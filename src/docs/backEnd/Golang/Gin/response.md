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
	c.JSON(200, map[string]interface{}{
		"code":    200,
		"message": "成功",
		"data":    gin.H{"name": "gin", "version": "1.10.0"},
	})
})
```
> `gin.H` 是 Gin 框架定义的一个**快捷类型**，源码为 `type H map[string]interface{}`。它等价于 `map[string]interface{}`，key 为 string，value 可以是任意类型。在返回 JSON 响应时使用 `gin.H` 比直接写 `map[string]interface{}{}` 更简洁。

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
输出：

```text
Hello, gin!
```

### XML 响应

XML 响应建议使用带 `xml` 标签的结构体，比 `gin.H` 的键名映射更可控：

```go
// 方式一：结构体（推荐）
type XMLResponse struct {
	XMLName  xml.Name `xml:"response"`
	Code     int      `xml:"code"`
	Message  string   `xml:"message"`
}

r.GET("/xml", func(c *gin.Context) {
	c.XML(200, XMLResponse{
		Code:    200,
		Message: "成功",
	})
})

// 方式二：gin.H（可用，但键名由 XML 解析规则推导）
r.GET("/xml-map", func(c *gin.Context) {
	c.XML(200, gin.H{
		"code":    200,
		"message": "成功",
	})
})
```
输出（两种方式一致）：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<response>
  <code>200</code>
  <message>成功</message>
</response>
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
输出：

```yaml
code: 200
message: 成功
```

### 原始字节响应

```go
r.GET("/raw", func(c *gin.Context) {
	data := []byte("原始数据")
	c.Data(200, "text/plain; charset=utf-8", data)
})
```
输出：

```text
原始数据
```

### HTML 响应

使用 HTML 响应前必须先**加载模板**，否则 `c.HTML` 会 panic。Gin 内置了 Go 标准 `html/template` 的加载方式。

假设项目目录结构如下：

```
gin-demo/
├── main.go
└── templates/
    └── index.html
```

`templates/index.html` 模板文件内容：

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <title>{{ .Title }}</title>
</head>
<body>
    <h1>{{ .Greeting }}</h1>
</body>
</html>
```

在 `main.go` 里加载模板并渲染：

```go
import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func main() {
	r := gin.Default()

	// 加载 templates 目录下所有 .html 文件
	// 路径模式按 Go 文件匹配语法，* 表示任意文件名
	r.LoadHTMLGlob("templates/*.html")

	// 也可以只加载单个文件
	// r.LoadHTMLFiles("templates/index.html")

	r.GET("/html", func(c *gin.Context) {
		// 第二个参数是模板名，第三个参数传给模板的数据
		c.HTML(http.StatusOK, "index.html", gin.H{
			"Title":    "Gin 示例",
			"Greeting": "Hello, Gin!",
		})
	})

	r.Run(":8080")
}
```

输出（访问 `http://localhost:8080/html`）：

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <title>Gin 示例</title>
</head>
<body>
    <h1>Hello, Gin!</h1>
</body>
</html>
```

> **提示**：
> - 模板数据用 `gin.H` 传入时，模板里用 `.字段名` 访问；如果传结构体，字段必须是**导出的**（首字母大写）才能被模板访问。
> - Gin 使用 Go 标准库的 `html/template`，自动转义 HTML 防止 XSS 注入。

::: v-pre
#### 模板布局：`{{define}}` 与 `{{block}}`

Go 的 `html/template` 提供了 `{{define}}`、`{{template}}`、`{{block}}` 三个动作，用来在一个文件内定义**可按名称引用的模板块**，实现页面布局、公共组件的复用。Gin 的 `LoadHTMLGlob` / `LoadHTMLFiles` 在加载模板时会自动把每个 `{{define}}` 块注册为一个独立的具名模板，handler 里可以直接用 `c.HTML("某个define名", data)` 渲染。

##### 语法速览

```text
{{define "name"}}   ...   {{end}}      定义一个名为 name 的模板块
{{template "name" .}}                   在当前模板中引用名为 name 的块，. 把当前数据传进去
{{block "name" .}}   ...   {{end}}      定义具名块，如果被覆盖则使用覆盖后的版本（布局场景常用）
```

> **注意**：Go 模板里的 `.` 代表**当前作用域的数据**，传进嵌套模板时必须显式写 `.`，否则子模板里拿不到父模板的数据。

##### 典型场景：页面布局

做 Web 页面时通常有统一的页头、页脚，只有中间内容不同。用 `{{block}}` 最省事——基模板定义占位子块，子模板用 `{{define}}` 覆盖。

```
templates/
├── layout.html      # 基模板：页头 + 占位 + 页脚
├── home.html        # 首页：只写内容区
└── about.html       # 关于页：只写内容区
```

`templates/layout.html`：

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <title>{{ block "title" . }}默认标题{{ end }}</title>
    <style>body { font-family: sans-serif; }</style>
</head>
<body>
    <nav><a href="/">首页</a> | <a href="/about">关于</a></nav>
    {{ block "content" . }}默认内容{{ end }}
    <footer>&copy; 2025 Gin Demo</footer>
</body>
</html>
```

`templates/home.html`（只覆盖子块，整体结构继承 layout）：

```html
{{/* 覆盖 layout.html 里的 title 和 content 块 */}}
{{define "title"}}首页{{end}}
{{define "content"}}
    <h1>欢迎访问，{{ .Name }}！</h1>
    <p>当前有 {{ .Count }} 条动态。</p>
{{end}}
{{/* 最后必须有一个 main 模板，Gin 用文件名注册主模板 */}}
{{template "layout.html" .}}
```

