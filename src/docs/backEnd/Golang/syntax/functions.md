---
title: 函数
order: 4
---

# 函数

## 函数定义

格式：
func 函数名(参数列表) 返回值列表 {
    函数体
}

```go
// 基本函数
func sayHello() {
    fmt.Println("Hello!")
}

// 带参数的函数
func greet(name string) { 
    fmt.Printf("Hello, %s!\n", name)
}

// 函数参数简写，省略类型默认取后一个参数的类型
func sub(a, b int) int {
    return a - b
}

// 可变参数，接收任意数量的参数
func sum(init int, numbers ...int) int { // 表示第一个参数赋给init，后续任意数量参数赋给numbers
    // 可变参数 numbers 是一个切片，需要遍历切片
    // 计算切片中所有元素的总和
    total := init
    for _, num := range numbers {
        total += num
    }
    return total
}

// 带返回值的函数
func add(a int, b int) int {
    return a + b
}

// 多返回值
func divide(a, b float64) (float64, error) {
    if b == 0 {
        return 0, errors.New("除数不能为0")
    }
    return a / b, nil
}

// 命名返回值
func calc(a, b int) (sum int, diff int) {
    sum = a + b
    diff = a - b
    return  // 自动返回命名变量
}
```

## 函数调用

```go
// 基本调用
sayHello()
greet("张三")

// 接收返回值
result := add(10, 20)
fmt.Println(result)  // 输出：30

// 接收多返回值
quotient, err := divide(10, 3)
if err != nil {
    fmt.Println("错误:", err)
} else {
    fmt.Println("结果:", quotient)
}
```

## 匿名函数和闭包

在一个函数里定义另一个函数时，只能定义匿名函数

```go
// 匿名函数
func() {
    fmt.Println("这是一个匿名函数")
}()  // 立即执行

// 赋值给变量
add := func(a, b int) int {
    return a + b
}
result := add(10, 20)

/* 闭包
 * 1、闭包是指有权访问另一个函数作用域中的变量的函数
 * 2、创建闭包的常见方式就是在一个函数内部定义另一个函数，通过另一个函数访问这个函数的局部变量
 * 3、闭包可以实现让一个变量常驻内存又不污染全局命名空间。由于变量常驻内存，过度使用闭包会导致性能下降。
 */

func makeCounter() func() int {
    count := 0 // count 是闭包的局部变量，能够常驻内存但不污染全局
    return func() int {
        count++
        return count
    }
}

counter := makeCounter()
fmt.Println(counter())  // 输出：1
fmt.Println(counter())  // 输出：2
fmt.Println(counter())  // 输出：3
```

## 定义函数类型

```go
// 定义函数类型
type AddFunc func(int, int) int

// 使用定义函数类型
var add AddFunc = func(a, b int) int { 
    return a + b
}
```

## defer 延迟执行

`defer` 是 Go 的关键字，用于延迟执行函数调用。被 defer 的语句会在**当前函数返回前**执行，无论函数是正常返回、提前 return 还是因 panic 退出。

### 基本语法

```go
defer 函数调用()
```

### 核心特性

**1. 延迟执行**

```go
func demo() {
    fmt.Println("开始")
    defer fmt.Println("defer 执行")
    fmt.Println("结束")
}
// 输出：
// 开始
// 结束
// defer 执行
```

**2. 多个 defer 按 LIFO（后进先出）顺序执行**

```go
func demo() {
    defer fmt.Println("第 1 个 defer")
    defer fmt.Println("第 2 个 defer")
    defer fmt.Println("第 3 个 defer")
}
// 输出：
// 第 3 个 defer
// 第 2 个 defer
// 第 1 个 defer
```

**3. 参数在注册时求值，而非执行时**

```go
func demo() {
    i := 1
    defer fmt.Println("defer 输出:", i)  // 此时 i=1，已求值
    i = 2
    fmt.Println("函数输出:", i)
}
// 输出：
// 函数输出: 2
// defer 输出: 1
```

如果想让 defer 在执行时求值，可以使用闭包：

```go
func demo() {
    i := 1
    defer func() {
        fmt.Println("defer 输出:", i)  // 闭包捕获的是变量引用
    }()
    i = 2
}
// 输出：defer 输出: 2
```

### defer 与返回值的关系

**defer 可以修改命名返回值，但不能修改匿名返回值。**

**本质原因：**

Go 编译器在处理返回值时，会在函数栈帧中分配一块**返回值存储区域**（称为"返回槽"）。匿名返回值和命名返回值的区别在于这块区域与函数内变量的关系：

**匿名返回值**：函数内有一个局部变量 `result`，返回值存储区域是另一个**独立的隐藏变量**。`return result` 时，Go 会把 `result` 的值**拷贝**到隐藏变量中。defer 修改的是局部变量 `result`，而隐藏变量里的值已经拷贝完毕，不会被影响。

**命名返回值**：函数签名中的 `result int` 直接就是返回值存储区域本身，函数内没有额外的局部变量。defer 修改的就是这个返回值变量，所以修改会生效。

简单类比：
- 匿名返回值：你写了一封信（局部变量），复印了一份放到邮箱（返回槽）。后来你改了原信，但邮箱里的复印件不会变。
- 命名返回值：你直接把信放进了邮箱。后来你改了信，邮箱里的信也就变了。

**return 语句的执行步骤：**

