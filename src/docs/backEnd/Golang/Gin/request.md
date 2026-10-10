---
title: 请求处理与参数绑定
order: 2
---

# 请求处理与参数绑定

## 请求上下文

Gin 通过 `*gin.Context` 封装了 HTTP 请求的所有信息，是处理请求的核心对象。

### 请求方法

```go
r.Any("/info", func(c *gin.Context) {
	// 获取请求方法
	method := c.Request.Method
	fmt.Println("请求方法:", method)

	// 获取请求 URL
	url := c.Request.URL.String()
	fmt.Println("请求 URL:", url)

	// 获取请求路径
	path := c.Request.URL.Path
	fmt.Println("请求路径:", path)

	// 获取客户端 IP
	ip := c.ClientIP()
	fmt.Println("客户端 IP:", ip)
})
```

### 请求头

```go
r.GET("/headers", func(c *gin.Context) {
	// 获取指定请求头
	userAgent := c.GetHeader("User-Agent")
	token := c.GetHeader("Authorization")

	// 获取所有请求头
	for key, values := range c.Request.Header {
		fmt.Printf("%s: %v\n", key, values)
	}
})
```

### 请求体

```go
r.POST("/body", func(c *gin.Context) {
	// 读取原始请求体（一次性读取，读完即空）
	body, _ := io.ReadAll(c.Request.Body)
	fmt.Println("请求体:", string(body))

	// 获取 Content-Type
	contentType := c.ContentType()
	fmt.Println("Content-Type:", contentType)
})
```

### Cookie

```go
r.GET("/cookie", func(c *gin.Context) {
	// 读取 Cookie
	cookie, err := c.Cookie("username")
	if err != nil {
		c.String(200, "未找到 Cookie")
		return
	}
	c.String(200, "用户名: %s", cookie)
})

r.GET("/set-cookie", func(c *gin.Context) {
	// 设置 Cookie
	c.SetCookie("username", "admin",
		3600,        // 有效期（秒）
		"/",         // 路径
		"localhost", // 域名
		false,       // 是否仅 HTTPS
		true,        // 是否 HttpOnly
	)
	c.String(200, "Cookie 已设置")
})
```

## 参数绑定

### 结构体绑定

将请求参数绑定到结构体，是最常用的方式：

```go
type LoginForm struct {
	Username string `form:"username" binding:"required"`
	Password string `form:"password" binding:"required"`
	Remember bool   `form:"remember"`
}

r.POST("/login", func(c *gin.Context) {
	var form LoginForm

	// 自动根据 Content-Type 选择合适的绑定方式
	if err := c.ShouldBind(&form); err != nil {
		c.JSON(400, gin.H{
			"code":    400,
			"message": "参数错误: " + err.Error(),
		})
		return
	}

	c.JSON(200, gin.H{
		"code":     200,
		"message":  "登录成功",
		"username": form.Username,
	})
})
```

### 绑定方法对比

| 方法 | 适用场景 | 说明 |
|------|----------|------|
| `ShouldBind` | 通用 | 根据 Content-Type 自动选择绑定方式 |
| `ShouldBindJSON` | JSON | 绑定 JSON 请求体 |
| `ShouldBindXML` | XML | 绑定 XML 请求体 |
| `ShouldBindQuery` | Query | 绑定 URL 查询参数 |
| `ShouldBindForm` | 表单 | 绑定表单数据 |
| `ShouldBindUri` | 路径参数 | 绑定 URI 中的路径参数 |
| `ShouldBindHeader` | 请求头 | 绑定请求头 |

### JSON 绑定

```go
type UserRequest struct {
	Name    string   `json:"name" binding:"required"`
	Age     int      `json:"age" binding:"gte=0,lte=150"`
	Hobbies []string `json:"hobbies"`
	Tags    map[string]string `json:"tags"`
}

r.POST("/user", func(c *gin.Context) {
	var req UserRequest

	// 显式绑定 JSON
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"message": err.Error()})
		return
	}

	c.JSON(200, req)
})
```

### XML 绑定

对于 `Content-Type: application/xml` 的请求，使用 `xml` 标签声明字段名，并通过 `ShouldBindXML` 绑定：

