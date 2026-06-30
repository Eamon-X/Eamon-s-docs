---
title: 并发和并行
order: 7
---

# 并发和并行

## 进程与线程

**进程（Process）**：一个正在独立运行的程序实例
**线程（Thread）**：进程内的执行单位，共享进程资源

## 并发 vs 并行

**并发（Concurrency）**：多个任务作用在一个CPU上，同一时间点只能有一个任务在执行，在同一时间段内处理多个任务，交替执行
**并行（Parallelism）**：多个任务作用多个CPU上，在同一时刻执行多个任务，真正同时进行

通俗的讲，多线程程序在单核CPU上运行就是并发执行，在多核CPU上运行就是并行执行。如果程序线程数大于CPU核心数，则多线程程序在多核CPU上运行时，同时存在并行执行和并发执行。

```
并发（单核 CPU）:
时间片1: 任务A → 任务B → 任务C
时间片2: 任务B → 任务A → 任务C

并行（多核 CPU）:
CPU核心1: 任务A ──────────────►
CPU核心2: 任务B ──────────────►
CPU核心3: 任务C ──────────────►
```

### Go 的并发优势

Go 语言天生支持并发，通过以下特性实现：

1. **Goroutine**：轻量级线程，由 Go 运行时管理
2. **Channel**：用于 Goroutine 间通信
3. **Select**：多路复用，同时等待多个 Channel
4. **sync 包**：提供同步原语

## Goroutine（协程）

### 创建 Goroutine

```go
// 创建 goroutine
func sayHello() {
    fmt.Println("Hello from goroutine!")
}

go sayHello() // 启动 goroutine，此方法可以跟主线程并行执行，相当于异步执行 sayHello 函数

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

### Goroutine 的特点

| 特性         | 说明                             |
| ------------ | -------------------------------- |
| **轻量级**   | 初始栈大小约 2KB，可动态扩展     |
| **调度**     | 由 Go 运行时调度，非操作系统线程 |
| **启动开销** | 远小于线程                       |
| **数量**     | 单个程序可创建数万甚至数十万     |

## Channel（通道）

Channel 是 Goroutine 间通信的管道，用于传递数据。数据传输遵循 FIFO（先进先出）原则。

```go
// 创建无缓冲的传递整型数据的通道
ch := make(chan int)

// 发送数据
ch <- 42 // 把42发送到通道ch

// 接收数据
value := <-ch // 从通道ch接收数据，返回值为int类型，value为42
fmt.Println(value) // 输出42

// 创建带缓冲的传递整型数据的通道，缓冲区大小为10个整型数据
bufferedCh := make(chan int, 10)
bufferedCh <- 1
bufferedCh <- 2

// 接收数据
<-bufferedCh // 从通道bufferedCh接收数据，但忽略返回值（1）
value1 := <-bufferedCh // 从通道bufferedCh接收数据，返回值为int类型，value1为2
fmt.Println(value1) // 输出2

// 关闭通道
close(ch)

// 检查通道是否关闭
value, ok := <-ch
if !ok {
    fmt.Println("通道已关闭")
}
```

### 通道类型

| 类型       | 创建方式          | 特点                             |
| ---------- | ----------------- | -------------------------------- |
| **无缓冲** | `make(chan T)`    | 发送和接收必须同时准备好         |
| **有缓冲** | `make(chan T, n)` | 缓冲区满时阻塞发送，空时阻塞接收 |
| **只读**   | `<-chan T`        | 只能接收数据                     |
| **只写**   | `chan<- T`        | 只能发送数据                     |

### 方向通道

```go
func producer(ch chan<- int) {
    for i := 0; i < 5; i++ {
        ch <- i
    }
    close(ch)
}

func consumer(ch <-chan int) {
    for value := range ch {
        fmt.Println(value)
    }
}

func main() {
    ch := make(chan int)
    go producer(ch)
    consumer(ch)
}
```

### 循环遍历通道

使用for range遍历通道时，必须先关闭通道，当通道被关闭时才会自动退出for range循环，如果没有关闭通道就会报错死锁。
使用for循环遍历通道时，可以不关闭通道。

```go
ch := make(chan int)

go func() {
    for i := 0; i < 5; i++ {
        ch <- i
    }
    close(ch) // 关闭通道
}()

// for range 遍历通道的值，通道没有key
for value := range ch {
    fmt.Println(value)
}

