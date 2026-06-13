---
title: Go 语法基础
order: 1
---

# Go 语法基础

## 包与入口函数

每个 Go 源文件都必须在第一行（注释和空行之后）声明它所属的包。

### 包的类型

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

### 入口函数

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

### init 函数

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

## 变量与常量

变量规则：

- 声明时未赋值，打印时会显示空
- 声明后才能使用且必须使用
- 同一作用域内，变量名不能重复
- 短变量声明：只能在函数内使用（局部变量），不能在包内使用（全局变量）

变量名的命名规则：

- 只能包含字母、数字和下划线
- 不能以数字开头
- 不能使用 Go 语言保留字
- 建议使用驼峰程命名法

### 变量声明

```go
// 方式1：使用 var 关键字 `var 变量名 类型 = 表达式`
var name string = "张三"
var age int = 25

// 方式2：类型推断
var name = "张三"  // 自动推断为 string 类型
var age = 25       // 自动推断为 int 类型

// 方式3：简短声明（只能在函数内使用） `变量名 := 表达式`
name := "张三"
age := 25

// 多变量声明
var x, y, z int = 1, 2, 3 // `var 变量名1, 变量名2, ... 类型 = 表达式1, 表达式2, ...`
a, b, c := 10, 20, "30"

/*
- 可以同时声明多个变量，每个变量的类型可以不同
- 可以在声明时初始化变量，也可以在声明后赋值
*/
var (
    a int = 10
    b string = "hello"
)
```

### 匿名变量

在使用多重赋值时，如果想要忽略某个值，可以使用匿名变量，用下划线 \_ 表示。
匿名变量不占用命名空间，不会分配内存，所以匿名变量之间不存在重复声明。

```go
var username, age = getUserInfo()
var _, age = getUserInfo() // 单独获取年龄
```

### 常量声明

```go
// 使用 const 关键字
const PI = 3.14159
const MAX_SIZE = 100

// 批量声明常量，如果省略了值则表示和上面一行的值相同
const (
    StatusOK    = 200
    StatusError = 500
    StatusError2 // 500
)

// iota 常量生成器，用于生成连续的整数常量，从 0 开始
// 每次 const 出现时，iota 会重置为 0
// 使用 _ 可以跳过当前的 iota 值，继续生成下一个 iota 值
// 可以在声明中间插队
const a = iota    // 0
const (
    a0 = iota    // 0
    a1           // 1
    a2          // 2
    _                // 3
    a10 = 10        // 10
    a5 = iota       // 5
    a6         // 6
)

// iota 的多常量同行定义用法
const (
    a, b = iota + 1, iota + 2    // 1, 2
    c, d // 2, 3
    e, f // 3, 4
)
```
**核心规则：**

1. **`iota` 按行递增**：每一行开始时 `iota` 自增 1（从 0 开始）
2. **同一行的 `iota` 值相同**：同一行中多次出现的 `iota` 取同一个值
3. **省略表达式会继承上一行**：后续行省略赋值表达式时，自动复用上一行的表达式模式

**逐行解析：**

| 行 | iota 值 | 计算过程 | 结果 |
|---|---------|---------|------|
| 第 1 行 | 0 | `a = 0+1`, `b = 0+2` | `a=1, b=2` |
| 第 2 行 | 1 | `c = 1+1`, `d = 1+2`（继承表达式） | `c=2, d=3` |
| 第 3 行 | 2 | `e = 2+1`, `f = 2+2`（继承表达式） | `e=3, f=4` |

## 数据类型

数据类型分为基本数据类型和复合数据类型。

### 基本数据类型

基本数据类型包括：

- 整数类型：int8, int16, int32, int64, uint8, uint16, uint32, uint64
- 浮点数类型：float32, float64
- 复数类型：complex64, complex128
- 字符串类型：string
- 布尔类型：bool
- 字节类型：byte（uint8 的别名）
- 字符类型：rune（int32 的别名，表示 Unicode 码点）

