---
title: mongosh 基础操作
order: 2
---

# mongosh 基础操作

`mongosh` 是 MongoDB 官方的交互式命令行（JavaScript Shell），可以直接用 JavaScript 语法操作数据库，是学习和调试 MongoDB 最常用的工具。

## 连接与断开

```shell
# 连接 MongoDB（默认连接 localhost:27017）
mongosh

# 连接指定主机、端口的数据库
mongosh "mongodb://localhost:27017"

# 断开连接并退出
exit;
quit();
```

## 数据库操作

```shell
# 显示所有数据库
show dbs

# 切换到指定数据库
# 注意：不存在时仅把当前会话的 "当前库" 切换到该名字，只读不会创建数据库，写入会创建数据库（插入数据后才真正显示）
use <database_name>

# 显示当前数据库
db

# 删除当前数据库
db.dropDatabase()
```

> **命名建议**：数据库名、集合名推荐纯小写、下划线分隔，不使用大写、空格，不以数字开头。

## 集合操作

```shell
# 显示当前数据库中的所有集合
show collections

# 显式创建集合（一般不需要，直接插入数据就会自动创建）
db.createCollection("user")

# 删除集合（collection 为集合名称，下同）
db.collection.drop()
```

> **隐式创建**：直接插入数据就会自动创建集合，如 `db.user.insertOne({ name: "张三", age: 20 })`，集合 `user` 就会被自动创建。

## 增删改查

以下示例中 `collection` 泛指任意集合名，`user` 是示例集合。

### 插入数据

```javascript
// 插入单条文档
db.collection.insertOne({ x: 1 })
db.user.insertOne({ name: "张三", age: 20 })

// 插入多条文档
db.collection.insertMany([{ x: 1 }, { y: 2 }, { z: 3 }])
db.user.insertMany([
  { name: "张三", age: 20 },
  { name: "李四", age: 21 }
])
```

### 查询数据

```javascript
// 查询所有文档
db.collection.find()

// 按条件查询
db.collection.find({ x: 1 })
db.user.find({ name: '张三' })       // 在集合 user 中，查找 name 为 '张三' 的文档
db.user.find({ age: { $gt: 20 } })   // 在集合 user 中，查找 age 大于 20 的文档
db.user.findOne({ age: { $gt: 20 } }) // 查找 age 大于 20 的第一个文档，返回结果为文档对象
```

更多条件查询写法（比较操作符、逻辑操作符、模糊查询等）见 [查询进阶](./query)。

### 更新数据

```javascript
// 更新单条文档：第一个参数为查询条件，第二个参数为更新操作
db.collection.updateOne({ x: 1 }, { $set: { x: 100 } })
db.user.updateOne({ name: '张三' }, { $set: { age: 21 } }) // 更新第一个 name 为 '张三' 的文档的 age 字段为 21

// 更新多条文档
db.collection.updateMany({ x: 1 }, { $set: { x: 100 } })
db.user.updateMany({ age: { $gt: 20 } }, { $set: { age: 22 } }) // 更新 age 大于 20 的所有文档的 age 为 22
```

### 删除数据

```javascript
// 删除单条文档
db.collection.deleteOne({ x: 1 })
db.user.deleteOne({ name: '张三' }) // 删除第一个 name 为 '张三' 的文档

// 删除多条文档
db.collection.deleteMany({ x: 1 })
db.user.deleteMany({ age: { $gt: 20 } }) // 删除 age 大于 20 的文档
```

> **注意**：不带任何条件的 `db.collection.deleteMany({})` 会清空集合中所有文档，操作前请确认当前 `db` 指向正确的数据库。
