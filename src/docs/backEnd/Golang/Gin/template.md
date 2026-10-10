---
title: 模板渲染
order: 6
---

# 模板渲染

Gin 使用 Go 标准库的 `html/template` 作为模板引擎，可以渲染 HTML 页面。

## 基本使用

### 目录结构

```
project/
├── main.go
└── templates/
    ├── index.html
    └── user.html
```

### 加载模板

```go
package main

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func main() {
	r := gin.Default()

	// 加载 templates 目录下所有 .html 文件
	r.LoadHTMLGlob("templates/*.html")
	// 或者加载指定文件
	// r.LoadHTMLFiles("templates/index.html", "templates/user.html")

	// 渲染 index.html
	r.GET("/", func(c *gin.Context) {
		c.HTML(http.StatusOK, "index.html", gin.H{
			"title":   "首页",
			"message": "欢迎使用 Gin",
		})
	})

	r.Run(":8080")
}
```

### 模板文件

```html
<!-- templates/index.html -->
<!DOCTYPE html>
<html>
<head>
    <title>{{ .title }}</title>
</head>
<body>
    <h1>{{ .message }}</h1>
    <!-- 模板注释 -->
    {{/* 这是模板注释，不会输出到页面 */}}
</body>
</html>
```

## 模板语法

### 变量输出

```go
c.HTML(200, "index.html", gin.H{
	"name":   "Alice",
	"age":    30,
	"active": true,
	"price":  19.99,
})
```

```html
<p>姓名: {{ .name }}</p>
<p>年龄: {{ .age }}</p>
<p>状态: {{ .active }}</p>
<p>价格: {{ .price }}</p>

<!-- 嵌套字段 -->
<p>{{ .user.Name }}</p>

<!-- 索引访问 -->
<p>{{ .list.0 }}</p>
```

### 条件判断

```go
// 传参
c.HTML(200, "index.html", gin.H{
	"isAdmin":  true,
	"user":     gin.H{"name": "Alice"},
	"role":     "admin",
})
```

```html
<!-- if 判断 -->
{{ if .isAdmin }}
    <p>您是管理员</p>
{{ else }}
    <p>您是普通用户</p>
{{ end }}

<!-- 判断非空 -->
{{ if .user }}
    <p>用户存在</p>
{{ end }}

<!-- 判断相等 -->
{{ if eq .role "admin" }}
    <p>管理员角色</p>
{{ else if eq .role "user" }}
    <p>用户角色</p>
{{ else }}
    <p>未知角色</p>
{{ end }}
```

### 循环遍历

```go
c.HTML(200, "index.html", gin.H{
	"users": []map[string]interface{}{
		{"name": "Alice", "age": 25},
		{"name": "Bob", "age": 30},
		{"name": "Charlie", "age": 35},
	},
})
```

```html
<ul>
    {{ range .users }}
        <li>{{ .name }} - {{ .age }} 岁</li>
    {{ end }}
</ul>

<!-- 带索引遍历 -->
<ul>
    {{ range $index, $user := .users }}
        <li>第 {{ $index }} 个: {{ $user.name }}</li>
    {{ end }}
</ul>

<!-- 空切片处理 -->
{{ range .users }}
    <li>{{ .name }}</li>
{{ else }}
    <li>暂无用户</li>
{{ end }}
```

### 管道操作

```go
// 传参
c.HTML(200, "index.html", gin.H{
	"price":  1234.5678,
	"content": "<b>粗体内容</b>",
	"names":   []string{"Alice", "Bob", "Charlie"},
})
```

```html
<!-- 格式化 -->
<p>价格: {{ printf "%.2f" .price }}</p>

<!-- 转义（默认自动转义，防止 XSS） -->
<p>{{ .content }}</p>
<!-- 输出: &lt;b&gt;粗体内容&lt;/b&gt; -->

<!-- 不转义（谨慎使用，有 XSS 风险） -->
<p>{{ .content | safeHTML }}</p>
<!-- 需要注册 safeHTML 函数 -->

<!-- 连接字符串 -->
<p>{{ .names | join ", " }}</p>
<!-- 输出: Alice, Bob, Charlie -->
```

## 自定义模板函数

### 注册自定义函数

