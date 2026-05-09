---
title: MongoDB数据持久化存储
order: 6
---

# MongoDB数据持久化存储

## 介绍

MongoDB 是一个底层由C++ 实现的数据库，它支持实时应用和高并发场景，同时提供了丰富的查询和索引功能，使开发能够快速构建和部署应用。

MongoDB 是一个基于文档存储（数据都是以文件存储在磁盘上）的分布式（可以分布到多个节点上）的 NoSQL 数据库（非关系型数据库）。

MongoDB 的数据结构由键值对(key-value)组成，每个键值对都有一个唯一的键(key)和一个值(value)。

MongoDB 适合对数据处理性能要求较高的场景，例如实时应用、高并发场景等；适合需要借助缓存层来处理数据的场景；适合需要高度的伸缩性（水平扩展）的场景。

## 特性

- 文档型数据库，较强可扩展性，拥有强大的查询语言，多种存储引擎
- 高性能、高可用、水平扩展；支持数据嵌入，子文档查询、支持副本集与分片
- 多种查询类型支持，且支持数据聚合查询、文本检索、地址位置查询

## 下载

[下载MongoDB](https://www.mongodb.com/zh-cn/docs/manual/administration/install-community/?operating-system=windows&windows-installation-method=msiexec)

## 基础概念

- 数据库：MongoDB 数据库是存储数据的容器，每个数据库可以包含多个集合（collection）。
- 集合：MongoDB 集合是存储数据的容器，每个集合可以包含多个文档（document）。
- 文档：MongoDB 文档是存储数据的基本单位，每个文档都有一个唯一的键（key）和一个值（value）。
- 字段：MongoDB 文档的字段是文档中存储的数据，每个字段都有一个键（key）和一个值（value）。
- 索引：MongoDB 索引是用于加速查询的特殊数据结构，每个索引都有一个键（key）和一个值（value）。
- 聚合：MongoDB 聚合是用于对数据进行复杂操作的特殊查询，每个聚合都有一个键（key）和一个值（value）。

```json
// MongoDB
{
  // 数据库 DataBase
  "DataBase": {
    // 集合 Collection，对应关系数据库中的表（table）
    "Collection": [
      // 文档 Document，对应关系数据库中的行（row）
      {
        // 字段 Field，对应关系数据库中的列（column）
        "Field": "Value"
      }
    ]
  },
  "京东": {
    "商品": [
      {
        "商品ID": "123456",
        "商品名称": "商品A",
        "商品价格": 100
      }
    ],
    "订单": [
      {
        "订单ID": "123456",
        "订单金额": 100
      }
    ]
  },
  "淘宝": {
    "商品": [
      {
        "商品ID": "789012",
        "商品名称": "商品B",
        "商品价格": 200
      }
    ]
  }
}
```

## Mongo Shell

### 连结与断开

```shell
# 连结MongoDB
mongosh

# 断开MongoDB连接
exit;
quit();
```

### 数据库操作

```shell
# 显示所有数据库
show dbs

# 切换到指定数据库，不存在时仅把当前会话的 “默认库” 切到这个名字，只读不会创建数据库，写入会创建数据库（插入数据后才真正显示）
use <database_name>;  ## 数据库名、集合名 推荐纯小写、下划线分隔、无大写、无空格，不以数字开头

# 显示当前数据库
db

# 删除当前数据库
db.dropDatabase();
```

### 集合（表）操作

```shell
# 显示所有集合
show collections

## 创建集合：直接插入数据就会自动创建，如 db.user.insertOne({ name: "张三", age: 20 }) ，集合 user 就会被自动创建

# 删除当前集合
db.collection.drop(); ## collection为集合名称
```

### 增删改查

#### 插入数据

```shell
# 插入单条文档
db.collection.insertOne({x:1});  ## collection为集合名称
db.user.insertOne({ name: "张三", age: 20 })

# 插入多条文档
db.collection.insertMany([{x:1},{y:2},{z:3}]);
db.user.insertMany([
    { name: "张三", age: 20 },
    { name: "李四", age: 21 },
])
```

#### 删除数据

```shell
# 删除单条文档
db.collection.deleteOne({x:1});  ## collection为集合名称
db.user.deleteOne({name: '张三'})  ## 在集合 user 中，删除第一个 name 为 '张三' 的文档

# 删除多条文档
db.collection.deleteMany({x:1});  ## collection为集合名称
db.user.deleteMany({age: {$gt: 20}})  ## 在集合 user 中，删除 age 大于 20 的文档
```

#### 查询数据

```shell
# 查询所有文档
db.collection.find();

# 查询指定文档字段
db.collection.find({x:1});
db.user.find({name: '张三'})  ## 在集合 user 中，查找 name 为 '张三' 的文档
db.user.find({age: {$gt: 20}})  ## 在集合 user 中，查找 age 大于 20 的文档
db.user.findOne({age: {$gt: 20}})  ## 在集合 user 中，查找 age 大于 20 的第一个文档，返回结果为文档对象

```

#### 更新数据

```shell
# 更新单条文档
db.collection.updateOne({x:1}, {$set: {x: 100}});  ## 第一个参数为查询条件，第二个参数为更新操作
db.user.updateOne({name: '张三'}, {$set: {age: 21}});  ## 在集合 user 中，更新第一个 name 为 '张三' 的文档的 age 字段为 21

# 更新多条文档
db.collection.updateMany({x:1}, {$set: {x: 100}});  ## 第一个参数为查询条件，第二个参数为更新操作
db.user.updateMany({age: {$gt: 20}}, {$set: {age: 22}});  ## 在集合 user 中，更新 age 大于 20 的文档的 age 字段为 22
```

## 第三方客户端链接

Navicat Premium 是一个功能强大的数据库客户端工具，支持连接 MongoDB 数据库。
[下载Navicat Premium](https://www.navicat.com.cn/products)

## 用NodeJs连接MongoDB

### 使用官方mongodb模块

#### 安装mongodb模块

```shell
npm install mongodb
```

#### 连接与操作数据库

```js
// 引入 mongodb 官方包
const { MongoClient } = require("mongodb");
// 连接地址（本地默认）
const url = "mongodb://localhost:27017";
// 创建客户端
const client = new MongoClient(url);
// 连接 + 测试
async function testConnectDB(dbName) {
  try {
    // 连接数据库
    await client.connect();
    console.log("✅ MongoDB 连接成功！");
    // 选择数据库
    const db = client.db(dbName);
    // 选择集合（相当于表）
    const userCollection = db.collection("user");
    // 测试：插入一条数据
    await userCollection.insertOne({ name: "小明", age: 20 });
    console.log("✅ 数据插入成功");
    // 测试：查询数据
    const data = await userCollection.find().toArray();
    console.log("📄 查询到的数据：", data);
  } catch (err) {
    console.error("❌ 连接失败：", err);
  } finally {
    // 关闭连接
    await client.close();
    console.log("✅ MongoDB 连接已关闭");
  }
}

// 执行
testConnectDB("my_test");
```

### 使用 Mongoose 模块

Mongoose 是 MongoDB 的 ODM（对象文档映射）工具，提供了更优雅的数据模型管理方式。

#### 安装 Mongoose

```bash
npm install mongoose
```

#### 完整示例

```js
// 引入 mongoose
const mongoose = require("mongoose");

// 连接数据库（MongoDB 6.0+ 无需额外配置参数）
async function testConnectDB() {
  try {
    // 连接 MongoDB
    await mongoose.connect("mongodb://localhost:27017/my_test");
    console.log("✅ MongoDB 连接成功！");

    // 1. 定义数据模型（Schema）
    const userSchema = new mongoose.Schema({
      name: {
        type: String,
        required: true,  // 必填字段
        trim: true       // 自动去除首尾空格
      },
      age: {
        type: Number,
        min: 0,          // 最小值约束
        max: 120         // 最大值约束
      },
      createdAt: {
        type: Date,
        default: Date.now  // 默认值为当前时间
      }
    });

    // 2. 创建模型（Model）
    // - 第一个参数：模型名称（首字母大写，遵循类命名约定）
    // - 第二个参数：对应的 Schema
    // - Mongoose 会自动将模型名转换为小写复数形式作为集合名
    //   例如：User → users，Product → products
    const User = mongoose.model("User", userSchema);
    
    // 💡 为什么 User 要用大写？
    // - mongoose.model() 返回的是一个 JavaScript 类（构造函数）
    // - JavaScript 约定：类和构造函数使用 PascalCase（首字母大写）
    // - 后续使用 new User() 创建实例时，大写开头符合直觉
    // - 这与变量/函数使用 camelCase（小驼峰）的规范不冲突
    // - 与"推荐全小写"不冲突，因为这是类名，不是普通变量名

    // 3. 插入数据
    const newUser = new User({ name: "小明", age: 20 });
    await newUser.save();
    console.log("✅ 数据插入成功");

    // 4. 查询数据
    const users = await User.find();
    console.log("📄 查询到的数据：", users);

  } catch (err) {
    console.error("❌ 操作失败：", err);
  } finally {
    // 关闭连接
    await mongoose.disconnect();
    console.log("✅ MongoDB 连接已关闭");
  }
}

// 执行
testConnectDB();
```

#### Mongoose 常用操作示例

```js
// 查询单条数据
// 1. 按 ID 查询
const user = await User.findById(userId);
// 2. 按字段值查询
const user = await User.findOne({ name: "小明" });

// 条件查询
// 1. 等于查询
const user = await User.findOne({ name: "小明" });
// 2. 大于等于查询
const adults = await User.find({ age: { $gte: 18 } });
// 3. 小于等于查询
const children = await User.find({ age: { $lte: 18 } });
// 4. 大于查询
const older = await User.find({ age: { $gt: 18 } });
// 5. 小于查询
const younger = await User.find({ age: { $lt: 18 } });
// 6. 不等于查询
const notEqual = await User.find({ name: { $ne: "小明" } });
// 7. 存查询
const hasName = await User.findOne({ name: { $exists: true } });
// 8. 存查询
const hasAge = await User.find({ age: { $gte: 18 } });

// 更新数据
// 1. 按 ID 更新
await User.findByIdAndUpdate(userId, { age: 21 });
// 2. 按字段值更新
await User.findOneAndUpdate({ name: "小明" }, { age: 21 });

// 删除数据
// 1. 按 ID 删除
await User.findByIdAndDelete(userId);
// 2. 按字段值删除
await User.findOneAndDelete({ name: "小明" });

// 计数
const count = await User.countDocuments({ age: { $gte: 18 } });
```

#### 与原生 MongoDB 驱动对比

| 特性 | 原生驱动 | Mongoose |
|------|----------|----------|
| **数据验证** | 需手动实现 | 内置 Schema 验证 |
| **类型安全** | 无 | 支持 TypeScript |
| **查询语法** | 简洁 | 更直观的链式调用 |
| **数据模型** | 无概念 | 提供 Model/Schema |
| **学习曲线** | 低 | 稍高 |
| **适用场景** | 简单操作、性能敏感 | 复杂业务、团队协作 |