// for 循环遍历通道的值，通道没有key
for i := 0; i < 5; i++ {
    fmt.Println(i, <-ch)
}
```

**注意：**

- 向已关闭的通道发送数据会 panic
- 从已关闭的通道接收数据返回零值和 `false`
- 通道只能关闭一次

### 通道阻塞

**无缓冲通道阻塞：**

无缓冲通道要求发送和接收**同时准备好**，否则会阻塞。

```go
// ❌ 会死锁：主 Goroutine 发送数据，但没有接收方
func main() {
    ch := make(chan int)
    ch <- 1  // 永远阻塞在这里
}

// ✅ 正确：使用 Goroutine 接收
func main() {
    ch := make(chan int)
    go func() {
        <-ch
    }()
    ch <- 1
}
```

**有缓冲通道阻塞：**

```go
ch := make(chan int, 2)  // 缓冲区大小为 2

// 前 2 次发送不会阻塞
ch <- 1
ch <- 2

// 第 3 次发送会阻塞（缓冲区已满）
ch <- 3  // 阻塞，直到有接收者取出数据
```

**阻塞场景总结：**

| 通道类型 | 阻塞条件                               |
| -------- | -------------------------------------- |
| 无缓冲   | 发送时无接收方，或接收时无发送方       |
| 有缓冲   | 缓冲区满时发送阻塞，缓冲区空时接收阻塞 |

**避免死锁：**

```go
// ❌ 死锁：等待自己
func main() {
    ch := make(chan int)
    <-ch  // 永远阻塞，没有发送方
}

// ❌ 死锁：多个 Goroutine 相互等待
func main() {
    ch1 := make(chan int)
    ch2 := make(chan int)

    go func() {
        ch1 <- <-ch2  // 等待 ch2
    }()
    ch2 <- <-ch1  // 等待 ch1
}

// ✅ 正确：确保有对应的发送/接收
func main() {
    ch := make(chan int)
    go func() {
        ch <- 1
    }()
    <-ch
}
```

**检测死锁：**

运行时检测到死锁会 panic：

```go
ch := make(chan int)
<-ch
// fatal error: all goroutines are asleep - deadlock!
```

## Select 多路复用

### 基本用法

```go
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

### 带超时的 Select

```go
func main() {
    ch := make(chan int)

    select {
    case v := <-ch:
        fmt.Println("收到:", v)
    case <-time.After(1 * time.Second):
        fmt.Println("超时")
    }
}
```

### Default 分支

```go
func main() {
    ch := make(chan int)

    select {
    case v := <-ch:
        fmt.Println("收到:", v)
    default:
        fmt.Println("无数据")
    }
}
```

## sync 包

### sync.Mutex（互斥锁）

```go
var mu sync.Mutex
var count int

func increment() {
    mu.Lock()
    defer mu.Unlock()
    count++
}
```

### sync.RWMutex（读写锁）

```go
var rwmu sync.RWMutex
var data = make(map[string]string)

func read(key string) string {
    rwmu.RLock()
    defer rwmu.RUnlock()
    return data[key]
}

func write(key, value string) {
    rwmu.Lock()
    defer rwmu.Unlock()
    data[key] = value
}
```

**适用场景：** 读多写少的场景，允许多个读操作同时进行。

### sync.WaitGroup

当主线程运行结束后，会立刻终止所有 Goroutine。为确保所有 Goroutine 都执行完成，可以使用 `sync.WaitGroup` 等待所有 Goroutine 完成。

```go
func main() {
    var wg sync.WaitGroup

    for i := 0; i < 3; i++ {
        wg.Add(1) // 协程计数器加1
        go func(id int) {
            defer wg.Done() // 协程计数器减1
            fmt.Printf("Goroutine %d 完成\n", id)
        }(i)
    }

    wg.Wait() // 等待所有 Goroutine 完成
    fmt.Println("所有 Goroutine 完成")
}
```

### sync.Once（单次执行）

```go
var once sync.Once
var initialized bool

func init() {
    once.Do(func() {
        initialized = true
        fmt.Println("初始化完成")
    })
}
```

### sync.Map（并发安全的 Map）

```go
var m sync.Map

func main() {
    m.Store("key1", "value1")
    m.Store("key2", "value2")

    if v, ok := m.Load("key1"); ok {
        fmt.Println(v)
    }

    m.Delete("key2")

    m.Range(func(key, value interface{}) bool {
        fmt.Printf("%s: %s\n", key, value)
        return true
    })
}
```

