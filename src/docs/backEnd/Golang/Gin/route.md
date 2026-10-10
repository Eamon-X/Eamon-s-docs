---
title: 路由
order: 1
---

# 路由

## 基本路由

Gin 支持 RESTful 风格的 HTTP 方法路由：

```go
func main() {
	r := gin.Default()

	// GET 请求
	r.GET("/user", func(c *gin.Context) {
		c.String(200, "GET 请求")
	})

	// POST 请求
	r.POST("/user", func(c *gin.Context) {
		c.String(200, "POST 请求")
	})

	// PUT 请求
	r.PUT("/user", func(c *gin.Context) {
		c.String(200, "PUT 请求")
	})

	// DELETE 请求
	r.DELETE("/user", func(c *gin.Context) {
		c.String(200, "DELETE 请求")
	})

	// PATCH 请求
	r.PATCH("/user", func(c *gin.Context) {
		c.String(200, "PATCH 请求")
	})

	// OPTIONS 请求（跨域预检）
	r.OPTIONS("/user", func(c *gin.Context) {
		c.String(200, "OPTIONS 请求")
	})

	// 任意方法
	r.Any("/any", func(c *gin.Context) {
		c.String(200, "任意 HTTP 方法")
	})

	r.Run(":8080")
}
```

### 方法对照表

| 方法 | 用途 |
|------|------|
| `GET` | 获取资源 |
| `POST` | 创建资源 |
| `PUT` | 整体更新资源 |
| `PATCH` | 部分更新资源 |
| `DELETE` | 删除资源 |
| `OPTIONS` | 跨域预检/查询支持的方法 |
| `Any` | 匹配所有方法 |

## 参数路由

### 路径参数（:param）

使用 `:` 定义路径参数，通过 `c.Param()` 获取：

```go
r.GET("/user/:id", func(c *gin.Context) {
	// 访问 /user/123 → id = "123"
	id := c.Param("id")
	c.String(200, "用户ID: %s", id)
})
```

### 通配符路由（*param）

使用 `*` 定义通配符，可以匹配任意层级路径：

```go
r.GET("/files/*filepath", func(c *gin.Context) {
	// 访问 /files/images/logo.png → filepath = /images/logo.png
	// 访问 /files/a/b/c        → filepath = /a/b/c
	filepath := c.Param("filepath")
	c.String(200, "文件路径: %s", filepath)
})
```

### 参数路由对比

| 写法 | 匹配规则 | 示例 |
|------|----------|------|
| `/user/:id` | 只匹配一级路径 | `/user/123` ✅ `/user/123/456` ❌ |
| `/files/*path` | 匹配多级路径 | `/files/a` ✅ `/files/a/b/c` ✅ |

### 同时匹配 GET 和 POST

```go
// 同一路径支持多个方法
r.GET("/user/:id", getHandler)
r.POST("/user/:id", updateHandler)
```

## 获取参数

### Query 参数（URL 查询参数）

```go
// 访问 /search?keyword=gin&page=2
r.GET("/search", func(c *gin.Context) {
	keyword := c.Query("keyword")        // 获取参数，不存在返回空字符串
	page := c.DefaultQuery("page", "1")  // 获取参数，不存在返回默认值 "1"

	// 判断参数是否存在
	if _, exists := c.GetQuery("keyword"); exists {
		// 参数存在
	}

	c.String(200, "关键词: %s, 页码: %s", keyword, page)
})
```

### Form 表单参数

```go
r.POST("/login", func(c *gin.Context) {
	username := c.PostForm("username")        // 获取表单字段
	password := c.DefaultPostForm("password", "123456")  // 带默认值

	c.String(200, "用户名: %s, 密码: %s", username, password)
})
```

## 路由分组

路由分组用于模块化管理，可以给分组统一添加中间件：

```go
func main() {
	r := gin.Default()

	// API 版本分组
	v1 := r.Group("/api/v1")
	{
		v1.GET("/users", listUsers)
		v1.GET("/users/:id", getUser)
		v1.POST("/users", createUser)
	}

	// 带中间件的分组
	admin := r.Group("/admin", AuthMiddleware())
	{
		admin.GET("/dashboard", adminDashboard)
		admin.DELETE("/users/:id", deleteUser)
	}

	r.Run(":8080")
}

func listUsers(c *gin.Context)     { c.String(200, "用户列表") }
func getUser(c *gin.Context)       { c.String(200, "用户详情") }
func createUser(c *gin.Context)    { c.String(200, "创建用户") }
func adminDashboard(c *gin.Context) { c.String(200, "管理后台") }
func deleteUser(c *gin.Context)    { c.String(200, "删除用户") }
```

### 分组的特点

1. **路径自动拼接**：分组路径 + 路由路径
2. **中间件继承**：分组内所有路由共享分组中间件
3. **支持嵌套**：分组内可以继续嵌套分组

```go
// 嵌套分组
api := r.Group("/api")
{
	v1 := api.Group("/v1")
	{
		v1.GET("/users", ...)
	}
	v2 := api.Group("/v2")
	{
		v2.GET("/users", ...)
	}
}
```

### 拆分到多个文件

项目规模上来后，全部路由写在一个文件里会越来越臃肿。推荐按**业务域**拆分，每个文件导出一个接收 `*gin.RouterGroup` 的注册函数，再由总入口统一调用。

推荐的目录结构：

