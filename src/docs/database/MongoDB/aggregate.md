---
title: 聚合管道
order: 4
---

# 聚合管道

聚合管道（Aggregation Pipeline）是 MongoDB 对数据进行复杂统计与处理的机制：文档依次通过多个**阶段（Stage）**处理，前一阶段的输出作为下一阶段的输入，类似流水线，对应 SQL 中的 `GROUP BY`、`JOIN` 等操作。

```javascript
db.collection.aggregate([
  { 阶段1 },
  { 阶段2 },
  { 阶段3 }
])
```

以 `orders` 集合为例，假设文档结构如下：

```json
{ "_id": 1, "user": "张三", "city": "北京", "amount": 100, "items": ["键盘", "鼠标"] }
{ "_id": 2, "user": "张三", "city": "北京", "amount": 200, "items": ["显示器"] }
{ "_id": 3, "user": "李四", "city": "上海", "amount": 300, "items": ["主机"] }
{ "_id": 4, "user": "王五", "city": "北京", "amount": 50,  "items": [] }
```

## 常用阶段

| 阶段        | 说明                             | SQL 等价                 |
| ----------- | -------------------------------- | ------------------------ |
| `$match`    | 过滤文档                         | `WHERE`                  |
| `$group`    | 按字段分组统计                   | `GROUP BY`               |
| `$sort`     | 排序，`1` 升序 `-1` 降序         | `ORDER BY`               |
| `$project`  | 挑选/重命名/计算输出字段         | `SELECT` 指定列          |
| `$limit`    | 限制返回条数                     | `LIMIT`                  |
| `$skip`     | 跳过指定条数                     | `OFFSET`                 |
| `$count`    | 统计条数                         | `COUNT(*)`               |
| `$unwind`   | 将数组字段拆分为多条文档         | -                        |
| `$lookup`   | 左外连接其他集合                 | `LEFT JOIN`              |

## 常用阶段示例

```javascript
// $match：过滤，语法与 find 的查询条件一致
db.orders.aggregate([
  { $match: { amount: { $gte: 100 } } }
])

// $group：按城市分组，统计订单数与总金额
// _id 为分组依据（null 表示全部文档分在一组）
db.orders.aggregate([
  {
    $group: {
      _id: "$city",
      total: { $sum: "$amount" },   // 金额求和
      count: { $sum: 1 }            // 每组条数：对常量 1 求和
    }
  }
])
// 结果：
// { "_id": "北京", "total": 350, "count": 3 }
// { "_id": "上海", "total": 300, "count": 1 }

// $sort：按总金额降序
db.orders.aggregate([
  { $group: { _id: "$city", total: { $sum: "$amount" } } },
  { $sort: { total: -1 } }
])

// $project：筛选输出字段并计算新字段
db.orders.aggregate([
  {
    $project: {
      _id: 0,
      user: 1,
      amount: 1,
      level: { $cond: { if: { $gte: ["$amount", 200] }, then: "大额", else: "普通" } }
    }
  }
])

// $count：统计文档条数
db.orders.aggregate([
  { $match: { amount: { $gte: 100 } } },
  { $count: "total" } // 输出 { "total": 3 }
])
```

## $unwind：拆分数组

将数组字段的每个元素拆成一条文档，常用于数组统计前的展开：

```javascript
// 把 items 数组拆开，每个元素生成一条文档
db.orders.aggregate([
  { $unwind: "$items" }
])
// _id:1 的文档会拆成两条：items 为 "键盘"、"鼠标" 各一条

// 结合 $group 统计每种商品出现的次数
db.orders.aggregate([
  { $unwind: "$items" },
  { $group: { _id: "$items", count: { $sum: 1 } } },
  { $sort: { count: -1 } }
])
```

## $lookup：联表查询

MongoDB 中跨集合关联使用 `$lookup`（相当于 SQL 的左外连接）：

```javascript
db.orders.aggregate([
  {
    $lookup: {
      from: "users",             // 被关联的集合
      localField: "user",        // 当前集合的关联字段
      foreignField: "name",      // 目标集合的匹配字段
      as: "userInfo"             // 匹配结果存入的新字段（数组）
    }
  }
])
// 每条订单会带上 userInfo 数组，包含 users 集合中 name 匹配的完整文档
```

## 聚合表达式速查

在 `$group` 等阶段中使用的累加/计算表达式：

| 表达式      | 说明                       |
| ----------- | -------------------------- |
| `$sum`      | 求和                       |
| `$avg`      | 平均值                     |
| `$min`      | 最小值                     |
| `$max`      | 最大值                     |
| `$push`     | 把值收集为数组             |
| `$addToSet` | 把值收集为去重数组         |
| `$first`    | 每组第一个文档的值         |
| `$last`     | 每组最后一个文档的值       |
| `$count`    | 每组条数（`$sum: 1` 亦可） |

```javascript
// 综合示例：按用户分组，统计订单数、总金额、平均金额、购买过的商品（去重）
db.orders.aggregate([
  { $match: { amount: { $gt: 0 } } },
  {
    $group: {
      _id: "$user",
      orderCount: { $sum: 1 },
      totalAmount: { $sum: "$amount" },
      avgAmount: { $avg: "$amount" },
      items: { $addToSet: "$items" }
    }
  },
  { $sort: { totalAmount: -1 } }
])
```
