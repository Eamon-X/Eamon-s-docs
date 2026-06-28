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

| 特性 | 说明 |
|-----|------|
| **轻量级** | 初始栈大小约 2KB，可动态扩展 |
| **调度** | 由 Go 运行时调度，非操作系统线程 |
| **启动开销** | 远小于线程 |
| **数量** | 单个程序可创建数万甚至数十万 |



### GMP 调度模型

Go 使用 GMP 调度模型管理 Goroutine：

```
┌─────────────────────────────────────────────────────────────┐
│                       Go Runtime                            │
├─────────────────────────────────────────────────────────────┤
│  G (Goroutine): 协程，包含执行栈和程序计数器                 │
│  M (Machine): 操作系统线程                                   │
│  P (Processor): 处理器，包含运行队列和上下文                 │
├─────────────────────────────────────────────────────────────┤
│  M1 ── P1 ── G1    G2    G3    ...    (本地运行队列)        │
│  M2 ── P2 ── G4    G5    G6    ...    (本地运行队列)        │
│  ...                                                        │
│  全局运行队列: G100  G101  G102  ...                         │
└─────────────────────────────────────────────────────────────┘
```

**调度策略：**

1. **Work Stealing**：空闲的 P 可以从其他 P 的队列中"偷"任务
2. **Global Queue**：当本地队列为空时，从全局队列获取任务
3. **Context Switch**：Goroutine 间切换开销极低

### 等待 Goroutine 完成

```go
func main() {
    var wg sync.WaitGroup

    for i := 0; i < 3; i++ {
        wg.Add(1)
        go func(id int) {
            defer wg.Done()
            fmt.Printf("Goroutine %d 完成\n", id)
        }(i)
    }

    wg.Wait()
    fmt.Println("所有 Goroutine 完成")
}
```

## Channel（通道）

Channel 是 Goroutine 间通信的管道，用于传递数据。

```go
// 创建无缓冲通道
ch := make(chan int)

// 发送数据
ch <- 42

// 接收数据
value := <-ch

// 创建带缓冲通道
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

### 通道类型

| 类型 | 创建方式 | 特点 |
|-----|---------|------|
| **无缓冲** | `make(chan T)` | 发送和接收必须同时准备好 |
| **有缓冲** | `make(chan T, n)` | 缓冲区满时阻塞发送，空时阻塞接收 |
| **只读** | `<-chan T` | 只能接收数据 |
| **只写** | `chan<- T` | 只能发送数据 |

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

### 关闭通道

```go
ch := make(chan int)

go func() {
    for i := 0; i < 5; i++ {
        ch <- i
    }
    close(ch)
}()

for value := range ch {
    fmt.Println(value)
}
```

**注意：**

- 向已关闭的通道发送数据会 panic
- 从已关闭的通道接收数据返回零值和 `false`
- 通道只能关闭一次

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

```go
func main() {
    var wg sync.WaitGroup

    for i := 0; i < 5; i++ {
        wg.Add(1)
        go func(id int) {
            defer wg.Done()
            fmt.Printf("Task %d done\n", id)
        }(i)
    }

    wg.Wait()
    fmt.Println("All tasks done")
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

| 方案 | 适用场景 |
|-----|---------|
| **Mutex** | 任意场景 |
| **Channel** | 生产者-消费者模式 |
| **sync.Map** | 并发读写 Map |
| **原子操作** | 简单的数值操作 |

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