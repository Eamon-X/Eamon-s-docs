---
title: RESTful API 设计与实现
order: 7
---

# RESTful API 设计与实现

## 什么是 RESTful API

REST（Representational State Transfer）是一种软件架构风格，用于设计网络应用程序接口。RESTful API 遵循以下核心原则：

- **无状态性**：每个请求包含完整信息，服务器不保存客户端状态
- **统一接口**：使用标准 HTTP 方法和状态码
- **资源导向**：一切皆资源，通过 URI 标识
- **可缓存性**：响应应标记为可缓存或不可缓存

## RESTful API 设计原则

### 1. 资源命名规范

| 原则               | 示例                                              |
| ------------------ | ------------------------------------------------- |
| 使用名词，不用动词 | `/users` 而非 `/getUsers`                         |
| 使用复数形式       | `/users` 而非 `/user`                             |
| 使用连字符分隔单词 | `/user-profile` 而非 `/userProfile`               |
| 避免层级过深       | `/users/1/posts` 而非 `/users/1/posts/2/comments` |

### 2. HTTP 方法使用

| 方法     | 作用                 | 示例                         |
| -------- | -------------------- | ---------------------------- |
| `GET`    | 获取资源             | `GET /users`、`GET /users/1` |
| `POST`   | 创建资源             | `POST /users`                |
| `PUT`    | 更新资源（完整替换） | `PUT /users/1`               |
| `PATCH`  | 更新资源（部分更新） | `PATCH /users/1`             |
| `DELETE` | 删除资源             | `DELETE /users/1`            |

### 3. 状态码规范

| 状态码                      | 含义                   | 使用场景                                                                      |
| --------------------------- | ---------------------- | ----------------------------------------------------------------------------- |
| `200 OK`                    | 请求成功且返回响应内容 | GET/PUT/PATCH/DELETE 成功，适用于 PUT 或 PATCH 请求修改资源后需返回结果的场景 |
| `201 Created`               | 资源创建成功           | POST 成功                                                                     |
| `204 No Content`            | 请求成功不返回任何内容 | DELETE 成功， 适用于删除或更新操作后无需返回数据的场景                        |
| `400 Bad Request`           | 请求参数错误           | 缺少必要参数、格式错误                                                        |
| `401 Unauthorized`          | 未授权                 | 需要登录或登录失败                                                            |
| `403 Forbidden`             | 禁止访问               | 已登录但无权限                                                                |
| `404 Not Found`             | 资源不存在             | 请求的资源未找到                                                              |
| `500 Internal Server Error` | 服务器内部错误         | 代码异常                                                                      |

## Express 实现 RESTful API

### 基础示例

```js
const express = require("express");
const app = express();

// 解析 JSON 请求体
app.use(express.json());

// 模拟数据
let users = [
  { id: 1, name: "张三", age: 25 },
  { id: 2, name: "李四", age: 30 },
];

// GET - 获取所有用户
app.get("/api/users", (req, res) => {
  res.status(200).json(users);
});

// GET - 获取单个用户
app.get("/api/users/:id", (req, res) => {
  const user = users.find((u) => u.id === parseInt(req.params.id));
  if (!user) {
    return res.status(404).json({ message: "用户不存在" });
  }
  res.status(200).json(user);
});

// POST - 创建用户
app.post("/api/users", (req, res) => {
  if (!req.body.name) {
    return res.status(400).json({ message: "姓名为必填项" });
  }

  const newUser = {
    id: users.length + 1,
    name: req.body.name,
    age: req.body.age || 0,
  };

  users.push(newUser);
  res.status(201).json(newUser);
});

// PUT - 更新用户（完整替换）
app.put("/api/users/:id", (req, res) => {
  const index = users.findIndex((u) => u.id === parseInt(req.params.id));
  if (index === -1) {
    return res.status(404).json({ message: "用户不存在" });
  }

  users[index] = {
    id: parseInt(req.params.id),
    name: req.body.name,
    age: req.body.age,
  };

  res.status(200).json(users[index]);
});

// PATCH - 更新用户（部分更新）
app.patch("/api/users/:id", (req, res) => {
  const user = users.find((u) => u.id === parseInt(req.params.id));
  if (!user) {
    return res.status(404).json({ message: "用户不存在" });
  }

  if (req.body.name) user.name = req.body.name;
  if (req.body.age !== undefined) user.age = req.body.age;

  res.status(200).json(user);
});

// DELETE - 删除用户
app.delete("/api/users/:id", (req, res) => {
  const initialLength = users.length;
  users = users.filter((u) => u.id !== parseInt(req.params.id));

  if (users.length === initialLength) {
    return res.status(404).json({ message: "用户不存在" });
  }

  res.status(204).send();
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
```

## 高级特性

### 1. 查询参数支持

```js
// 支持分页、排序、过滤
app.get("/api/users", (req, res) => {
  let result = [...users];

  // 过滤
  if (req.query.name) {
    result = result.filter((u) => u.name.includes(req.query.name));
  }

  // 排序
  if (req.query.sortBy === "age") {
    result.sort((a, b) => a.age - b.age);
  }

  // 分页
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;

  res.status(200).json({
    data: result.slice(startIndex, endIndex),
    total: result.length,
    page,
    limit,
  });
});
```