#### 数值类型

```go
// 整数类型
// int类型的变量默认值为 0
var a int8 = 127        // -128 到 127
var b int16 = 32767     // -32768 到 32767
var c int32 = 2147483647
var d int64 = 9223372036854775807
var e int = 100         // 根据平台自动选择 32 或 64 位

var f uint8 = 255       // 0 到 255
var g uint = 100        // 无符号整数

// 浮点数类型
// float32和float64类型的变量默认值为 0.0
var h float32 = 3.14
var i float64 = 3.141592653589793
var j float32 = 3.14e+2 // 表示 3.14 * 10^2
var k float32 = 3.14e-2 // 表示 3.14 / 10^2

// 浮点数精度丢失问题，需要使用第三方包 decimal 来处理
var l float64 = 1129.6
fmt.Println(l * 100) // 输出：112959.99999999999999

// 复数类型
var m complex64 = 1 + 2i
var n complex128 = 1 + 2i
```

#### 字符串和布尔类型

```go
// 字符串
// string类型的变量默认值为 "" 空
var name string = "Hello, World!"
var message = "这是一段中文文本"

// 字符串操作
str1 := "Hello"
str2 := "World"
result := str1 + " " + str2  // 字符串拼接
length := len(str1)           // 获取字符串长度。Go 源码默认 UTF-8 编码，汉字占3个字节，英文占1个字节

// 布尔类型
// 布尔类型的变量默认值为 false
var isActive bool = true
var isDeleted bool = false
```

#### byte 和 rune 类型

`byte` 和 `rune` 是 Go 中用于处理文本的两个特殊类型，它们分别是 `uint8` 和 `int32` 的别名。

```go
// byte 是 uint8 的别名，表示单个字节（0-255）
// 常用于处理 ASCII 字符或二进制数据
var b1 byte = 'A'        // 65（ASCII 码）
var b2 byte = 97         // 'a'
var b3 byte = 0x41       // 'A'（十六进制）

// rune 是 int32 的别名，表示一个 Unicode 码点（字符的唯一编号），UTF-8的一个字符
// 用于处理多字节字符（如中文、emoji 等），一个 rune 代表一个完整字符
var r1 rune = '中'       // 20013（Unicode 码点）
var r2 rune = '👋'       // 128075（emoji）
var r3 rune = '\u4E2D'   // '中'（Unicode 转义）

// 字符串遍历的区别
s := "Hello世界"

// 按字节遍历（byte）
for i := 0; i < len(s); i++ {
    fmt.Printf("%c ", s[i])  // 输出：H e l l o ä ¸  ç   (乱码，因为汉字被拆分成字节)
}

// 按字符遍历（rune）
for _, r := range s {
    fmt.Printf("%c ", r)  // 输出：H e l l o 世 界 (正确)
}

// 字符串长度
// 注意：unsafe.Sizeof(s) 无法查看string类型的数据占用的字节数，只能查看指针占用的字节数
fmt.Println(len(s))              // 11（字节数：5个英文 + 2个汉字×3 = 11）
fmt.Println(len([]rune(s)))      // 7（字符数：5个英文 + 2个汉字 = 7）

// 修改字符串中的字符
// 注意：字符串是不可变的，不能直接修改字符串中的字符。要修改字符串，需要先将字符串转换为字节数组或 rune 切片，然后修改切片中的元素，修改后会重新分配内存并复制字节数组或 rune 切片。
// 或者使用 strings.Replace 或 strings.ReplaceAll 函数来替换子字符串。
S := "Hello世界"
byteS := []byte(S) // 将字符串转换为字节数组
byteS[0] = 'h' // 修改第一个字节为h
fmt.Println(string(byteS)) // 转换为字符串后输出结果：hello世界

runeS := []rune(S) // 将字符串转换为 rune 切片
runeS[5] = '问' // 修改第一个 rune 为问
fmt.Println(string(runeS)) // 转换为字符串后输出结果：hello问界
```


