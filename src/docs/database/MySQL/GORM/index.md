---
title: GORM 入门
order: 0
---

# GORM 入门

GORM 是 Go 语言生态里使用最广的 ORM（对象关系映射）库，官方地址 [gorm.io](https://gorm.io/)。它把数据库表映射成 Go 结构体，用链式 API 取代手写 SQL 和逐行 `Scan`。

## 为什么用 ORM

| 对比     | 原生 `database/sql`            | GORM                                  |
| -------- | ------------------------------ | ------------------------------------- |
| 查询     | 手写 SQL + 逐行 `Scan`         | `db.Where(...).Find(&users)` 一行搞定 |
| 建表     | 手写 `CREATE TABLE`            | `AutoMigrate(&User{})` 按 struct 建表 |
| 参数绑定 | 自己拼 `?` 和参数              | 方法参数自动绑定，天然防注入          |
| 关联查询 | 手动 JOIN 再组装               | `Preload` / `Joins` 自动填充          |
| 可读性   | SQL 与 Go 代码混杂             | 业务语义清晰                          |
| 性能上限 | 最高（完全可控）               | 有反射开销，复杂查询不如原生 SQL      |

> ORM 不是「不用懂 SQL」。恰恰相反，GORM 的零值更新、软删除、`Preload` 造成的 N+1 等问题，都要靠理解 SQL 才能排查。

## 安装

```shell
go get -u gorm.io/gorm
go get -u gorm.io/driver/mysql
```

## 连接 MySQL

DSN（数据源名称）格式：

```
用户名:密码@tcp(地址:端口)/库名?参数1=值1&参数2=值2
```

```go
package main

import (
  "fmt"
  "gorm.io/driver/mysql"
  "gorm.io/gorm"
)

func main() {
  // parseTime=True 让 datetime 自动转成 time.Time，必须加
  dsn := "root:123456@tcp(127.0.0.1:3306)/demo?charset=utf8mb4&parseTime=True&loc=Local"
  db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{})
  if err != nil {
    panic("连接数据库失败: " + err.Error())
  }
  fmt.Println("连接成功")
}
```

常用 DSN 参数：

| 参数        | 说明                                          |
| ----------- | --------------------------------------------- |
| `charset`   | 字符集，用 `utf8mb4`，否则存不了 emoji         |
| `parseTime` | `True` 时 `DATETIME` 转 `time.Time`，**必加**  |
| `loc`       | 时区，`Local` 表示本地时区（不设默认 UTC）     |
| `timeout`   | 连接超时，如 `timeout=10s`                    |

## 连接池配置

GORM 底层就是 `database/sql`，连接池要额外设置：

```go
sqlDB, err := db.DB()   // 取出底层 *sql.DB
if err != nil {
  panic(err)
}

sqlDB.SetMaxOpenConns(100)             // 最大打开连接数（默认无限制）
sqlDB.SetMaxIdleConns(10)              // 最大空闲连接数（默认 2）
sqlDB.SetConnMaxLifetime(time.Hour)    // 连接最长存活时间，防止被 MySQL 主动断开
```

| 方法                 | 作用                 | 建议值                |
| -------------------- | -------------------- | --------------------- |
| `SetMaxOpenConns`    | 最多同时打开多少连接 | 按 QPS 与 DB 上限评估 |
| `SetMaxIdleConns`    | 保留多少空闲连接复用 | 10 ~ 20               |
| `SetConnMaxLifetime` | 连接最大存活时长     | 小于 MySQL `wait_timeout` |

> 连接数不是越大越好。超过数据库 `max_connections` 会直接报错，且每个连接都占内存。

## 常用全局配置

```go
db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{
  // 打印 SQL 日志：开发用 Info，生产用 Warn 或 Silent
  Logger: logger.Default.LogMode(logger.Info),
  // 表名用单数（默认是复数 users），配合已有表结构时常用
  NamingStrategy: schema.NamingStrategy{SingularTable: true},
  // 迁移时不自动建外键约束（多数项目交给应用层维护）
  DisableForeignKeyConstraintWhenMigrating: true,
  // 关闭单条写操作的默认事务包装，写入性能可提升约 30%
  SkipDefaultTransaction: true,
})
```

## 默认约定

GORM 有一套「约定优于配置」的规则，了解后才能预判生成的 SQL：

| 约定     | 规则                                                         |
| -------- | ------------------------------------------------------------ |
| 表名     | 结构体名的**蛇形复数**：`User` → `users`，`UserName` → `user_names` |
| 主键     | 字段名为 `ID`（或带 `primaryKey` 标签）的字段                |
| 列名     | 字段名蛇形：`UserName` → `user_name`                         |
| 时间戳   | `CreatedAt` / `UpdatedAt` 自动填充，`DeletedAt` 触发软删除   |
| 表名前缀 | 可在 `NamingStrategy` 里统一配置 `TablePrefix`               |

不符合约定时用标签覆盖：`gorm:"column:custom_name"`，或实现 `TableName() string` 方法。

下一章介绍模型定义：字段标签、主键、索引与自动迁移。
