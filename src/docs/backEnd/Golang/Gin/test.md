---
title: 单元测试
order: 9
---

# 单元测试

Gin 提供了完善的测试支持，使用 Go 标准库的 `testing` 包和 `net/http/httptest` 包即可对路由进行测试，无需启动真实服务器。

## 基本测试

### 测试 GET 接口

```go
package main

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
)

// 测试准备：创建测试用的路由
func setupRouter() *gin.Engine {
	gin.SetMode(gin.TestMode) // 使用测试模式
	r := gin.Default()

	r.GET("/ping", func(c *gin.Context) {
		c.JSON(200, gin.H{"message": "pong"})
	})

	return r
}

// 测试 GET /ping
func TestPing(t *testing.T) {
	r := setupRouter()

	// 构造测试请求
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/ping", nil)

	// 执行请求
	r.ServeHTTP(w, req)

	// 断言状态码
	if w.Code != http.StatusOK {
		t.Errorf("期望状态码 %d，实际 %d", http.StatusOK, w.Code)
	}

	// 断言响应体
	var response map[string]string
	if err := json.Unmarshal(w.Body.Bytes(), &response); err != nil {
		t.Fatal("响应解析失败:", err)
	}
	if response["message"] != "pong" {
		t.Errorf("期望 message=pong，实际 %s", response["message"])
	}
}
```

### 运行测试

```shell
# 运行当前包所有测试
go test

# 运行指定测试
go test -run TestPing

# 显示详细输出
go test -v

# 输出测试覆盖率
go test -cover
```

## 测试各类请求

### 测试带参数请求

```go
// 测试 Query 参数
func TestQueryParam(t *testing.T) {
	r := setupRouter()

	// 带 Query 参数的请求
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/search?keyword=gin&page=2", nil)
	r.ServeHTTP(w, req)

	if w.Code != 200 {
		t.Errorf("期望 200，实际 %d", w.Code)
	}
}
```

### 测试 POST JSON

```go
// 测试 POST JSON 请求
func TestPostJSON(t *testing.T) {
	r := setupRouter()

	// 构造 JSON 请求体
	requestBody := `{"username":"admin","password":"123456"}`
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/login", strings.NewReader(requestBody))
	req.Header.Set("Content-Type", "application/json")

	r.ServeHTTP(w, req)

	// 断言
	if w.Code != 200 {
		t.Errorf("期望 200，实际 %d，响应: %s", w.Code, w.Body.String())
	}
}
```

### 测试表单请求

```go
func TestPostForm(t *testing.T) {
	r := setupRouter()

	// 构造表单请求
	form := url.Values{}
	form.Set("username", "admin")
	form.Set("password", "123456")

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/login-form", strings.NewReader(form.Encode()))
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	r.ServeHTTP(w, req)
}
```

### 测试文件上传

```go
func TestFileUpload(t *testing.T) {
	r := setupRouter()

	// 构造 multipart 表单
	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)

	// 创建测试文件内容
	fileContent := []byte("测试文件内容")
	fileWriter, _ := writer.CreateFormFile("file", "test.txt")
	fileWriter.Write(fileContent)
	writer.Close()

	// 发送请求
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/upload", body)
	req.Header.Set("Content-Type", writer.FormDataContentType())

	r.ServeHTTP(w, req)

	if w.Code != 200 {
		t.Errorf("期望 200，实际 %d", w.Code)
	}
}
```

## 测试中间件

```go
// 测试鉴权中间件
func TestAuthMiddleware(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := gin.Default()

	// 注册需要鉴权的路由
	r.GET("/admin", AuthMiddleware(), func(c *gin.Context) {
		c.JSON(200, gin.H{"message": "管理员页面"})
	})

	// 测试未携带 token
	t.Run("无token", func(t *testing.T) {
		w := httptest.NewRecorder()
		req, _ := http.NewRequest("GET", "/admin", nil)
		r.ServeHTTP(w, req)

		if w.Code != http.StatusUnauthorized {
			t.Errorf("期望 401，实际 %d", w.Code)
		}
	})

	// 测试携带有效 token
	t.Run("有token", func(t *testing.T) {
		w := httptest.NewRecorder()
		req, _ := http.NewRequest("GET", "/admin", nil)
		req.Header.Set("Authorization", "valid-token")
		r.ServeHTTP(w, req)

		if w.Code != http.StatusOK {
			t.Errorf("期望 200，实际 %d", w.Code)
		}
	})
}
```

