---
title: 接口
order: 6
---

# 接口

## 基本概念

接口（interface）是 Go 语言中一种抽象类型，它定义了一组方法签名（method signature），但不包含实现。接口用于描述对象的行为，而不关心对象的具体类型。

**核心特点：**

1. **接口是一种契约**：定义了方法签名，任何实现了这些方法的类型都可以被视为该接口类型
2. **隐式实现**：Go 不需要显式声明实现了某个接口，只要类型实现了接口的所有方法，就自动实现了该接口
3. **多态**：同一个接口可以指向不同类型的对象，调用相同的方法会执行不同的实现

## 接口定义

### 基本语法

```go
type 接口名 interface {
    方法1(参数列表) 返回值列表
    方法2(参数列表) 返回值列表
    // ...
}
```

```go
// 定义一个 Reader 接口
type Reader interface {
    Read(p []byte) (n int, err error)
}

// 定义一个 Writer 接口
type Writer interface {
    Write(p []byte) (n int, err error)
}

// 定义一个 Closer 接口
type Closer interface {
    Close() error
}
```

## 接口实现

### 隐式实现

Go 的接口实现是隐式的，不需要使用 `implements` 关键字。只要一个类型实现了接口的所有方法，就自动实现了该接口。

```go
type Stringer interface {
    String() string
}

type Person struct {
    Name string
    Age  int
}

// 实现 Stringer 接口
func (p Person) String() string {
    return fmt.Sprintf("%s (%d)", p.Name, p.Age)
}

func main() {
    p := Person{Name: "张三", Age: 25}
    var s Stringer = p  // 隐式转换，Person 实现了 Stringer 接口
    fmt.Println(s.String())  // 输出：张三 (25)
}
```

### 值接收者 vs 指针接收者

```go
type Mover interface {
    Move()
}

type Point struct {
    X, Y int
}

// 值接收者实现，不会修改原始值
func (p Point) Move() {
    p.X++
    p.Y++
}

// 指针接收者实现，会修改原始值
func (p *Point) Move() {
    p.X++
    p.Y++
}
```

**区别：**

| 接收者类型 | 实现者类型 | 说明 |
|-----------|-----------|------|
| 值接收者 | 值类型和指针类型 | 不会修改原始值 |
| 指针接收者 | 只有指针类型 | 会修改原始值 |

```go
// 值接收者实现
func (p Point) Move() {
    fmt.Println("值接收者 Move")
}

func main() {
    p := Point{X: 1, Y: 2}
    var m Mover

    m = p    // 值类型实现接口（OK）
    m = &p   // 指针类型也可以（自动解引用）

    m.Move()  // 输出：值接收者 Move
}
```

```go
// 指针接收者实现
func (p *Point) Move() {
    fmt.Println("指针接收者 Move")
}

func main() {
    p := Point{X: 1, Y: 2}
    var m Mover

    // m = p    // 编译错误！值类型没有实现接口
    m = &p   // 只有指针类型可以

    m.Move()  // 输出：指针接收者 Move
}
```

### 一个结构体实现多个接口

```go
type Animaler1 interface {
    getName() string
}

type Animaler2 interface {
    setName(name string)
}

type Dog struct {
    Name string
}

func (d Dog) getName() string {
    return d.Name
}

func (d *Dog) setName(name string) {
    d.Name = name
}

func main() {
    d := Dog{Name: "旺财"}
    var a1 Animaler1
    var a2 Animaler2

    a1 = d  // 隐式转换，Dog 实现了 Animaler1 接口
    a2 = d  // 隐式转换，Dog 实现了 Animaler2 接口

    fmt.Println(a1.getName())  // 输出：旺财
    a2.setName("咪咪")
    fmt.Println(a1.getName())  // 输出：咪咪
}
```

## 空接口

### 基本概念

空接口（`interface{}`）不包含任何方法，因此所有类型都实现了空接口。空接口可以存储任意类型的值，类似ts中的`any`类型。

在Go1.18版本后，`interface{}`可以用`any`类型代替。原理：`type any = interface{}`

```go
// 定义空接口
type Any interface{}
var anything Any

// 存储任意类型
anything = 42 // 让 int 实现 Any 接口
anything = "hello" // 让 string 实现 Any 接口
anything = true // 让 bool 实现 Any 接口
anything = []int{1, 2, 3} // 让 []int 实现 Any 接口
anything = map[string]int{"a": 1} // 让 map[string]int 实现 Any 接口

// 结构体也可以
type Person struct {
    Name string
    Age  int
}
anything = Person{Name: "张三", Age: 25} // 让 Person 实现 Any 接口
```

### 类型断言

从空接口中获取具体类型的值需要使用类型断言（type assertion）。

格式：
```go
x.(T)
```
- x 是空接口变量
- T 是期望的类型
- 返回值的第一个参数是 T 类型的值（如果类型匹配）或 nil（如果类型不匹配）
- 返回值的第二个参数是一个布尔值，用于判断类型是否匹配（true 表示匹配，false 表示不匹配）