### 2. 错误处理中间件

#### 核心特征：4 个参数

错误处理中间件必须有 4 个参数，第一个参数是错误对象：

```js
app.use((err, req, res, next) => {
  // err: 错误对象
  // req: 请求对象
  // res: 响应对象
  // next: 下一个中间件
});
```

**关键区别**：普通中间件只有 3 个参数 `(req, res, next)`，而错误处理中间件必须有 4 个参数。

#### 如何触发错误处理中间件

**方式 1：调用 next(err) 传递错误对象**

```js
app.get("/users/:id", async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      const error = new Error("用户不存在");
      error.status = 404;
      return next(error); // 触发错误处理中间件
    }
    res.json(user);
  } catch (err) {
    next(err); // 将捕获的错误传递给错误处理中间件
  }
});
```

**方式 2：同步代码中抛出异常**

```js
app.get("/test", (req, res) => {
  throw new Error("同步错误"); // Express 会自动捕获并传递给错误处理中间件
});
```

**方式 3：异步代码中的未捕获错误**

```js
app.get("/async", (req, res, next) => {
  setTimeout(() => {
    try {
      throw new Error("异步错误");
    } catch (err) {
      next(err); // 必须手动捕获并传递
    }
  }, 1000);
});
```

#### 在项目中的实际使用

**完整配置示例**

```js
// app.js
import express from "express";
const app = express();

// 1. 解析请求体中间件
app.use(express.json());

// 2. 路由
app.use("/api/users", userRouter);

// 3. 404 处理（放在所有路由之后）
app.use((req, res) => {
  res.status(404).json({ message: "API 接口不存在" });
});

// 4. 错误处理中间件（放在最后）
app.use((err, req, res, next) => {
  console.error(err.stack);

  const statusCode = err.status || 500;
  const message = err.message || "Internal Server Error";

  res.status(statusCode).json({
    error: statusCode === 500 ? "Internal Server Error" : message,
    message: process.env.NODE_ENV === "production" ? "服务器错误" : err.message,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
});
```

**在控制器中的使用**

```js
// userController.js
export const userController = {
  async getUser(req, res, next) {
    try {
      const user = await User.findById(req.params.id);
      if (!user) {
        const error = new Error("用户不存在");
        error.status = 404;
        return next(error);
      }
      res.json(user);
    } catch (err) {
      err.status = 500;
      next(err);
    }
  },
};
```

#### 运行时触发流程

```
客户端请求 → 路由匹配失败 → 404 中间件 → 返回 404 响应
              ↓
         路由匹配成功 → 业务逻辑执行 → 正常响应
              ↓
         发生错误（throw / next(err)）
              ↓
         错误处理中间件捕获 → 返回错误响应
```

#### 最佳实践

**1. 自定义错误类**

```js
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// 使用
next(new AppError("用户不存在", 404));
```

**2. 区分错误类型**

```js
app.use((err, req, res, next) => {
  if (err instanceof AppError) {
    // 业务错误
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  } else {
    // 系统错误
    console.error("Unexpected error:", err);
    res.status(500).json({
      status: "error",
      message: "服务器内部错误",
    });
  }
});
```

**3. 异步错误处理**

```js
// 方式 1：try-catch
async function handler(req, res, next) {
  try {
    await someAsyncOperation();
  } catch (err) {
    next(err);
  }
}

// 方式 2：Express 5.x 自动支持
// Express 5 会自动捕获 async 函数中的 Promise rejection
```

#### 关键要点

| 要点         | 说明                                           |
| ------------ | ---------------------------------------------- |
| 位置顺序     | 错误处理中间件必须放在所有其他中间件和路由之后 |
| 参数识别     | Express 通过参数数量识别错误处理中间件         |
| 错误传递     | 通过 `next(err)` 传递错误对象                  |
| 错误对象属性 | 可以自定义 `status`、`message` 等属性          |
| 环境区分     | 生产环境不应暴露详细错误信息和堆栈             |

### 3. 身份认证（JWT）

#### JWT 原理

JWT（JSON Web Token）是一种用于安全传输信息的开放标准，通过 JSON 对象在各方之间安全地传输声明。

##### JWT 结构

JWT 由三部分组成，用点号（`.`）分隔：

```
Header.Payload.Signature
```

**1. Header（头部）**

```json
{
  "alg": "HS256",
  "typ": "JWT"
}
```

- `alg`：使用的签名算法（如 HS256、RS256）
- `typ`：令牌类型，固定为 "JWT"

**2. Payload（载荷）**

```json
{
  "sub": "1234567890",
  "name": "John Doe",
  "iat": 1516239022,
  "exp": 1516239082
}
```

包含声明信息：