**byte 和 rune 的区别：**

| 特性 | byte | rune |
|------|------|------|
| 底层类型 | uint8 | int32 |
| 大小 | 1 字节 | 4 字节 |
| 用途 | ASCII 字符、二进制数据 | Unicode 字符 |
| 字符范围 | 0-255 | 所有 Unicode 码点 |

**使用建议：**

- 处理 ASCII 文本或二进制数据时使用 `byte`
- 处理包含多语言字符（中文、日文、emoji 等）时使用 `rune`
- 计算字符串"字符数"而非"字节数"时，先转换为 `[]rune`

#### 类型转换

- 不推荐把高精度类型转换为低精度类型，否则会导致精度丢失。
- 不推荐把float类型转换为int类型，否则会导致溢出问题。
- 不允许将整型强制转换为布尔类型，否则会导致逻辑错误。
- 布尔型无法参与数值运算，也无法与其他类型进行转换。
- Go 不支持隐式类型转换，必须显式转换。
- 转换时要注意溢出问题，否则会导致数据丢失。
```go
// var d float64 = a  // 错误！必须显式转换

// 显式类型转换
// 数值类型之间转换 
var a int = 10
var b float64 = float64(a)
var c int = int(b)

// 高位向低位转换时要注意溢出问题
var n1 int16 = 130
fmt.Println(int8(n1)) // 输出：-126

// 其他类型转换为string类型
// 通过Sprintf转换
var i int = 10
var f float64 = 10.0
var b bool = true
var by byte = 'a'
strs := fmt.Sprintf("%d%f%c%t", i, f, by, b) // 输出：1010.000000atrue
// 通过strconv包转换
var str1 string = strconv.FormatInt(int64(i), 10) // 参数1：要转换的整数，参数2：进制。 输出："10" 
var str2 string = strconv.FormatFloat(f, 'f', 2, 64) // 参数1：要转换的浮点数，参数2：格式化输出类型，参数3：精度（-1表示不对小数进行格式化），参数4：输入待转换的浮点数的类型。 输出："10.00" 
var str3 string = strconv.FormatBool(b) // 参数1：要转换的布尔值。 输出："true" 
var str4 string = strconv.FormatUint(uint64(by), 10) // 参数1：要转换的字节，参数2：进制。 输出："97" 
var str5 string = strconv.FormatRune(rune(by)) // 参数1：要转换的 rune。 输出："a" 

// string 类型转换为其他类型
var str string = "10"
var i2, err = strconv.ParseInt(str, 10, 32) // 参数1：要转换的字符串，参数2：进制，参数3：输出类型，必须是 int32 或 int64。 输出：10
var f2, err = strconv.ParseFloat(str, 64) // 参数1：要转换的字符串，参数2：输入待转换的浮点数的类型。 输出：10.0
```

### 复合数据类型

复合数据类型包括：
- 数组：数组是跟基本数据类型一样属于值类型而非引用类型
- 切片
- 结构体
- 枚举
- 枚举类型

#### 数组

**数组的长度是固定的，数组的长度也是类型的一部分**

