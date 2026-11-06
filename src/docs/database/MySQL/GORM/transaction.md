---
title: 事务与锁
order: 5
---

# 事务与锁

GORM 的事务基于底层 `database/sql`，提供闭包式和手动式两种写法。锁则通过 `clause.Locking` 生成 `FOR UPDATE` / `FOR SHARE`。

## 闭包式事务（推荐）

```go
err := db.Transaction(func(tx *gorm.DB) error {
  // 扣款
  if err := tx.Model(&Account{}).
    Where("id = ? AND balance >= ?", 1, 100).
    Update("balance", gorm.Expr("balance - ?", 100)).Error; err != nil {
    return err
  }

  // 入账
  if err := tx.Model(&Account{}).
    Where("id = ?", 2).
    Update("balance", gorm.Expr("balance + ?", 100)).Error; err != nil {
    return err
  }

  return nil   // 返回 nil 才提交，返回 err 自动回滚
})
```

- 闭包里**只能用 `tx`**，用 `db` 会跑在事务之外，导致部分提交
- 返回 `nil` → `COMMIT`；返回非 nil → `ROLLBACK`

## 手动事务

```go
tx := db.Begin()
defer func() {
  if r := recover(); r != nil {
    tx.Rollback()   // panic 时回滚
    panic(r)
  }
}()

if err := tx.Create(&order).Error; err != nil {
  tx.Rollback()
  return err
}

return tx.Commit().Error
```

> 忘记 `Commit` / `Rollback` 会一直占着连接和锁，最终拖垮连接池。务必用 `defer` 兜底。

## 嵌套事务（SavePoint）

在 `tx.Transaction` 里再开一层事务，GORM 用 `SAVEPOINT` 实现：

```go
db.Transaction(func(tx *gorm.DB) error {
  tx.Create(&user)

  // 内层失败只回滚这一段，外层仍可继续
  if err := tx.Transaction(func(tx2 *gorm.DB) error {
    return tx2.Create(&order).Error
  }); err != nil {
    // 记录日志，但不返回 err，外层继续提交
  }

  return nil
})
```

对应 SQL：`SAVEPOINT sp1` → 失败 `ROLLBACK TO SAVEPOINT sp1`。

> MySQL 的 `SAVEPOINT` 不是真正独立的事务，锁不会因为回滚到保存点而立刻释放。

## 钩子（Hooks）

```go
func (u *User) BeforeCreate(tx *gorm.DB) error {
  if u.Name == "" {
    return errors.New("姓名不能为空")
  }
  return nil
}

func (o *Order) AfterCreate(tx *gorm.DB) error {
  // 写日志、发消息等
  return nil
}
```

| 钩子                            | 触发时机       |
| ------------------------------- | -------------- |
| `BeforeSave` / `AfterSave`      | 创建或更新前后 |
| `BeforeCreate` / `AfterCreate`  | 创建前后       |
| `BeforeUpdate` / `AfterUpdate`  | 更新前后       |
| `BeforeDelete` / `AfterDelete`  | 删除前后       |
| `AfterFind`                     | 查询结果填充后 |

> 钩子里 `return err` 会中断操作并回滚所在事务。不要在钩子里做 HTTP 调用等慢操作，事务会被拉长。

## 悲观锁：FOR UPDATE

```go
import "gorm.io/gorm/clause"

err := db.Transaction(func(tx *gorm.DB) error {
  var product Product

  // SELECT * FROM products WHERE id = 1 FOR UPDATE
  if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).
    First(&product, 1).Error; err != nil {
    return err
  }

  if product.Stock <= 0 {
    return errors.New("库存不足")
  }

  return tx.Model(&product).Update("stock", product.Stock-1).Error
})
```

共享锁：

```go
tx.Clauses(clause.Locking{Strength: "SHARE"}).First(&user, 1)  // FOR SHARE
```

> `FOR UPDATE` 必须**命中索引**，否则 InnoDB 会锁住扫描到的所有行，退化成近似表锁。详见「锁」章节。

## 乐观锁：版本号

```go
type Product struct {
  ID      uint `gorm:"primaryKey"`
  Stock   int
  Version int
}

var p Product
db.First(&p, 1)

res := db.Model(&Product{}).
  Where("id = ? AND version = ?", p.ID, p.Version).
  Updates(map[string]interface{}{
    "stock":   p.Stock - 1,
    "version": p.Version + 1,
  })

if res.RowsAffected == 0 {
  // 版本不匹配（被别人改过），重试或返回冲突
}
```

| 对比     | 悲观锁 `FOR UPDATE`        | 乐观锁 version         |
| -------- | -------------------------- | ---------------------- |
| 加锁     | 是，事务期间独占行         | 否                     |
| 冲突处理 | 阻塞等待，可能死锁         | 更新失败后重试         |
| 适用     | 强一致、冲突频繁（如库存） | 冲突较少、可重试的场景 |

## 死锁与重试

MySQL 检测到死锁会返回 `1213 Deadlock found`，GORM 层可识别错误码后重试：

```go
import "github.com/go-sql-driver/mysql"

var mysqlErr *mysql.MySQLError

for i := 0; i < 3; i++ {
  err := db.Transaction(fn)
  if err == nil {
    break
  }
  // 1213 = 死锁，1205 = 锁等待超时
  if errors.As(err, &mysqlErr) && (mysqlErr.Number == 1213 || mysqlErr.Number == 1205) {
    continue
  }
  return err
}
```

重试必须保证 `fn` 是**幂等**的（不依赖上一次的部分结果）。

## 实践建议

- 事务尽量短，不要在事务里做 HTTP / 文件 / 消息队列操作
- 多个表按**固定顺序**加锁，避免死锁
- `*gorm.DB` 可以跨 goroutine 共享，事务对象 `tx` **不能**
- 大批量更新分批提交，避免长时间持有大量行锁
