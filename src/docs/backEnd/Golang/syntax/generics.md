---
title: 泛型
order: 9
---

# 泛型

## 基本概念

**泛型（Generics）** 是 Go 1.18（2022年3月）引入的重要特性，允许在**不指定具体类型**的情况下编写通用的函数和类型。使用时再传入具体类型。

### 为什么需要泛型

在泛型出现之前，想写一个通用函数只能使用 `interface{}` + 类型断言：

```go
// 旧写法：interface{} + 类型断言
func MaxOld(a, b interface{}) interface{} {
    switch a := a.(type) {
    case int:
        if a > b.(int) {
            return a
        }
    case float64:
        if a > b.(float64) {
            return a
        }
    }
    return b
}

// 问题：类型不安全、写法繁琐、无法复用
```

使用泛型后：

```go
// 新写法：泛型（类型安全、简洁、可复用）
func Max[T int | float64](a, b T) T {
    if a > b {
        return a
    }
    return b
}
```

### 泛型的核心优势

| 特性 | 说明 |
|------|------|
| **类型安全** | 编译时检查类型，不会因类型错误而 panic |
| **代码复用** | 一份代码适用于多种类型 |
| **性能** | 编译时确定类型，无运行时开销 |
| **可读性** | 明确表达函数的类型约束 |

## 泛型函数

### 基本语法

```go
// 语法：func 函数名[类型参数](参数列表) 返回值
func 函数名[T 约束](参数 T) 返回类型 {
    // 函数体
}
```

### 第一个泛型函数

```go
// 返回切片中的最大值
func Max[T int | float64](s []T) T {
    if len(s) == 0 {
        var zero T
        return zero
    }
    max := s[0]
    for _, v := range s[1:] {
        if v > max {
            max = v
        }
    }
    return max
}

// 调用示例
func main() {
    fmt.Println(Max([]int{1, 5, 3, 9, 2}))       // 9
    fmt.Println(Max([]float64{1.5, 3.2, 2.1}))   // 3.2
}
```

### 类型参数

类型参数用方括号 `[]` 声明：

```go
// T 是类型参数的名字，可以自定义
func Min[T int](a, b T) T {
    if a < b {
        return a
    }
    return b
}
```

### 多类型参数

可以声明多个类型参数：

```go
// 两个类型参数：K 和 V
func GetMapValue[K comparable, V any](m map[K]V, key K) V {
    return m[key]
}

func main() {
    m := map[string]int{"a": 1, "b": 2}
    fmt.Println(GetMapValue(m, "a"))  // 1

    m2 := map[int]string{1: "one", 2: "two"}
    fmt.Println(GetMapValue(m2, 1))  // one
}
```

### 类型推断

调用泛型函数时，Go 会自动推断类型参数：

```go
func Reverse[T any](s []T) []T {
    result := make([]T, len(s))
    for i, v := range s {
        result[len(s)-1-i] = v
    }
    return result
}

func main() {
    // 自动推断 T = int
    nums := Reverse([]int{1, 2, 3})     // [3 2 1]

    // 自动推断 T = string
    strs := Reverse([]string{"a", "b", "c"})  // [c b a]

    // 显式指定类型（当推断不明确时）
    nums2 := Reverse[int]([]int{1, 2, 3})      // 显式指定
}
```

### 实例化

用具体类型替换类型参数的过程叫**实例化**：

```go
// 编译时会生成对应的版本
Reverse[int]     // 生成 int 版本的 Reverse
Reverse[string]  // 生成 string 版本的 Reverse
// Go 编译器会为每种类型生成专门的代码
```

## 类型约束

类型约束用于**限制类型参数的适用范围**。

### `any` 约束

`any` 是最宽松的约束，等价于 `interface{}`，允许任何类型：

```go
func Print[T any](v T) {
    fmt.Println(v)
}

func main() {
    Print(42)         // int
    Print("hello")    // string
    Print(true)       // bool
    Print(3.14)       // float64
}
```

### `comparable` 约束

`comparable` 允许所有可比较的类型（支持 `==` 和 `!=` 的类型）：

```go
func Contains[T comparable](s []T, target T) bool {
    for _, v := range s {
        if v == target {
            return true
        }
    }
    return false
}

func main() {
    fmt.Println(Contains([]int{1, 2, 3}, 2))        // true
    fmt.Println(Contains([]string{"a", "b"}, "c"))  // false
}
```

### 接口约束

可以用接口作为约束，限制必须实现某些方法：

