---
title: 在 Node.js 中使用
order: 6
---

# 在 Node.js 中使用 MongoDB

在 Node.js 中连接 MongoDB 有两种常用方式：

- **官方 `mongodb` 驱动**：轻量、直接，适合简单操作和性能敏感场景
- **Mongoose**：ODM（对象文档映射）工具，提供 Schema 数据模型管理，适合复杂业务和团队协作

## 使用官方 mongodb 模块

### 安装 mongodb 模块

```shell
npm install mongodb
```

### 连接与操作数据库

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

## 使用 Mongoose 模块

Mongoose 是 MongoDB 的 ODM（对象文档映射）工具，提供了更优雅的数据模型管理方式。

### 安装 Mongoose

```bash
npm install mongoose
```

### 完整示例

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
        required: true, // 必填字段
        trim: true, // 自动去除首尾空格
      },
      age: {
        type: Number,
        min: 0, // 最小值约束
        max: 120, // 最大值约束
      },
      createdAt: {
        type: Date,
        default: Date.now, // 默认值为当前时间
      },
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

### Schema 常用约束

| 约束       | 说明                                       |
| ---------- | ------------------------------------------ |
| `type`     | 字段类型（String/Number/Date/Array 等）    |
| `required` | 必填字段                                   |
| `default`  | 默认值                                     |
| `unique`   | 唯一（创建唯一索引）                       |
| `min`/`max`| 数值/日期的最小、最大值                    |
| `enum`     | 枚举取值范围                               |
| `trim`     | 去除字符串首尾空格                         |

### 常用操作示例

```js
// 查询单条数据
// 1. 按 ID 查询
const user = await User.findById(userId);
// 2. 按字段值查询
const user = await User.findOne({ name: "小明" });

// 条件查询（操作符与 mongosh 一致，详见「查询与更新操作符」章节）
// 1. 大于等于查询
const adults = await User.find({ age: { $gte: 18 } });
// 2. 小于等于查询
const children = await User.find({ age: { $lte: 18 } });
// 3. 大于查询
const older = await User.find({ age: { $gt: 18 } });
// 4. 小于查询
const younger = await User.find({ age: { $lt: 18 } });
// 5. 不等于查询
const notEqual = await User.find({ name: { $ne: "小明" } });
// 6. 字段存在查询
const hasName = await User.findOne({ name: { $exists: true } });

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

// 分页查询
// skip(0): 跳过前0条记录（从第1条开始）
// limit(10): 每页显示10条记录
const users = await User.find().skip(0).limit(10);
// countDocuments(): 获取集合中的总记录数，用于计算总页数
const total = await User.countDocuments();

// 关联查询
// populate("friends"): 自动填充关联的 friends 字段，将外键引用替换为完整的文档数据
// populate 是 Mongoose 提供的强大功能，用于处理文档之间的关联关系
// 当一个文档中存储了其他文档的 ID（外键）时，populate 可以自动查询并填充这些关联文档的完整内容
// 支持链式调用：populate("friends").populate("posts") 可以填充多个关联字段
// 支持字段选择：populate("friends", "name age") 只填充关联文档的指定字段
const users = await User.find().populate("friends");

// 返回示例：
// [
//   {
//     _id: "user123",
//     name: "张三",
//     friends: [
//       {
//         _id: "friend456",
//         name: "李四",
//         age: 25
//       },
//       {
//         _id: "friend789",
//         name: "王五",
//         age: 28
//       }
//     ]
//   }
// ]
// 不使用 populate 时，friends 字段只会返回 ID 数组：["friend456", "friend789"]
```

### 与原生 MongoDB 驱动对比

| 特性         | 原生驱动           | Mongoose           |
| ------------ | ------------------ | ------------------ |
| **数据验证** | 需手动实现         | 内置 Schema 验证   |
| **类型安全** | 无                 | 支持 TypeScript    |
| **查询语法** | 简洁               | 更直观的链式调用   |
| **数据模型** | 无概念             | 提供 Model/Schema  |
| **学习曲线** | 低                 | 稍高               |
| **适用场景** | 简单操作、性能敏感 | 复杂业务、团队协作 |
