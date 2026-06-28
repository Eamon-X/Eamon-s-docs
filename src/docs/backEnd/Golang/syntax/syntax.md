---
title: Go 语法基础
order: 1
---

# Go 语法基础
## 错误处理
| 9 | 错误处理 | error-handling |

```go
// 错误类型
type error interface {
    Error() string
}

// 创建错误
func divide(a, b float64) (float64, error) {
    if b == 0 {
        return 0, errors.New("除数不能为0")
    }
    return a / b, nil
}

// 错误处理
result, err := divide(10, 0)
if err != nil {
    fmt.Println("发生错误:", err)
    return
}
fmt.Println("结果:", result)

// 自定义错误
type MyError struct {
    Code    int
    Message string
}

func (e *MyError) Error() string {
    return fmt.Sprintf("错误 %d: %s", e.Code, e.Message)
}

func doSomething() error {
    return &MyError{Code: 404, Message: "未找到"}
}
```

 