```go
// 定义约束接口
type Stringer interface {
    String() string
}

// 使用接口约束
func PrintString[T Stringer](v T) {
    fmt.Println(v.String())
}

// 自定义类型实现 Stringer
type Person struct {
    Name string
}

func (p Person) String() string {
    return p.Name
}

func main() {
    PrintString(Person{Name: "Alice"})  // Alice
}
```

### 自定义约束

可以在约束中列出允许的类型集合：

```go
// 仅允许 int、int64、float64
type Numeric interface {
    int | int64 | float64
}

func Add[T Numeric](a, b T) T {
    return a + b
}

func main() {
    fmt.Println(Add(1, 2))          // 3 (T = int)
    fmt.Println(Add(1.5, 2.5))      // 4.0 (T = float64)
    fmt.Println(Add(int64(10), 20)) // 30 (T = int64)
}
```

### `~` 波浪号运算符

`~` 表示允许底层类型为指定类型的**所有类型**（包括用户自定义类型）：

```go
type MyInt int    // 自定义类型，底层类型是 int

// 不使用 ~：只允许 int 类型
func ProcessInt[T int](v T) {
    // MyInt 不能作为参数
}

// 使用 ~：允许所有底层类型为 int 的类型
func ProcessAnyInt[T ~int](v T) {
    // int 和 MyInt 都可以作为参数
}

func main() {
    var x int = 10
    var y MyInt = 20

    ProcessInt(x)      // ✅ 可以
    // ProcessInt(y)    // ❌ 不可以

    ProcessAnyInt(x)   // ✅ 可以
    ProcessAnyInt(y)   // ✅ 可以
}
```

### 多个约束的交集

可以使用 `&` 组合多个约束：

```go
type Constraint interface {
    ~int | ~float64
}

// T 必须同时满足 Numeric 和 fmt.Stringer
func Format[T Numeric](v T) string {
    return fmt.Sprintf("%v", v)
}
```

## 泛型类型

### 泛型结构体

```go
// 泛型链表节点
type Node[T any] struct {
    Value T
    Next  *Node[T]
}

// 泛型链表
type LinkedList[T any] struct {
    Head *Node[T]
    Size int
}

func (list *LinkedList[T]) Append(value T) {
    node := &Node[T]{Value: value}
    if list.Head == nil {
        list.Head = node
    } else {
        current := list.Head
        for current.Next != nil {
            current = current.Next
        }
        current.Next = node
    }
    list.Size++
}

func (list *LinkedList[T]) Get(index int) T {
    current := list.Head
    for i := 0; i < index; i++ {
        current = current.Next
    }
    return current.Value
}

// 使用示例
func main() {
    intList := LinkedList[int]{}
    intList.Append(10)
    intList.Append(20)
    intList.Append(30)
    fmt.Println(intList.Get(1))  // 20

    stringList := LinkedList[string]{}
    stringList.Append("hello")
    stringList.Append("world")
    fmt.Println(stringList.Get(0))  // hello
}
```

### 泛型接口

```go
// 泛型可存储接口
type Store[T any] interface {
    Get(key string) T
    Set(key string, value T)
}

// 实现泛型接口
type MemoryStore[T any] struct {
    data map[string]T
}

func NewMemoryStore[T any]() *MemoryStore[T] {
    return &MemoryStore[T]{data: make(map[string]T)}
}

func (s *MemoryStore[T]) Get(key string) T {
    return s.data[key]
}

func (s *MemoryStore[T]) Set(key string, value T) {
    s.data[key] = value
}

// 使用示例
func main() {
    intStore := NewMemoryStore[int]()
    intStore.Set("count", 100)
    fmt.Println(intStore.Get("count"))  // 100

    stringStore := NewMemoryStore[string]()
    stringStore.Set("name", "Alice")
    fmt.Println(stringStore.Get("name"))  // Alice
}
```

### 泛型方法

```go
type Stack[T any] struct {
    items []T
}

func (s *Stack[T]) Push(item T) {
    s.items = append(s.items, item)
}

func (s *Stack[T]) Pop() T {
    if len(s.items) == 0 {
        var zero T
        return zero
    }
    item := s.items[len(s.items)-1]
    s.items = s.items[:len(s.items)-1]
    return item
}

func (s *Stack[T]) Peek() T {
    if len(s.items) == 0 {
        var zero T
        return zero
    }
    return s.items[len(s.items)-1]
}

func (s *Stack[T]) Len() int {
    return len(s.items)
}

// 使用示例
func main() {
    intStack := Stack[int]{}
    intStack.Push(1)
    intStack.Push(2)
    intStack.Push(3)
    fmt.Println(intStack.Pop())   // 3
    fmt.Println(intStack.Peek())  // 2
    fmt.Println(intStack.Len())   // 2
}
```

