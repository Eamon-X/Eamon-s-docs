---
title: 查询进阶
order: 3
---

# 查询进阶

GORM 的查询是链式的：`db.Where(...).Order(...).Limit(...).Find(&users)`。每一环返回新的 `*gorm.DB`，只有遇到 `Find` / `First` / `Count` 这类「终结方法」才真正执行 SQL。

## 条件查询

```go
// 1. 字符串条件（推荐，参数自动绑定，无注入风险）
db.Where("name = ?", "张三").First(&user)
db.Where("age > ? AND city = ?", 18, "北京").Find(&users)

// 2. IN
db.Where("name IN ?", []string{"张三", "李四"}).Find(&users)

// 3. LIKE / BETWEEN
db.Where("name LIKE ?", "%张%").Find(&users)
db.Where("age BETWEEN ? AND ?", 18, 30).Find(&users)

// 4. 结构体条件：只使用非零字段
db.Where(&User{Name: "张三", Age: 0}).Find(&users)   // 实际只有 name = '张三'

// 5. map 条件：零值也会生效
db.Where(map[string]interface{}{"name": "张三", "age": 0}).Find(&users)
```

> 结构体条件会**忽略零值**（`0`、`""`、`false`），和 `Updates` 的规则一致。需要按零值筛选时改用 map 或字符串条件。

### AND / OR / NOT

```go
// 链式 Where 之间是 AND
db.Where("age > ?", 18).Where("city = ?", "北京")

// OR
db.Where("age > ?", 18).Or("name = ?", "张三")

// 复杂 OR：用一个字符串包住整组条件
db.Where("age > ?", 18).Or("name = ? AND city = ?", "李四", "上海")

// NOT
db.Not("name = ?", "张三").Find(&users)
db.Not(map[string]interface{}{"city": "北京"}).Find(&users)
```

## 字段选择、排序与分页

```go
db.Select("id", "name").Find(&users)       // 只查指定列
db.Order("age DESC, id ASC").Find(&users)  // 多字段排序

// 第 3 页，每页 10 条
page, size := 3, 10
db.Limit(size).Offset((page - 1) * size).Find(&users)
```

## 聚合查询

```go
// 总数
var count int64
db.Model(&User{}).Where("age > ?", 18).Count(&count)

// 分组 + 聚合 + HAVING
type CityStat struct {
  City  string
  Total int64
}

var stats []CityStat
db.Model(&User{}).
  Select("city, COUNT(*) AS total").
  Group("city").
  Having("COUNT(*) > ?", 1).
  Scan(&stats)

// 去重
var cities []string
db.Model(&User{}).Distinct().Pluck("city", &cities)

// 只取某列的所有值
var names []string
db.Model(&User{}).Pluck("name", &names)
```

> `Count` 必须作用在 `Model` 上才会自动带上表名。

## 原生 SQL

```go
// 查询：Scan 到结构体切片
var users []User
db.Raw("SELECT id, name, age FROM users WHERE age > ?", 18).Scan(&users)

// 写入：Exec，不返回结果集
db.Exec("UPDATE users SET age = ? WHERE id = ?", 21, 1)
```

> 参数仍然用 `?` 占位，不要自己拼字符串。`Raw` 只是绕过了 GORM 的 SQL 生成，不绕过参数绑定。

## 分批处理大量数据

一次性 `Find` 十万行会占满内存，用 `FindInBatches`：

```go
var users []User
db.Where("city = ?", "北京").FindInBatches(&users, 1000, func(tx *gorm.DB, batch int) error {
  // 每次处理 1000 条
  for _, u := range users {
    _ = u
  }
  return nil
})
```

底层是「按主键游标分段查询」，不会因为 `OFFSET` 越大越慢，适合数据迁移、批量重算。

## 扫描到 map 或自定义结构

```go
// 查询结果不匹配模型时，用 map 接收
var results []map[string]interface{}
db.Model(&User{}).Find(&results)

// 只取需要的列到自定义结构
type SimpleUser struct {
  ID   uint
  Name string
}
var list []SimpleUser
db.Model(&User{}).Select("id", "name").Scan(&list)
```

## 复用查询条件（Scopes）

```go
func Adults(db *gorm.DB) *gorm.DB {
  return db.Where("age >= ?", 18)
}

func InBeijing(db *gorm.DB) *gorm.DB {
  return db.Where("city = ?", "北京")
}

db.Scopes(Adults, InBeijing).Find(&users)
```

适合把通用过滤、权限范围等条件抽出来，避免每个查询重复写。

## 调试：只看 SQL 不执行

```go
stmt := db.Session(&gorm.Session{DryRun: true}).
  Where("age > ?", 18).
  First(&user).Statement

fmt.Println(stmt.SQL.String())    // SELECT ... FROM users WHERE age > 18 ...
fmt.Println(stmt.Vars)           // 参数值
```

配合 `Logger: logger.Default.LogMode(logger.Info)` 可以看每条真实执行的 SQL 与耗时。

## 常见误区

| 误区                            | 正确做法                                        |
| ------------------------------- | ----------------------------------------------- |
| `db.Where(...)` 后忘了终结方法  | 链式调用不执行，必须接 `Find` / `First` / `Count` |
| 用 `Find` 却期望查不到报错       | `Find` 返回空切片、err 为 nil；单条用 `First` 并判断 `ErrRecordNotFound` |
| 条件里用结构体却想筛零值         | 改用 map 或字符串条件                           |
| 大偏移分页 `Offset(100000)`      | 用 `FindInBatches` 或主键游标分页               |
| 关联数据逐条查（N+1）            | 用 `Preload` 一次性加载，见「关联关系」章       |