```go
// 模板函数需要在加载模板之前注册
func main() {
	r := gin.Default()

	// 注册自定义模板函数
	r.SetFuncMap(template.FuncMap{
		// 格式化时间
		"formatTime": func(t time.Time) string {
			return t.Format("2006-01-02 15:04:05")
		},
		// 大写转换
		"toUpper": strings.ToUpper,
		// 判断字符串是否为空
		"isEmpty": func(s string) bool {
			return s == ""
		},
		// 多参数：重复字符串 n 次
		// 主参数 s 放在最后，方便用管道传入
		"repeat": func(n int, s string) string {
			return strings.Repeat(s, n)
		},
	})

	// 加载模板（必须在 SetFuncMap 之后）
	r.LoadHTMLGlob("templates/*.html")

	r.GET("/", func(c *gin.Context) {
		c.HTML(200, "index.html", gin.H{
			"time": time.Now(),
			"name": "alice",
		})
	})

	r.Run(":8080")
}
```

### 模板中使用自定义函数

```html
{{/* 管道语法：.time 作为最后一个参数传给 formatTime */}}
<p>当前时间: {{ .time | formatTime }}</p>
{{/* 函数调用语法：与管道等价，参数顺序更直观 */}}
<p>当前时间: {{ formatTime .time }}</p>

<p>姓名: {{ .name | toUpper }}</p>

{{/* 多参数函数 + 管道：.name 追加为最后一个参数 → repeat(3, .name) */}}
<p>{{ .name | repeat 3 }}</p>
{{/* 等价的函数调用语法 */}}
<p>{{ repeat 3 .name }}</p>

{{ if isEmpty .name }}
    <p>姓名为空</p>
{{ else }}
    <p>姓名: {{ .name }}</p>
{{ end }}
```

> **说明**：Go 模板同时支持**管道语法**（`值 | 函数`）和**函数调用语法**（`函数 值`），两者等价。管道语法会把 `|` 前的值追加为函数的**最后一个**参数，所以多参数函数如果用管道，自定义函数需要把主参数放在最后。如果参数顺序定义反了（如 `func(s string, n int)`），`.name | repeat 3` 会把 `.name` 传给 `n` 导致类型错误，此时只能用函数调用语法 `repeat .name 3`。

## 模板嵌套与继承

### 子模板（include）

```html
<!-- templates/base.html -->
<!DOCTYPE html>
<html>
<head>
    <title>{{ block "title" . }}默认标题{{ end }}</title>
</head>
<body>
    <header>{{ template "header" . }}</header>
    <main>{{ template "content" . }}</main>
    <footer>{{ template "footer" . }}</footer>
</body>
</html>
```

```html
<!-- templates/header.html -->
{{ define "header" }}
<div class="header">网站导航栏</div>
{{ end }}
```

```html
<!-- templates/footer.html -->
{{ define "footer" }}
<div class="footer">版权信息 © 2024</div>
{{ end }}
```

```go
// 加载所有模板
r.LoadHTMLGlob("templates/*.html")

// 首页模板
r.GET("/", func(c *gin.Context) {
	c.HTML(200, "index.html", gin.H{
		"title": "首页",
	})
})
```

### 使用 block 定义可覆盖块

```html
<!-- templates/layout.html -->
<!DOCTYPE html>
<html>
<head>
    <title>{{ block "title" . }}默认标题{{ end }}</title>
</head>
<body>
    {{ block "content" . }}
        默认内容
    {{ end }}
</body>
</html>
```

```html
<!-- templates/about.html -->
{{ define "title" }}关于我们{{ end }}

{{ define "content" }}
<h1>关于页面</h1>
<p>这是关于我们公司的介绍。</p>
{{ end }}
```

::: v-pre
### `{{block}}` vs `{{define}} + {{template}}` 的区别

| 特性 | `{{block "name" .}}...{{end}}` | `{{define "name"}}...{{end}}` + `{{template "name" .}}` |
|------|--------------------------------|--------------------------------------------------------|
| 能否跨文件覆盖 | ✅ 子文件可以用同名 `{{define}}` 覆盖 | ❌ `{{define}}` 只能定义，不能覆盖 |
| 有默认内容 | ✅ `block` 内部就是默认值 | ❌ 单独 `define` 没有默认 |
| 适用场景 | 布局中的"可替换"占位 | 独立组件、固定片段 |
| 常见组合 | 基模板 `block` + 子模板 `define` 覆盖 | `define` 在一处，`template` 在多处复用 |

### 常见坑