## 类型集合与底层原理

### 约束的底层表示

在 Go 编译器中，约束的内部表示是**类型集合（type set）**：

| 约束 | 类型集合 |
|------|----------|
| `any` | 所有类型 |
| `comparable` | 所有可比较类型 |
| `int \| string` | int 和 string |
| `~int` | 所有底层类型为 int 的类型 |

### 联合类型

用 `|` 表示类型集合的并集：

```go
// T 只能是 int 或 string
func Print[T int | string](v T) {
    fmt.Println(v)
}
```

### 交集约束

用接口的方法集与类型集合取交集：

```go
type Reader interface {
    Read(p []byte) (n int, err error)
}

// T 必须：实现 Reader 接口，且底层类型为 io.Reader
func Process[T Reader](r T) {
    // ...
}
```

## 常见应用场景

### 泛型集合工具

```go
// Map 函数：对切片每个元素应用函数
func Map[T any, U any](s []T, f func(T) U) []U {
    result := make([]U, len(s))
    for i, v := range s {
        result[i] = f(v)
    }
    return result
}

// Filter 函数：过滤切片
func Filter[T any](s []T, f func(T) bool) []T {
    var result []T
    for _, v := range s {
        if f(v) {
            result = append(result, v)
        }
    }
    return result
}

// Reduce 函数：归约切片
func Reduce[T any, U any](s []T, initial U, f func(U, T) U) U {
    result := initial
    for _, v := range s {
        result = f(result, v)
    }
    return result
}

// 使用示例
func main() {
    nums := []int{1, 2, 3, 4, 5}

    // 转换：每个元素乘 2
    doubled := Map(nums, func(n int) int { return n * 2 })
    fmt.Println(doubled)  // [2 4 6 8 10]

    // 过滤：只保留偶数
    evens := Filter(nums, func(n int) bool { return n%2 == 0 })
    fmt.Println(evens)  // [2 4]

    // 求和
    sum := Reduce(nums, 0, func(acc, n int) int { return acc + n })
    fmt.Println(sum)  // 15
}
```

### 泛型 Pair 类型

```go
// 键值对
type Pair[K any, V any] struct {
    Key   K
    Value V
}

// 分组函数
func GroupBy[T any, K comparable](s []T, keyFunc func(T) K) map[K][]T {
    groups := make(map[K][]T)
    for _, v := range s {
        key := keyFunc(v)
        groups[key] = append(groups[key], v)
    }
    return groups
}

// 使用示例
func main() {
    type User struct {
        Name string
        Age  int
    }

    users := []User{
        {Name: "Alice", Age: 25},
        {Name: "Bob", Age: 30},
        {Name: "Charlie", Age: 25},
    }

    // 按年龄分组
    groups := GroupBy(users, func(u User) int { return u.Age })
    fmt.Println(groups)  // map[25:[{Alice 25} {Charlie 25}] 30:[{Bob 30}]]
}
```

### 泛型优先队列

```go
import "container/heap"

// 泛型堆
type GenericHeap[T any] struct {
    items []T
    less  func(a, b T) bool
}

func NewHeap[T any](less func(a, b T) bool) *GenericHeap[T] {
    h := &GenericHeap[T]{
        less: less,
    }
    heap.Init(h)
    return h
}

func (h *GenericHeap[T]) Len() int           { return len(h.items) }
func (h *GenericHeap[T]) Swap(i, j int)      { h.items[i], h.items[j] = h.items[j], h.items[i] }
func (h *GenericHeap[T]) Less(i, j int) bool { return h.less(h.items[i], h.items[j]) }

func (h *GenericHeap[T]) Push(x interface{}) {
    h.items = append(h.items, x.(T))
}

func (h *GenericHeap[T]) Pop() interface{} {
    old := h.items
    n := len(old)
    item := old[n-1]
    h.items = old[0 : n-1]
    return item
}

// 使用示例
func main() {
    // int 类型最小堆
    intHeap := NewHeap(func(a, b int) bool { return a < b })
    heap.Push(intHeap, 3)
    heap.Push(intHeap, 1)
    heap.Push(intHeap, 4)
    fmt.Println(heap.Pop(intHeap))  // 1
    fmt.Println(heap.Pop(intHeap))  // 3
}
```

## 最佳实践

### 何时使用泛型

