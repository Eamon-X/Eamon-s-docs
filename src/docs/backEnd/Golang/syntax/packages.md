---
title: 包与入口函数
order: 0
---

# 包与入口函数

每个 Go 源文件都必须在第一行（注释和空行之后）声明它所属的包。

## 包的类型

Go 中的包主要分为两种类型：

**1. main 包（可执行程序）**

`main` 包是 Go 程序的入口包，编译后会生成可执行文件。每个可执行程序必须有且仅有一个 `main` 包。

```go
package main

import "fmt"

func main() {
    fmt.Println("Hello, World!")
}
```

**2. 普通包（库包）**

普通包用于组织可复用的代码，编译后生成 `.a` 归档文件，供其他包导入使用。包名通常与目录名一致。

```go
// 位于 mylib/math.go 文件中
package mylib

// Add 导出函数，供其他包使用
func Add(a, b int) int {
    return a + b
}

// helper 未导出函数，仅包内可见
func helper() {
    // 内部逻辑
}
```

## 入口函数

`main` 包中必须定义一个 `main` 函数，它是程序的执行入口。

```go
package main

import "fmt"

// main 函数是程序的入口点
// 无参数，无返回值
func main() {
    fmt.Println("程序开始执行")

    // 程序逻辑
    // main 函数执行完毕后，程序自动退出
}
```

**入口函数的特点：**

- `main` 函数不能有参数
- `main` 函数不能有返回值
- 每个 `main` 包只能有一个 `main` 函数
- `main` 函数执行完毕后，程序自动终止
- 可以通过 `os.Exit(code)` 手动设置退出状态码

```go
package main

import (
    "fmt"
    "os"
)

func main() {
    err := run()
    if err != nil {
        fmt.Println("程序出错:", err)
        os.Exit(1)  // 以状态码 1 退出，表示异常
    }
    os.Exit(0)  // 以状态码 0 退出，表示正常
}

func run() error {
    // 实际业务逻辑
    return nil
}
```

## init 函数

每个包可以包含一个或多个 `init` 函数，它们在包初始化时自动执行，无需手动调用。

```go
package main

import "fmt"

// init 函数在 main 函数之前自动执行
// 常用于初始化配置、注册组件等
func init() {
    fmt.Println("包初始化")
}

// 可以有多个 init 函数，按声明顺序执行
func init() {
    fmt.Println("第二个 init")
}

func main() {
    fmt.Println("main 函数执行")
}

// 输出顺序：
// 包初始化
// 第二个 init
// main 函数执行
```

**init 函数的特点：**

- 无参数，无返回值
- 不能被显式调用
- 在每个包导入时自动执行一次
- 多个 `init` 函数按文件名的字典序执行
- 常用于全局变量初始化、数据库连接、注册驱动等场景

## 常用标准库

### fmt 包

fmt包提供了格式化输入和输出的功能。