- **Registered Claims**（预定义声明）：`iss`（Issuer，发行者）、`sub`（Subject，主题）、`aud`（Audience，受众）、`exp`（Expiration Time，过期时间）、`nbf`（Not Before，生效时间）、`iat`（Issued At，签发时间）、`jti`（JWT ID，令牌唯一标识）
- **Public Claims**（公共声明）：自定义但不冲突的声明
- **Private Claims**（私有声明）：各方协商的自定义声明

**3. Signature（签名）**

```
HMACSHA256(
  base64UrlEncode(header) + "." +
  base64UrlEncode(payload),
  secret
)
```

使用密钥对前两部分进行签名，确保数据完整性。

##### JWT 工作流程

```
1. 用户登录 → 服务器验证 → 返回 JWT
2. 客户端存储 JWT（localStorage/cookie）
3. 后续请求携带 JWT（Authorization: Bearer <token>）
4. 服务器验证签名 → 解析 Payload → 处理请求
```

##### 签名算法对比

| 算法    | 类型       | 特点                               |
| ------- | ---------- | ---------------------------------- |
| `HS256` | 对称加密   | 同一密钥加密解密，简单但密钥需保密 |
| `RS256` | 非对称加密 | 私钥签名，公钥验证，更安全         |

##### JWT vs Session

| 特性     | JWT                | Session              |
| -------- | ------------------ | -------------------- |
| 存储位置 | 客户端             | 服务端               |
| 状态性   | 无状态             | 有状态               |
| 扩展性   | 好（易于水平扩展） | 差（需共享 Session） |
| 安全性   | 签名防篡改         | 依赖 Cookie          |

##### 安全注意事项

1. **HTTPS 传输**：防止令牌被截获
2. **合理设置过期时间**：避免令牌泄露后被长期滥用
3. **密钥管理**：使用足够长的随机密钥，定期轮换
4. **避免敏感信息**：Payload 仅做 Base64 编码，不加密
5. **Token 存储**：优先使用 HttpOnly Cookie

#### JWT 实现代码

```js
const jwt = require("jsonwebtoken");

// 生成 JWT
const generateToken = (user) => {
  const payload = {
    userId: user.id,
    username: user.username,
  };
  return jwt.sign(payload, "your-secret-key", { expiresIn: "1h" });
};

// JWT 认证中间件
const authenticate = (required = true) => {
  return (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];

    if (token) {
      jwt.verify(token, "your-secret-key", (err, decoded) => {
        if (err) {
          return res.status(403).json({ message: "无效的 token" });
        }
        req.user = decoded;
        next();
      });
    } else if (required) {
      return res.status(401).json({ message: "未授权" });
    } else {
      return next();
    }
  };
};

// 登录接口
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;

  // 验证用户...
  const user = { id: 1, username: "admin" };

  const token = generateToken(user);
  res.json({ token });
});

// 保护的路由
app.get("/api/profile", authenticate(), (req, res) => {
  res.json({ user: req.user });
});
```

## RESTful API 最佳实践

### 1. 版本控制

```js
// 方式一：URL 版本控制（推荐）
app.use("/api/v1/users", userRoutes);
app.use("/api/v2/users", userRoutesV2);

// 方式二：Header 版本控制
// Accept: application/vnd.example.v1+json
```

### 2. 响应格式统一

```js
// 成功响应
{
  "status": "success",
  "data": { /* 数据 */ },
  "message": "操作成功"
}

// 错误响应
{
  "status": "error",
  "error": {
    "code": 400,
    "message": "参数错误"
  }
}
```

### 3. 使用 HTTPS

始终使用 HTTPS 保护 API 通信，特别是涉及用户敏感数据时。

### 4. 限流

```js
const rateLimit = require("express-rate-limit");

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 分钟
  max: 100, // 限制每个 IP 最多 100 次请求
});

app.use("/api/", limiter);
```

### 5. API 文档

使用 Swagger/OpenAPI 自动生成 API 文档：

```bash
npm install swagger-jsdoc swagger-ui-express
```

```js
const swaggerUi = require("swagger-ui-express");
const swaggerJSDoc = require("swagger-jsdoc");

const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "API 文档",
      version: "1.0.0",
    },
  },
  apis: ["./routes/*.js"],
};

const swaggerDocs = swaggerJSDoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));
```

## RESTful vs GraphQL

| 特性     | RESTful        | GraphQL        |
| -------- | -------------- | -------------- |
| 请求方式 | 多个端点       | 单一端点       |
| 数据获取 | 固定响应结构   | 按需获取       |
| 版本控制 | 需要版本化     | 无需版本化     |
| 缓存     | 利用 HTTP 缓存 | 需要自定义缓存 |
| 学习曲线 | 较低           | 较高           |

**选择建议**：

- 简单 API、需要快速开发：RESTful
- 复杂数据需求、移动端应用：GraphQL

## 总结

设计 RESTful API 时应遵循：

1. 使用合适的 HTTP 方法表达操作意图
2. 使用有意义的资源命名
3. 返回合适的 HTTP 状态码
4. 提供一致的响应格式
5. 考虑安全性和性能
