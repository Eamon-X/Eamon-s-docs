---
title: 原生 Node 开发 Web 服务器
order: 4
---

# 原生 Node 开发 Web 服务器

## 基础实现

```js
// server.js

import http from "http";
import router from "./router.js";
// 1. 创建一个HTTP服务器
const server = http.createServer();

// 服务器监听端口8080
server.listen(8080, "localhost", () => {
  console.log("服务器运行在 http://localhost:8080/");
});

// 2. 服务器接收请求并处理
server.on("request", (req, res) => {
  // 传递给路由函数处理
  router(req, res);
});
```

```js
// router.js
import url from "url";
import querystring from "querystring";
import controller from "./controller.js";
export default function router(req, res) {
  // 3. 根据不同的请求方法做不同的处理
  if (req.method === "GET") {
    // 处理 GET 请求
    // GET 请求的参数在 req.url 中（请求头传参）
    const query = url.parse(req.url, true).query;
    console.log("GET 请求参数:", query);
    // 4. 响应处理结果并断开链接
    if (req.url === "/") {
      controller.index(req, res);
    } else if (req.url === "/html") {
      controller.html(req, res);
    } else {
      controller.notFound(req, res);
    }
  } else if (req.method === "POST") {
    // 处理 POST 请求
    // POST 请求的参数在 req.body 中（请求体传参）
    let body = "";
    req.on("data", (chunk) => {
      // chunk 是 Buffer 类型，需要转换为字符串
      body += chunk;
    });
    req.on("end", () => {
      controller.post(req, res, querystring.parse(body));
    });
    res.end();
  } else {
    // 处理其他请求方法
  }
}
```

```js
// controller.js

export default {
  // 处理 GET 请求
  index(req, res) {
    res.statusCode = 200;
    res.setHeader("Content-Type", "text/plain; charset=utf-8"); // 服务器数据响应类型：text/plain 文本类型；charset=utf-8 编码类型
    res.end("Hello, World!\n");
  },
  html(req, res) {
    res.statusCode = 200;
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.end("<h1>Hello, World!</h1>\n");
  },
  notFound(req, res) {
    res.statusCode = 404;
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.end("404 Not Found\n");
  },

  // 处理 POST 请求
  post(req, res, body) {
    // 业务逻辑...
    console.log(`POST 请求参数: `, body);
  },
};
```

**nodemon 工具**：监听文件变化，自动重启服务器

全局安装：

```bash
npm install -g nodemon
```

使用：

```bash
nodemon server.js
```

## 服务器数据响应类型

- text/plain 文本类型（需要指定编码类型）
- text/html HTML 类型（需要指定编码类型）
- application/json JSON 类型（需要指定编码类型）
- application/javascript JavaScript 类型（需要指定编码类型）
- image/png PNG 图片类型（二进制类型是按字节传输的，不需要字符编码信息）
- image/jpeg JPEG 图片类型（二进制类型是按字节传输的，不需要字符编码信息）
- audio/mpeg MP3 音频类型（二进制类型是按字节传输的，不需要字符编码信息）
- video/mp4 MP4 视频类型（二进制类型是按字节传输的，不需要字符编码信息）

## 编码类型

- charset=utf-8 万国码
- charset=gbk 国标码

## 请求方法

- GET 获取服务器资源
- POST 向服务器提交数据
- PUT 向服务器写入资源，如果已存在则进行替换
- DELETE 删除资源
- HEAD 与 GET 方法相同，但只返回响应头信息，不返回响应体
- OPTIONS 用于查询服务器所支持的请求方法

## 请求体类型

- application/x-www-form-urlencoded 表单数据类型（键值对格式）
- multipart/form-data 包含文件上传的表单数据类型（键值对格式）
- application/json JSON 数据类型（键值对格式）

## 响应状态码

- 1xx 信息响应类
- 2xx 成功响应类
- 3xx 重定向响应类
- 4xx 客户端错误响应类
- 5xx 服务器错误响应类
