---
title: 中间件
order: 4
---

# 中间件

## 什么是中间件

**中间件（Middleware）** 是在请求到达路由处理函数之前或之后执行的一段逻辑。可以理解为请求处理流水线上的关卡：

```
请求进入
   │
   ▼
┌─────────────┐
│ 中间件 1     │── 日志记录
├─────────────┤
│ 中间件 2     │── 鉴权认证
├─────────────┤
│ 中间件 3     │── 限流
├─────────────┤
│ 路由处理函数  │── 业务逻辑
└─────────────┘
   │
   ▼
响应返回
```

## 中间件执行流程

Gin 中间件通过 `c.Next()` 和 `c.Abort()` 控制执行流程：

### Next 流程

```go
func Middleware1() gin.HandlerFunc {
	return func(c *gin.Context) {
		fmt.Println("中间件1 - 开始")
		c.Next() // 继续执行下一个中间件或路由处理函数
		fmt.Println("中间件1 - 结束")
	}
}

func Middleware2() gin.HandlerFunc {
	return func(c *gin.Context) {
		fmt.Println("中间件2 - 开始")
		c.Next()
		fmt.Println("中间件2 - 结束")
	}
}

func main() {
	r := gin.Default()
	r.Use(Middleware1(), Middleware2())

	r.GET("/test", func(c *gin.Context) {
		fmt.Println("路由处理函数")
		c.String(200, "ok")
	})

	r.Run(":8080")
}
```

执行顺序：

```
中间件1 - 开始
中间件2 - 开始
路由处理函数
中间件2 - 结束
中间件1 - 结束
```

### Abort 流程

`c.Abort()` 会停止后续中间件和路由处理函数的执行：

```go
func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		token := c.GetHeader("Authorization")
		if token == "" {
			// 终止后续执行
			c.Abort()
			// 直接返回响应
			c.JSON(401, gin.H{"message": "未认证"})
			return
		}
		// 认证通过，继续执行
		c.Next()
	}
}
```

执行顺序：

```
AuthMiddleware - 检查 token
   │
   ├── token 为空 → Abort → 返回 401（后续中间件和路由都不执行）
   │
   └── token 有效 → Next → 执行后续逻辑
```

## 注册中间件

### 全局中间件

所有路由都会执行：

```go
func main() {
	r := gin.Default()

	// 注册全局中间件
	r.Use(LoggerMiddleware())
	r.Use(AuthMiddleware())

	// 以下路由都会经过上述中间件
	r.GET("/a", handlerA)
	r.POST("/b", handlerB)
}
```

### 路由级中间件

只对指定路由生效：

```go
r.GET("/admin", AdminAuthMiddleware(), func(c *gin.Context) {
	c.String(200, "管理员页面")
})
```

### 分组中间件

对分组内所有路由生效：

```go
api := r.Group("/api")
api.Use(AuthMiddleware()) // 组内所有路由都需要认证
{
	api.GET("/users", listUsers)
	api.POST("/users", createUser)
}

// 不在组内，不需要认证
r.GET("/public", publicHandler)
```

## 自定义中间件

### 基本结构

```go
// 日志中间件
func LoggerMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()

		// 请求前
		fmt.Printf("开始处理: %s %s\n", c.Request.Method, c.Request.URL.Path)

		// 调用下一个处理函数
		c.Next()

		// 请求后
		duration := time.Since(start)
		fmt.Printf("处理完成: 耗时 %v, 状态码 %d\n",
			duration, c.Writer.Status())
	}
}
```

### 带参数的中间件

```go
// 带参数的鉴权中间件
func AuthWithRoles(roles ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		// 获取用户角色
		role := c.GetHeader("X-User-Role")
		if role == "" {
			c.Abort()
			c.JSON(401, gin.H{"message": "未认证"})
			return
		}

		// 检查角色权限
		hasPermission := false
		for _, r := range roles {
			if role == r {
				hasPermission = true
				break
			}
		}

		if !hasPermission {
			c.Abort()
			c.JSON(403, gin.H{"message": "无权限访问"})
			return
		}

		// 将用户信息存入上下文
		c.Set("role", role)
		c.Next()
	}
}

// 使用
admin := r.Group("/admin", AuthWithRoles("admin", "superuser"))
{
	admin.GET("/dashboard", dashboardHandler)
}
```

## 上下文传递数据

中间件之间、中间件与路由之间可以通过 `c.Set()` / `c.Get()` 传递数据：

```go
// 认证中间件
func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		token := c.GetHeader("Authorization")
		// 解析 token，获取用户信息...
		userID := int64(123)

		// 存入上下文
		c.Set("userID", userID)
		c.Set("username", "admin")
		c.Next()
	}
}

// 路由处理函数中获取
r.GET("/profile", AuthMiddleware(), func(c *gin.Context) {
	// 从上下文获取
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(401, gin.H{"message": "未登录"})
		return
	}

	username, _ := c.Get("username")

	c.JSON(200, gin.H{
		"userID":   userID,
		"username": username,
	})
})
```

