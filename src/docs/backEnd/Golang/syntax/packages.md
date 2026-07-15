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

```go.mod
module myproject

go 1.26.4
```

```go
// 位于 math/math.go 文件中
package math

// Add 大写开头为导出函数，供其他包使用
func Add(a, b int) int {
    return a + b
}

// helper 小写开头为未导出函数，仅包内可见
func helper() {
    // 内部逻辑
}
```

```go
// 位于main.go文件中
package main

import (
    "fmt"
    M "myproject/math" // 把math包定义别名为 M
)

func main() {
    fmt.Println("Hello, World!")
    fmt.Println(math.Add(1, 2)) // 输出：3
    fmt.Println(M.Add(1, 2)) // 输出：3
}
```

## 包管理工具

Go 提供了 `go mod` 命令来管理项目的依赖。

- `go mod init`：初始化一个新的模块，设置模块名和版本。类似于`npm init`。
- `go mod tidy`：根据当前依赖关系更新模块的版本。类似于`npm install`。
- `go get`：主动安装 指定包及其依赖。类似于`npm install <package>`。

```bash
go mod init myproject # 初始化模块
```

## 使用第三方包

[查找常见第三方包](https://pkg.go.dev/)

**1. 使用 `go get` 安装第三方包**

```bash
go get github.com/username/package-name
```

**2. 导入第三方包到代码中**

```go
import (
    "github.com/username/package-name"
)
```

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
os.Remove("dir")                    // 删除目录
os.RemoveAll("dir1/dir2")                 // 递归删除目录和文件


// 文件操作
file, err := os.Create("test.txt")
file, err := os.Open("test.txt") // 只读打开文件

defer file.Close() // 操作完成后必须关闭文件流

content, err := file.ReadAll() // 读取文件内容，返回字节切片
str := string(content) // 转换为字符串

file, err := os.OpenFile("test.txt", os.O_APPEND|os.O_WRONLY, 0644) // 追加写入
file.WriteString("hello world") // 写入字符串

// 复制文件
srcFile, err := os.Open("testA.txt")
dstFile, err := os.Create("testB.txt")
io.Copy(dstFile, srcFile)

// 重命名文件
os.Rename("testB.txt", "testC.txt") // 把 testB.txt 重命名为 testC.txt

```

#### os打开文件模式与权限

- `os.O_RDONLY`：只读打开文件
- `os.O_WRONLY`：只写打开文件
- `os.O_RDWR`：读写打开文件
- `os.O_APPEND`：追加写入文件
- `os.O_CREATE`：创建文件
- `os.O_TRUNC`：截断（清空）文件内容

文件权限：一个八进制数，r（读取）04、w（写入）02、wx（执行）01 三者中的任意组合。

- 0644：读取、写入、执行（所有者、组用户、其他用户）
- 0755：读取、写入、执行（所有者、组用户、其他用户）
- 0777：读取、写入、执行（所有者、组用户、其他用户）

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

## init 函数

每个包可以包含一个或多个 `init` 函数，它们在包初始化时自动执行，无需手动调用。

嵌套导入多个包时 `init` 的执行顺序遵循以下规则：

**执行顺序规则：**

1. 被导入的包的 `init` 函数先执行
2. 同一文件中的多个 `init` 按出现顺序执行
3. 同一包内不同文件的 `init` 按文件名排序执行
4. 深层嵌套依赖最先执行

**示例说明：**

```go
// 假设有如下导入关系：
// main -> pkgA -> pkgB -> pkgC

// 执行顺序：
// 1. pkgC.init()
// 2. pkgB.init()
// 3. pkgA.init()
// 4. main.init()
// 5. main.main()
```

**具体示例代码：**

```go
// pkgC.go
package pkgC

import "fmt"

func init() {
    fmt.Println("pkgC init")
}

// pkgB.go
package pkgB

import (
    "fmt"
    "pkgC"
)

func init() {
    fmt.Println("pkgB init")
}

// pkgA.go
package pkgA

import (
    "fmt"
    "pkgB"
)

func init() {
    fmt.Println("pkgA init")
}

// main.go
package main

import (
    "fmt"
    "pkgA"
)

func init() {
    fmt.Println("main init")
}

func main() {
    fmt.Println("main function")
}

// 输出顺序：
// pkgC init
// pkgB init
// pkgA init
// main init
// main function
```

**init 函数的特点：**

- 无参数，无返回值
- 不能被显式调用
- 同一包无论被导入多少次，`init` 只执行一次
- 多个 `init` 函数按文件名的字典序执行
- 常用于全局变量初始化、数据库连接、注册驱动等场景

**注意事项：**

- 不要在 `init` 中做耗时操作，会延长程序启动时间
- 避免在 `init` 中依赖不确定顺序的外部状态

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