## 表驱动测试

表驱动测试是 Go 的推荐测试方式，用一个表格定义多个测试用例：

```go
// 定义一个加法接口
func TestUserAPI(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := setupRouter()

	// 定义测试用例表
	testCases := []struct {
		name       string
		method     string
		path       string
		body       string
		expectedCode int
	}{
		{
			name:         "有效用户",
			method:       "POST",
			path:         "/users",
			body:         `{"name":"Alice","age":25}`,
			expectedCode: 200,
		},
		{
			name:         "缺少姓名",
			method:       "POST",
			path:         "/users",
			body:         `{"age":25}`,
			expectedCode: 400,
		},
		{
			name:         "年龄非法",
			method:       "POST",
			path:         "/users",
			body:         `{"name":"Alice","age":-5}`,
			expectedCode: 400,
		},
		{
			name:         "无效JSON",
			method:       "POST",
			path:         "/users",
			body:         `{invalid json`,
			expectedCode: 400,
		},
	}

	// 遍历执行所有测试用例
	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			w := httptest.NewRecorder()
			req, _ := http.NewRequest(tc.method, tc.path, strings.NewReader(tc.body))
			req.Header.Set("Content-Type", "application/json")
			r.ServeHTTP(w, req)

			if w.Code != tc.expectedCode {
				t.Errorf("期望状态码 %d，实际 %d，响应: %s",
					tc.expectedCode, w.Code, w.Body.String())
			}
		})
	}
}
```

## 测试业务逻辑

### 提取业务逻辑便于测试

```go
// 业务逻辑层（不依赖 gin.Context，便于测试）
type UserService struct{}

func (s *UserService) CreateUser(name string, age int) (User, error) {
	if name == "" {
		return User{}, errors.New("姓名不能为空")
	}
	if age < 0 || age > 150 {
		return User{}, errors.New("年龄不合法")
	}
	return User{Name: name, Age: age}, nil
}

// 测试业务逻辑
func TestCreateUser(t *testing.T) {
	service := &UserService{}

	// 正常情况
	user, err := service.CreateUser("Alice", 25)
	if err != nil {
		t.Errorf("不应报错: %v", err)
	}
	if user.Name != "Alice" {
		t.Errorf("期望 Alice，实际 %s", user.Name)
	}

	// 空姓名
	if _, err := service.CreateUser("", 25); err == nil {
		t.Error("空姓名应报错")
	}

	// 非法年龄
	if _, err := service.CreateUser("Alice", 200); err == nil {
		t.Error("非法年龄应报错")
	}
}
```

## Mock 外部依赖

使用接口 + mock 的方式测试依赖数据库等外部资源的逻辑：

```go
// 定义数据访问接口
type UserRepository interface {
	FindByID(id int64) (*User, error)
	Save(user *User) error
}

// 业务服务依赖接口
type UserHandler struct {
	repo UserRepository
}

// Mock 实现
type MockUserRepository struct {
	users map[int64]*User
}

func (m *MockUserRepository) FindByID(id int64) (*User, error) {
	if user, ok := m.users[id]; ok {
		return user, nil
	}
	return nil, errors.New("用户不存在")
}

func (m *MockUserRepository) Save(user *User) error {
	m.users[user.ID] = user
	return nil
}

// 测试 handler
func TestGetUserHandler(t *testing.T) {
	// 初始化 mock
	mockRepo := &MockUserRepository{
		users: map[int64]*User{
			1: {ID: 1, Name: "Alice"},
		},
	}
	handler := &UserHandler{repo: mockRepo}

	// 构造 gin 路由和请求
	gin.SetMode(gin.TestMode)
	r := gin.Default()
	r.GET("/users/:id", handler.GetUser)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/users/1", nil)
	r.ServeHTTP(w, req)

	if w.Code != 200 {
		t.Errorf("期望 200，实际 %d", w.Code)
	}
}
```

## 断言辅助工具

### 简洁的断言封装

```go
// 封装常用断言
func assertStatus(t *testing.T, w *httptest.ResponseRecorder, expected int) {
	t.Helper()
	if w.Code != expected {
		t.Errorf("期望状态码 %d，实际 %d", expected, w.Code)
	}
}

func assertJSONField(t *testing.T, body []byte, field, expected string) {
	t.Helper()
	var data map[string]interface{}
	if err := json.Unmarshal(body, &data); err != nil {
		t.Fatal("JSON 解析失败:", err)
	}
	value, ok := data[field].(string)
	if !ok || value != expected {
		t.Errorf("期望 %s=%s，实际 %v", field, expected, data[field])
	}
}
```

### 使用断言库

也可以使用第三方断言库，如 `github.com/stretchr/testify`：

```go
import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
)

func TestPing(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := gin.Default()
	r.GET("/ping", func(c *gin.Context) {
		c.JSON(200, gin.H{"message": "pong"})
	})

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/ping", nil)
	r.ServeHTTP(w, req)

	// 使用 testify 断言
	assert.Equal(t, 200, w.Code)
	assert.Contains(t, w.Body.String(), "pong")
}
```

## 测试覆盖率

### 查看覆盖率

```shell
# 生成覆盖率报告到文件
go test -coverprofile=coverage.out

# 查看 HTML 覆盖率报告
go tool cover -html=coverage.out
```

### 覆盖率阈值

```shell
# 覆盖率低于 80% 时测试失败（CI 中使用）
go test -coverprofile=coverage.out -covermode=count
```

## 完整示例

一个完整的测试文件结构：

```go
package main

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
)

// 初始化测试路由
func newTestRouter() *gin.Engine {
	gin.SetMode(gin.TestMode)
	r := gin.Default()

	// 注册测试所需路由
	r.POST("/api/users", createUserHandler)
	r.GET("/api/users/:id", getUserHandler)

	return r
}

// 测试创建用户
func TestCreateUserHandler(t *testing.T) {
	r := newTestRouter()

	testCases := []struct {
		name       string
		body       string
		expectedCode int
	}{
		{"有效请求", `{"name":"Alice","age":25}`, 200},
		{"缺少姓名", `{"age":25}`, 400},
		{"非法JSON", `{bad`, 400},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			w := httptest.NewRecorder()
			req, _ := http.NewRequest("POST", "/api/users",
				bytes.NewBufferString(tc.body))
			req.Header.Set("Content-Type", "application/json")

			r.ServeHTTP(w, req)

			if w.Code != tc.expectedCode {
				t.Errorf("期望 %d，实际 %d", tc.expectedCode, w.Code)
			}
		})
	}
}

// 测试查询用户
func TestGetUserHandler(t *testing.T) {
	r := newTestRouter()

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/api/users/1", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("期望 200，实际 %d", w.Code)
	}

	// 验证响应结构
	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)
	if _, ok := response["data"]; !ok {
		t.Error("响应缺少 data 字段")
	}
}
```

## 注意事项

1. **使用 TestMode**：测试中设置 `gin.SetMode(gin.TestMode)` 减少日志干扰
2. **不启动真实服务器**：使用 `httptest.NewRecorder()` 直接在内存中测试
3. **测试文件命名**：`xxx_test.go` 结尾的文件才会被 `go test` 识别
4. **测试函数命名**：必须以 `Test` 开头，参数必须是 `*testing.T`
5. **业务逻辑分离**：将业务逻辑从 handler 中抽出，便于单独测试
6. **mock 外部依赖**：数据库、第三方 API 等通过接口 + mock 测试