### 类型安全的取值

```go
// 使用类型断言获取
userID := c.GetInt64("userID")        // int64
username := c.GetString("username")   // string
enabled := c.GetBool("enabled")       // bool

// 获取任意类型并断言
value, exists := c.Get("data")
if exists {
	if data, ok := value.(MyType); ok {
		// 使用 data
	}
}
```

## 内置中间件

### gin.Logger

记录请求日志：

```go
r := gin.New() // 创建空引擎，不带任何中间件
r.Use(gin.Logger()) // 手动添加日志中间件
```

输出格式：

```
[GIN] 2024/01/15 - 10:00:00 | 200 | 1.2ms | 127.0.0.1 | GET "/api/users"
```

### gin.Recovery

捕获 panic，防止程序崩溃：

```go
r := gin.New()
r.Use(gin.Recovery()) // panic 时返回 500，程序继续运行

r.GET("/panic", func(c *gin.Context) {
	panic("出错了") // 会被 Recovery 捕获，不会崩溃
})
```

> `gin.Default()` 等价于 `gin.New()` + `gin.Logger()` + `gin.Recovery()`

### 自定义 Logger 格式

```go
r := gin.New()
r.Use(gin.LoggerWithFormatter(func(param gin.LogFormatterParams) string {
	// 自定义日志格式
	return fmt.Sprintf("[%s] %s - %s %s %d %s\n",
		param.TimeStamp.Format("2006-01-02 15:04:05"),
		param.ClientIP,
		param.Method,
		param.Path,
		param.StatusCode,
		param.Latency,
	)
}))
```

## 常见中间件示例

### CORS 跨域中间件

```go
func CorsMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// 允许所有来源
		c.Header("Access-Control-Allow-Origin", "*")
		// 允许的请求方法
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		// 允许的请求头
		c.Header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With")
		// 允许携带 Cookie
		c.Header("Access-Control-Allow-Credentials", "true")
		// 预检请求缓存时间（秒）
		c.Header("Access-Control-Max-Age", "86400")

		// 预检请求直接返回
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	}
}

// 使用
r := gin.Default()
r.Use(CorsMiddleware())
```

### 限流中间件

```go
func RateLimitMiddleware(limit int) gin.HandlerFunc {
	// 简单的令牌桶
	bucket := make(chan struct{}, limit)
	// 定期补充令牌
	go func() {
		for {
			select {
			case bucket <- struct{}{}:
				time.Sleep(100 * time.Millisecond)
			}
		}
	}()

	return func(c *gin.Context) {
		select {
		case <-bucket:
			// 获取到令牌，放行
			c.Next()
		default:
			// 令牌不足，拒绝请求
			c.Abort()
			c.JSON(429, gin.H{"message": "请求过于频繁"})
		}
	}
}
```

> 生产环境建议使用官方限流库：`golang.org/x/time/rate` 或 `github.com/ulule/limiter`

### 请求超时中间件

```go
func TimeoutMiddleware(timeout time.Duration) gin.HandlerFunc {
	return func(c *gin.Context) {
		// 创建带超时的上下文
		ctx, cancel := context.WithTimeout(c.Request.Context(), timeout)
		defer cancel()

		// 替换请求上下文
		c.Request = c.Request.WithContext(ctx)

		// 处理完成后检查是否超时
		c.Next()

		if ctx.Err() == context.DeadlineExceeded {
			c.Abort()
			c.JSON(504, gin.H{"message": "请求超时"})
		}
	}
}
```

### 请求 ID 中间件

```go
func RequestIDMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// 从请求头获取，没有则生成
		requestID := c.GetHeader("X-Request-ID")
		if requestID == "" {
			requestID = generateID()
		}

		// 存入上下文和响应头
		c.Set("requestID", requestID)
		c.Header("X-Request-ID", requestID)

		c.Next()
	}
}
```

## 中间件执行顺序总结

```go
// 中间件按注册顺序执行
r.Use(A(), B(), C())

// 执行顺序：
// A开始 → B开始 → C开始 → 路由函数 → C结束 → B结束 → A结束
```

```go
// Abort 停止后续执行
r.Use(A(), B(), C())

// 如果 B 中调用了 Abort()：
// A开始 → B开始 → B结束(Abort) → A结束
// C 和路由函数都不会执行
```

## 注意事项

1. **中间件顺序很重要**：先注册的先执行
2. **Abort 后仍需返回响应**：`Abort()` 不会自动返回响应，需要显式调用
3. **不要在中间件中阻塞太久**：会影响整个服务的响应能力
4. **使用 goroutine 时要复制上下文**：不要在 goroutine 中使用 `*gin.Context`

```go
func BadMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// ❌ 错误：在 goroutine 中使用 c
		go func() {
			c.Set("data", 1) // 并发访问上下文，不安全
		}()

		// ✅ 正确：复制需要的值
		value := c.GetHeader("X-Value")
		go func(v string) {
			// 在 goroutine 中使用复制的值
			fmt.Println(v)
		}(value)

		c.Next()
	}
}
```
