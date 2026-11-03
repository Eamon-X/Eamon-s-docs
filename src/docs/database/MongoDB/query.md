---
title: 查询与更新操作符
order: 3
---

# 查询与更新操作符

MongoDB 的查询条件和更新操作都通过**操作符**（以 `$` 开头的键）来表达。本章以 `user` 集合为例。

## 比较操作符

| 操作符 | 含义     | SQL 等价      |
| ------ | -------- | ------------- |
| `$eq`  | 等于     | `=`           |
| `$ne`  | 不等于   | `!=`          |
| `$gt`  | 大于     | `>`           |
| `$gte` | 大于等于 | `>=`          |
| `$lt`  | 小于     | `<`           |
| `$lte` | 小于等于 | `<=`          |

```javascript
db.user.find({ age: { $gt: 20 } })   // age > 20
db.user.find({ age: { $gte: 18 } })  // age >= 18
db.user.find({ age: { $lte: 18 } })  // age <= 18
db.user.find({ age: { $lt: 18 } })   // age < 18
db.user.find({ name: { $ne: '张三' } }) // name != '张三'

// 等于可以直接写字段值，$eq 可省略
db.user.find({ name: '张三' })
db.user.find({ name: { $eq: '张三' } }) // 等价写法
```

## 包含与存在

```javascript
// $in：字段的值在指定数组中（命中任意一个即匹配）
db.user.find({ name: { $in: ['张三', '李四'] } })

// $nin：字段的值不在指定数组中
db.user.find({ name: { $nin: ['张三', '李四'] } })

// $exists：字段是否存在（1/true 表示存在）
db.user.find({ phone: { $exists: true } })  // 查询含有 phone 字段的文档
db.user.find({ phone: { $exists: false } }) // 查询不含 phone 字段的文档
```

## 逻辑操作符

```javascript
// $or：多个条件满足任意一个即匹配（SQL 中的 OR）
db.user.find({
  $or: [
    { name: '张三' },
    { age: { $gte: 18 } }
  ]
})

// $and：多个条件同时满足（普通写法并列多个字段即为 AND，$and 用于同字段多条件或显式表达）
db.user.find({
  $and: [
    { age: { $gte: 18 } },
    { age: { $lte: 30 } }
  ]
})
// 等价于（同字段多条件并列）：
db.user.find({ age: { $gte: 18, $lte: 30 } })

// $not：取反
db.user.find({ age: { $not: { $gte: 18 } } }) // age < 18 或 age 不存在

// $nor：所有条件都不满足
db.user.find({ $nor: [{ name: '张三' }, { age: { $lt: 18 } }] })
```

## 模糊查询

使用 `$regex`（或直接传正则对象）实现类似 SQL `LIKE` 的效果：

```javascript
// 相当于 LIKE '%三%'：包含"三"
db.user.find({ name: { $regex: '三' } })

// 相当于 LIKE '张%'：以"张"开头
db.user.find({ name: { $regex: '^张' } })

// 相当于 LIKE '%三'：以"三"结尾
db.user.find({ name: { $regex: '三$' } })

// 忽略大小写
db.user.find({ name: { $regex: 'tom', $options: 'i' } })

// 正则对象写法，效果同上
db.user.find({ name: /张/ })
```

## 排序与分页

```javascript
// sort：1 为升序，-1 为降序（按年龄从大到小）
db.user.find().sort({ age: -1 })

// skip：跳过指定条数；limit：限制返回条数
// 第 1 页（每页 10 条）
db.user.find().skip(0).limit(10)
// 第 2 页
db.user.find().skip(10).limit(10)

// 排序 + 分页组合：按年龄降序，取第 2 页
db.user.find().sort({ age: -1 }).skip(10).limit(10)

// 统计条数
db.user.find({ age: { $gte: 18 } }).count()
db.user.countDocuments({ age: { $gte: 18 } }) // 推荐写法
```

## 字段投影

`find` 的第二个参数指定返回哪些字段，`1` 为返回，`0` 为排除，`_id` 默认总是返回：

```javascript
// 只返回 name 和 age 字段
db.user.find({}, { name: 1, age: 1 })

// 排除 phone 字段，其余全部返回
db.user.find({}, { phone: 0 })

// 不返回 _id
db.user.find({}, { name: 1, age: 1, _id: 0 })
```

> **注意**：`1` 和 `0` 不能混用（`_id: 0` 除外），否则报错。

## 更新操作符

更新操作必须使用操作符修饰，直接传对象会**整体替换**文档：

```javascript
// ❌ 危险：整条文档被替换为 { age: 21 }，name 等其他字段丢失
db.user.updateOne({ name: '张三' }, { age: 21 })

// ✅ 正确：只修改指定字段
db.user.updateOne({ name: '张三' }, { $set: { age: 21 } })
```

| 操作符      | 说明                                       |
| ----------- | ------------------------------------------ |
| `$set`      | 设置字段值，字段不存在则创建               |
| `$unset`    | 删除字段                                   |
| `$inc`      | 数值自增/自减（正数增加，负数减少）        |
| `$mul`      | 数值乘法                                   |
| `$push`     | 向数组末尾追加元素                         |
| `$pull`     | 从数组中删除匹配的元素                     |
| `$addToSet` | 向数组添加元素（已存在时不重复添加）       |
| `$pop`      | 删除数组首（-1）或尾（1）元素              |
| `$rename`   | 字段重命名                                 |

```javascript
// $set：修改/新增字段
db.user.updateOne({ name: '张三' }, { $set: { age: 21, city: '北京' } })

// $unset：删除字段
db.user.updateOne({ name: '张三' }, { $unset: { city: "" } })

// $inc：年龄加 1（传负数则为减）
db.user.updateOne({ name: '张三' }, { $inc: { age: 1 } })

// $push：向 hobbies 数组追加元素
db.user.updateOne({ name: '张三' }, { $push: { hobbies: '篮球' } })

// $pull：从 hobbies 数组中移除元素
db.user.updateOne({ name: '张三' }, { $pull: { hobbies: '篮球' } })

// $addToSet：添加但不去覆盖已有值
db.user.updateOne({ name: '张三' }, { $addToSet: { hobbies: '读书' } })
```