```go
// <Order>
//   <ID>1001</ID>
//   <Amount>99.9</Amount>
//   <Items>
//     <Item>
//       <Name>键盘</Name>
//       <Count>1</Count>
//     </Item>
//     <Item>
//       <Name>鼠标</Name>
//       <Count>2</Count>
//     </Item>
//   </Items>
// </Order>
type Item struct {
	Name  string `xml:"name"`
	Count int    `xml:"count"`
}

type OrderRequest struct {
	ID     int64   `xml:"id" binding:"required"`
	Amount float64 `xml:"amount"`
	Items  []Item  `xml:"items>item"` // 嵌套列表
}

r.POST("/order", func(c *gin.Context) {
	var req OrderRequest

	// 显式绑定 XML
	if err := c.ShouldBindXML(&req); err != nil {
		c.XML(400, gin.H{"message": err.Error()})
		return
	}

	c.XML(200, req)
})
```

说明：

- 结构体使用 `xml` 标签映射 XML 节点名，字段名匹配不区分大小写
- 嵌套结构通过 `items>item` 这样的路径写法表示，等价于 `xml:"items item"` 的子节点写法
- `ShouldBind` 在识别到 `Content-Type: application/xml` 时也会自动走 XML 绑定
- 响应同样可以使用 `c.XML()` 序列化输出

#### 手动解析 XML

某些场景（如微信支付回调、需要先校验签名的第三方接口）需要先拿到原始数据自行处理，可以结合 `GetRawData` 和 `encoding/xml` 手动解析：

```go
import "encoding/xml"

r.POST("/callback", func(c *gin.Context) {
	// 读取原始 XML 数据
	data, err := c.GetRawData() // 从c.Request.Body读取原始数据，注意：一次性读取，读完即空
	if err != nil {
		c.XML(400, gin.H{"message": "读取请求体失败"})
		return
	}

	// 可在此处对原始数据做签名校验等处理

	// 手动解析到结构体（复用上面定义的 OrderRequest）
	var req OrderRequest
	if err := xml.Unmarshal(data, &req); err != nil {
		c.XML(400, gin.H{"message": err.Error()})
		return
	}

	c.XML(200, req)
})
```

### Query 参数绑定

```go
type PageQuery struct {
	Page     int    `form:"page" binding:"required"`
	PageSize int    `form:"page_size" binding:"required"`
	Keyword  string `form:"keyword"`
}

r.GET("/users", func(c *gin.Context) {
	var query PageQuery

	// 只绑定 Query 参数，忽略请求体
	if err := c.ShouldBindQuery(&query); err != nil {
		c.JSON(400, gin.H{"message": err.Error()})
		return
	}

	// 访问 /users?page=1&page_size=10&keyword=gin
	c.JSON(200, query)
})
```

### 路径参数绑定

```go
type PathParams struct {
	ID   int64  `uri:"id" binding:"required"`
	Type string `uri:"type"`
}

r.GET("/user/:id/:type", func(c *gin.Context) {
	var params PathParams

	// 绑定路径参数
	if err := c.ShouldBindUri(&params); err != nil {
		c.JSON(400, gin.H{"message": err.Error()})
		return
	}

	// 访问 /user/123/admin → ID=123, Type=admin
	c.JSON(200, params)
})
```

### 多来源绑定

一个请求可能同时包含 Query、路径参数和请求体：

```go
type MixedParams struct {
	ID       int64  `uri:"id" binding:"required"`
	Page     int    `form:"page" binding:"required"`
	Category string `json:"category" binding:"required"`
}

r.POST("/posts/:id", func(c *gin.Context) {
	var params MixedParams

	// 分别绑定不同来源
	if err := c.ShouldBindUri(&params); err != nil {
		c.JSON(400, gin.H{"message": "路径参数错误"})
		return
	}
	if err := c.ShouldBindQuery(&params); err != nil {
		c.JSON(400, gin.H{"message": "查询参数错误"})
		return
	}
	if err := c.ShouldBindJSON(&params); err != nil {
		c.JSON(400, gin.H{"message": "请求体错误"})
		return
	}

	c.JSON(200, params)
})
```

