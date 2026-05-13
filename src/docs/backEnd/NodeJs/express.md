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

## 路由

### 路由方法

| 路由方法       | 描述               |
| -------------- | ------------------ |
| `app.all()`    | 处理所有 HTTP 请求 |
| `app.get()`    | 处理 GET 请求      |
| `app.post()`   | 处理 POST 请求     |
| `app.put()`    | 处理 PUT 请求      |
| `app.delete()` | 处理 DELETE 请求   |

### 路径参数

Express 使用 `path-to-regexp` 库来解析路由路径，支持多种参数格式：

#### 基础路径参数

使用 `:param` 格式定义路径参数，参数值通过 `req.params` 访问：

```js
// 定义路由：匹配 /user/123
app.get("/user/:id", (req, res) => {
  res.send(`User ID: ${req.params.id}`);
});

// 多个路径参数：匹配 /posts/2024/05
app.get("/posts/:year/:month", (req, res) => {
  res.send(`Year: ${req.params.year}, Month: ${req.params.month}`);
});
```

#### 可选参数（?）

参数名后加 `?` 表示该参数可选：

```js
// 匹配 /user/123 和 /user
app.get("/user/:id?", (req, res) => {
  res.send(`User ID: ${req.params.id || "未指定"}`);
});

// 多个可选参数：匹配 /posts、/posts/2024、/posts/2024/05
app.get("/posts/:year?/:month?", (req, res) => {
  res.send(`Year: ${req.params.year}, Month: ${req.params.month}`);
});
```

#### 匹配多个路径段（+）

参数名后加 `+` 表示匹配一个或多个路径段：

```js
// 匹配 /files/documents/report.pdf
app.get("/files/:path+", (req, res) => {
  res.send(`Path: ${req.params.path}`); // 输出: documents/report.pdf
});
```

#### 匹配零或多个路径段（\*）

参数名后加 `*` 表示匹配零个或多个路径段：

```js
// 匹配 /static/css/style.css 和 /static
app.get("/static/*", (req, res) => {
  res.send(`Static path: ${req.params[0]}`);
});
```

#### 正则表达式约束

可以使用正则表达式约束参数格式：

```js
// 仅匹配数字 ID：/user/123
app.get("/user/:id(\\d+)", (req, res) => {
  res.send(`Numeric ID: ${req.params.id}`);
});

// 匹配特定格式的日期：/date/2024-05-20
app.get("/date/:date(\\d{4}-\\d{2}-\\d{2})", (req, res) => {
  res.send(`Date: ${req.params.date}`);
});
```

#### 参数默认值

可以在处理函数中为参数设置默认值：

```js
app.get("/posts/:page?", (req, res) => {
  const page = parseInt(req.params.page) || 1;
  res.send(`当前页码: ${page}`);
});
```

## 响应方法

| 响应方法           | 描述                                           |
| ------------------ | ---------------------------------------------- |
| `res.send()`       | 发送文本响应                                   |
| `res.json()`       | 发送 JSON 响应                                 |
| `res.download()`   | 发送下载响应                                   |
| `res.redirect()`   | 发送重定向响应                                 |
| `res.render()`     | 发送渲染响应                                   |
| `res.sendStatus()` | 设置状态码并立即发送响应（包含状态码对应文本） |
| `res.status()`     | 设置响应状态码（可链式调用其他方法）           |
| `res.setHeader()`  | 设置响应头                                     |
| `res.end()`        | 结束响应                                       |

### res.sendStatus() vs res.status()

两者都用于设置HTTP响应状态码，但用法和行为有重要区别：

| 特性       | `res.sendStatus(code)`                           | `res.status(code)`                     |
| ---------- | ------------------------------------------------ | -------------------------------------- |
| **作用**   | 设置状态码并立即发送响应                         | 仅设置状态码，不发送响应               |
| **响应体** | 自动发送状态码对应的文本（如 404 → "Not Found"） | 无响应体，需后续调用 `send()`/`json()` |
| **返回值** | 无（响应已发送）                                 | 返回 `res` 对象，支持链式调用          |

