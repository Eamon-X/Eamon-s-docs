---
title: 增删改查
order: 2
---

# 增删改查

本章示例基于下面的模型：

```go
type User struct {
  ID        uint           `gorm:"primaryKey"`
  Name      string         `gorm:"size:50;not null"`
  Age       int
  City      string         `gorm:"size:50"`
  CreatedAt time.Time
  UpdatedAt time.Time
  DeletedAt gorm.DeletedAt `gorm:"index"`  // 启用软删除
}
```

## 新增（Create）

```go
// 单条：执行后 user.ID 会被回填
user := User{Name: "张三", Age: 20}
db.Create(&user)   // => INSERT INTO users (name, age, created_at, updated_at) VALUES ('张三', 20, ..., ...)

// 批量：一条 INSERT ... VALUES (...), (...), (...)
users := []User{{Name: "李四", Age: 22}, {Name: "王五", Age: 25}}
db.Create(&users)   // => INSERT INTO users (name, age, ...) VALUES ('李四', 22, ...), ('王五', 25, ...)

// 大批量分批插入，避免单条 SQL 过长、内存占用过高
db.CreateInBatches(&users, 100)   // => 同上，但每批最多 100 条
```

### 遇到重复主键 / 唯一键

```go
import "gorm.io/gorm/clause"

// 冲突时更新全部字段（MySQL 的 ON DUPLICATE KEY UPDATE）
db.Clauses(clause.OnConflict{UpdateAll: true}).Create(&users)
// => INSERT INTO users (id, name, age, ...) VALUES (?, ?, ...) ON DUPLICATE KEY UPDATE name=VALUES(name), age=VALUES(age), ...

// 冲突时什么都不做（相当于 INSERT IGNORE）
db.Clauses(clause.OnConflict{DoNothing: true}).Create(&users)
// => INSERT IGNORE INTO users (id, name, age, ...) VALUES (?, ?, ...)

// 只更新指定列
db.Clauses(clause.OnConflict{
  Columns:   []clause.Column{{Name: "id"}},
  DoUpdates: clause.AssignmentColumns([]string{"name", "age"}),
}).Create(&users)
// => INSERT INTO users (id, name, age, ...) VALUES (?, ?, ...)
//    ON DUPLICATE KEY UPDATE name=VALUES(name), age=VALUES(age)
```

## 查询

### 单条查询

```go
var user User

db.First(&user)                      // => SELECT * FROM users WHERE deleted_at IS NULL ORDER BY id ASC LIMIT 1
db.First(&user, 1)                   // => SELECT * FROM users WHERE id = 1 AND deleted_at IS NULL ORDER BY id ASC LIMIT 1
db.First(&user, "name = ?", "张三")  // => SELECT * FROM users WHERE name = '张三' AND deleted_at IS NULL ORDER BY id ASC LIMIT 1
db.Take(&user)                       // => SELECT * FROM users WHERE deleted_at IS NULL LIMIT 1  （无 ORDER BY，更快）
db.Last(&user)                       // => SELECT * FROM users WHERE deleted_at IS NULL ORDER BY id DESC LIMIT 1
```

| 方法    | 排序     | 条件为空时     |
| ------- | -------- | -------------- |
| `First` | 主键升序 | 取表中第一条   |
| `Last`  | 主键降序 | 取表中最后一条 |
| `Take`  | 不排序   | 取任意一条     |

查不到时返回 `gorm.ErrRecordNotFound`：

```go
import "errors"

err := db.First(&user, 1).Error
if errors.Is(err, gorm.ErrRecordNotFound) {
  // 记录不存在，通常是 404
}
```

### 多条查询

Find 把结果切到 slice，查不到返回**空 slice**（不是错误）。

