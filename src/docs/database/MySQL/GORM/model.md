---
title: 模型定义
order: 1
---

# 模型定义

模型（Model）就是一个普通的 Go 结构体，GORM 读取字段和标签来推断表名、列名、类型与约束。

## 基础写法

```go
type User struct {
  ID   uint   `gorm:"primaryKey"`          // 映射到 id，自增主键
  Name string `gorm:"size:50;not null"`    // varchar(50) NOT NULL
  Age  int    // 映射到 age，默认 bigint
}
```

默认对应 `users` 表，字段名驼峰、列名自动转蛇形（`UserName` → `user_name`）。

## 默认表名规则

GORM 根据结构体名自动推断表名，规则是：**驼峰拆词 → 转小写蛇形 → 取英语复数**。

| 结构体名        | 蛇形              | 默认表名              |
| --------------- | ----------------- | --------------------- |
| `User`          | user              | `users`               |
| `SysUser`       | sys_user          | `sys_users`           |
| `UserProfile`   | user_profile      | `user_profiles`       |
| `HTTPRequestLog`| http_request_log  | `http_request_logs`   |
| `Person`        | person            | `people`（不规则复数）|

复数化由 `inflect` 库处理，常见规则：

- 一般加 `s`：`user` → `users`
- 以 `s/x/z/ch/sh` 结尾加 `es`：`box` → `boxes`
- 辅音 + `y` → `ies`：`category` → `categories`
- 不规则：`person` → `people`、`child` → `children`、`man` → `men`

> 连续大写缩写（如 `HTTP`、`ID`）会被当作一个词拆开，所以 `HTTPRequestLog` → `http_request_log`，而不是 `httprequest_log`。

## 自定义表名

```go
// 1. 实现 TableName 方法（最明确，局部生效）
func (User) TableName() string { return "sys_user" }

// 2. 全局配置表名前缀（批量生效）
db, _ := gorm.Open(mysql.Open(dsn), &gorm.Config{
  NamingStrategy: schema.NamingStrategy{TablePrefix: "t_"}, // User → t_users
})

// 3. 全局关掉复数（批量生效）
db, _ := gorm.Open(mysql.Open(dsn), &gorm.Config{
  NamingStrategy: schema.NamingStrategy{SingularTable: true}, // User → user
})
```

> `TableName()` 优先级高于全局 `NamingStrategy`。单个模型用前者，统一规则用后者。

## gorm.Model

GORM 内置了一个通用模型：

```go
type Model struct {
  ID        uint           `gorm:"primaryKey"`
  CreatedAt time.Time
  UpdatedAt time.Time
  DeletedAt gorm.DeletedAt `gorm:"index"`  // 软删除标记
}
```

直接内嵌即可获得这四个字段：

```go
type User struct {
  gorm.Model          // 内嵌，等于拥有 ID / CreatedAt / UpdatedAt / DeletedAt
  Name string
}
```

> 嵌入 `gorm.Model` 就意味着**启用软删除**：`Delete` 只是把 `deleted_at` 置为当前时间，查询会自动过滤。不需要软删除时自己写 `ID` 字段即可。

## 常用字段标签

| 标签              | 作用                               | 示例                        |
| ----------------- | ---------------------------------- | --------------------------- |
| `primaryKey`      | 指定主键                           | `gorm:"primaryKey"`         |
| `autoIncrement`   | 自增（整数主键默认自增）           | `gorm:"autoIncrement"`      |
| `column`          | 自定义列名                         | `gorm:"column:user_name"`   |
| `size`            | 字符串长度                         | `gorm:"size:100"`           |
| `type`            | 强制列类型                         | `gorm:"type:decimal(10,2)"` |
| `not null`        | 非空                               | `gorm:"not null"`           |
| `default`         | 默认值                             | `gorm:"default:0"`          |
| `uniqueIndex`     | 唯一索引                           | `gorm:"uniqueIndex"`        |
| `index`           | 普通索引                           | `gorm:"index"`              |
| `index:idx_name`  | 指定索引名，同名即复合索引         | `gorm:"index:idx_name_age"` |
| `comment`         | 列注释                             | `gorm:"comment:用户姓名"`   |
| `serializer:json` | 字段存 JSON 字符串，读写自动序列化 | `gorm:"serializer:json"`    |
| `-`               | 忽略该字段                         | `gorm:"-"`                  |
| `-:migration`     | 参与读写，但不参与建表             | `gorm:"-:migration"`        |

