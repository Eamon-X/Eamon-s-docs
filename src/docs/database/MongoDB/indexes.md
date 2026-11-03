---
title: 索引
order: 5
---

# 索引

索引是用于加速查询的特殊数据结构（默认为 B-Tree）。没有索引时，查询需要**全表扫描**（逐条遍历所有文档）；有了索引，MongoDB 可以像书的目录一样快速定位数据。

## 基本操作

```javascript
// 查看集合中的所有索引（_id 是自动创建的默认索引）
db.user.getIndexes()

// 创建单字段索引：1 为升序，-1 为降序
db.user.createIndex({ name: 1 })

// 创建复合索引：先按 name 升序，name 相同时按 age 降序
db.user.createIndex({ name: 1, age: -1 })

// 创建唯一索引：字段的值不允许重复
db.user.createIndex({ name: 1 }, { unique: true })

// 创建稀疏索引：只为存在该字段的文档建立索引
db.user.createIndex({ phone: 1 }, { sparse: true })

// 创建 TTL 索引：文档到期自动删除（常用于日志、验证码等过期数据）
db.logs.createIndex({ createdAt: 1 }, { expireAfterSeconds: 3600 }) // 1 小时后删除

// 删除指定索引
db.user.dropIndex("name_1")

// 删除除 _id 外的所有索引
db.user.dropIndexes()
```

## 索引类型

| 类型     | 关键参数       | 说明                                   |
| -------- | -------------- | -------------------------------------- |
| 单字段   | -              | 对单个字段建索引                       |
| 复合索引 | -              | 对多个字段联合建索引，遵循最左前缀原则 |
| 唯一索引 | `unique`       | 字段值唯一，可用来做唯一性约束         |
| 稀疏索引 | `sparse`       | 只为包含该字段的文档建立索引           |
| TTL 索引 | `expireAfterSeconds` | 到期自动删除文档                 |
| 文本索引 | `"text"`       | 支持文本搜索                           |

## 使用 explain 分析查询

`explain` 可以查看查询的执行计划，判断是否命中索引：

```javascript
db.user.find({ name: '张三' }).explain("executionStats")
```

重点关注输出中的两个值：

- `winningPlan.stage: "COLLSCAN"`：全表扫描，说明没有走索引
- `winningPlan.stage: "IXSCAN"`：索引扫描，说明命中了索引
- `executionStats.totalDocsExamined`：实际检查的文档数，越接近返回条数越好

## 使用建议

- 为**查询频率高**的字段（尤其是 `find`、`sort` 涉及的字段）建立索引
- 索引并非越多越好：每个索引都会占用磁盘空间，并且会降低写入（插入/更新/删除）性能
- 复合索引遵循**最左前缀原则**：`{ name: 1, age: -1 }` 可以支持按 `name` 或 `name + age` 查询，但无法单独支持按 `age` 查询
- 唯一索引配合业务使用，可以在数据库层面保证字段不重复（如用户名、手机号）