```go
// 固定长度数组
var arr1 [5]int
arr1[0] = 1
arr1[1] = 2

// 声明并初始化
arr2 := [5]int{1, 2, 3, 4, 5}

// 让编译器推断长度
arr3 := [...]int{1, 2, 3, 4, 5}

// 指定索引值的方式来初始化数组
arr4 := [...]int{1: 10, 4: 40} // 输出：[0 10 0 0 40]

// 多维数组
matrix := [2][3]int{ // 2行3列
    {1, 2, 3},
    {4, 5, 6},
}
// 多维数组让编译器推断长度
matrix1 := [...][3]int{ // 2行3列
    {1, 2, 3}, 
    {4, 5, 6},
}

/* 错误写法：多维数组只有第一层可以使用...来推断长度
matrix2 := [2][...]int{ // 2行3列
    {1, 2, 3},
    {4, 5, 6},
}

本质原因：Go 的数组类型是 [N]T，其中 N 是类型的一部分
多维数组 [2][3]int 的实际类型是 [2]([3]int)，即元素类型为 [3]int 的数组
内层数组的长度是元素类型定义的一部分，必须是确定的类型
如果写成 [2][...]int，相当于元素类型是 [?]int，这不是合法类型，编译器无法推断
// 这相当于：
arr := [2]SomeType{...}  // SomeType 必须是已知类型

// 如果写成 [2][...]int，相当于：
arr := [2][?]int{...}    // [?]int 不是合法类型，编译器不知道元素类型是什么
*/

// 遍历数组
for i := 0; i < len(arr4); i++ {
    fmt.Println(arr4[i])
}

for i, v := range arr4 {
    fmt.Println(i, v)
}

// 获取数组的长度
len(arr4) // 输出5
```

#### 切片（Slice）

**切片的本质是对底层数组的封装，包含指向底层数组的指针、长度（len）和容量（cap）。**
**切片的长度是可变的**

```go
// 创建切片
slice := []int{} // 空切片 nil 切片，长度为0，容量为0
slice1 := []int{1, 2, 3, 4, 5}

// 切片操作
numbers := []int{1, 2, 3, 4, 5, 6, 7, 8, 9, 10}
fmt.Println(numbers[2:5])   // [3, 4, 5]
fmt.Println(numbers[:3])    // [1, 2, 3]
fmt.Println(numbers[7:])    // [8, 9, 10]
fmt.Println(numbers[:])     // 所有元素

// 从数组创建切片，从切片创建切片是同理的
arr := [5]int{1, 2, 3, 4, 5}
slice2 := arr[:]  // 获取数组的所有元素，返回[1, 2, 3, 4, 5]
slice3 := arr[1:]  // 左闭右开，获取数组的第2个元素到数组的最后一个元素，返回[2, 3, 4, 5]
slice4 := arr[:4]  // 左闭右开，获取数组的第1个元素到第4个元素，返回[1, 2, 3, 4]
slice5 := arr[1:4]  // 左闭右开，获取数组的第2个元素到第4个元素，返回[2, 3, 4]

// 使用 make 创建
sliceMake1 := make([]int, 5)       // 长度5，容量5，返回[0 0 0 0 0]
sliceMake2 := make([]int, 3, 10)   // 长度3，容量10，返回[0 0 0]

// copy 复制切片，相当于深拷贝
src := []int{1, 2, 3}
dst := make([]int, len(src))
copy(dst, src)
fmt.Println(dst) // 输出：[1 2 3]

// append 添加元素
slice := []int{1, 2, 3}
slice = append(slice, 4)
slice = append(slice, 5, 6, 7)
slice = append(slice, []int{8, 9}...) // 合并切片，... 表示将切片展开为多个参数，返回[1, 2, 3, 4, 5, 6, 7, 8, 9]

// 通过 append 来删除切片中的元素
slice = append(slice[:2], slice[3:]...) // 删除索引为2的元素，返回[1, 2, 4, 5, 6, 7, 8, 9]

/**
 * 切片容量与底层数组的关系
 * 
 * 切片是对底层数组的引用，切片本身不存储数据，只包含：
 * - 指向底层数组的指针
 * - 长度（len）：切片中元素的个数
 * - 容量（cap）：从切片起始位置到底层数组末尾的元素个数
 */

// 示例1：从数组创建切片，容量 = 数组长度 - 起始索引
arr := [10]int{1, 2, 3, 4, 5, 6, 7, 8, 9, 10}
s1 := arr[2:5]       // 长度 3，容量 8（从索引2到数组末尾共8个元素）
fmt.Println(len(s1)) // 3
fmt.Println(cap(s1)) // 8

s2 := arr[5:]        // 长度 5，容量 5（从索引5到数组末尾共5个元素）
fmt.Println(len(s2)) // 5
fmt.Println(cap(s2)) // 5

// 示例2：append 扩容机制
// 当 append 超出当前容量时，Go 会自动创建更大的底层数组并复制数据
s3 := []int{1, 2, 3}       // 长度 3，容量 3
s3 = append(s3, 4)         // 需要 4，容量 3 不够，触发扩容 → 容量 6
s3 = append(s3, 5, 6, 7)   // 需要 7，容量 6 不够，触发扩容 → 容量 12
s3 = append(s3, 8, 9)      // 需要 9，容量 12 够用，不扩容
fmt.Println(len(s3))       // 9
fmt.Println(cap(s3))       // 12

/**
 * Go 切片扩容规则（Go 1.18+）：
 * 
 * 1. 新容量需求 > 旧容量 × 2 → 直接分配到需求大小
 * 2. 旧容量 < 256 → 容量翻倍（×2）
 * 3. 旧容量 ≥ 256 → 容量增长约 1.25 倍（实际会做内存对齐）
 * 
 * 扩容过程：
 * - 分配新的更大的底层数组
 * - 将旧数组数据复制到新数组
 * - 切片指针指向新数组
 * - 旧数组如果没有其他引用，会被 GC 回收
 */

```

