---
title: 反射
order: 8
---

# 反射

## 基本概念

**反射（Reflection）** 是指程序在运行时能够访问、检查和修改其自身结构的能力。在 Go 语言中，反射通过 `reflect` 包实现。

### 为什么需要反射

反射主要用于以下场景：

1. **序列化/反序列化**：如 JSON、XML 等格式的转换
2. **ORM 框架**：自动映射数据库表和结构体
3. **配置解析**：根据结构体标签加载配置
4. **测试框架**：动态创建测试用例
5. **通用工具函数**：处理未知类型的数据

### 与接口的关系

反射和接口关系非常紧密。在 Go 中，接口的底层实现是一个 `(type, value)` 对：

```
interface 变量
├── type: 存储具体类型信息
└── value: 存储具体值
```

反射就是操作这对值——通过 `reflect.TypeOf()` 获取 type，通过 `reflect.ValueOf()` 获取 value。

## reflect 包

`reflect` 包提供了两个核心函数：

```go
import "reflect"

var x int = 42

// 获取类型信息
t := reflect.TypeOf(x)
fmt.Println(t)  // int

// 获取值信息
v := reflect.ValueOf(x)
fmt.Println(v)  // 42
```

### Type 和 Value 的区别

| 特性     | Type                             | Value                           |
| -------- | -------------------------------- | ------------------------------- |
| **用途** | 获取类型信息                     | 获取值信息                      |
| **包含** | 类型名称、方法、字段等           | 实际值、可以修改值              |
| **方法** | `Name()`, `Kind()`, `NumField()` | `Int()`, `SetInt()`, `String()` |

### Kind 类型

`Kind()` 方法返回类型的底层分类：

```go
var x int = 42
t := reflect.TypeOf(x)
fmt.Println(t)  // int
fmt.Println(t.Name())  // int
fmt.Println(t.Kind())  // int

type MyInt int
var y MyInt = 100
t2 := reflect.TypeOf(y)
fmt.Println(t2)  // main.MyInt
fmt.Println(t2.Name())  // MyInt
fmt.Println(t2.Kind())  // int  (底层类型是 int)
```

常见的 Kind 类型：

| Kind                | 描述   |
| ------------------- | ------ |
| `reflect.Int`       | 整数   |
| `reflect.String`    | 字符串 |
| `reflect.Bool`      | 布尔值 |
| `reflect.Slice`     | 切片   |
| `reflect.Map`       | 映射   |
| `reflect.Struct`    | 结构体 |
| `reflect.Ptr`       | 指针   |
| `reflect.Interface` | 接口   |

## 反射三定律

Go 官方总结了反射的三个核心定律：

### 第一定律：从 interface 值可以反射出反射对象

reflect.ValueOf(x) 的过程：
1. x 被自动装箱到 interface{} 中
2. interface{} 内部存储了 (type, value) 对
3. reflect.ValueOf() 从这个 interface 中提取信息，创建反射对象

```go
var x int = 42
v := reflect.ValueOf(x)  // 从 interface 值获取反射对象
fmt.Println(v.Int())     // 42
```

### 第二定律：从反射对象可以还原出 interface 值

```go
var x int = 42
v := reflect.ValueOf(x)

// 将反射对象还原为 interface 值
i := v.Interface()

// 类型断言
y, ok := i.(int)
if ok {
    fmt.Println(y)  // 42
}
```

### 第三定律：要修改反射对象，其值必须可设置（settable）

```go
var x int = 42
v := reflect.ValueOf(x)

// v.SetInt(100)  // ❌ 错误！v 不是可设置的

// 必须传递指针
v2 := reflect.ValueOf(&x)
v2.Elem().SetInt(100)  // ✅ 通过 Elem() 获取指针指向的值
fmt.Println(x)         // 100
```

**可设置性规则**：只有通过指针获取的反射对象才是可设置的。

## 动态操作

### 获取和设置值