1. **`define` 块所在的文件必须被 `LoadHTMLGlob` 覆盖到**。如果只写了 `templates/pagination.html` 但 Glob 模式没匹配到它，handler 渲染时会报 `template: "pagination" is undefined`。建议统一 `LoadHTMLGlob("templates/**/*.html")` 把所有层级都包含进去。
2. **`{{template "name" .}}` 里的 `.` 不要丢**。丢了 `.` 之后子模板的数据作用域变成 `nil`，里面访问 `.Xxx` 会全部得到零值。
3. **Gin 只把文件名注册成"主模板"**。比如 `templates/home.html` 的主模板名是 `home.html`，里面所有 `{{define}}` 块是额外的具名模板，不能用文件名去渲染某个 `define` 块——要么渲染包含它的主模板，要么直接用 `c.HTML(http.StatusOK, "某个define名", data)`。
4. **同一个名字被多次 `define`** 会 panic。多个文件里不能有同名的 `{{define "xxx"}}` 块，包括通过 `block` 默认定义的名字。建议按功能前缀命名，比如 `layout_title`、`list_pagination`。
:::

## 渲染复杂数据

### 结构体数据

```go
type User struct {
	ID        int64
	Name      string
	Email     string
	CreatedAt time.Time
}

r.GET("/users", func(c *gin.Context) {
	users := []User{
		{ID: 1, Name: "Alice", Email: "alice@example.com", CreatedAt: time.Now()},
		{ID: 2, Name: "Bob", Email: "bob@example.com", CreatedAt: time.Now()},
	}

	c.HTML(200, "users.html", gin.H{
		"users": users,
	})
})
```

```html
<!-- templates/users.html -->
<table border="1">
    <thead>
        <tr>
            <th>ID</th>
            <th>姓名</th>
            <th>邮箱</th>
            <th>注册时间</th>
        </tr>
    </thead>
    <tbody>
        {{ range .users }}
        <tr>
            <td>{{ .ID }}</td>
            <td>{{ .Name }}</td>
            <td>{{ .Email }}</td>
            <td>{{ .CreatedAt.Format "2006-01-02" }}</td>
        </tr>
        {{ end }}
    </tbody>
</table>
```

## 完整示例

一个用户列表页面：

```go
package main

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

type User struct {
	ID        int64
	Name      string
	Email     string
	CreatedAt time.Time
}

func main() {
	r := gin.Default()

	// 注册模板函数
	r.SetFuncMap(template.FuncMap{
		"formatTime": func(t time.Time) string {
			return t.Format("2006-01-02 15:04:05")
		},
	})

	// 加载模板
	r.LoadHTMLGlob("templates/*.html")

	// 首页
	r.GET("/", func(c *gin.Context) {
		c.HTML(http.StatusOK, "index.html", gin.H{
			"title": "用户管理系统",
		})
	})

	// 用户列表
	r.GET("/users", func(c *gin.Context) {
		users := []User{
			{ID: 1, Name: "Alice", Email: "alice@example.com", CreatedAt: time.Now()},
			{ID: 2, Name: "Bob", Email: "bob@example.com", CreatedAt: time.Now()},
		}
		c.HTML(http.StatusOK, "users.html", gin.H{
			"title": "用户列表",
			"users": users,
		})
	})

	// 静态资源
	r.Static("/static", "./static")

	r.Run(":8080")
}
```

## 注意事项

### 1. 模板缓存

生产环境建议开启模板缓存（默认开启，Debug 模式下每次请求都会重新加载）：

```go
// 设置 Release 模式自动启用模板缓存
gin.SetMode(gin.ReleaseMode)
```

### 2. 自动转义（XSS 防护）

Go 的 `html/template` 默认自动转义 HTML 特殊字符，防止 XSS 攻击。只有显式使用 `template.HTML` 类型才不转义：

```go
// 传递不需要转义的 HTML（谨慎使用）
c.HTML(200, "index.html", gin.H{
	// 使用 template.HTML 类型，模板中输出时不会转义
	"content": template.HTML("<b>粗体</b>"),
})
```

### 3. 模板路径匹配

`LoadHTMLGlob("templates/*.html")` 只匹配一级目录，不递归：

```go
// 递归加载子目录
r.LoadHTMLGlob("templates/**/*")

// 加载所有子目录的 html
r.LoadHTMLGlob("templates/**/*.html")
```

### 4. 模板名冲突

使用 `LoadHTMLGlob` 加载多个目录的模板时，同名的 `define` 块会冲突，建议使用不同名称。