```go
// 命名返回值：defer 可以修改返回值
func namedReturn() (result int) {
    result = 10
    defer func() {
        result++  // result 变为 11
    }()
    return result  // 1. 将 result 赋值给返回槽  2. 执行 defer  3. 真正返回
}
// 最终返回 11

// 匿名返回值：defer 无法修改返回值
func anonymousReturn() int {
    result := 10
    defer func() {
        result = 20  // 修改的是局部变量，不影响返回值
    }()
    return result  // 1. 将 result 的值(10)复制到隐藏返回槽  2. 执行 defer(修改局部变量为20)  3. 返回隐藏槽中的值(10)
}
// 最终返回 10
```

### defer 的作用

1. **资源清理**：确保资源（文件、网络连接、锁等）在使用后被释放
2. **简化代码**：将清理逻辑紧跟在资源创建处，避免遗漏
3. **异常安全**：即使函数因 panic 或提前 return 退出，defer 仍会执行

### 应用场景

**1. 文件/资源关闭**

```go
func processData() error {
    file, err := os.Open("data.txt")
    if err != nil {
        return err
    }
    defer file.Close()  // 确保文件被关闭

    // 处理文件...
    return nil
}
```

**2. 互斥锁释放**

```go
var mu sync.Mutex

func safeUpdate() {
    mu.Lock()
    defer mu.Unlock()  // 确保锁被释放，即使发生 panic

    // 临界区操作...
}
```

**3. panic 恢复**

```go
func recoverFromPanic() {
    defer func() {
        if r := recover(); r != nil {
            fmt.Println("捕获 panic:", r)
        }
    }()

    // 可能 panic 的代码
    panic("something went wrong")
}
```

**4. 函数执行时间追踪**

```go
func trackTime(name string) func() {
    start := time.Now()
    return func() {
        fmt.Printf("%s 耗时: %v\n", name, time.Since(start))
    }
}

func doWork() {
    defer trackTime("doWork")()  // 函数结束时打印耗时
    // 执行工作...
}
```

**5. 数据库事务回滚**

```go
func transaction(db *sql.DB) error {
    tx, _ := db.Begin()
    defer tx.Rollback()  // 默认回滚

    // 执行操作...
    // 如果成功，显式提交会覆盖 defer
    return tx.Commit()
}
```

### 注意事项

- defer 只能用于函数或方法调用，不能用于表达式
- defer 注册在函数级别，不在代码块级别（if/for 内的 defer 仍在函数返回时执行）
- 大量 defer 会有轻微性能开销，热点路径中需谨慎使用
- defer 中发生 panic 会覆盖外层 panic

## panic 和 recover

Go 没有传统意义上的异常（try-catch），而是使用 `panic` 和 `recover` 来处理运行时错误。

### panic

`panic` 用于触发运行时恐慌，会立即停止当前函数的执行，然后逐层向上返回，依次执行每层的 `defer` 函数，直到程序崩溃或遇到 `recover`。

```go
// 触发 panic
panic("发生错误")
panic(errors.New("自定义错误"))
panic(42)  // panic 可以接受任意类型的值
```

**panic 的传播过程：**

```go
func main() {
    defer fmt.Println("main 的 defer")
    fmt.Println("main 开始")
    f1()
    fmt.Println("main 结束")  // 不会执行
}

func f1() {
    defer fmt.Println("f1 的 defer")
    fmt.Println("f1 开始")
    f2()
    fmt.Println("f1 结束")  // 不会执行
}

func f2() {
    defer fmt.Println("f2 的 defer")
    fmt.Println("f2 开始")
    panic("出错了！")
    fmt.Println("f2 结束")  // 不会执行
}

// 输出：
// main 开始
// f1 开始
// f2 开始
// f2 的 defer
// f1 的 defer
// main 的 defer
// panic: 出错了！
```

### recover

`recover` 用于捕获 panic，恢复程序的正常执行。**recover 必须在 defer 中调用才有效。**

```go
func safeFunc() {
    defer func() {
        if r := recover(); r != nil {
            fmt.Println("捕获到 panic:", r)
        }
    }()

    fmt.Println("开始执行")
    panic("出错了")
    fmt.Println("不会执行")
}

safeFunc()
// 输出：
// 开始执行
// 捕获到 panic: 出错了
```

## panic + recover + defer 的配合

```go
func process() (err error) {
    defer func() {
        if r := recover(); r != nil {
            err = fmt.Errorf("发生 panic: %v", r)
        }
    }()

    // 可能 panic 的代码
    data := []int{1, 2, 3}
    fmt.Println(data[10])  // 索引越界，触发 panic

    return nil
}

err := process()
if err != nil {
    fmt.Println("错误:", err)
}
```

### 什么时候使用 panic

**应该使用 panic 的场景：**
- 程序遇到了无法恢复的错误（如配置错误、资源不可用）
- 开发阶段的断言检查（如 `nil` 指针、非法参数）
- 标准库中常见：`nil` 解引用、数组越界、除零等

**不应该使用 panic 的场景：**
- 常规的错误处理（应使用 `error` 返回值）
- 用户输入验证
- 网络请求失败、文件不存在等可预期错误

```go
// ❌ 错误用法：用 panic 处理常规错误
func getUser(id int) *User {
    user, err := db.Query(id)
    if err != nil {
        panic(err)  // 不应该 panic
    }
    return user
}

// ✅ 正确用法：返回 error
func getUser(id int) (*User, error) {
    user, err := db.Query(id)
    if err != nil {
        return nil, err
    }
    return user, nil
}
```

### 注意事项

- `recover` 只在 `defer` 函数中直接调用时才有效
- `recover` 必须在同一个 goroutine 中调用，不能跨 goroutine 捕获 panic
- 如果 defer 中又发生 panic，会覆盖之前的 panic
- 被 recover 捕获后，程序从 defer 所在函数返回，不会回到 panic 发生的位置
- 生产环境中应谨慎使用 panic/recover，优先使用 error 处理