✅ **适合使用泛型的场景：**
- 编写与类型无关的工具函数（Map、Filter、Reduce）
- 实现通用的数据结构（Stack、Queue、LinkedList）
- 编写类型安全的容器和集合
- 需要同时支持多种类型的 API

❌ **不适合使用泛型的场景：**
- 只处理单一类型的函数
- 类型需要在运行时动态确定
- 泛型使代码过于复杂
- 团队成员不熟悉泛型

### 泛型 vs 反射 vs interface{}

| 特性 | 泛型 | 反射 | interface{} |
|------|------|------|-------------|
| **类型安全** | ✅ 编译时检查 | ❌ 运行时才发现错误 | ❌ 运行时才发现错误 |
| **性能** | ✅ 无额外开销 | ❌ 开销大 | ⚠️ 有一定开销 |
| **代码简洁** | ✅ 简洁 | ❌ 繁琐 | ⚠️ 中等 |
| **灵活性** | ⚠️ 受约束限制 | ✅ 最灵活 | ✅ 灵活 |
| **适用范围** | 已知类型集合 | 完全未知类型 | 未知类型 |

### 设计建议

1. **从约束最严格的开始**：先使用具体类型，确认需要泛型后再抽象
2. **命名清晰**：类型参数名使用有意义的名称（如 `T`、`K`、`V`）
3. **避免过度泛型**：不要为了泛型而泛型
4. **结合接口**：泛型约束配合接口使用，表达更精确的约束
5. **文档说明**：为泛型函数编写清晰的文档，说明约束和用法

### 性能考量

泛型在编译时会被**实例化**为具体类型的代码，因此：

- ✅ **运行时性能与具体类型代码相同**
- ✅ **不会有反射那样的运行时开销**
- ⚠️ **编译时会生成多个版本的代码**，可能增加二进制文件大小

```go
// 编译后会生成两个版本
Reverse[int]     // 生成 int 版本
Reverse[string]  // 生成 string 版本
// 二进制文件中会有两份代码
```

## 注意事项

### 类型推断的局限性

```go
func Foo[T any](a T, b T) T {
    return a
}

func main() {
    // 当参数类型不一致时，推断会失败
    // Foo(1, "hello")  // ❌ 编译错误

    // 需要显式指定类型
    // Foo[interface{}](1, "hello")  // 不推荐
}
```

### 方法集限制

类型参数的方法集取决于约束：

```go
type Stringer interface {
    String() string
}

// T 必须有 String() 方法
func Print[T Stringer](v T) {
    fmt.Println(v.String())  // ✅ 可以调用 String()
}

// 但不能调用其他方法
// func Reset[T Stringer](v T) {
//     v.Reset()  // ❌ 编译错误
// }
```

### 泛型与方法

泛型类型的方法不能是泛型的（在 Go 1.18 中）：

```go
// 允许：结构体是泛型的，方法不是泛型的
type Box[T any] struct {
    value T
}

func (b Box[T]) Get() T {  // ✅ 方法不是泛型的
    return b.value
}

// 不允许：方法本身有类型参数
// func (b Box[T]) Transform[U any](f func(T) U) Box[U] {  // ❌
// }
```

### 比较与可比较性

```go
// 使用 comparable 约束才能使用 ==
func Find[T comparable](s []T, target T) int {
    for i, v := range s {
        if v == target {  // ✅ 只有 comparable 才能用 ==
            return i
        }
    }
    return -1
}

// 使用 any 约束时，不能用 ==
func BadFind[T any](s []T, target T) int {
    for i, v := range s {
        // if v == target {  // ❌ 编译错误
    }
    return -1
}
```

## 版本兼容性

### Go 1.18（2022年3月）

- ✅ 引入泛型特性
- ✅ 支持类型参数和类型约束
- ✅ 支持 `any` 和 `comparable` 约束

### Go 1.21（2023年8月）

- ✅ 引入 `min` 和 `max` 内置函数
- ✅ 支持 `clear` 内置函数
- ✅ 约束中支持 `|` 和 `&` 组合

### Go 1.22（2024年2月）

- ✅ 改进类型推断
- ✅ 支持更多约束组合

## 总结

泛型是 Go 语言的重要补充，带来了更强的表达能力和类型安全：

- **核心价值**：在保持类型安全的前提下，编写可复用的通用代码
- **与反射的区别**：泛型在编译时确定类型，反射在运行时确定
- **适用场景**：通用工具函数、数据结构、类型安全的容器
- **注意事项**：避免过度泛型，结合约束表达精确的类型需求

**记忆口诀**：泛型让 Go 拥有了"模板能力"，一次编写，多类型复用，编译时安全，运行时高效。