---
title: 结构体
order: 6
---

# 结构体

## 定义结构体

```go
// 定义结构体
type 类型名 struct {
    字段名 字段类型
    字段名 字段类型
}

type Person struct {
    Name string
    Age int
    City string
}
```

- 类型名：表示自定义结构体的名称，在同一个包内不能重复。类型名首字母大写，表示是公有类型，其他包可以访问。首字母小写，表示是私有类型，只能在当前包内访问。
- 字段名：表示结构体的字段名称，结构体中的字段名必须是唯一的。字段名首字母大写，表示是公有字段，其他包可以访问。首字母小写，表示是私有字段，只能在当前包内访问。
- 字段类型：表示结构体的字段类型，用于指定字段的数据类型。

## 创建结构体实例

```go
// 方式1：先实例化再赋值
var p Person // p的类型是main.Person

// 或者使用new关键字实例化
var p = new(Person) // p的类型是*main.Person
// golang支持对结构体指针直接使用`.`来访问结构体成员
// p.Name 底层是 (*p).Name
p.Name = "张三"
p.Age = 25
p.City = "北京"

// 方式2：按字段顺序初始化
p1 := Person{"张三", 25, "北京"}

// 方式3：使用字段名初始化（推荐，更清晰）
p2 := Person{Name: "李四", Age: 30, City: "上海"}

// 方式4：部分字段初始化，未指定字段为零值
p3 := Person{Name: "王五"}  // Age=0, City=""

// 方式5：创建结构体指针
p4 := &Person{Name: "赵六", Age: 28}
fmt.Println(p4.Name)  // 自动解引用，输出：赵六
```

## 结构体的匿名

### 匿名结构体

临时使用的结构体，无需定义类型名。

```go
user := struct {
    ID   int
    Name string
}{
    ID:   1,
    Name: "测试用户",
}

fmt.Println(user.Name)  // 输出：测试用户
```

### 结构体的匿名字段

匿名字段是指在结构体中没有指定字段名的字段，直接使用字段类型来定义。

匿名字段默认采用类型名作为字段名，结构体要求字段名必须唯一，因此一个结构体中同种类型的匿名字段只能有一个。

匿名字段在嵌套结构体中经常使用

```go
type Person struct {
    string
    int
}

p := Person{"张三", 25}
fmt.Println(p.string)  // 输出：张三
fmt.Println(p.int)   // 输出：25
```

## 结构体嵌套

```go
type Address struct {
    Street string
    City   string
}

type Person struct {
    Name    string
    Age     int
    Hobby   []string
    Address Address  // 嵌套结构体
}

/**
type Person struct {
    Name    string
    Age     int
    Hobby   []string
    Address          // 嵌套匿名结构体
}
*/

p := Person{
    Name: "张三",
    Age:  25,
    Hobby: []string{"篮球", "足球"},
    Address: Address{
        Street: "朝阳区",
        City:   "北京",
    },
}

// 访问嵌套字段
fmt.Println(p.Address.City)  // 输出：北京

// 简写，访问结构体字段时，会优先在当前结构体中查找，找不到再去嵌套匿名结构体中查找
fmt.Println(p.City)  // 输出：北京
```

### 结构体的继承

结构体的继承是指一个结构体可以继承另一个结构体的字段和方法。

```go
type Animal struct {
    Name string
}

func (a Animal) Speak() {
    fmt.Println(a.Name + " is speaking")
}

type Dog struct {
    Animal // 结构体嵌套，继承Animal的字段和方法
    Sex string
}

var d = Dog{
    Animal: Animal{Name: "旺财"},
    Sex:    "男",
}
fmt.Println(d.Speak())  // 访问父结构体的方法，输出：旺财 is speaking
```

- 子结构体可以访问父结构体的字段和方法。
- 子结构体可以重写父结构体的方法。
- 子结构体可以添加新的字段和方法。

## 结构体方法

### 值接收者方法

```go
type Rectangle struct {
    Width  float64
    Height float64
}

// 值接收者：方法内部操作的是副本，不影响原对象
func (r Rectangle) Area() float64 {
    return r.Width * r.Height
}

rect := Rectangle{Width: 10, Height: 5}
fmt.Println(rect.Area())  // 输出：50
```

### 指针接收者方法

```go
// 指针接收者：方法内部操作的是原对象，可以修改其值
func (r *Rectangle) Scale(factor float64) {
    r.Width = r.Width * factor
    r.Height *= factor
}

rect.Scale(2)
fmt.Println(rect.Width)   // 输出：20
fmt.Println(rect.Height)  // 输出：10
```

### 值接收者 vs 指针接收者

| 特性           | 值接收者               | 指针接收者           |
| -------------- | ---------------------- | -------------------- |
| 是否修改原对象 | 否                     | 是                   |
| 内存开销       | 拷贝整个结构体         | 仅拷贝指针（8字节）  |
| 适用场景       | 小型结构体、不需要修改 | 需要修改、大型结构体 |

**选择值接收者还是指针接收者？**

| 场景                           | 建议                     |
| ------------------------------ | ------------------------ |
| 需要修改接收者的状态           | 指针接收者               |
| 结构体较大（避免拷贝开销）     | 指针接收者               |
| 小型结构体（如 Point）         | 值接收者                 |
| 方法不修改接收者               | 值或指针均可，保持一致性 |
| 包含 sync.Mutex 等不可拷贝字段 | 指针接收者               |

## 结构体比较

```go
type Point struct {
    X, Y int
}

p1 := Point{1, 2}
p2 := Point{1, 2}
p3 := Point{2, 3}

// 结构体可以直接比较（所有字段都是可比较类型时）
fmt.Println(p1 == p2)  // 输出：true
fmt.Println(p1 == p3)  // 输出：false
```
