---
title: 响应处理
order: 3
---

# 响应处理

## JSON 响应

JSON 是 Web API 最常用的响应格式。

### 基本 JSON 响应

```go
r.GET("/json", func(c *gin.Context) {
	c.JSON(200, gin.H{
		"code":    200,
		"message": "成功",
		"data":    gin.H{"name": "gin", "version": "1.10.0"},
	})
})
```

输出：

```json
{"code":200,"message":"成功","data":{"name":"gin","version":"1.10.0"}}
```

### 结构体 JSON 响应

```go
type User struct {
	ID       int64  `json:"id"`
	Name     string `json:"name"`
	Email    string `json:"email"`
	Password string `json:"-"`          // "-" 表示不输出该字段
	Age      int    `json:"age,omitempty"` // omitempty 表示空值不输出
}

r.GET("/user", func(c *gin.Context) {
	user := User{
		ID:    1,
		Name:  "Alice",
		Email: "alice@example.com",
		Age:   0,
	}
	c.JSON(200, user)
})
```

输出：

```json
{"id":1,"name":"Alice","email":"alice@example.com"}
```

### JSON 标签说明

| 标签写法 | 效果 |
|----------|------|
| `json:"id"` | 字段名改为 id |
| `json:"-"` | 不序列化该字段 |
| `json:"age,omitempty"` | 空值（0、false、""）时不输出 |
| `json:"name,string"` | 序列化为字符串 |

### 精确 JSON（不转义 HTML）

```go
r.GET("/pure-json", func(c *gin.Context) {
	c.PureJSON(200, gin.H{
		"html": "<b>粗体</b>",
	})
})
```

对比 `JSON` 会将 `<`、`>` 等字符转义，`PureJSON` 不转义：

```json
// JSON：  {"html":"\u003cb\u003e粗体\u003c/b\u003e"}
// PureJSON：{"html":"<b>粗体</b>"}
```

### JSONP 响应（跨域）

```go
// 访问 /jsonp?callback=myCallback
r.GET("/jsonp", func(c *gin.Context) {
	c.JSONP(200, gin.H{
		"message": "hello",
	})
})
```

输出：

```javascript
myCallback({"message":"hello"})
```

## 其他格式响应

### 字符串响应

```go
r.GET("/string", func(c *gin.Context) {
	c.String(200, "普通字符串")
})

// 支持格式化
r.GET("/format", func(c *gin.Context) {
	name := "gin"
	c.String(200, "Hello, %s!", name)  // Hello, gin!
})
```

### XML 响应

```go
r.GET("/xml", func(c *gin.Context) {
	c.XML(200, gin.H{
		"code":    200,
		"message": "成功",
	})
})
```

### YAML 响应

```go
r.GET("/yaml", func(c *gin.Context) {
	c.YAML(200, gin.H{
		"code":    200,
		"message": "成功",
	})
})
```

### 原始字节响应

```go
r.GET("/raw", func(c *gin.Context) {
	data := []byte("原始数据")
	c.Data(200, "text/plain; charset=utf-8", data)
})
```

## 重定向

### 302 临时重定向

```go
r.GET("/redirect", func(c *gin.Context) {
	// 重定向到外部 URL
	c.Redirect(302, "https://gin-gonic.com")
})
```

### 301 永久重定向

```go
r.GET("/old-path", func(c *gin.Context) {
	// 永久重定向，搜索引擎会更新索引
	c.Redirect(301, "/new-path")
})
```

### 路由内部重定向

```go
r.GET("/test", func(c *gin.Context) {
	// 重定向到其他路由
	c.Redirect(http.StatusMovedPermanently, "/ping")
})
```

### 路由重定向（RedirectTrailingSlash）

```go
// 访问 /path/ 会自动重定向到 /path
r.RedirectTrailingSlash = true
```

## 响应状态码

### 常用状态码

| 状态码 | 含义 |
|--------|------|
| 200 | 请求成功 |
| 201 | 创建成功 |
| 204 | 无内容 |
| 301 | 永久重定向 |
| 302 | 临时重定向 |
| 400 | 请求参数错误 |
| 401 | 未认证 |
| 403 | 无权限 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

### 使用常量

```go
import "net/http"

r.GET("/status", func(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"code": http.StatusOK})
	c.JSON(http.StatusBadRequest, gin.H{"code": http.StatusBadRequest})
	c.JSON(http.StatusUnauthorized, gin.H{"code": http.StatusUnauthorized})
	c.JSON(http.StatusNotFound, gin.H{"code": http.StatusNotFound})
	c.JSON(http.StatusInternalServerError, gin.H{"code": http.StatusInternalServerError})
})
```

## 响应头设置

