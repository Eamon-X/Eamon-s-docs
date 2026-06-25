---
title: 数据类型
order: 2
---

# 数据类型

数据类型分为基本数据类型和复合数据类型。

## 基本数据类型

基本数据类型包括：

- 整数类型：int8, int16, int32, int64, uint8, uint16, uint32, uint64
- 浮点数类型：float32, float64
- 复数类型：complex64, complex128
- 字符串类型：string
- 布尔类型：bool
- 字节类型：byte（uint8 的别名）
- 字符类型：rune（int32 的别名，表示 Unicode 码点）

### 数值类型

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

### 字符串和布尔类型

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

### byte 和 rune 类型

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

### 类型转换

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

## 复合数据类型

复合数据类型包括：
- 数组：[n]T，数组是跟基本数据类型一样属于值类型而非引用类型
- 切片：[]T
- 映射：map[K]V
- 结构体：结构体是值类型而非引用类型
- 函数
- 通道
- 接口

### 数组

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

### 切片（Slice）

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

### Map（映射）

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

// 把map值按照key排序并输出
// 1. 先将map的key转换为切片
// 2. 对切片排序
// 3. 遍历排序后的切片，输出对应的value
sortedKeys := make([]string, 0, len(ages))
for key := range ages {
    sortedKeys = append(sortedKeys, key)
}
sort.Strings(sortedKeys)
for _, key := range sortedKeys {
    fmt.Printf("%s: %d岁\n", key, ages[key])
}
```

### 结构体（struct）

#### 定义结构体

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

#### 创建结构体实例

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

#### 结构体的匿名

##### 匿名结构体

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

##### 结构体的匿名字段

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

#### 结构体嵌套

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

#### 结构体的继承

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

#### 结构体方法

##### 值接收者方法

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

##### 指针接收者方法

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

##### 值接收者 vs 指针接收者

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

#### 结构体比较

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

#### 结构体与JSON之间的转换

- 私有属性不能被json包访问

```go
type Person struct {
    Name string `json:"name"` // 字段名与JSON键名不同，使用结构体标签指定
    Age  int // 字段名与JSON键名相同，可以省略标签
}

p := Person{
    Name: "张三",
    Age:  25,
}

// 结构体转换为JSON字符串
jsonData1, err := json.Marshal(p)
jsonString1 := string(jsonData1)
fmt.Println(jsonString1)  // 输出：{"name":"张三","Age":25}

jsonData, err := json.MarshalIndent(p, "", "  ") // 格式化的多行字符串
// prefix : 每行开头添加的前缀（示例中为空字符串 "" ）
// indent : 缩进使用的字符串（示例中为两个空格 "  " ）
jsonString2 := string(jsonData)
fmt.Println(jsonString2)
// 输出:
// {
//   "name": "张三",
//   "Age": 25
// }


// JSON字符串转换为结构体
var p2 Person
err1 := json.Unmarshal(jsonData1, &p2)
err2 := json.Unmarshal([]byte(jsonString1), &p2)
fmt.Println(p2.Name)  // 输出：张三
fmt.Println(p2.Age)   // 输出：25

```

##### JSON tag常用选项

| Tag                     | 说明               |
| ----------------------- | ------------------ |
| `json:"name"`           | 指定JSON字段名     |
| `json:"-"`              | 忽略该字段         |
| `json:"name,omitempty"` | 字段为零值时省略   |
| `json:"name,string"`    | 数字类型转为字符串 |

### 接口

[接口（interface）](interface) 是 Go 语言中一种抽象类型，它定义了一组方法签名（method signature），但不包含实现。接口用于描述对象的行为，而不关心对象的具体类型。