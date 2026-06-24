---
title: 指针
order: 5
---

# 指针

## 基本概念

- golang里每个变量都有一个对应的内存地址
- 指针存储了一个变量在内存中的地址
- 通过指针可以间接访问和修改该变量的值

## 相关运算符
- `&`：取地址运算符，获取变量的内存地址
- `*`：解引用运算符，通过指针访问指向的值

```go
var a int = 42
var p *int = &a  // p 是指向 int 的指针，保存了变量 a 的内存地址

fmt.Println(p)   // 输出：0xc0000b2008（变量 a 的内存地址）
fmt.Println(*p)  // 解引用，输出：42
```

```go
// 修改指针指向的值
*p = 100
fmt.Println(a)  // 输出：100（变量 a 的值已被修改）
```

## 声明

指针是引用数据类型，需要先声明并分配内存后才能存储值。

```go
// 声明指针
var p *int           // 声明一个指向 int 的指针，零值为 nil
var s *string        // 声明一个指向 string 的指针
// 分配内存
p = new(int)        // 分配内存，返回 *int，初始值为 0
fmt.Println(*p)     // 输出：0

// 声明并初始化
a := 42
p1 := &a             // 自动推断类型为 *int
var p2 *int = &a     // 显式声明类型

// 通过 new 创建指针
p3 := new(int)       // 分配内存，返回 *int，初始值为 0
*p3 = 100
fmt.Println(*p3)     // 输出：100
```

## 指针类型

```go
// 基本类型指针
var pInt *int
var pFloat *float64
var pBool *bool

// 数组指针
arr := [3]int{1, 2, 3}
var pArr *[3]int = &arr
fmt.Println((*pArr)[0])  // 输出：1
fmt.Println(pArr[0])     // 简写，输出：1（Go 自动解引用）

// 指针的指针（二级指针）
var a int = 42
var p *int = &a
var pp **int = &p
fmt.Println(**pp)  // 输出：42
```

## 指针与函数

### 值传递 vs 指针传递

**最重要的区别：**

- **值传递**：函数接收的是实参的副本，修改不影响实参
- **指针传递**：函数接收的是实参的地址，通过解引用可以修改实参

```go
// 值传递：无法修改实参
func zeroVal(val int) {
    val = 0
}

// 指针传递：可以修改实参
func zeroPtr(ptr *int) {
    *ptr = 0
}

a := 42
zeroVal(a)
fmt.Println(a)   // 输出：42（未改变）

zeroPtr(&a)
fmt.Println(a)   // 输出：0（已改变）
```

### 指针作为参数

```go
func swap(a, b *int) {
    *a, *b = *b, *a
}

x, y := 10, 20
swap(&x, &y)
fmt.Println(x, y)  // 输出：20 10
```

### 指针作为返回值

```go
func createPointer() *int {
    result := 42
    return &result  // 返回局部变量的地址完全合法，Go 编译器会自动将其分配到堆上
}

p := createPointer()
fmt.Println(*p)  // 输出：42
```

## 指针与切片/映射

**切片和映射本身就是引用类型，内部已经包含指针，不需要再传指针。**

```go
// 切片不需要指针参数
func appendValue(slice []int, value int) {
    slice[0] = value  // 修改影响实参
}

// 映射不需要指针参数
func setValue(m map[string]int, key string, value int) {
    m[key] = value  // 修改影响实参
}

// 但如果需要改变切片本身（如追加元素导致扩容），需要传指针
func appendToSlice(slice *[]int, value int) {
    *slice = append(*slice, value)
}

nums := []int{1, 2, 3}
appendToSlice(&nums, 4)
fmt.Println(nums)  // 输出：[1, 2, 3, 4]
```

## nil 指针与安全检查

```go
func printValue(p *int) {
    if p == nil {
        fmt.Println("指针为 nil")
        return
    }
    fmt.Println(*p)
}

var p *int
printValue(p)      // 输出：指针为 nil

a := 42
printValue(&a)     // 输出：42
```

**解引用 nil 指针会触发 panic：**

```go
var p *int
fmt.Println(*p)  // panic: runtime error: invalid memory address or nil pointer dereference

// 安全做法：使用前检查
if p != nil {
    fmt.Println(*p)
}
```

## 指针运算（无）

**Go 不支持指针运算（如 C/C++ 中的 `ptr++`、`ptr + n`、`ptr - n` 等）。**

```go
arr := [3]int{1, 2, 3}
var p *int = &arr[0]

// 以下在 C/C++ 中合法，但在 Go 中不合法
// p++          // 编译错误
// p + 1        // 编译错误
// *(p + 1)     // 编译错误
```

如果需要通过指针遍历数组，请使用切片：

```go
arr := [3]int{1, 2, 3}
slice := arr[:]
for i := range slice {
    fmt.Println(slice[i])
}
```

**使用 unsafe 包可以实现指针运算（不推荐）：**

```go
// 极度不推荐，破坏类型安全
arr := [3]int{1, 2, 3}
ptr := unsafe.Pointer(&arr[0])
ptr = unsafe.Pointer(uintptr(ptr) + unsafe.Sizeof(arr[0]))
fmt.Println(*(*int)(ptr))  // 输出：2
```

## 使用场景总结

### 1. 修改函数外部的变量

```go
func increment(ptr *int) {
    *ptr++
}
```

### 2. 避免大结构体的拷贝开销

```go
type LargeStruct struct {
    Data [10000]int
}

// 值传递：每次调用都会拷贝整个结构体，开销大
func processValue(data LargeStruct) {
    // ...
}

// 指针传递：只拷贝 8 字节的地址，开销小
func processPointer(data *LargeStruct) {
    // ...
}
```

### 3. 实现单例或共享状态

```go
type Config struct {
    AppName string
    Version string
}

var globalConfig *Config

func GetConfig() *Config {
    if globalConfig == nil {
        globalConfig = &Config{
            AppName: "MyApp",
            Version: "1.0.0",
        }
    }
    return globalConfig
}
```

### 4. 标记可选参数（nil 表示未提供）

```go
func findUser(id int, opts *FindOptions) *User {
    if opts == nil {
        opts = &FindOptions{Limit: 10}  // 默认值
    }
    // 查询逻辑...
}
```

### 5. 实现链表等数据结构

```go
type Node struct {
    Value int
    Next  *Node
}

type LinkedList struct {
    Head *Node
}

func (l *LinkedList) Append(value int) {
    newNode := &Node{Value: value}
    if l.Head == nil {
        l.Head = newNode
        return
    }
    current := l.Head
    for current.Next != nil {
        current = current.Next
    }
    current.Next = newNode
}
```