### sync.Pool（对象池）

```go
var pool = sync.Pool{
    New: func() interface{} {
        return make([]byte, 1024)
    },
}

func process() {
    buf := pool.Get().([]byte)
    defer pool.Put(buf)

    // 使用 buf
}
```

**适用场景：** 减少对象创建和 GC 开销，用于频繁创建和销毁的对象。

## Context

### 基本概念

Context 用于传递请求范围的值、取消信号和超时时间。

```go
func doSomething(ctx context.Context) {
    select {
    case <-ctx.Done():
        fmt.Println("任务取消")
    default:
        fmt.Println("任务执行中")
    }
}
```

### 取消 Context

```go
func main() {
    ctx, cancel := context.WithCancel(context.Background())

    go func() {
        time.Sleep(2 * time.Second)
        cancel()
    }()

    doSomething(ctx)
}
```

### 带超时的 Context

```go
func main() {
    ctx, cancel := context.WithTimeout(context.Background(), 1*time.Second)
    defer cancel()

    doSomething(ctx)
}
```

### 带截止时间的 Context

```go
func main() {
    deadline := time.Now().Add(5 * time.Second)
    ctx, cancel := context.WithDeadline(context.Background(), deadline)
    defer cancel()

    doSomething(ctx)
}
```

### 传递值

```go
func main() {
    ctx := context.WithValue(context.Background(), "requestId", "12345")
    process(ctx)
}

func process(ctx context.Context) {
    requestId := ctx.Value("requestId").(string)
    fmt.Println("Request ID:", requestId)
}
```

## 常见并发模式

### 1. 生产者-消费者模式

```go
func producer(ch chan<- int, count int) {
    for i := 0; i < count; i++ {
        ch <- i
    }
    close(ch)
}

func consumer(ch <-chan int, wg *sync.WaitGroup) {
    defer wg.Done()
    for value := range ch {
        fmt.Println("消费:", value)
    }
}

func main() {
    ch := make(chan int)
    var wg sync.WaitGroup

    go producer(ch, 10)

    for i := 0; i < 3; i++ {
        wg.Add(1)
        go consumer(ch, &wg)
    }

    wg.Wait()
}
```

### 2. Worker Pool（工作池）

```go
func worker(id int, jobs <-chan int, results chan<- int) {
    for job := range jobs {
        fmt.Printf("Worker %d 处理任务 %d\n", id, job)
        results <- job * 2
    }
}

func main() {
    jobs := make(chan int, 100)
    results := make(chan int, 100)

    for w := 1; w <= 3; w++ {
        go worker(w, jobs, results)
    }

    for j := 1; j <= 9; j++ {
        jobs <- j
    }
    close(jobs)

    for a := 1; a <= 9; a++ {
        <-results
    }
}
```

### 3. Fan-Out / Fan-In

```go
func gen(nums ...int) <-chan int {
    out := make(chan int)
    go func() {
        for _, n := range nums {
            out <- n
        }
        close(out)
    }()
    return out
}

func sq(in <-chan int) <-chan int {
    out := make(chan int)
    go func() {
        for n := range in {
            out <- n * n
        }
        close(out)
    }()
    return out
}

func merge(cs ...<-chan int) <-chan int {
    var wg sync.WaitGroup
    out := make(chan int)

    output := func(c <-chan int) {
        for n := range c {
            out <- n
        }
        wg.Done()
    }

    wg.Add(len(cs))
    for _, c := range cs {
        go output(c)
    }

    go func() {
        wg.Wait()
        close(out)
    }()
    return out
}

func main() {
    in := gen(2, 3)

    c1 := sq(in)
    c2 := sq(in)

    for n := range merge(c1, c2) {
        fmt.Println(n)
    }
}
```

### 4. Pipeline（管道）

```go
func stage1(in <-chan int) <-chan int {
    out := make(chan int)
    go func() {
        for n := range in {
            out <- n * 2
        }
        close(out)
    }()
    return out
}

func stage2(in <-chan int) <-chan int {
    out := make(chan int)
    go func() {
        for n := range in {
            out <- n + 1
        }
        close(out)
    }()
    return out
}

func main() {
    input := make(chan int)
    go func() {
        for i := 1; i <= 5; i++ {
            input <- i
        }
        close(input)
    }()

    pipeline := stage2(stage1(input))

    for result := range pipeline {
        fmt.Println(result)
    }
}
```

