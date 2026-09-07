---
title: 参数校验
order: 7
---

# 参数校验

Gin 内置基于 `go-playground/validator` 的请求参数校验功能，通过结构体标签声明校验规则。

## 基本校验

### 使用 binding 标签

```go
type LoginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

r.POST("/login", func(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"message": "参数错误: " + err.Error()})
		return
	}
	// 校验通过，处理业务
	c.JSON(200, gin.H{"message": "登录成功"})
})
```

## 常用校验规则

| 标签 | 说明 | 示例 |
|------|------|------|
| `required` | 必填 | `binding:"required"` |
| `min` | 最小值 | `binding:"min=3"` |
| `max` | 最大值 | `binding:"max=10"` |
| `len` | 固定长度 | `binding:"len=11"` |
| `email` | 邮箱格式 | `binding:"email"` |
| `url` | URL 格式 | `binding:"url"` |
| `gt` | 大于 | `binding:"gt=0"` |
| `gte` | 大于等于 | `binding:"gte=18"` |
| `lt` | 小于 | `binding:"lt=100"` |
| `lte` | 小于等于 | `binding:"lte=150"` |
| `oneof` | 枚举值 | `binding:"oneof=admin user"` |
| `numeric` | 数值 | `binding:"numeric"` |
| `alphanum` | 字母数字 | `binding:"alphanum"` |
| `datetime` | 日期格式 | `binding:"datetime=2006-01-02"` |

### 字符串校验

```go
type StringRequest struct {
	Name     string `binding:"required,min=2,max=50"`  // 必填，长度 2-50
	Username string `binding:"required,alphanum"`      // 必填，只能字母数字
	Phone    string `binding:"required,len=11,numeric"` // 必填，11 位数字
	Email    string `binding:"required,email"`         // 必填，邮箱格式
	Homepage string `binding:"omitempty,url"`          // 可选，如果是 URL 格式
}
```

> **omitempty**：允许字段为空，为空时跳过校验。

### 数值校验

```go
type NumberRequest struct {
	Age      int     `binding:"required,gte=0,lte=150"` // 0-150
	Score    float64 `binding:"required,gt=0"`          // 大于 0
	Level    int     `binding:"oneof=1 2 3 4 5"`        // 枚举 1-5
	Quantity int     `binding:"required,min=1"`         // 至少 1
}
```

### 日期校验

```go
type DateRequest struct {
	StartDate string `binding:"required,datetime=2006-01-02"`
	EndDate   string `binding:"required,datetime=2006-01-02 15:04:05"`
}
```

## 组合校验

### 多规则组合

```go
type UserRequest struct {
	Username string `binding:"required,min=3,max=20,alphanum"`
	Password string `binding:"required,min=8,max=32"`
	Email    string `binding:"required,email"`
	Age      int    `binding:"required,gte=18,lte=100"`
	Gender   string `binding:"required,oneof=male female other"`
	Phone    string `binding:"required,len=11,numeric"`
	Website  string `binding:"omitempty,url"`
}
```

### 跨字段校验

```go
type RegisterRequest struct {
	Password        string `json:"password" binding:"required,min=8"`
	ConfirmPassword string `json:"confirm_password" binding:"required,eqfield=Password"`
}

r.POST("/register", func(c *gin.Context) {
	var req RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"message": err.Error()})
		return
	}
	c.JSON(200, gin.H{"message": "注册成功"})
})
```

| 跨字段标签 | 说明 |
|-----------|------|
| `eqfield=Field` | 等于另一个字段 |
| `nefield=Field` | 不等于另一个字段 |
| `gtfield=Field` | 大于另一个字段 |
| `gtefield=Field` | 大于等于另一个字段 |
| `ltfield=Field` | 小于另一个字段 |
| `ltefield=Field` | 小于等于另一个字段 |

## 自定义校验器

### 注册自定义校验器

```go
package main

import (
	"regexp"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/gin-gonic/gin/binding"
	"github.com/go-playground/validator/v10"
)

// 自定义校验函数
func ValidateUsername(fl validator.FieldLevel) bool {
	username := fl.Field().String()
	// 规则：不能包含空格，长度 3-15
	return len(username) >= 3 && len(username) <= 15 && !strings.Contains(username, " ")
}

// 自定义校验：必须是合法手机号
func ValidatePhone(fl validator.FieldLevel) bool {
	phone := fl.Field().String()
	matched, _ := regexp.MatchString(`^1[3-9]\d{9}$`, phone)
	return matched
}

func main() {
	r := gin.Default()

	// 注册自定义校验器
	if v, ok := binding.Validator.Engine().(*validator.Validate); ok {
		v.RegisterValidation("username", ValidateUsername)
		v.RegisterValidation("phone", ValidatePhone)
	}

	type UserRequest struct {
		Username string `json:"username" binding:"required,username"`
		Phone    string `json:"phone" binding:"required,phone"`
	}

	r.POST("/user", func(c *gin.Context) {
		var req UserRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(400, gin.H{"message": err.Error()})
			return
		}
		c.JSON(200, gin.H{"message": "校验通过"})
	})

	r.Run(":8080")
}
```

### 翻译错误信息

自定义校验的错误信息默认是英文，可以通过翻译中间件处理：