## 绑定标签详解

### 常用标签

| 标签 | 来源 | 说明 |
|------|------|------|
| `form` | 表单/Query | 表单字段名 |
| `json` | JSON | JSON 字段名 |
| `uri` | 路径 | 路径参数名 |
| `header` | 请求头 | 请求头字段名 |
| `binding` | 校验规则 | 校验规则（详见校验章节） |
| `default` | - | 默认值（需配合 gin 的 binding 配置） |

### 时间格式绑定

```go
type TimeParams struct {
	Start string `form:"start" binding:"required" time_format:"2006-01-02"`
}

// 也可以绑定到 time.Time 类型
type TimeParams2 struct {
	Start time.Time `form:"start" binding:"required" time_format:"2006-01-02 15:04:05"`
}
```

## 常见错误处理

### 绑定错误信息友好化

```go
r.POST("/user", func(c *gin.Context) {
	var req UserRequest

	// 方式一：直接返回错误
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"message": err.Error()})
		return
	}

	// 方式二：提取具体字段错误（需要 validator）
	// if err := c.ShouldBindJSON(&req); err != nil {
	// 	var errMsgs []string
	// 	for _, e := range err.(validator.ValidationErrors) {
	// 		errMsgs = append(errMsgs, e.Field()+" 校验失败")
	// 	}
	// 	c.JSON(400, gin.H{"message": strings.Join(errMsgs, ", ")})
	// 	return
	// }
})
```

### 空请求体处理

```go
r.POST("/json", func(c *gin.Context) {
	var req map[string]interface{}

	if err := c.ShouldBindJSON(&req); err != nil {
		// 请求体为空或 JSON 解析失败
		c.JSON(400, gin.H{"message": "请求体必须是合法的 JSON"})
		return
	}

	c.JSON(200, req)
})
```

## 完整示例

一个用户管理接口的参数处理示例：

```go
package main

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

type User struct {
	ID     int64  `json:"id"`
	Name   string `json:"name" binding:"required"`
	Email  string `json:"email" binding:"required,email"`
	Age    int    `json:"age" binding:"gte=0,lte=150"`
	Active bool   `json:"active"`
}

func main() {
	r := gin.Default()

	// 创建用户：POST /api/users
	r.POST("/api/users", func(c *gin.Context) {
		var user User
		if err := c.ShouldBindJSON(&user); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"code":    http.StatusBadRequest,
				"message": "参数错误: " + err.Error(),
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"code": http.StatusOK,
			"data": user,
		})
	})

	// 查询用户：GET /api/users/:id?page=1
	r.GET("/api/users/:id", func(c *gin.Context) {
		id := c.Param("id")
		page := c.DefaultQuery("page", "1")

		c.JSON(http.StatusOK, gin.H{
			"code": http.StatusOK,
			"data": gin.H{
				"id":   id,
				"page": page,
			},
		})
	})

	r.Run(":8080")
}
```

### 发送请求测试

启动服务后，可以用 curl 发送请求验证参数绑定效果。

**创建用户**（JSON 请求体，走 `ShouldBindJSON`）：

```bash
curl -X POST http://localhost:8080/api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice","email":"alice@example.com","age":25,"active":true}'
```

返回：

```json
{"code":200,"data":{"id":0,"name":"Alice","email":"alice@example.com","age":25,"active":true}}
```

**查询用户**（路径参数 + Query 参数，GET 请求也可以直接在浏览器地址栏访问）：

```bash
curl "http://localhost:8080/api/users/123?page=1"
```

返回：

```json
{"code":200,"data":{"id":"123","page":"1"}}
```

**校验失败示例**（缺少必填字段 `email`，`binding:"required"` 触发 400）：

```bash
curl -X POST http://localhost:8080/api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice"}'
```

返回：

```json
{"code":400,"message":"参数错误: Key: 'User.Email' Error:Field validation for 'Email' failed on the 'required' tag"}
```

> **提示**：Windows 的 cmd 不支持用单引号包裹 JSON，建议改用 Git Bash、PowerShell，或使用 Apifox、Postman 等图形化工具发送请求。
