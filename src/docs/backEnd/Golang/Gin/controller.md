---
title: 控制器
order: 6
---

# 控制器

前面的章节里，handler 逻辑都是直接写在路由文件中的匿名函数里。项目规模变大后，这种写法会让路由文件越来越臃肿。控制器（Controller）的作用就是**把 handler 逻辑从路由定义中抽离出来**，按业务域组织成结构体方法，让路由文件只负责"挂载"。

## 基础控制器

把匿名函数改为结构体方法，只需要一个空结构体：

```go
// controllers/user_controller.go
package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

type UserController struct{}

// List 处理 GET /users
func (uc *UserController) List(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "用户列表"})
}

// Get 处理 GET /users/:id
func (uc *UserController) Get(c *gin.Context) {
	id := c.Param("id")
	c.JSON(http.StatusOK, gin.H{"id": id})
}
```

在路由文件里创建实例并注册：

```go
// routes/user_routes.go
package routes

import (
	"github.com/gin-gonic/gin"

	"your-project/controllers"
)

func RegisterUserRoutes(group *gin.RouterGroup) {
	uc := &controllers.UserController{}

	users := group.Group("/users")
	{
		users.GET("", uc.List)
		users.GET("/:id", uc.Get)
	}
}
```

> **注意**：注册路由时写的是 `uc.List`（方法值，绑定了接收者 `uc`），**不要**写成 `uc.List(c)`——加括号会立刻调用并把返回值当 handler 传入，编译报错。

## 控制器分组

与路由拆分一样，控制器也按**业务域**一个文件一个控制器：

```
project/
├── main.go
├── routes/
│   └── routes.go
└── controllers/
    ├── user_controller.go
    └── order_controller.go
```

每个控制器负责一个资源，方法名对应 RESTful 动作：

```go
// controllers/order_controller.go
package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

type OrderController struct{}

func (oc *OrderController) List(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "订单列表"})
}

func (oc *OrderController) Get(c *gin.Context) {
	id := c.Param("id")
	c.JSON(http.StatusOK, gin.H{"id": id})
}

func (oc *OrderController) Create(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "创建订单"})
}
```

路由文件与控制器一一对应注册：

```go
// routes/routes.go
package routes

import (
	"github.com/gin-gonic/gin"

	"your-project/controllers"
)

func RegisterAllRoutes(r *gin.Engine) {
	uc := &controllers.UserController{}
	oc := &controllers.OrderController{}

	api := r.Group("/api")
	v1 := api.Group("/v1")
	{
		users := v1.Group("/users")
		{
			users.GET("", uc.List)
			users.GET("/:id", uc.Get)
		}

		orders := v1.Group("/orders")
		{
			orders.GET("", oc.List)
			orders.GET("/:id", oc.Get)
			orders.POST("", oc.Create)
		}
	}
}
```

> **提示**：控制器实例通常只需要创建一次，在总入口 `RegisterAllRoutes` 里统一创建、传递给各注册函数，避免每个路由文件重复 `new`。

## 控制器方法继承

Go 没有 class 继承，但通过**结构体嵌入**（embedding）可以实现类似效果：把公共字段和方法放在基控制器里，业务控制器嵌入它之后，就能像调用自己的方法一样调用基控制器的方法（方法提升）。

### 定义基控制器

```go
// controllers/base_controller.go
package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// BaseController 基控制器：封装所有控制器共用的逻辑
type BaseController struct{}

// Success 统一成功响应
func (BaseController) Success(c *gin.Context, data interface{}) {
	c.JSON(http.StatusOK, gin.H{
		"code": 0,
		"data": data,
	})
}

// Fail 统一失败响应
func (BaseController) Fail(c *gin.Context, httpCode int, message string) {
	c.JSON(httpCode, gin.H{
		"code":    -1,
		"message": message,
	})
}
```

### 业务控制器嵌入基控制器

```go
// controllers/user_controller.go
package controllers

import (
	"your-project/services"
)

type UserController struct {
	BaseController          // 嵌入基控制器
	Svc            *services.UserService
}

func (uc *UserController) List(c *gin.Context) {
	users := uc.Svc.ListUsers()
	uc.Success(c, users) // 直接调用基控制器方法，像自己的方法一样
}

func (uc *UserController) Get(c *gin.Context) {
	id := c.Param("id")
	user, err := uc.Svc.GetUser(id)
	if err != nil {
		uc.Fail(c, 404, "用户不存在") // 继承来的方法同样可用
		return
	}
	uc.Success(c, user)
}
```

> **注意**：这是 Go 的**组合**，不是真正的继承——`UserController` 并不"是"一个 `BaseController`，只是通过嵌入获得了方法提升。如果业务控制器自己定义了同名方法（如自己也写了 `Success`），会**遮蔽**基控制器的方法，优先调用自身的版本。

### 方法接收者的选择

| 写法 | 特点 |
|------|------|
| `func (BaseController) Success(...)` | 不需要访问字段时的简洁写法，接收者可省略名字 |
| `func (b *BaseController) Success(...)` | 需要访问基控制器字段（如 DB）时使用 |
| `func (uc *UserController) List(...)` | 业务控制器推荐指针接收者，保持一致性 |

## 依赖注入

控制器通常依赖 service 层完成业务逻辑。通过**构造函数**把依赖传入，而不是在控制器内部自己创建：

```go
// services/user_service.go
package services

import "errors"

type UserService struct{}

func (s *UserService) ListUsers() []string {
	// 实际项目中这里会查询数据库
	return []string{"Alice", "Bob"}
}

func (s *UserService) GetUser(id string) (string, error) {
	if id == "0" {
		return "", errors.New("not found")
	}
	return "Alice", nil
}
```

```go
// controllers/user_controller.go
package controllers

import "your-project/services"

type UserController struct {
	BaseController
	Svc *services.UserService
}

// 构造函数：由外部注入依赖
func NewUserController(svc *services.UserService) *UserController {
	return &UserController{Svc: svc}
}
```

```go
// routes/routes.go
func RegisterAllRoutes(r *gin.Engine) {
	// 组装依赖链：service → controller
	userSvc := &services.UserService{}
	uc := controllers.NewUserController(userSvc)

	// ... 注册路由
}
```

这样做的好处：

1. **可测试**：单元测试时可以传入 mock 的 service
2. **单一实例**：service 和 controller 的生命周期由入口统一管理
3. **依赖清晰**：看构造函数就知道控制器依赖了什么

## 常见坑

1. **注册时方法值不要加括号**。`users.GET("", uc.List)` 是把方法值作为 handler；写成 `uc.List(c)` 会立即调用且类型不匹配。

2. **嵌入后同名方法会遮蔽**。业务控制器自己定义了和基控制器同名的方法时，自身版本优先生效；想调用基控制器版本需要显式写 `uc.BaseController.Success(c, data)`。

3. **方法接收者类型要统一**。如果注册路由用的是 `uc := &UserController{}`（指针），方法接收者也建议都用指针 `*UserController`，混用值/指针接收者容易在方法集上产生困惑。

4. **控制器保持"薄"**。控制器只负责：解析参数 → 调用 service → 封装响应。数据库操作、业务规则都应该在 service 层，否则分层就失去了意义。