## 竞态条件

### 什么是竞态条件

多个 Goroutine 同时访问共享数据，导致数据不一致。

```go
// ❌ 竞态条件示例
var count int

func increment() {
    count++
}

func main() {
    for i := 0; i < 1000; i++ {
        go increment()
    }
    time.Sleep(1 * time.Second)
    fmt.Println("count =", count)  // 可能不是 1000
}
```

### 检测竞态条件

使用 `-race` 标志检测：

```bash
go run -race main.go
```

### 解决方案

| 方案         | 适用场景          |
| ------------ | ----------------- |
| **Mutex**    | 任意场景          |
| **Channel**  | 生产者-消费者模式 |
| **sync.Map** | 并发读写 Map      |
| **原子操作** | 简单的数值操作    |

```go
// ✅ 使用 Mutex
var mu sync.Mutex
var count int

func increment() {
    mu.Lock()
    defer mu.Unlock()
    count++
}

// ✅ 使用 Channel
func increment(ch chan<- int) {
    ch <- 1
}

func main() {
    ch := make(chan int)
    count := 0

    go func() {
        for range ch {
            count++
        }
    }()

    for i := 0; i < 1000; i++ {
        go increment(ch)
    }
}

// ✅ 使用原子操作
import "sync/atomic"

var count int64

func increment() {
    atomic.AddInt64(&count, 1)
}
```

## 总结

### 核心要点

1. **Goroutine**：轻量级并发执行单元
2. **Channel**：Goroutine 间通信的安全方式
3. **Select**：同时等待多个 Channel 操作
4. **sync 包**：提供同步原语（Mutex、WaitGroup、Once 等）
5. **Context**：传递取消信号和请求上下文
6. **并发模式**：生产者-消费者、Worker Pool、Fan-Out/Fan-In、Pipeline

### 最佳实践

1. **不要共享内存，要通过通信共享**（Go 官方推荐）
2. **使用 Channel 传递数据，使用 Mutex 保护共享状态**
3. **使用 WaitGroup 等待多个 Goroutine 完成**
4. **使用 Context 传递取消信号**
5. **使用 `-race` 检测竞态条件**
6. **避免 Goroutine 泄漏**

### 常见错误

1. **忘记关闭 Channel**：导致接收方永远阻塞
2. **向已关闭的 Channel 发送数据**：导致 panic
3. **没有等待 Goroutine 完成**：主程序提前退出
4. **共享数据不加保护**：导致竞态条件
5. **过度使用 Mutex**：影响性能，考虑使用 Channel

## 例子

**1. 统计1-12000的数字中哪些是素数，并同时打印出来，要求结合Goroutine、Channel并开启8线程执行**

