---
title: Golang
order: 0
---

# Golang

## 简介

- **Golang**：一种静态类型、编译型语言，由Google开发。
- **Golang** 是一种跨平台的语言，可以在多个操作系统上运行。
- **Golang** 是一种支持并发的语言，可以并行执行多个任务。
- **Golang** 是一种支持垃圾回收的语言，不需要手动管理内存。
- **Golang** 是一种支持函数式编程的语言，可以使用闭包和匿名函数。
- **Golang** 是一种支持类型断言的语言，可以在运行时检查变量的类型。

## 安装 Golang

[Golang 安装](https://go.dev/dl/)

### 验证安装

```shell
go version
```

## 查看go环境变量

```shell
go env
```

### 设置国内代理

默认的Go模块下载源在国外，速度可能很慢。在命令提示符中执行以下命令，换用国内镜像源，这将极大提升后续下载依赖包的速度。

```shell
go env -w GOPROXY=https://goproxy.cn,direct
```

## 配置VS Code

安装扩展：

- golang.go 这个插件将提供代码高亮、智能补全、导航等所有核心功能。

## 简单示例

```go
	package main // 声明main包，表示这是一个可执行程序
	​
	import "fmt" // 导入格式化输入输出的标准库包
	​
	func main() { // main函数是程序执行的入口
	  fmt.Println("Hello, World! 来自我的第一个Go程序。")
	}
```

运行程序：

1. 快速运行
   ```shell
   go run main.go
   ```
2. 编译生成可执行文件运行
   ```shell
   go build main.go
   ./main
   ```

## 延伸学习与故障排查

学习Go Modules：这是现代Go的官方依赖管理工具。在你的项目根目录下执行 go mod init 你的模块名 来初始化，之后就可以用 go get 方便地管理第三方库了。

如果工具安装失败：请首先检查 go env GOPROXY 是否已正确设置为国内代理。如果提示“命令找不到”，请再次确认是否已将 go\bin 目录正确添加到系统 PATH 并重启了VS Code。

善用调试：在代码行号左侧点击可以设置断点，然后使用VS Code左侧的“运行和调试”功能启动，可以逐行检查程序状态，这是解决复杂问题的利器。

## 参考文献

- [Golang 官方文档中文](https://go-lang.org.cn/)
- [Golang 官方文档英文](https://golang.google.cn/)
- [Windows下通过Visual Studio Code打造Go语言开发环境入门](https://zhuanlan.zhihu.com/p/10256978690)
- [配置Visual Studio Code 用于 Go 开发](https://learn.microsoft.com/zh-cn/azure/developer/go/configure-visual-studio-code-for-go-development)