```go
var users []User

db.Find(&users)                          // => SELECT * FROM users WHERE deleted_at IS NULL
db.Find(&users, []uint{1, 2, 3})         // => SELECT * FROM users WHERE id IN (1, 2, 3) AND deleted_at IS NULL
db.Where("age > ? AND city = ?", 20, "北京").Find(&users)
// => SELECT * FROM users WHERE age > 20 AND city = '北京' AND deleted_at IS NULL

// 结构体当条件（零值字段被忽略，见下方「条件构造」）
db.Find(&users, User{Age: 22})
// => SELECT * FROM users WHERE age = 22 AND deleted_at IS NULL
//    如果 User{Age: 22, City: ""}，City 是空字符串（零值），不会进 WHERE
```

### 条件构造

```go
// 三种传参方式
db.Where("name = ?", "张三").Find(&users)                      // 1. 占位符（推荐，防 SQL 注入）
// => SELECT * FROM users WHERE name = '张三' AND deleted_at IS NULL

db.Where(&User{City: "北京"}).Find(&users)                     // 2. 结构体（零值字段被忽略）
// => SELECT * FROM users WHERE city = '北京' AND deleted_at IS NULL

db.Where(map[string]interface{}{"city": "北京"}).Find(&users)   // 3. map（零值保留）
// => SELECT * FROM users WHERE city = '北京' AND deleted_at IS NULL

// 叠加条件
db.Where("age > ?", 20).Where("city = ?", "北京").Find(&users)   // AND 叠加
// => SELECT * FROM users WHERE age > 20 AND city = '北京' AND deleted_at IS NULL

db.Where("age > ? OR city = ?", 20, "北京").Find(&users)         // OR
// => SELECT * FROM users WHERE age > 20 OR city = '北京' AND deleted_at IS NULL

// IN / LIKE / 范围
db.Where("city IN ?", []string{"北京", "上海"}).Find(&users)
// => SELECT * FROM users WHERE city IN ('北京','上海') AND deleted_at IS NULL

db.Where("name LIKE ?", "%张%").Find(&users)
// => SELECT * FROM users WHERE name LIKE '%张%' AND deleted_at IS NULL

db.Where("created_at BETWEEN ? AND ?", startTime, endTime).Find(&users)
// => SELECT * FROM users WHERE created_at BETWEEN startTime AND endTime AND deleted_at IS NULL
```

> **结构体 vs map 传参**：`Where(&User{City: "北京", Age: 0})` 里 `Age: 0` 会被当作零值忽略；换成 `map[string]interface{}{"city": "北京", "age": 0}` 两个条件都生效。

### 排序

```go
db.Where("age > ?", 20).Order("age DESC").Find(&users)
// => SELECT * FROM users WHERE age > 20 AND deleted_at IS NULL ORDER BY age DESC

db.Order("city ASC, age DESC").Find(&users)
// => SELECT * FROM users WHERE deleted_at IS NULL ORDER BY city ASC, age DESC
```

### 分页

Offset 风格：

```go
db.Offset(0).Limit(10).Find(&users)   // 第 1 页
// => SELECT * FROM users WHERE deleted_at IS NULL LIMIT 10 OFFSET 0

db.Offset(10).Limit(10).Find(&users)  // 第 2 页
// => SELECT * FROM users WHERE deleted_at IS NULL LIMIT 10 OFFSET 10
```

常见的「总数 + 当前页数据」组合：

```go
page, pageSize := 2, 10
var total int64
db.Model(&User{}).Where("age > ?", 20).Count(&total)   // 先查总数
// => SELECT count(*) FROM users WHERE age > 20 AND deleted_at IS NULL

db.Where("age > ?", 20).
  Offset((page - 1) * pageSize).
  Limit(pageSize).
  Find(&users)   // 再查当前页
// => SELECT * FROM users WHERE age > 20 AND deleted_at IS NULL LIMIT 10 OFFSET 10
```

> Offset 很大时（如翻到第 1000 页）MySQL 要先扫过前面 10000 条再丢掉，会很慢。大数据量改用**游标分页**：`WHERE id > 上一页最后一条ID LIMIT ?`，利用主键索引，性能稳定。

### 指定列

避免 `SELECT *`，只查需要的字段：