```go
package main

import (
	"fmt"
	"sync"
)

// isPrime 判断一个数是否为素数
// 素数定义：大于1的自然数，除了1和它本身外没有其他因数
func isPrime(n int) bool {
	if n <= 1 {
		return false
	}
	if n == 2 {
		return true
	}
	if n%2 == 0 {
		return false
	}
	// 只需要检查到 sqrt(n)，因为如果 n 有因子，必然有一个因子 <= sqrt(n)
	for i := 3; i*i <= n; i += 2 {
		if n%i == 0 {
			return false
		}
	}
	return true
}

// worker 工作函数，从 tasks channel 获取数字，判断是否为素数，将结果发送到 results channel
// wg 用于通知主 goroutine 该 worker 已完成
func worker(id int, tasks <-chan int, results chan<- int, wg *sync.WaitGroup) {
	// 函数结束时通知 WaitGroup 减少计数
	defer wg.Done()

	// for range 遍历 tasks channel，当 channel 关闭时自动退出循环
	for num := range tasks {
		if isPrime(num) {
			// 将素数发送到 results channel
			results <- num
		}
	}
}

func main() {
	const (
		workerCount = 8      // 开启的 goroutine 数量
		maxNum      = 12000  // 需要检查的最大数字
	)

	// 创建 tasks channel，用于分发待检查的数字
	// 缓冲区大小设为 100，避免生产者发送数据时短暂阻塞
	tasks := make(chan int, 100)

	// 创建 results channel，用于收集素数结果
	// 缓冲区大小设为 100，不再需要预测素数数量，因为打印 goroutine 会实时消费
	results := make(chan int, 100)

	// 创建 WaitGroup，用于等待所有 worker 完成
	var wg sync.WaitGroup

	// 创建 printerWg，用于等待打印 goroutine 完成
	var printerWg sync.WaitGroup

	// 启动 8 个 worker goroutine
	for i := 1; i <= workerCount; i++ {
		wg.Add(1) // 每启动一个 worker，增加 WaitGroup 计数
		go worker(i, tasks, results, &wg)
	}

	// 启动任务分发 goroutine
	// 将任务分发放到单独的 goroutine 中，是避免死锁的关键：
	// 如果主 goroutine 先分发所有任务再读取 results，
	// 当 results 缓冲区满时，worker 会阻塞在发送，导致无人接收 tasks，
	// 主 goroutine 阻塞在发送 tasks，形成死锁。
	go func() {
		for num := 1; num <= maxNum; num++ {
			tasks <- num
		}
		close(tasks) // 所有任务分发完成后关闭 tasks channel
		fmt.Println("任务分发完成，已关闭 tasks channel")
	}()

	// 素数计数器，在 main 函数作用域声明
	// 打印 goroutine 写入，主 goroutine 在 printerWg.Wait() 之后读取
	// 由于 printerWg.Wait() 保证了 happens-before 关系，所以没有竞态条件
	var count int

	// 启动打印 goroutine，负责实时读取 results channel 并打印
	printerWg.Add(1)
	go func() {
		defer printerWg.Done()
		fmt.Println("开始实时打印素数结果...")
		for prime := range results {
			fmt.Printf("%5d", prime)
			count++
			if count%10 == 0 {
				fmt.Println()
			}
		}
	}()

	// 主 goroutine 职责：
	// 1. 等待所有 worker 完成
	// 2. 关闭 results channel（通知打印 goroutine 没有更多数据）
	// 3. 等待打印 goroutine 完成
	// 4. 打印最终统计
	wg.Wait()
	close(results)
	fmt.Println("所有 worker 已完成，已关闭 results channel")

	printerWg.Wait()

	// 打印最终统计
	fmt.Printf("\n\n===== 统计完成 =====\n")
	fmt.Printf("1-%d 中共有 %d 个素数\n", maxNum, count)
}
```

**代码说明：**

1. **Worker Pool 模式**：这是一种经典的并发模式，适用于任务量较大且可以并行处理的场景

2. **Channel 作用**：
   - `tasks`：分发 goroutine 向 worker 分发待检查的数字
   - `results`：worker 将找到的素数发送到打印 goroutine

3. **四条并行执行线**：
   - **分发 goroutine**：负责将 1-12000 的数字发送到 `tasks` channel，完成后关闭 channel
   - **8 个 worker goroutine**：从 `tasks` channel 获取数字，判断是否为素数，将结果发送到 `results` channel
   - **打印 goroutine**：实时从 `results` channel 读取数据并打印，同时计数
   - **主 goroutine**：协调各 goroutine，最后打印统计结果

4. **两个 WaitGroup**：
   - `wg`：等待所有 worker 完成
   - `printerWg`：等待打印 goroutine 完成

5. **主 goroutine 职责**：
   - `wg.Wait()`：等待所有 worker 完成
   - `close(results)`：关闭 results channel，通知打印 goroutine 没有更多数据
   - `printerWg.Wait()`：等待打印 goroutine 完成所有打印
   - 打印最终统计结果

6. **实时打印**：打印 goroutine 使用 `for range` 遍历 `results` channel，每收到一个素数就立即打印，不需要等待所有结果

7. **死锁避免**：
   - **任务分发放到单独 goroutine**：这是最关键的设计。如果主 goroutine 先分发所有任务再读取 results，当 results 缓冲区满时，worker 会阻塞在发送，导致无人接收 tasks，主 goroutine 阻塞在发送 tasks，形成死锁
   - **主 goroutine 负责关闭 results**：由于主 goroutine 不再读取 results，它可以直接执行 `wg.Wait()` + `close(results)`，不再需要单独的 goroutine 来做这件事

8. **并发安全**：`count` 变量虽然在打印 goroutine 中写入、主 goroutine 中读取，但由于 `printerWg.Wait()` 保证了 happens-before 关系，所以没有竞态条件

9. **缓冲区设计**：两个 channel 的缓冲区都设为 100，不再需要预测素数数量，因为打印 goroutine 会实时消费 results，不会出现缓冲区溢出的情况