```go
import (
	"github.com/go-playground/locales/zh"
	ut "github.com/go-playground/universal-translator"
	"github.com/go-playground/validator/v10"
	zh_translations "github.com/go-playground/validator/v10/translations/zh"
)

// 全局翻译器
var (
	uni      *ut.UniversalTranslator
	trans    ut.Translator
	validate *validator.Validate
)

func initTranslator() {
	// 初始化中文翻译
	zhLocale := zh.New()
	uni = ut.New(zhLocale, zhLocale)
	trans, _ = uni.GetTranslator("zh")

	validate = validator.New()
	zh_translations.RegisterDefaultTranslations(validate, trans)
}

// 自定义中文错误提示
func CustomValidateMsg(err error) string {
	if errs, ok := err.(validator.ValidationErrors); ok {
		var msgs []string
		for _, e := range errs {
			msgs = append(msgs, e.Translate(trans))
		}
		return strings.Join(msgs, "; ")
	}
	return err.Error()
}
```

## 校验错误处理

### 提取字段错误

```go
r.POST("/user", func(c *gin.Context) {
	var req UserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		// 类型断言为 validator.ValidationErrors
		if errs, ok := err.(validator.ValidationErrors); ok {
			var messages []string
			for _, e := range errs {
				// e.Field() 字段名
				// e.Tag() 校验规则
				// e.Value() 当前值
				messages = append(messages, fmt.Sprintf(
					"字段 %s 不满足规则 %s",
					e.Field(), e.Tag(),
				))
			}
			c.JSON(400, gin.H{"message": messages})
			return
		}

		// 非校验错误（如 JSON 解析失败）
		c.JSON(400, gin.H{"message": "请求格式错误"})
		return
	}
	c.JSON(200, gin.H{"message": "校验通过"})
})
```

### 为字段添加自定义错误消息

```go
type UserRequest struct {
	Username string `json:"username" binding:"required,min=3"`
	Password string `json:"password" binding:"required,min=8"`
}

// 更友好的错误提示：定义错误码到中文消息的映射
var errorMessages = map[string]string{
	"Username.required": "用户名不能为空",
	"Username.min":      "用户名至少 3 个字符",
	"Password.required": "密码不能为空",
	"Password.min":      "密码至少 8 个字符",
}

func validateRequest(c *gin.Context, req interface{}) error {
	if err := c.ShouldBindJSON(req); err != nil {
		if errs, ok := err.(validator.ValidationErrors); ok {
			for _, e := range errs {
				key := fmt.Sprintf("%s.%s", e.Field(), e.Tag())
				if msg, exists := errorMessages[key]; exists {
					return fmt.Errorf("%s", msg)
				}
			}
		}
		return err
	}
	return nil
}

r.POST("/user", func(c *gin.Context) {
	var req UserRequest
	if err := validateRequest(c, &req); err != nil {
		c.JSON(400, gin.H{"message": err.Error()})
		return
	}
	c.JSON(200, gin.H{"message": "校验通过"})
})
```

## 嵌套结构体校验

```go
type Address struct {
	City    string `json:"city" binding:"required"`
	Street  string `json:"street" binding:"required"`
	ZipCode string `json:"zip_code" binding:"required,len=6,numeric"`
}

type User struct {
	Name    string  `json:"name" binding:"required"`
	Age     int     `json:"age" binding:"required,gte=18"`
	Address Address `json:"address" binding:"required"` // 嵌套结构体
}

r.POST("/user", func(c *gin.Context) {
	var user User
	if err := c.ShouldBindJSON(&user); err != nil {
		c.JSON(400, gin.H{"message": err.Error()})
		return
	}
	c.JSON(200, user)
})
```

## 切片与 Map 校验

```go
// 切片元素校验
type SliceRequest struct {
	IDs     []int    `json:"ids" binding:"required,min=1,dive,gt=0"`
	Names   []string `json:"names" binding:"required,min=1,dive,required,min=2"`
	Tags    []string `json:"tags" binding:"max=5,dive,required"`
}

// Map 校验
type MapRequest struct {
	Config map[string]string `json:"config" binding:"required,dive,keys,required,min=2,endkeys,required"`
}
```

> **dive** 表示进入切片/Map 元素进行校验。

## 完整示例

```go
package main

import (
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
)

type CreateUserRequest struct {
	Username  string   `json:"username" binding:"required,min=3,max=20,alphanum"`
	Password  string   `json:"password" binding:"required,min=8,max=32"`
	Email     string   `json:"email" binding:"required,email"`
	Age       int      `json:"age" binding:"required,gte=0,lte=150"`
	Gender    string   `json:"gender" binding:"required,oneof=male female other"`
	Phone     string   `json:"phone" binding:"omitempty,len=11,numeric"`
	Interests []string `json:"interests" binding:"max=5,dive,required"`
}

func main() {
	r := gin.Default()

	r.POST("/api/users", func(c *gin.Context) {
		var req CreateUserRequest

		if err := c.ShouldBindJSON(&req); err != nil {
			// 解析校验错误
			var messages []string
			if errs, ok := err.(validator.ValidationErrors); ok {
				for _, e := range errs {
					messages = append(messages, fmt.Sprintf(
						"字段 %s 校验失败（规则: %s）",
						e.Field(), e.Tag(),
					))
				}
			} else {
				messages = append(messages, "请求格式错误")
			}

			c.JSON(http.StatusBadRequest, gin.H{
				"code":    http.StatusBadRequest,
				"message": messages,
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"code":    http.StatusOK,
			"message": "创建用户成功",
			"data":    req,
		})
	})

	r.Run(":8080")
}
```

## 注意事项

1. **required 与零值**：`required` 会拒绝零值（0、""、false），如果字段允许零值应使用 `omitempty`
2. **校验优先级**：`ShouldBind` 先绑定再校验，绑定失败时不会执行校验
3. **自定义校验器**：自定义校验器必须在路由注册之前注册
4. **性能**：复杂的校验规则会带来一定性能开销，可缓存 validator 实例
5. **错误信息本地化**：生产环境建议使用翻译器输出中文错误信息