## Map（映射）

```go
// 创建 map
ages := make(map[string]int)
ages["张三"] = 25
ages["李四"] = 30

// 声明并初始化
scores := map[string]int{
    "张三": 90,
    "李四": 85,
    "王五": 95,
}

// 访问元素
age := ages["张三"]
fmt.Println(age)  // 输出：25

// 检查键是否存在
value, exists := ages["王五"]
if exists {
    fmt.Println("存在:", value)
} else {
    fmt.Println("不存在")
}

// 删除元素
delete(ages, "李四")

// 遍历 map
for name, age := range ages {
    fmt.Printf("%s: %d岁\n", name, age)
}

// 修改元素
ages["张三"] = 26
```

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


## 控制结构

### 条件语句

```go
// if 语句
age := 18
if age >= 18 {
    fmt.Println("成年人")
}

// if-else 语句
if age >= 18 {
    fmt.Println("成年人")
} else {
    fmt.Println("未成年人")
}

// if-else if-else 语句
score := 85
if score >= 90 {
    fmt.Println("优秀")
} else if score >= 80 {
    fmt.Println("良好")
} else if score >= 60 {
    fmt.Println("及格")
} else {
    fmt.Println("不及格")
}

// if 带初始化语句
// age 只能在 if 语句中使用，超出作用域后不可用
if age := 20; age >= 18 {
    fmt.Println("成年人")
}
// age 在这里不可用
```

### switch 语句
在 go 中的 switch 的 case 中可以不使用break，默认只执行当前 case 中的语句。

```go
// 基本 switch
day := "Monday"
switch day {
case "Monday":
    fmt.Println("星期一")
case "Tuesday":
    fmt.Println("星期二")
case "Wednesday":
    fmt.Println("星期三")
default:
    fmt.Println("其他")
}

// 不带表达式的 switch（类似 if-else if）
score := 85
switch {
case score >= 90:
    fmt.Println("优秀")
case score >= 80:
    fmt.Println("良好")
case score >= 60:
    fmt.Println("及格")
default:
    fmt.Println("不及格")
}

// case存在多个条件
switch day {
case "Monday", "Tuesday":
    fmt.Println("工作日")
case "Wednesday", "Thursday":
    fmt.Println("工作日")
default:
    fmt.Println("其他")
}

// 每个fallthrough只会继续执行下一个 case，而不是一直执行到 default
num := 1
switch num {
case 1:
    fmt.Println("1")
    fallthrough
case 2:
    fmt.Println("2")
default:
    fmt.Println("其他") 
}
// 输出：1 和 2
```

