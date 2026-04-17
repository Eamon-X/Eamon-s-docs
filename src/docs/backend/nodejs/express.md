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
