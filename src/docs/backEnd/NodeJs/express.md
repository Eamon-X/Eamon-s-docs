---
title: Express 框架 开发 Web 服务器
order: 5
---

# Express 框架 开发 Web 服务器

## Express 框架

Express 是一个基于 Node.js 平台的极简、灵活的 Web 应用开发框架，它提供了一系列强大的功能，帮助开发者快速构建 Web 应用。

Express 适合做 传统的Web网站、API接口服务器、服务器渲染中间层、开发辅助工具、自定义集成框架等

## Express 安装

```bash
npm install express
```

### 自动生成项目结构

使用官方代码生成器可以快速创建一个 Express 项目的基础结构。

```bash
npx express-generator myapp
```

## 基本使用

```js
// app.js
import express from "express";
import fs from "fs";
// 引入promisify，用于将回调函数转换为Promise
import { promisify } from "util";
// 将fs.readFile转换为Promise
const readFileAsync = promisify(fs.readFile);
const writeFileAsync = promisify(fs.writeFile);
// 获取express实例
const app = express();
// 解析application/x-www-form-urlencoded格式的请求体
app.use(express.urlencoded());
// 解析application/json格式的请求体
app.use(express.json());

// 设置端口号
const port = 3000;

// 启动服务器
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});

// 定义路由
app.get("/", async (req, res) => {
  try {
    const data = await readFileAsync("./db-user.json", "utf-8");
    const user = JSON.parse(data).user;
    res.send(user);
    // res.send 等价于 以下代码
    // res.setHeader("Content-Type", "text/html; charset=utf-8");
    // res.end(data);
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
    // 等价于
    // res.statusCode = 500;
    // res.setHeader("Content-Type", "text/plain; charset=utf-8");
    // res.end("Internal Server Error\n");
    return;
  }
});

app.post("/", async (req, res) => {
  try {
    // 打印请求头信息
    console.log(req.headers);
    // 打印请求体信息
    console.log(req.body);
    const { body } = req;
    if (!body) {
      res.status(400).send("Bad Request");
      return;
    }
    const data = await readFileAsync("./db-user.json", "utf-8");
    const user = JSON.parse(data).user;
    let maxUserId = 0;
    user.forEach((item) => {
      if (item.id > maxUserId) {
        maxUserId = item.id;
      }
    });
    maxUserId++;
    const newUser = {
      id: maxUserId,
      name: body.name,
      age: body.age,
    };
    user.push(newUser);
    // 写入文件
    const writeResult = await writeFileAsync(
      "./db-user.json",
      JSON.stringify({ user }, null, 2),
    );
    console.log("writeResult", writeResult);
    if (!writeResult) {
      res.send(newUser);
    } else {
      res.status(500).send("Internal Server Error");
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
    return;
  }
});

// 此处id是占位符，是一个变量
app.put("/:id", async (req, res) => {
  try {
    const {
      params: { id },
      body,
    } = req; // 从req.params中获取id参数
    if (!body) {
      res.status(400).send("Bad Request");
      return;
    }
    const data = await readFileAsync("./db-user.json", "utf-8");
    const user = JSON.parse(data).user;
    const index = user.findIndex((item) => item.id === parseInt(id));
    if (index === -1) {
      res.status(404).send("Not Found");
      return;
    }
    user[index].name = body.name || user[index].name;
    user[index].age = body.age || user[index].age;
    // 写入文件
    const writeResult = await writeFileAsync(
      "./db-user.json",
      JSON.stringify({ user }, null, 2),
    );
    console.log("writeResult", writeResult);
    if (!writeResult) {
      res.send(user[index]);
    } else {
      res.status(500).send("Internal Server Error");
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
});
```

## 中间件

中间件（Middleware）是 Express 中处理请求和响应的核心机制。中间件函数可以访问请求对象 (`req`)、响应对象 (`res`) 和 `next` 函数，用于在请求到达路由处理器之前或之后执行额外逻辑。

### 中间件分类

Express 中间件主要分为以下五类：

| 类型 | 说明 | 注册方式 |
|------|------|----------|
| 应用级中间件 | 对所有路由生效 | `app.use()` |
| 路由级中间件 | 仅对特定路由生效 | `router.use()` 或路由参数中添加 |
| 错误处理中间件 | 捕获和处理错误 | 四个参数 `(err, req, res, next)` |
| 内置中间件 | Express 内置功能 | `express.static()`、`express.json()` 等 |
| 第三方中间件 | npm 安装的中间件 | 如 `body-parser`、`cors` 等 |

### 应用级中间件

需要在路由定义之前使用 `app.use()` 注册，对所有后续路由生效：

```js
// 日志中间件：记录所有请求
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});
```

### 路由级中间件

仅对特定路由生效，有两种注册方式：通过路由参数直接注册，或使用 `express.Router` 注册。

#### 方式一：通过路由参数注册

在定义路由时，将中间件函数作为参数直接传递，中间件只对该路由生效：

```js
// 定义一个验证中间件
const authenticate = (req, res, next) => {
  const token = req.headers.authorization;
  if (!token) {
    return res.status(401).send('未授权');
  }
  // 验证 token 逻辑...
  req.user = { id: 1, name: '用户' };
  next();
};

// 将中间件作为第二个参数传递给路由
// 访问 /dashboard 前会先执行 authenticate 中间件
app.get('/dashboard', authenticate, (req, res) => {
  res.send(`欢迎, ${req.user.name}`);
});

// 多个中间件链式调用
app.post('/order', 
  authenticate,           // 第一个中间件：验证身份
  (req, res, next) => {   // 第二个中间件：验证订单数据
    if (!req.body.amount) {
      return res.status(400).send('缺少金额');
    }
    next();
  },
  (req, res) => {         // 路由处理器
    res.send('订单创建成功');
  }
);
```

#### 方式二：使用 express.Router 注册

```js
// 创建路由实例，用于组织相关路由
const router = express.Router();

// 在路由实例上注册中间件，仅对该路由实例下的所有路由生效
router.use((req, res, next) => {
  console.log('路由级中间件：处理 /api 前缀下的所有请求');
  // 调用 next() 将控制权传递给下一个中间件或路由处理器
  next();
});

// 定义具体路由：GET /api/users
router.get('/api/users', (req, res) => {
  res.json([]);
});

// 将路由实例挂载到主应用的 /api 路径
// 此时 router 中的路由路径会自动添加 /api 前缀
// 如上面的 /api/users 实际访问路径为 /api/api/users
app.use('/api', router);
```

### 错误处理中间件

错误处理中间件需要四个参数，必须在所有其他中间件之后注册：

```js
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('服务器内部错误');
});
```

### 内置中间件

Express 提供的常用内置中间件：

```js
// 静态文件服务
app.use(express.static('public'));

// 解析 JSON 请求体
app.use(express.json());

// 解析 URL 编码的请求体
app.use(express.urlencoded({ extended: true }));
```

### 第三方中间件

通过 npm 安装后使用：

```bash
npm install cors
```

```js
const cors = require('cors');
app.use(cors());
```