```go
db.Select("name", "age").Find(&users)
// => SELECT name, age FROM users WHERE deleted_at IS NULL

db.Select([]string{"id", "name"}).Find(&users)
// => SELECT id, name FROM users WHERE deleted_at IS NULL

// 排除字段（关联查询时常用）
db.Omit("created_at", "updated_at").Find(&users)
// => SELECT id, name, age, city, deleted_at FROM users WHERE deleted_at IS NULL
```

### 聚合

```go
var count int64
db.Model(&User{}).Where("city = ?", "北京").Count(&count)
// => SELECT count(*) FROM users WHERE city = '北京' AND deleted_at IS NULL

var sumAge int64
db.Model(&User{}).Select("COALESCE(SUM(age), 0)").Where("city = ?", "北京").Scan(&sumAge)
// => SELECT COALESCE(SUM(age), 0) FROM users WHERE city = '北京' AND deleted_at IS NULL

var avgAge float64
db.Model(&User{}).Select("AVG(age)").Where("city = ?", "北京").Scan(&avgAge)
// => SELECT AVG(age) FROM users WHERE city = '北京' AND deleted_at IS NULL
```

### Scan 到自定义结构体

不想查全部字段、或查了多表想合并到一个 DTO，用 `Scan`：

```go
type UserSummary struct {
  ID   uint
  Name string
  // 这里没有 Age、City 等字段，和 Select 的列一一对应
}

var summaries []UserSummary
db.Select("id", "name").Model(&User{}).Scan(&summaries)
// => SELECT id, name FROM users WHERE deleted_at IS NULL
```

`Scan` 也能接原始 SQL：

```go
db.Raw("SELECT id, name FROM users WHERE age > ?", 20).Scan(&users)
// => SELECT id, name FROM users WHERE age > 20
```

## 更新（Update）

这四个方法最容易踩坑，先看区别：

| 方法                | 更新范围       | 触发钩子 | 更新零值 |
| ------------------- | -------------- | -------- | -------- |
| `Save`              | **全部字段**   | 是       | 是       |
| `Updates`（结构体） | 非零字段       | 是       | **否**   |
| `Updates`（map）    | map 里的字段   | 是       | 是       |
| `Update`            | 单列           | 是       | 是       |
| `UpdateColumn`      | 单列，跳过钩子 | 否       | 是       |

```go
// 假设 user 是从数据库查出来的，user.ID = 1
// db.Model(&user) 会把 user 的非零字段自动拼到 WHERE，主键 ID 自然就成了 WHERE id=user.ID

// ✅ Save：更新所有字段（包括零值），本质是 UPDATE 全列
user.Name = "李四"
user.Age = 0
db.Save(&user)
// => UPDATE users SET name='李四', age=0, city='...', updated_at=... WHERE id=1

// ⚠️ Updates + 结构体：Age = 0 属于零值，会被忽略，不会写进 SQL
db.Model(&user).Updates(User{Name: "李四", Age: 0})
// => UPDATE users SET name='李四', updated_at=... WHERE id=1
//    注意 age=0 不在 SQL 里！

// ✅ Updates + map：零值也会更新
db.Model(&user).Updates(map[string]interface{}{"name": "李四", "age": 0})
// => UPDATE users SET name='李四', age=0, updated_at=... WHERE id=1

// ✅ 单列更新
db.Model(&user).Update("age", 0)
// => UPDATE users SET age=0, updated_at=... WHERE id=1

// ✅ 只更新指定列（绕过结构体零值过滤）
db.Model(&user).Select("Name", "Age").Updates(User{Name: "李四", Age: 0})
// => UPDATE users SET name='李四', age=0, updated_at=... WHERE id=1

// 如果要更新 id=2 的用户，有两种写法：
// 1. Model 里直接带 ID
db.Model(&User{ID: 2}).Update("age", 0)
// => UPDATE users SET age=0, updated_at=... WHERE id=2

// 2. 用 Where 条件更灵活
db.Model(&User{}).Where("id = ?", 2).Update("age", 0)
// => UPDATE users SET age=0, updated_at=... WHERE id = 2
```

