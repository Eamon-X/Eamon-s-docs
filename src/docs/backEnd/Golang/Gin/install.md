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
	"net/http"
	"github.com/gin-gonic/gin"
)

func main() {
	// 创建一个默认的路由引擎
	// gin.Default() 会自动加载 Logger 和 Recovery 中间件
	r := gin.Default()
	// 注册一个 GET 请求路由
	// 当访问 /ping 时，返回 JSON 响应
	r.GET("/ping", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"message": "pong",
		})
	})
	// 注册一个 GET 请求路由
	r.GET("/hello", func(c *gin.Context) {
		// c.String 返回纯文本响应
		c.String(http.StatusOK, "Hello, Gin!")
	})
	// 启动HTTP服务，监听 8080 端口
	r.Run(":8080")  // 等价于 r.Run("127.0.0.1:8080")
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

## 热加载

Go 没有内置热加载，开发时通常借助第三方文件监听工具，改完代码自动重新编译并重启服务，无需手动 `Ctrl+C` 再 `go run`。社区主流工具对比如下：

| 工具 | 推荐度 | 特点 | 状态 |
|------|--------|------|------|
| **air** | ⭐⭐⭐⭐⭐ | 配置灵活、彩色日志、社区最活跃 | 活跃维护 |
| **gin**（同名 CLI 工具） | ⭐⭐⭐⭐ | 零配置开箱即用，但名字易与框架混淆 | 维护较慢 |
| **fresh** | ⭐⭐⭐ | 极简，基本无需配置 | 维护一般 |
| **CompileDaemon** | ⭐⭐⭐ | 简单，适合小项目 | 维护一般 |
| **realize** | ❌ | 功能曾最全，但已归档停止维护 | 不推荐 |

**推荐使用 [air](https://github.com/air-verse/air)**。

### 安装 air

```shell
go install github.com/air-verse/air@latest
```

### 初始化配置

在项目根目录执行，自动生成 `.air.toml` 配置文件：

```shell
air init
```

生成的配置关键项如下（已适配 Gin 项目）：

```toml
root = "."
tmp_dir = "tmp"

[build]
  # 构建命令：编译到 tmp 目录，不污染项目根目录
  cmd = "go build -o ./tmp/main ."
  bin = "tmp/main"
  # 监听的文件扩展名
  include_ext = ["go", "tpl", "tmpl", "html"]
  # 忽略的目录（避免监听无关文件导致频繁重启）
  exclude_dir = ["assets", "tmp", "vendor", "testdata"]
  # 延迟时间（毫秒），防止连续保存触发多次重启
  delay = 1000

[misc]
  # 退出时清理 tmp 目录
  clean_on_exit = true
```

### 启动热加载

```shell
air
```

之后修改任意 `.go` 文件保存，air 会自动重新编译并重启服务，终端会输出类似日志：

```
building...
running...
[GIN-debug] Listening and serving HTTP on :8080
```

> **提示**：
> - 热加载只用于**开发环境**，生产环境直接运行编译好的二进制即可，不要把 air 打进部署产物。
> - 构建失败时 air 会打印错误并保留旧进程运行，不会中断调试。
> - 如果用 VS Code 调试，可配合 Delve（`dlv`）在 air 重启后附加断点调试。

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