[fmt 包文档](https://docscn.studygolang.com/The-Golang-Standard-Library-by-Example/chapter01/01.3.html)

```go
import "fmt"

// 输出
fmt.Print("Hello", "World")                    // 不换行，多个参数不分隔
fmt.Println("Hello", "World")                  // 换行，多个参数用空格分隔
// 格式化输出：
// %s 表示字符串，%d 表示整数，%f 表示浮点数，%v 表示任意类型
// \n 表示换行，\t 表示制表符
fmt.Printf("Hello, %s!\n", "张三")
fmt.Printf("Hello, %d!\n", 25)
fmt.Printf("Hello, %f!\n", 3.14)
fmt.Printf("Hello, %v!\n", true)
fmt.Printf("Name: %s, Age: %d\n", "张三", 25)  // 默认不换行，用\n换行
// 输出变量类型
fmt.Printf("%T\n", name)  // 输出 name 的类型，例如 string
fmt.Printf("%T\n", age)   // 输出 age 的类型，例如 int

// 拼接字符串
str := fmt.Sprintf("Name: %s, Age: %d", "张三", 25)

// 格式化输入
var name string
var age int
fmt.Scan(&name, &age)
fmt.Scanf("Name: %s, Age: %d", &name, &age)
```

### strings 包

```go
import "strings"

// 常用字符串操作
strings.Contains("hello world", "world")     // 判断字符串"hello world"是否包含子字符串"world"，返回true
strings.HasPrefix("hello", "he")             // 判断字符串"hello"是否以"he"开头，返回true
strings.HasSuffix("hello", "lo")             // 判断字符串"hello"是否以"lo"结尾，返回true
strings.Index("hello", "l")                 // 从前往后，查找子字符串"l"在字符串"hello"中的第一个索引，返回2（索引为2，返回-1表示未找到）
strings.LastIndex("hello", "l")             // 从后往前，查找子字符串"l"在字符串"hello"中的最后一个索引，返回3（索引为3，返回-1表示未找到）
strings.Join([]string{"a", "b", "c"}, "-")   // 把切片转换为字符串，用 "-" 分隔，返回 "a-b-c"
strings.Split("a-b-c", "-")                  // 分割字符串，返回切片 [a b c]
strings.ToLower("HELLO")                     // 转换为小写，返回 "hello"
strings.ToUpper("hello")                     // 转换为大写，返回 "HELLO"
strings.TrimSpace("  hello  ")               // 移除字符串首尾的空格，返回 "hello"
strings.Replace("hello", "l", "L", -1)       // 替换子字符串"l"为"L"，返回 "heLLo"
strings.Count("hello", "l")                  // 返回子字符串"l"在字符串"hello"中出现的次数，返回2
```

### os 包

```go
import "os"

// 环境变量
os.Getenv("GOPATH")
os.Setenv("MY_VAR", "value")

// 文件和目录
os.Getwd()                          // 获取当前工作目录
os.Chdir("/path/to/dir")            // 切换目录
os.Mkdir("newdir", 0755)            // 创建目录
os.MkdirAll("a/b/c", 0755)          // 递归创建目录
os.Remove("file.txt")               // 删除文件
os.RemoveAll("dir")                 // 递归删除

// 文件操作
file, err := os.Create("test.txt")
file, err := os.Open("test.txt")
file, err := os.OpenFile("test.txt", os.O_APPEND|os.O_WRONLY, 0644)
```

### time 包

```go
import "time"

// 获取当前日期时间
time.Now()          

// 时间格式化
// 通过使用 Go 的诞生时间2006年1月2日 15时04分05秒 （速记：2026 1 2 3 4 5）
// 2006 表示年，01 表示月，02 表示日
// 03 表示 12小时制，15 表示 24小时制，04 表示分钟，05 表示秒
time.Now().Format("2006-01-02 15:04:05")

// 获取时间戳
time.Now().Unix() // 单位为秒，返回 int64 类型的整数
time.Now().UnixMilli() // 单位为毫秒，返回 int64 类型的整数
time.Now().UnixNano() // 单位为纳秒，返回 int64 类型的整数

// 时间戳转换为日期时间
time.Unix(time.Now().Unix(), 0) // 第一个参数为时间戳，第二个参数为纳秒

// 日期时间转换为时间戳
t, err := time.ParseInLocation("2006-01-02 15:04:05", "2023-01-01 12:00:00", time.Local)
t.Unix() // 返回时间戳，单位为秒

// 时间操作
time.Now().Add(time.Hour) // 加 1 小时

// 等待
time.Sleep(time.Second)            // 等待 1 秒
time.Sleep(time.Second * 2)        // 等待 2 秒

// 定时器
ticker := time.NewTicker(time.Second) // 创建一个 1 秒的定时器
ticker.C // 返回一个通道，用于接收定时器的事件

for t := range ticker.C {
    fmt.Println("定时器触发", t) // 每 1 秒打印一次
}

ticker.Stop() // 停止定时器

```