> **最常见的线上事故**：用 `Updates(User{...})` 把字段改成 0、`""`、`false`，数据库里却没变。因为 GORM 用结构体更新时**忽略零值**。要更新零值必须用 `map` 或 `Select`。

### 关键：`Model()` 有没有主键 → 单条 vs 全表

`Model()` 里的结构体**非零字段**会被自动拼到 WHERE，主键是否有值决定了更新范围：

```go
// 1. 有主键 → 只更新一行（WHERE id 自动加上）
user := User{ID: 42}                                   // 主键不为零
db.Model(&user).Select("Name", "Age").Updates(User{Name: "李四", Age: 0})
// => UPDATE users SET name='李四', age=0, updated_at=... WHERE id = 42

// 2. 没有主键 → 没有 WHERE，全表更新！（极度危险）
user := User{}                                         // 主键为零值
db.Model(&user).Select("Name", "Age").Updates(User{Name: "李四", Age: 0})
// => UPDATE users SET name='李四', age=0, updated_at=...
//    没有任何 WHERE 条件，所有行都会被更新！
```

> **线上又一大型事故根源**：从请求体反序列化了一个空结构体就直接塞给 `Model()`，结果忘了补 Where 条件。批量更新务必显式写 `Where()`，不要依赖结构体里的非零字段 "碰巧" 生效。

### 批量更新

```go
// 把 30 岁以上的用户城市改成北京
db.Model(&User{}).Where("age > ?", 30).Update("city", "北京")
// => UPDATE users SET city='北京', updated_at=... WHERE age > 30 AND deleted_at IS NULL
```

> 条件为空时 GORM 会返回 `ErrMissingWhereClause` 拒绝执行，防止误更新全表。确实要更新全表用 `db.Session(&gorm.Session{AllowGlobalUpdate: true})`，但请三思。

## 删除（Delete）

```go
db.Delete(&User{}, 1)                   // 按主键删除
// => UPDATE users SET deleted_at='当前时间' WHERE id=1 AND deleted_at IS NULL  （软删除）

db.Where("age < ?", 18).Delete(&User{}) // 按条件删除
// => UPDATE users SET deleted_at='当前时间' WHERE age < 18 AND deleted_at IS NULL

db.Delete(&User{}, []int{1, 2, 3})      // 批量按主键删除
// => UPDATE users SET deleted_at='当前时间' WHERE id IN (1,2,3) AND deleted_at IS NULL
```

### 软删除

模型里有 `DeletedAt gorm.DeletedAt` 时，`Delete` 实际执行：

```sql
UPDATE users SET deleted_at = '2026-11-06 10:00:00' WHERE id = 1
```

之后所有查询自动带上 `deleted_at IS NULL`：

```go
db.Unscoped().Find(&users)    // 查询包含已软删除的数据
// => SELECT * FROM users   （没有 deleted_at IS NULL）

db.Unscoped().Delete(&user)   // 物理删除（真删）
// => DELETE FROM users WHERE id = 1
```

| 操作                  | 效果               |
| --------------------- | ------------------ |
| `Delete`              | 软删除             |
| `Unscoped().Delete`   | 物理删除           |
| `Unscoped().Find`     | 包含已删除记录     |
| 普通 `Find` / `First` | 自动过滤已删除记录 |

> 软删除的代价：所有查询多一个 `deleted_at IS NULL` 条件，索引要带上它，否则数据量大时容易全表扫描。

## 与关联一起保存

```go
// 创建主记录时一并创建关联（GORM 自动处理外键）
user := User{
  Name: "张三",
  Orders: []Order{{Amount: 99}, {Amount: 199}},
}
db.Create(&user)   // users 插一条，orders 插两条
// => 1. INSERT INTO users (name, ...) VALUES ('张三', ...)
//    2. INSERT INTO orders (user_id, amount, ...) VALUES (user.ID, 99, ...), (user.ID, 199, ...)
```

关联字段的详细用法见「关联关系」章节。