```go
// 获取值
var x int = 42
v := reflect.ValueOf(x)
fmt.Println(v.Int())        // 42

var s string = "hello"
v2 := reflect.ValueOf(s)
fmt.Println(v2.String())    // hello

// 设置值（必须通过指针）
var y int = 10
v3 := reflect.ValueOf(&y)
v3.Elem().SetInt(20)
fmt.Println(y)  // 20
```

### 访问结构体字段

```go
type Person struct {
    Name string
    Age  int
}

p := Person{Name: "Alice", Age: 30}
t := reflect.TypeOf(p) // 返回的t是main.Person
v := reflect.ValueOf(p) // 返回的v是{Alice 30}

// 获取字段数量
fmt.Println(v.NumField())  // 2

// 获取字段名称和值
for i := 0; i < v.NumField(); i++ {
    fieldName := v.Type().Field(i).Name
    fieldValue := v.Field(i).Interface() // Interface() 的作用是将反射对象转换为 interface{} 类型，方便后续类型断言
    fieldType := t.Field(i).Type // 获取字段类型信息
    
    fmt.Printf("%s: %v, %s\n", fieldName, fieldValue, fieldType.Name()) // Name: Alice, string, Age: 30, int
}
```

### 设置结构体字段

```go
type Person struct {
    Name string
    Age  int
}

p := Person{Name: "Alice", Age: 30}
v := reflect.ValueOf(&p).Elem()  // 通过指针获取

// 设置字段值
v.FieldByName("Name").SetString("Bob")
v.FieldByName("Age").SetInt(25)

fmt.Println(p)  // {Bob 25}
```

### 动态调用方法

```go
type Calculator struct{}

func (c *Calculator) Multiply(a, b int) int {
    return a * b
}
func (c *Calculator) Add(a, b int) int {
    return a + b
}

func main() {
    c := &Calculator{}
    v := reflect.ValueOf(c)

    // 获取方法
    methodNum := v.Type().NumMethod()  // 获取方法数量，这里是2
    method1 := v.Method(0) // 获取第一个方法，这里是Add（跟结构体方法名称的ASCII码顺序有关）

    method, ok := v.MethodByName("Add")
    if !ok {
        fmt.Println("方法不存在")
        return
    }
    fmt.Println(method.Type())  // func(*Calculator) int
    fmt.Println(method.Name())  // Add
    fmt.Println(method.NumIn())  // 获取方法的输入参数数量，这里是2

    // 准备参数，args是reflect.Value类型的切片，每个元素对应一个反射对象的参数
    args := []reflect.Value{
        reflect.ValueOf(10), // 把10转换为reflect.Value类型
        reflect.ValueOf(20), // 把20转换为reflect.Value类型
    }

    // 调用方法
    result := method.Call(args)
    fmt.Println(result[0].Int())  // 30
}
```

## 结构体标签

结构体标签是反射最常用的场景之一，用于为字段添加元数据。

### 基本语法

```go
type Person struct {
    Name string `json:"name" xml:"name"`
    Age  int    `json:"age" xml:"age"`
}
```

### 解析结构体标签

```go
type Person struct {
    Name string `json:"name" validate:"required"`
    Age  int    `json:"age" validate:"min=18"`
}

func main() {
    t := reflect.TypeOf(Person{})

    for i := 0; i < t.NumField(); i++ {
        field := t.Field(i)
        tag := field.Tag

        // 获取标签值
        jsonTag := tag.Get("json")
        validateTag := tag.Get("validate")

        fmt.Printf("字段 %s: json=%s, validate=%s\n",
            field.Name, jsonTag, validateTag)
    }
}
```

### 自定义标签解析

```go
type Person struct {
    Name string `json:"name" mytag:"required,max=100"`
}

func parseMyTag(tag string) (required bool, max int) {
    parts := strings.Split(tag, ",")
    for _, part := range parts {
        kv := strings.Split(part, "=")
        if len(kv) == 2 {
            switch kv[0] {
            case "required":
                required = true
            case "max":
                max, _ = strconv.Atoi(kv[1])
            }
        }
    }
    return
}
```