### 循环语句

```go
// for 循环（基本形式）
for i := 0; i < 5; i++ {
    fmt.Println(i)
}

// while 风格的 for 循环
count := 0
for count < 5 {
    fmt.Println(count)
    count++
}

// 无限循环
for {
    fmt.Println("无限循环")
    break  // 退出循环
}

// range 遍历
/**
 * for-range 的使用方法
 * 
 * 语法：for 索引, 值 := range 集合 { ... }
 * 
 * 不同集合的返回值：
 * - 数组/切片：返回 (索引, 值)
 * - map：返回 (键, 值)
 * - 字符串：返回 (字节索引, rune字符)
 * - channel：只返回值
 */

// 1. 遍历数组/切片
nums := []int{10, 20, 30}
for i, v := range nums {
    fmt.Println(i, v)  // 0 10, 1 20, 2 30
}

// 只要索引
for i := range nums {
    fmt.Println(i)  // 0, 1, 2
}

// 只要值（用 _ 忽略索引）
for _, v := range nums {
    fmt.Println(v)  // 10, 20, 30
}

// 2. 遍历 map
scores := map[string]int{"张三": 90, "李四": 85}
for name, score := range scores {
    fmt.Println(name, score)  // 遍历顺序不固定
}

// 只要键
for name := range scores {
    fmt.Println(name)
}

// 3. 遍历字符串（按 rune 字符遍历）
s := "Hello世界"
for i, ch := range s {
    fmt.Printf("%d: %c\n", i, ch)  // i 是字节索引，ch 是字符
}

// 4. 遍历 channel
ch := make(chan int, 3)
ch <- 1
ch <- 2
ch <- 3
close(ch)

for v := range ch {  // channel 关闭后自动退出循环
    fmt.Println(v)  // 1, 2, 3
}

// continue 和 break
for i := 0; i < 10; i++ {
    if i%2 == 0 {
        continue  // 跳过偶数
    }
    if i > 7 {
        break  // 大于7时退出
    }
    fmt.Println(i)  // 输出：1, 3, 5, 7
}

// 退出多重循环
outerLoop:
for i := 0; i < 3; i++ {
    for j := 0; j < 3; j++ {
        if i == 1 && j == 1 {
            break outerLoop  // 退出外层循环
        }
        fmt.Println(i, j)
    }
}

// continue 跳转到指定循环
outerLoop:
for i := 0; i < 3; i++ {
    for j := 0; j < 3; j++ {
        if i == 1 && j == 1 {
            continue outerLoop  // 跳转到外层循环
        }
        fmt.Println(i, j)
    }
}

// goto 可以通过标签进行代码间的无条件跳转
label:
fmt.Println("跳转到标签")
goto label  // 跳转到标签
```

## 函数

### 函数定义

```go
// 基本函数
func sayHello() {
    fmt.Println("Hello!")
}

// 带参数的函数
func greet(name string) {
    fmt.Printf("Hello, %s!\n", name)
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

### 函数调用

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

### 可变参数函数

```go
// 可变参数
func sum(numbers ...int) int {
    total := 0
    for _, num := range numbers {
        total += num
    }
    return total
}

result := sum(1, 2, 3, 4, 5)
fmt.Println(result)  // 输出：15
```

### 匿名函数和闭包

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

// 闭包
func makeCounter() func() int {
    count := 0
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

### defer 延迟执行

```go
// defer 在函数返回前执行
func readFile() {
    file, err := os.Open("test.txt")
    if err != nil {
        fmt.Println("打开文件失败:", err)
        return
    }
    defer file.Close()  // 函数返回前关闭文件

    // 读取文件内容...
}

// 多个 defer 按 LIFO 顺序执行
func multipleDefers() {
    defer fmt.Println("第一个")
    defer fmt.Println("第二个")
    defer fmt.Println("第三个")
    // 输出顺序：第三个、第二个、第一个
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