```go
var i interface{} = 42

// 基本类型断言
value, ok := i.(int)
if ok {
    fmt.Println("是整数:", value)
} else {
    fmt.Println("不是整数")
}

// 类型断言（不检查）
value := i.(int)  // 如果类型不匹配会 panic
```

### 类型选择

```go
func describe(i interface{}) {
    switch v := i.(type) {
    case int:
        fmt.Printf("整数: %d\n", v)
    case string:
        fmt.Printf("字符串: %s\n", v)
    case bool:
        fmt.Printf("布尔值: %t\n", v)
    case []int:
        fmt.Printf("整数切片: %v\n", v)
    default:
        fmt.Printf("未知类型: %T\n", v)
    }
}

describe(42)        // 输出：整数: 42
describe("hello")   // 输出：字符串: hello
describe(true)      // 输出：布尔值: true
describe([]int{1, 2, 3})  // 输出：整数切片: [1 2 3]
```

## 接口嵌套

接口可以嵌套其他接口，形成接口组合。

```go
type Animal interface {
    Eat()
    Sleep()
}

type Flyer interface {
    Fly()
}

// 嵌套接口
type Bird interface {
    Animal
    Flyer
}

type Sparrow struct{}

func (s Sparrow) Eat() {
    fmt.Println("麻雀吃种子")
}

func (s Sparrow) Sleep() {
    fmt.Println("麻雀睡觉")
}

func (s Sparrow) Fly() {
    fmt.Println("麻雀飞")
}

func main() {
    var b Bird = Sparrow{}
    b.Eat()   // 输出：麻雀吃种子
    b.Sleep() // 输出：麻雀睡觉
    b.Fly()   // 输出：麻雀飞
}
```
---
## 以下由AI生成---
---

## 接口的底层结构

### 运行时表示

接口在运行时包含两个指针：

```
┌─────────────────────────────────┐
│         interface{}             │
├─────────────────────────────────┤
│  type pointer  ──────► 类型信息 │
│  data pointer  ──────► 实际数据 │
└─────────────────────────────────┘
```

### 值类型 vs 指针类型

**值类型存储：**

```
┌────────────────────────────────────────────────────┐
│         interface{}                                │
├────────────────────────────────────────────────────┤
│  type pointer  ──────► Point 类型信息              │
│  data pointer  ──────► 拷贝的 Point 值 {X:1, Y:2}  │
└────────────────────────────────────────────────────┘
```

**指针类型存储：**

```
┌────────────────────────────────────────────────────┐
│         interface{}                                │
├────────────────────────────────────────────────────┤
│  type pointer  ──────► *Point 类型信息             │
│  data pointer  ──────► &Point{X:1, Y:2} 指针       │
└────────────────────────────────────────────────────┘
```

### nil 接口

```go
// nil 接口：类型和数据都是 nil
var i interface{}
fmt.Println(i == nil)  // 输出：true

// 非 nil 接口：类型不为 nil，数据为 nil
var p *int
var j interface{} = p
fmt.Println(j == nil)  // 输出：false（因为类型是 *int）
```

## 接口的常见用法

### 1. 定义行为契约

```go
type Logger interface {
    Log(message string)
    Error(message string)
    Info(message string)
}

type ConsoleLogger struct{}

func (l ConsoleLogger) Log(message string) {
    fmt.Println("LOG:", message)
}

func (l ConsoleLogger) Error(message string) {
    fmt.Println("ERROR:", message)
}

func (l ConsoleLogger) Info(message string) {
    fmt.Println("INFO:", message)
}

func process(logger Logger) {
    logger.Info("开始处理")
    logger.Log("处理中...")
    logger.Error("处理完成")
}
```

### 2. 实现多态

```go
type Shape interface {
    Area() float64
    Perimeter() float64
}

type Rectangle struct {
    Width  float64
    Height float64
}

func (r Rectangle) Area() float64 {
    return r.Width * r.Height
}

func (r Rectangle) Perimeter() float64 {
    return 2 * (r.Width + r.Height)
}

type Circle struct {
    Radius float64
}

func (c Circle) Area() float64 {
    return math.Pi * c.Radius * c.Radius
}

func (c Circle) Perimeter() float64 {
    return 2 * math.Pi * c.Radius
}

func printShapeInfo(s Shape) {
    fmt.Printf("面积: %.2f\n", s.Area())
    fmt.Printf("周长: %.2f\n", s.Perimeter())
}

func main() {
    shapes := []Shape{
        Rectangle{Width: 10, Height: 5},
        Circle{Radius: 3},
    }

    for _, shape := range shapes {
        printShapeInfo(shape)
        fmt.Println()
    }
}
```

### 3. 函数参数类型约束

```go
type Stringer interface {
    String() string
}

func printString(s Stringer) {
    fmt.Println(s.String())
}

type Person struct {
    Name string
    Age  int
}

func (p Person) String() string {
    return fmt.Sprintf("%s (%d)", p.Name, p.Age)
}

func main() {
    p := Person{Name: "张三", Age: 25}
    printString(p)  // 输出：张三 (25)
}
```

