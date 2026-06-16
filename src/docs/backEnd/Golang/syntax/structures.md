---
title: 控制结构
order: 3
---

# 控制结构

## 条件语句

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

## switch 语句
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

## 循环语句

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