`templates/about.html`：

```html
{{define "title"}}关于{{end}}
{{define "content"}}
    <h1>关于本站</h1>
    <p>{{ .Message }}</p>
{{end}}
{{template "layout.html" .}}
```

`main.go`：

```go
func main() {
	r := gin.Default()

	// 加载所有模板，包括 layout、home、about 和它们里面定义的子块
	// Gin 会自动把 home.html、about.html 以及 "title"、"content" 都注册好
	r.LoadHTMLGlob("templates/*.html")

	r.GET("/", func(c *gin.Context) {
		// 主模板名 = 文件名（不含目录）
		c.HTML(http.StatusOK, "home.html", gin.H{
			"Name":  "Alice",
			"Count": 12,
		})
	})

	r.GET("/about", func(c *gin.Context) {
		c.HTML(http.StatusOK, "about.html", gin.H{
			"Message": "这是一个 Gin 示例项目。",
		})
	})

	r.Run(":8080")
}
```

##### 典型场景：独立组件复用

一些通用片段（分页器、菜单、卡片）可以独立用 `{{define}}` 成一个具名模板，在任何页面里用 `{{template "name" .}}` 引入。

```html
{{/* 在任何 .html 文件（例如 layout.html）里定义一次 */}}
{{define "pagination"}}
<div class="pagination">
    <button>上一页</button>
    <span>第 {{ .Page }} / {{ .TotalPage }} 页</span>
    <button>下一页</button>
</div>
{{end}}
```

在其他页面里直接引入：

```html
... 列表内容 ...
{{template "pagination" .}}
```

handler 里只要传入包含 `Page`、`TotalPage` 的数据即可。

##### `{{block}}` vs `{{define}} + {{template}}` 的区别

| 特性 | `{{block "name" .}}...{{end}}` | `{{define "name"}}...{{end}}` + `{{template "name" .}}` |
|------|--------------------------------|--------------------------------------------------------|
| 能否跨文件覆盖 | ✅ 子文件可以用同名 `{{define}}` 覆盖 | ❌ `{{define}}` 只能定义，不能覆盖 |
| 有默认内容 | ✅ `block` 内部就是默认值 | ❌ 单独 `define` 没有默认 |
| 适用场景 | 布局中的"可替换"占位 | 独立组件、固定片段 |
| 常见组合 | 基模板 `block` + 子模板 `define` 覆盖 | `define` 在一处，`template` 在多处复用 |

##### 常见坑

1. **`define` 块所在的文件必须被 `LoadHTMLGlob` 覆盖到**。如果只写了 `templates/pagination.html` 但 Glob 模式没匹配到它，handler 渲染时会报 `template: "pagination" is undefined`。建议统一 `LoadHTMLGlob("templates/**/*.html")` 把所有层级都包含进去。
2. **`{{template "name" .}}` 里的 `.` 不要丢**。丢了 `.` 之后子模板的数据作用域变成 `nil`，里面访问 `.Xxx` 会全部得到零值。
3. **Gin 只把文件名注册成"主模板"**。比如 `templates/home.html` 的主模板名是 `home.html`，里面所有 `{{define}}` 块是额外的具名模板，不能用文件名去渲染某个 `define` 块——要么渲染包含它的主模板，要么直接用 `c.HTML(http.StatusOK, "某个define名", data)`。
4. **同一个名字被多次 `define`** 会 panic。多个文件里不能有同名的 `{{define "xxx"}}` 块，包括通过 `block` 默认定义的名字。建议按功能前缀命名，比如 `layout_title`、`list_pagination`。
:::

## 重定向

重定向涉及 `net/http` 包，请确保代码中有 `import "net/http"`。

### 302 临时重定向

```go
r.GET("/redirect", func(c *gin.Context) {
	// 重定向到外部 URL
	c.Redirect(http.StatusFound, "https://gin-gonic.com")
})
```

### 301 永久重定向

```go
r.GET("/old-path", func(c *gin.Context) {
	// 永久重定向，搜索引擎会更新索引
	c.Redirect(http.StatusMovedPermanently, "/new-path")
})
```

### 路由内部重定向

```go
r.GET("/test", func(c *gin.Context) {
	// 重定向到其他路由
	c.Redirect(http.StatusMovedPermanently, "/ping")
})
```

### Engine 级配置：RedirectTrailingSlash

在 `r.Run()` 之前设置，开启后 Gin 会自动对末尾斜杠做重定向：

```go
r := gin.Default()

// 开启后：访问 /path/ 会自动 301 重定向到 /path
// 访问 /path 会自动 301 重定向到 /path/（取决于哪个路由注册了）
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

> 需要 `import "net/http"` 以使用 `http.StatusOK` 等常量。

```go
package response

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

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
	c.JSON(http.StatusOK, Response{
		Code:    http.StatusOK,
		Message: "成功",
		Data:    data,
	})
}

// 失败响应（code 同时作为 HTTP 状态码和业务码，如需分离请自行调整）
func Fail(c *gin.Context, httpCode, code int, message string) {
	c.JSON(httpCode, Response{
		Code:    code,
		Message: message,
	})
}

// 分页响应
func SuccessWithPage(c *gin.Context, list interface{}, total int64, page, pageSize int) {
	c.JSON(http.StatusOK, Response{
		Code:    http.StatusOK,
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
		response.Fail(c, http.StatusBadRequest, 40001, "参数错误")
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

流式响应需要 `fmt`、`time` 包，请确保有相应的 `import`。

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