## 实际应用示例

### JSON 序列化简化版

```go
func toJSON(v interface{}) string {
    val := reflect.ValueOf(v)
    if val.Kind() != reflect.Struct {
        return ""
    }

    var result strings.Builder
    result.WriteString("{")

    for i := 0; i < val.NumField(); i++ {
        fieldType := val.Type().Field(i)
        fieldValue := val.Field(i)

        jsonTag := fieldType.Tag.Get("json")
        if jsonTag == "" {
            jsonTag = fieldType.Name
        }

        result.WriteString(fmt.Sprintf("\"%s\":", jsonTag))

        switch fieldValue.Kind() {
        case reflect.String:
            result.WriteString(fmt.Sprintf("\"%s\"", fieldValue.String()))
        case reflect.Int:
            result.WriteString(fmt.Sprintf("%d", fieldValue.Int()))
        }

        if i < val.NumField()-1 {
            result.WriteString(",")
        }
    }

    result.WriteString("}")
    return result.String()
}

type Person struct {
    Name string `json:"name"`
    Age  int    `json:"age"`
}

func main() {
    p := Person{Name: "Alice", Age: 30}
    fmt.Println(toJSON(p))  // {"name":"Alice","age":30}
}
```

### 通用值比较

```go
func compare(a, b interface{}) bool {
    va := reflect.ValueOf(a)
    vb := reflect.ValueOf(b)

    if va.Type() != vb.Type() {
        return false
    }

    switch va.Kind() {
    case reflect.Int, reflect.Int64:
        return va.Int() == vb.Int()
    case reflect.String:
        return va.String() == vb.String()
    case reflect.Struct:
        for i := 0; i < va.NumField(); i++ {
            if !compare(va.Field(i).Interface(), vb.Field(i).Interface()) {
                return false
            }
        }
        return true
    default:
        return false
    }
}
```

## 性能与最佳实践

### 性能开销

反射的性能开销较大，主要原因：

1. **类型检查**：运行时需要进行类型判断
2. **内存分配**：创建反射对象需要分配内存
3. **间接调用**：动态调用方法比直接调用慢

### 使用建议

1. **优先使用编译时类型检查**：能在编译时确定类型的场景，不要使用反射
2. **缓存反射结果**：如果需要多次操作同一类型，缓存 Type 和 Value
3. **避免热路径使用反射**：性能敏感的代码路径应避免使用反射
4. **使用代码生成**：可以用 `go generate` 生成代码代替反射
5. **测试覆盖**：反射代码容易出错，需要充分测试

### 性能对比示例

```go
// 直接调用（快）
func addDirect(a, b int) int {
    return a + b
}

// 反射调用（慢）
func addReflect(a, b int) int {
    var c Calculator
    v := reflect.ValueOf(&c)
    method := v.MethodByName("Add")
    args := []reflect.Value{reflect.ValueOf(a), reflect.ValueOf(b)}
    result := method.Call(args)
    return int(result[0].Int())
}
```

## 注意事项

1. **反射会破坏类型安全**：编译时无法检查反射操作的正确性
2. **可设置性问题**：只有通过指针获取的反射对象才是可设置的
3. **Nil 接口问题**：`reflect.TypeOf(nil)` 返回 nil
4. **循环引用问题**：处理结构体时要注意循环引用
5. **导出字段问题**：反射只能访问导出的字段（首字母大写）

## 总结

反射是一把双刃剑：

- **优点**：提供了强大的运行时能力，使通用框架成为可能
- **缺点**：性能开销大、破坏类型安全、代码可读性差

**使用原则**：

- 在通用框架和工具函数中可以使用反射
- 在业务逻辑代码中应尽量避免使用反射
- 如果必须使用，要做好性能优化和测试
