---
title: Go 语法基础
order: 1
---

# Go 语法基础




## 结构体（Struct）

```go
// 定义结构体
type Person struct {
    Name string
    Age  int
    City string
}

// 创建结构体实例
p1 := Person{"张三", 25, "北京"}
p2 := Person{Name: "李四", Age: 30, City: "上海"}
p3 := Person{Name: "王五"}  // 其他字段为零值

// 访问字段
fmt.Println(p1.Name)  // 输出：张三
fmt.Println(p1.Age)   // 输出：25

// 修改字段
p1.Age = 26

// 结构体指针
p4 := &Person{Name: "赵六", Age: 28}
fmt.Println(p4.Name)  // 自动解引用

// 匿名结构体
user := struct {
    ID   int
    Name string
}{
    ID:   1,
    Name: "测试用户",
}
```

### 结构体方法

```go
// 定义方法
type Rectangle struct {
    Width  float64
    Height float64
}

// 值接收者
func (r Rectangle) Area() float64 {
    return r.Width * r.Height
}

// 指针接收者（可以修改原值）
func (r *Rectangle) Scale(factor float64) {
    r.Width *= factor
    r.Height *= factor
}

rect := Rectangle{Width: 10, Height: 5}
fmt.Println(rect.Area())  // 输出：50

rect.Scale(2)
fmt.Println(rect.Width)   // 输出：20
```




## 接口（Interface）

```go
// 定义接口
type Animal interface {
    Speak() string
    Move() string
}

// 实现接口
type Dog struct {
    Name string
}

func (d Dog) Speak() string {
    return "汪汪"
}

func (d Dog) Move() string {
    return "跑"
}

type Cat struct {
    Name string
}

func (c Cat) Speak() string {
    return "喵喵"
}

func (c Cat) Move() string {
    return "走"
}

// 使用接口
func makeSound(a Animal) {
    fmt.Println(a.Speak())
}

dog := Dog{Name: "旺财"}
cat := Cat{Name: "咪咪"}

makeSound(dog)  // 输出：汪汪
makeSound(cat)  // 输出：喵喵
```

### 空接口

```go
// 空接口可以接受任何类型
var anything interface{}

anything = 42
anything = "hello"
anything = true

// 类型断言
value := anything.(string)

// 类型断言检查
if str, ok := anything.(string); ok {
    fmt.Println("是字符串:", str)
}

// 类型选择
func describe(i interface{}) {
    switch v := i.(type) {
    case int:
        fmt.Printf("整数: %d\n", v)
    case string:
        fmt.Printf("字符串: %s\n", v)
    case bool:
        fmt.Printf("布尔值: %t\n", v)
    default:
        fmt.Printf("未知类型: %T\n", v)
    }
}
```

## 错误处理

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

 
## 并发编程

### Goroutine

```go
// 创建 goroutine
func sayHello() {
    fmt.Println("Hello from goroutine!")
}

go sayHello()  // 启动 goroutine

// 带参数的 goroutine
func greet(name string) {
    fmt.Printf("Hello, %s!\n", name)
}

go greet("张三")
go greet("李四")

// 匿名函数 goroutine
go func() {
    fmt.Println("匿名 goroutine")
}()
```

### Channel（通道）

```go
// 创建通道
ch := make(chan int)

// 发送数据
ch <- 42

// 接收数据
value := <-ch

// 带缓冲的通道
bufferedCh := make(chan int, 10)
bufferedCh <- 1
bufferedCh <- 2

// 关闭通道
close(ch)

// 检查通道是否关闭
value, ok := <-ch
if !ok {
    fmt.Println("通道已关闭")
}
```

### Channel 示例

```go
// 生产者-消费者模式
func producer(ch chan int) {
    for i := 0; i < 5; i++ {
        ch <- i
        fmt.Println("生产:", i)
    }
    close(ch)
}

func consumer(ch chan int) {
    for value := range ch {
        fmt.Println("消费:", value)
    }
}

ch := make(chan int)
go producer(ch)
consumer(ch)

// 多路复用（select）
func main() {
    ch1 := make(chan int)
    ch2 := make(chan int)

    go func() { ch1 <- 1 }()
    go func() { ch2 <- 2 }()

    for i := 0; i < 2; i++ {
        select {
        case v := <-ch1:
            fmt.Println("从 ch1 收到:", v)
        case v := <-ch2:
            fmt.Println("从 ch2 收到:", v)
        }
    }
}
```

## 包管理

### 导入包

```go
import (
    "fmt"
    "os"
    "strings"
)

// 别名导入
import (
    f "fmt"
    myos "os"
)

// 点导入（不推荐）
import . "fmt"

// 空白导入（只执行 init）
import _ "database/sql/driver"
```

### 创建包

```go
// mypackage/math.go
package mypackage

// 导出（首字母大写）
func Add(a, b int) int {
    return a + b
}

// 未导出（首字母小写，包外不可见）
func internalHelper() {
    // ...
}

// init 函数（包加载时自动执行）
func init() {
    fmt.Println("mypackage 已加载")
}
```

| 序号 | 中文标题 | 英文命名建议 |
|-----|---------|-------------|
| 1 | 包与入口函数 | package-and-entry |
| 2 | 常用标准库 | standard-library |
| 3 | 变量与常量 | variables-and-constants |
| 4 | 数据类型 | data-types |
| 5 | 结构体（Struct） | struct |
| 6 | 控制结构 | control-structures |
| 7 | 函数 | functions |
| 8 | 接口（Interface） | interface |
| 9 | 错误处理 | error-handling |
| 10 | 并发编程 | concurrency |
| 11 | 包管理 | package-management |