```js
// res.sendStatus() - 一步完成
res.sendStatus(404); // 等价于 res.status(404).send('Not Found')
res.sendStatus(200); // 等价于 res.status(200).send('OK')

// res.status() - 可链式调用
res.status(400).send("请求参数错误");
res.status(201).json({ id: 1, message: "创建成功" });
res.status(500).end(); // 仅发送状态码，无响应体
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

| 类型           | 说明             | 注册方式                                         |
| -------------- | ---------------- | ------------------------------------------------ |
| 应用级中间件   | 对所有路由生效   | `app.use()`                                      |
| 路由级中间件   | 仅对特定路由生效 | `router.use()` 或路由参数中添加                  |
| 错误处理中间件 | 捕获和处理错误   | 四个参数 `(err, req, res, next)`                 |
| 内置中间件     | Express 内置功能 | `express.static()`、`express.json()` 等          |
| 第三方中间件   | npm 安装的中间件 | 如 `body-parser`、`cors`、`express-validator` 等 |

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
    return res.status(401).send("未授权");
  }
  // 验证 token 逻辑...
  req.user = { id: 1, name: "用户" };
  next();
};

// 将中间件作为第二个参数传递给路由
// 访问 /dashboard 前会先执行 authenticate 中间件
app.get("/dashboard", authenticate, (req, res) => {
  res.send(`欢迎, ${req.user.name}`);
});

// 多个中间件链式调用
app.post(
  "/order",
  authenticate, // 第一个中间件：验证身份
  (req, res, next) => {
    // 第二个中间件：验证订单数据
    if (!req.body.amount) {
      return res.status(400).send("缺少金额");
    }
    next();
  },
  (req, res) => {
    // 路由处理器
    res.send("订单创建成功");
  },
);
```

#### 方式二：使用 express.Router 注册

```js
// 创建路由实例，用于组织相关路由
const router = express.Router();

// 在路由实例上注册中间件，仅对该路由实例下的所有路由生效
router.use((req, res, next) => {
  console.log("路由级中间件：处理 /api 前缀下的所有请求");
  // 调用 next() 将控制权传递给下一个中间件或路由处理器
  next();
});

// 定义具体路由：GET /api/users
router.get("/api/users", (req, res) => {
  res.json([]);
});

// 将路由实例挂载到主应用的 /api 路径
// 此时 router 中的路由路径会自动添加 /api 前缀
// 如上面的 /api/users 实际访问路径为 /api/api/users
app.use("/api", router);
```

### 错误处理中间件

错误处理中间件需要四个参数，必须在所有其他中间件之后注册：

```js
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("服务器内部错误");
});
```

### 内置中间件

Express 提供的常用内置中间件：

```js
// 静态文件服务
app.use(express.static("public"));

// 解析 JSON 请求体
app.use(express.json());

// 解析 URL 编码的请求体
app.use(express.urlencoded({ extended: true }));
```

### 第三方中间件

#### cors 中间件解决 CORS 问题

CORS（Cross-Origin Resource Sharing）是一种安全机制，用于限制从一个域名访问另一个域名的资源。如果您的 Express 应用需要从其他域名发送请求，您需要配置 CORS 中间件来处理跨域请求。

#### 使用 cors 中间件

通过 npm 安装后使用：

```bash
npm install cors
```

```js
const cors = require("cors");
app.use(cors());
```

#### 文件上传中间件

使用 `multer` 中间件处理文件上传：

```bash
npm install multer
```

```js
// 引入 multer 中间件
import multer from "multer";
// 创建 multer 实例，指定上传相对目录
const upload = multer({ dest: "uploaded/" });

// 定义路由，处理文件上传，file 是表单字段名，需要与前端表单中的 name 属性一致
app.post("/upload", upload.single("file"), (req, res) => {
  // 处理上传的文件
  console.log(req.file);
  // {
  //   fieldname: 'file',
  //   originalname: '3D_Clay_BlindBox.png',
  //   encoding: '7bit',
  //   mimetype: 'image/png',
  //   destination: 'uploaded/',
  //   filename: '544b0d66570a4fe2c6e686efe16e4960',
  //   path: 'uploaded\\544b0d66570a4fe2c6e686efe16e4960',
  //   size: 54127
  // }
  const fileNameArr = req.file.originalname.split(".");
    const fileType = fileNameArr[fileNameArr.length - 1];
    try {
      await renameAsync(
        `./uploaded/${req.file.filename}`,
        `./uploaded/${req.file.filename}.${fileType}`,
      );
      const updateUser = await User.findByIdAndUpdate(
        req.user._id,
        {
          avatar: `${req.file.filename}.${fileType}`,
        },
        { new: true },
      );
      res.status(200).json({ user: updateUser });
    } catch (error) {
      res.status(500).json({ errors: error });
    }
});
```