```go
r.GET("/headers", func(c *gin.Context) {
	// 设置单个响应头
	c.Header("X-Custom-Header", "custom-value")
	c.Header("Content-Type", "application/json")

	// 设置多个同名响应头
	c.Writer.Header().Add("Set-Cookie", "a=1")
	c.Writer.Header().Add("Set-Cookie", "b=2")

	// 跨域响应头
	c.Header("Access-Control-Allow-Origin", "*")
	c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")

	c.JSON(200, gin.H{"message": "ok"})
})
```

## 统一响应格式

实际项目中建议封装统一的响应结构：

### 定义统一结构

```go
package response

// 统一响应结构
type Response struct {
	Code    int         `json:"code"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
}

// 分页数据
type PageData struct {
	List     interface{} `json:"list"`
	Total    int64       `json:"total"`
	Page     int         `json:"page"`
	PageSize int         `json:"page_size"`
}

// 成功响应
func Success(c *gin.Context, data interface{}) {
	c.JSON(200, Response{
		Code:    200,
		Message: "成功",
		Data:    data,
	})
}

// 失败响应
func Fail(c *gin.Context, code int, message string) {
	c.JSON(code, Response{
		Code:    code,
		Message: message,
	})
}

// 分页响应
func SuccessWithPage(c *gin.Context, list interface{}, total int64, page, pageSize int) {
	c.JSON(200, Response{
		Code:    200,
		Message: "成功",
		Data: PageData{
			List:     list,
			Total:    total,
			Page:     page,
			PageSize: pageSize,
		},
	})
}
```

### 使用统一响应

```go
type User struct {
	ID   int64  `json:"id"`
	Name string `json:"name"`
}

func main() {
	r := gin.Default()

	r.GET("/user", func(c *gin.Context) {
		user := User{ID: 1, Name: "Alice"}
		response.Success(c, user)
	})

	r.GET("/users", func(c *gin.Context) {
		users := []User{{ID: 1, Name: "Alice"}, {ID: 2, Name: "Bob"}}
		response.SuccessWithPage(c, users, 2, 1, 10)
	})

	r.GET("/error", func(c *gin.Context) {
		response.Fail(c, 400, "参数错误")
	})

	r.Run(":8080")
}
```

## 中止响应（Abort）

在中间件中需要提前终止请求时使用：

```go
r.GET("/abort", func(c *gin.Context) {
	// 终止后续处理（包括后续中间件和路由处理函数）
	c.Abort()
	// Abort 之后仍然可以返回响应
	c.JSON(401, gin.H{"message": "未认证"})
})
```

> **注意**：`Abort()` 只是停止后续处理，不会自动返回响应，需要显式调用 `c.JSON()` 等发送响应。

## 流式响应

### 分块传输（Stream）

```go
r.GET("/stream", func(c *gin.Context) {
	// 设置流式响应头
	c.Writer.Header().Set("Content-Type", "text/plain")
	c.Writer.Header().Set("Transfer-Encoding", "chunked")

	// 多次写入
	for i := 0; i < 10; i++ {
		fmt.Fprintf(c.Writer, "第 %d 条数据\n", i)
		c.Writer.Flush() // 立即发送
		time.Sleep(100 * time.Millisecond)
	}
})
```

### SSE（Server-Sent Events）

```go
r.GET("/events", func(c *gin.Context) {
	c.Writer.Header().Set("Content-Type", "text/event-stream")
	c.Writer.Header().Set("Cache-Control", "no-cache")
	c.Writer.Header().Set("Connection", "keep-alive")

	ticker := time.NewTicker(1 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			fmt.Fprintf(c.Writer, "data: 当前时间 %s\n\n", time.Now().Format("15:04:05"))
			c.Writer.Flush()
		case <-c.Request.Context().Done():
			// 客户端断开连接
			return
		}
	}
})
```

## 文件下载响应

```go
r.GET("/download", func(c *gin.Context) {
	// 方式一：指定文件名下载
	c.FileAttachment("files/report.pdf", "报告.pdf")
})

r.GET("/download2", func(c *gin.Context) {
	// 方式二：直接返回文件内容
	c.File("files/report.pdf")
})
```

## 响应写入时机

Gin 只能发送一次响应，一旦写入即不可更改：

```go
r.GET("/once", func(c *gin.Context) {
	c.JSON(200, gin.H{"message": "第一次"})

	// 下面的响应不会生效，Gin 会输出警告
	// c.String(200, "第二次响应不会发送")
})
```

如果需要中途修改响应，可以在写入前判断：

```go
// 检查是否已写入响应
if c.Writer.Written() {
	// 已写入，不要再发送响应
	return
}
```