### 4. 返回值类型抽象

```go
type Database interface {
    Query(sql string) ([]map[string]interface{}, error)
    Exec(sql string) (int64, error)
}

type MySQL struct{}

func (m MySQL) Query(sql string) ([]map[string]interface{}, error) {
    // MySQL 查询逻辑
    return nil, nil
}

func (m MySQL) Exec(sql string) (int64, error) {
    // MySQL 执行逻辑
    return 0, nil
}

type PostgreSQL struct{}

func (p PostgreSQL) Query(sql string) ([]map[string]interface{}, error) {
    // PostgreSQL 查询逻辑
    return nil, nil
}

func (p PostgreSQL) Exec(sql string) (int64, error) {
    // PostgreSQL 执行逻辑
    return 0, nil
}

func NewDatabase(dbType string) Database {
    switch dbType {
    case "mysql":
        return MySQL{}
    case "postgresql":
        return PostgreSQL{}
    default:
        return nil
    }
}
```

## 接口与类型转换

### 接口类型转换

```go
type Reader interface {
    Read(p []byte) (n int, err error)
}

type Writer interface {
    Write(p []byte) (n int, err error)
}

type ReadWriter interface {
    Reader
    Writer
}

func main() {
    var rw ReadWriter = ...

    // 向上转换（安全，自动）
    var r Reader = rw
    var w Writer = rw

    // 向下转换（需要类型断言）
    var rw2 ReadWriter = r.(ReadWriter)  // 如果 r 没有实现 Writer，会 panic
}
```

### 类型断言的安全写法

```go
var i interface{} = "hello"

// 安全的类型断言
if str, ok := i.(string); ok {
    fmt.Println("是字符串:", str)
} else {
    fmt.Println("不是字符串")
}

// 不安全的类型断言（可能 panic）
str := i.(string)
```

## 接口的最佳实践

### 1. 接口要小而精

```go
// ✅ 推荐：小接口
type Reader interface {
    Read(p []byte) (n int, err error)
}

type Writer interface {
    Write(p []byte) (n int, err error)
}

// ❌ 不推荐：大接口
type DataProcessor interface {
    Read(p []byte) (n int, err error)
    Write(p []byte) (n int, err error)
    Close() error
    Flush() error
    Seek(offset int64, whence int) (int64, error)
    Stat() (os.FileInfo, error)
}
```

### 2. 依赖抽象而非具体

```go
// ✅ 推荐：依赖接口
func processData(reader Reader) error {
    // 使用接口方法
}

// ❌ 不推荐：依赖具体类型
func processData(file *os.File) error {
    // 绑定到具体实现
}
```

### 3. 避免空接口滥用

```go
// ❌ 不推荐：过度使用空接口
func process(data interface{}) {
    // 需要大量类型断言
}

// ✅ 推荐：使用具体接口
func process(data Stringer) {
    fmt.Println(data.String())
}
```

### 4. 接口命名规范

```go
// ✅ 推荐：以 -er 结尾
type Reader interface{}
type Writer interface{}
type Closer interface{}
type Stringer interface{}

// ❌ 不推荐：冗长的命名
type DataReaderInterface interface{}
type FileWriterInterface interface{}
```

## 接口与继承的对比

### Go 的接口 vs 传统继承

| 特性 | 传统继承 | Go 接口 |
|-----|---------|---------|
| 实现方式 | 显式继承 | 隐式实现 |
| 关系 | is-a | has-a（行为） |
| 耦合度 | 高 | 低 |
| 灵活性 | 低 | 高 |
| 多重继承 | 受限 | 支持 |

### 示例对比

**传统继承：**

```java
// Java 示例
class Animal {
    public void eat() {}
}

class Dog extends Animal {
    public void bark() {}
}

Dog dog = new Dog();
dog.eat();   // 继承自 Animal
dog.bark();  // 自己的方法
```

**Go 接口：**

```go
// Go 示例
type Eater interface {
    Eat()
}

type Barker interface {
    Bark()
}

type Dog struct{}

func (d Dog) Eat() {
    fmt.Println("狗吃东西")
}

func (d Dog) Bark() {
    fmt.Println("狗叫")
}

var eater Eater = Dog{}
var barker Barker = Dog{}

eater.Eat()   // 调用 Eater 接口方法
barker.Bark() // 调用 Barker 接口方法
```

## 总结

### 核心要点

1. **接口定义行为**：不关心实现细节，只关心能做什么
2. **隐式实现**：无需声明，实现方法即实现接口
3. **多态支持**：同一接口可以指向不同类型的对象
4. **空接口万能**：可以存储任意类型的值
5. **接口嵌套**：可以组合多个接口形成新接口

### 应用场景

- 定义行为契约，实现解耦
- 实现多态，统一处理不同类型
- 函数参数和返回值的类型约束
- 依赖注入和测试中的 mock

### 注意事项

- 接口要小而精，遵循单一职责
- 避免空接口的滥用
- 注意值接收者和指针接收者的区别
- nil 接口和存储 nil 的接口是不同的
