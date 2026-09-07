---
title: Gin 入门
order: 0
---

# Gin 入门

## 官网文档

[Gin 官网文档](https://gin-gonic.com/zh-cn/)

## 什么是 Gin

**Gin** 是一个用 Go 语言编写的高性能 Web 框架，它以极低的 API 开销和极高的性能著称，是目前 Go 社区最流行的 Web 框架之一。

### Gin 的特点

| 特性 | 说明 |
|------|------|
| **高性能** | 基于 httprouter，API 性能极快 |
| **中间件机制** | 支持全局/局部中间件，灵活扩展 |
| **JSON 校验** | 内置参数绑定与校验功能 |
| **路由分组** | 支持路由分组，方便模块化管理 |
| **错误管理** | 内置错误处理和 Recovery 机制 |
| **渲染支持** | 支持 JSON、XML、HTML、文件等多种渲染 |

## 安装 Gin

### 1. 初始化 Go 模块

```shell
go mod init gin-demo
```

### 2. 安装 Gin 框架

```shell
go get -u github.com/gin-gonic/gin
```

> **国内加速**：如果下载缓慢，先设置代理：
> ```shell
> go env -w GOPROXY=https://goproxy.cn,direct
> ```

### 3. 验证安装

```go
package main

import (
	"github.com/gin-gonic/gin"
)

func main() {
	r := gin.Default()
	r.GET("/ping", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"message": "pong",
		})
	})
	r.Run() // 默认监听 0.0.0.0:8080
}
```

运行程序：

```shell
go run main.go
```

浏览器访问 `http://localhost:8080/ping`，返回：

```json
{"message": "pong"}
```

## 第一个 Gin 程序

创建一个完整的 Hello World 示例：

```go
package main

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func main() {
	// 创建一个默认的路由引擎
	// gin.Default() 会自动加载 Logger 和 Recovery 中间件
	r := gin.Default()

	// 注册一个 GET 请求路由
	r.GET("/hello", func(c *gin.Context) {
		// c.String 返回纯文本响应
		c.String(http.StatusOK, "Hello, Gin!")
	})

	// 启动服务，监听 8080 端口
	r.Run(":8080")
}
```

### 代码说明

| 代码 | 说明 |
|------|------|
| `gin.Default()` | 创建默认引擎，自带 Logger 和 Recovery 中间件 |
| `r.GET("/hello", handler)` | 注册 GET 路由和对应处理函数 |
| `c *gin.Context` | 上下文对象，封装了请求和响应 |
| `c.String(code, str)` | 返回字符串响应 |
| `r.Run(":8080")` | 启动 HTTP 服务 |

### 启动方式对比

```go
r.Run()            // 默认监听 0.0.0.0:8080
r.Run(":8080")     // 监听所有网卡的 8080 端口
r.Run("127.0.0.1:8080")  // 仅监听本机
r.Run(":9090")     // 指定其他端口
```

也可以使用 `http.ListenAndServe` 方式启动：

```go
r := gin.Default()
// ... 注册路由 ...
http.ListenAndServe(":8080", r)
```

## 开发模式设置

### Release 模式

生产环境建议使用 Release 模式，减少日志输出并关闭调试信息：

```go
// 方式一：设置环境变量
// 在 main 函数之前调用
gin.SetMode(gin.ReleaseMode)

func main() {
	r := gin.Default()
	r.Run(":8080")
}
```

### 模式对比

| 模式 | 设置方式 | 特点 |
|------|----------|------|
| DebugMode | 默认 | 输出调试日志，显示路由表 |
| ReleaseMode | `gin.SetMode(gin.ReleaseMode)` | 减少日志，生产环境推荐 |
| TestMode | `gin.SetMode(gin.TestMode)` | 测试环境使用 |

## 常用辅助方法

### gin.H 快捷字典

`gin.H` 是 `map[string]interface{}` 的别名，用于构建 JSON 响应：

```go
// gin.H 等价于 map[string]interface{}
c.JSON(http.StatusOK, gin.H{
	"code":    200,
	"message": "成功",
	"data":    []string{"a", "b"},
})
```

### 项目目录结构推荐

```
gin-demo/
├── main.go              # 程序入口
├── go.mod               # 模块定义
├── go.sum               # 依赖校验
├── config/              # 配置管理
├── controllers/         # 控制器层
├── models/              # 数据模型
├── middleware/          # 中间件
├── routes/              # 路由定义
├── services/            # 业务逻辑
├── uploads/             # 上传文件
└── views/               # HTML 模板
```

## 常见问题

### 1. 端口被占用

```shell
# 查看端口占用
netstat -ano | findstr :8080
# 结束占用进程（根据 PID）
taskkill /PID <PID> /F
```

### 2. 修改端口不生效

确认使用 `r.Run(":端口号")` 显式指定端口，而不是 `r.Run()`。

### 3. 404 页面

Gin 默认返回 JSON 格式的 404，也可以自定义：

```go
// 自定义 404 响应
r.NoRoute(func(c *gin.Context) {
	c.JSON(http.StatusNotFound, gin.H{
		"code":    404,
		"message": "页面不存在",
	})
})
```