常用类型对照：

| Go 类型           | 建议写法                    | 生成列类型     |
| ----------------- | --------------------------- | -------------- |
| `string`          | `gorm:"size:50"`            | `varchar(50)`  |
| `string`（长文本） | `gorm:"type:text"`          | `text`         |
| `int`             | 默认                        | `bigint`       |
| `int32`           | `gorm:"type:int"`           | `int`          |
| `float64`         | `gorm:"type:double"`        | `double`       |
| 金额              | `gorm:"type:decimal(10,2)"` | `decimal(10,2)` |
| `bool`            | 默认                        | `tinyint(1)`   |
| `time.Time`       | 默认                        | `datetime(3)`  |
| `[]byte`          | `gorm:"type:blob"`          | `blob`         |
| 结构体 / map      | `gorm:"serializer:json"`    | `json` / `text` |

> **金额不要用 `float64`**：和 MySQL 的 float/double 一样有精度问题，用 `decimal` 类型配合 `string` 或 decimal 库。详见「核心概念」的数据类型章节。

## 主键的几种写法

```go
// 1. 自增整数主键（最常用）
ID uint `gorm:"primaryKey"`

// 2. 不自增，业务指定（如外部系统 ID）
ID int64 `gorm:"primaryKey;autoIncrement:false"`

// 3. 字符串主键，用钩子生成 UUID
ID string `gorm:"primaryKey;size:36"`
func (u *User) BeforeCreate(tx *gorm.DB) error {
  u.ID = uuid.NewString()
  return nil
}

// 4. 复合主键（多列组合唯一）
type StudentCourse struct {
  StudentID uint `gorm:"primaryKey"`
  CourseID  uint `gorm:"primaryKey"`
}
```

## 时间戳

```go
type Article struct {
  ID        uint      `gorm:"primaryKey"`
  CreatedAt time.Time // 创建时自动填充
  UpdatedAt time.Time // 每次更新自动填充
}
```

自定义格式：

```go
CreatedAt int64 `gorm:"autoCreateTime:milli"`  // 毫秒时间戳
UpdatedAt int64 `gorm:"autoUpdateTime:second"` // 秒时间戳
```

## 索引与唯一约束

```go
type User struct {
  ID    uint   `gorm:"primaryKey"`
  Phone string `gorm:"size:20;uniqueIndex"`              // 唯一索引，自动命名
  Email string `gorm:"size:100;uniqueIndex:uk_email"`    // 指定索引名
  Name  string `gorm:"size:50;index"`
  Age   int    `gorm:"index:idx_name_age"`               // 与 Name 组成复合索引
}
```

多个字段用**同一个索引名** → 生成复合索引，顺序按字段定义顺序（即最左前缀顺序）。

## 自动迁移

```go
db.AutoMigrate(&User{}, &Order{}, &Article{})
```

| 会做               | 不会做                         |
| ------------------ | ------------------------------ |
| 创建缺失的表       | 删除已存在但模型里没有的列     |
| 添加缺失的列、索引 | 修改已有列的类型、长度、默认值 |
| 添加缺失的约束     | 重命名列                       |

> `AutoMigrate` 适合**开发阶段**和**新表初始化**。生产变更必须用 SQL 迁移文件（golang-migrate、goose 等），并配合备份与回滚方案。

## 与已有表对接

如果表由 DBA 提前建好，用标签逐列对齐，或用 `TableName` 指定表名：

```go
type Order struct {
  ID        uint      `gorm:"column:order_id;primaryKey"`
  UserID    uint      `gorm:"column:user_id;index"`
  Amount    string    `gorm:"column:amount;type:decimal(10,2)"`
  CreatedAt time.Time `gorm:"column:create_time;autoCreateTime"`
}

func (Order) TableName() string { return "t_order" }
```

下一章介绍增删改查的具体写法与常见陷阱。