```
project/
├── main.go
└── routes/
    ├── routes.go          # 总入口，统一调用各业务模块
    ├── user_routes.go     # 用户相关路由
    └── order_routes.go    # 订单相关路由
```

`routes/user_routes.go`：

```go
package routes

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// RegisterUserRoutes 注册 /api/v1/users 下的所有路由
func RegisterUserRoutes(group *gin.RouterGroup) {
	users := group.Group("/users")
	{
		users.GET("", listUsers)
		users.GET("/:id", getUser)
		users.POST("", createUser)
		users.PUT("/:id", updateUser)
		users.DELETE("/:id", deleteUser)
	}
}

func listUsers(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "用户列表"})
}
func getUser(c *gin.Context) {
	id := c.Param("id")
	c.JSON(http.StatusOK, gin.H{"id": id})
}
func createUser(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "创建用户"})
}
func updateUser(c *gin.Context) {
	id := c.Param("id")
	c.JSON(http.StatusOK, gin.H{"id": id})
}
func deleteUser(c *gin.Context) {
	id := c.Param("id")
	c.JSON(http.StatusOK, gin.H{"id": id})
}
```

`routes/order_routes.go`：

```go
package routes

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func RegisterOrderRoutes(group *gin.RouterGroup) {
	orders := group.Group("/orders")
	{
		orders.GET("", listOrders)
		orders.GET("/:id", getOrder)
	}
}

func listOrders(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "订单列表"})
}
func getOrder(c *gin.Context) {
	id := c.Param("id")
	c.JSON(http.StatusOK, gin.H{"id": id})
}
```

`routes/routes.go`（总入口）：

```go
package routes

import (
	"github.com/gin-gonic/gin"
)

// RegisterAllRoutes 挂载所有业务路由到根路由
func RegisterAllRoutes(r *gin.Engine) {
	api := r.Group("/api")
	v1 := api.Group("/v1")

	// 统一调用各业务模块的注册函数
	RegisterUserRoutes(v1)
	RegisterOrderRoutes(v1)
}
```

`main.go`：

```go
package main

import (
	"github.com/gin-gonic/gin"

	"your-project/routes"
)

func main() {
	r := gin.Default()

	// 一行代码完成所有路由注册
	routes.RegisterAllRoutes(r)

	r.Run(":8080")
}
```

> **提示**：每个 `RegisterXxxRoutes` 只负责**路由挂载**，handler 里的业务逻辑建议抽到 `service` 或 `controller` 层，路由文件保持"薄"。如果需要在路由里统一挂载 middleware（如鉴权、限流），可以在 `RegisterAllRoutes` 里给 `v1` 分组加，也可以在各业务文件内部用 `users := group.Group("", AuthMiddleware())` 单独加。

## 路由匹配优先级

Gin 基于 httprouter，路由匹配遵循以下优先级：

```go
// 1. 静态路由（最高优先级）
r.GET("/user/list", handler1)

// 2. 参数路由
r.GET("/user/:id", handler2)

// 3. 通配符路由（最低优先级）
r.GET("/user/*path", handler3)
```

> **注意**：Gin 不允许在同一位置同时存在静态路由和参数路由冲突，例如 `/user/list` 和 `/user/:id` 可以共存（因为它们对应的节点类型不同但路径语义不同，httprouter 会按优先级匹配）。但 `/:id` 和 `/*path` 不能同时注册在同一层级。

## 404 与 405 处理

### 自定义 404

```go
r.NoRoute(func(c *gin.Context) {
	c.JSON(404, gin.H{
		"code":    404,
		"message": "资源不存在",
	})
})
```

### 自定义 405（方法不允许）

```go
r.NoMethod(func(c *gin.Context) {
	c.JSON(405, gin.H{
		"code":    405,
		"message": "请求方法不允许",
	})
})
```

## 路由调试

### 打印路由表

```go
// Debug 模式下启动时打印所有注册的路由
r := gin.Default()
// ... 注册路由 ...
// 控制台会输出：
// GET    /user        --> main.main.func1
// POST   /user        --> main.main.func2
```

### 获取所有路由

```go
routes := r.Routes()
for _, route := range routes {
	fmt.Printf("%s %s → %s\n", route.Method, route.Path, route.Handler)
}
```

## 完整示例

一个包含各种路由类型的综合示例：

```go
package main

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func main() {
	r := gin.Default()

	// 静态路由
	r.GET("/", func(c *gin.Context) {
		c.String(http.StatusOK, "首页")
	})

	// 参数路由
	r.GET("/user/:id", func(c *gin.Context) {
		id := c.Param("id")
		c.JSON(http.StatusOK, gin.H{
			"id": id,
		})
	})

	// 通配符路由
	r.GET("/assets/*file", func(c *gin.Context) {
		file := c.Param("file")
		c.String(http.StatusOK, "资源: %s", file)
	})

	// 查询参数
	r.GET("/search", func(c *gin.Context) {
		q := c.Query("q")
		c.String(http.StatusOK, "搜索: %s", q)
	})

	// 路由分组
	api := r.Group("/api")
	{
		api.GET("/version", func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{"version": "1.0.0"})
		})
	}

	// 404 处理
	r.NoRoute(func(c *gin.Context) {
		c.JSON(http.StatusNotFound, gin.H{"message": "Not Found"})
	})

	r.Run(":8080")
}
```
