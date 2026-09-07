---
title: 文件上传与静态资源
order: 5
---

# 文件上传与静态资源

## 单文件上传

### 后端处理

```go
r.POST("/upload", func(c *gin.Context) {
	// 从表单获取文件，字段名是 "file"
	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(400, gin.H{"message": "请选择要上传的文件"})
		return
	}

	// 获取文件信息
	fmt.Printf("文件名: %s\n", file.Filename)
	fmt.Printf("文件大小: %d 字节\n", file.Size)

	// 保存文件到指定路径
	uploadPath := "uploads/" + file.Filename
	if err := c.SaveUploadedFile(file, uploadPath); err != nil {
		c.JSON(500, gin.H{"message": "文件保存失败"})
		return
	}

	c.JSON(200, gin.H{
		"message":  "上传成功",
		"filename": file.Filename,
		"path":     uploadPath,
	})
})
```

### 前端表单

```html
<!DOCTYPE html>
<html>
<body>
    <form action="/upload" method="post" enctype="multipart/form-data">
        <input type="file" name="file">
        <input type="submit" value="上传">
    </form>
</body>
</html>
```

### 使用 curl 测试

```shell
curl -X POST http://localhost:8080/upload \
  -F "file=@./test.txt"
```

## 多文件上传

```go
r.POST("/upload-multiple", func(c *gin.Context) {
	// 获取表单中的所有文件
	form, err := c.MultipartForm()
	if err != nil {
		c.JSON(400, gin.H{"message": "表单解析失败"})
		return
	}

	// 获取 "files" 字段的所有文件
	files := form.File["files"]

	// 逐个保存
	var savedFiles []string
	for _, file := range files {
		uploadPath := "uploads/" + file.Filename
		if err := c.SaveUploadedFile(file, uploadPath); err != nil {
			c.JSON(500, gin.H{"message": "文件 " + file.Filename + " 保存失败"})
			return
		}
		savedFiles = append(savedFiles, uploadPath)
	}

	c.JSON(200, gin.H{
		"message": fmt.Sprintf("成功上传 %d 个文件", len(savedFiles)),
		"files":   savedFiles,
	})
})
```

### 前端多文件表单

```html
<form action="/upload-multiple" method="post" enctype="multipart/form-data">
    <input type="file" name="files" multiple>
    <input type="submit" value="批量上传">
</form>
```

```shell
# curl 测试多文件上传
curl -X POST http://localhost:8080/upload-multiple \
  -F "files=@./a.txt" \
  -F "files=@./b.txt" \
  -F "files=@./c.txt"
```

## 文件类型限制

### 按扩展名限制

```go
func IsAllowedExt(filename string, allowedExts []string) bool {
	ext := strings.ToLower(filepath.Ext(filename))
	for _, allowed := range allowedExts {
		if ext == allowed {
			return true
		}
	}
	return false
}

r.POST("/upload", func(c *gin.Context) {
	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(400, gin.H{"message": "请选择文件"})
		return
	}

	// 只允许图片格式
	allowedExts := []string{".jpg", ".jpeg", ".png", ".gif"}
	if !IsAllowedExt(file.Filename, allowedExts) {
		c.JSON(400, gin.H{"message": "只支持图片格式: jpg, jpeg, png, gif"})
		return
	}

	c.SaveUploadedFile(file, "uploads/"+file.Filename)
	c.JSON(200, gin.H{"message": "上传成功"})
})
```

### 按文件大小限制

```go
const MaxFileSize = 5 * 1024 * 1024 // 5MB

r.POST("/upload", func(c *gin.Context) {
	// 限制请求体大小
	r.MaxMultipartMemory = 8 << 20 // 8MB（处理大文件时调大）

	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(400, gin.H{"message": "请选择文件"})
		return
	}

	// 检查文件大小
	if file.Size > MaxFileSize {
		c.JSON(400, gin.H{
			"message": "文件过大，最大支持 5MB",
		})
		return
	}

	c.SaveUploadedFile(file, "uploads/"+file.Filename)
	c.JSON(200, gin.H{"message": "上传成功"})
})
```

### 服务器全局限制

```go
// 限制整个请求体最大为 8MB
r.MaxMultipartMemory = 8 << 20
```

## 保存路径与文件名处理

### 使用时间戳命名避免重名

```go
func GenerateFileName(originalName string) string {
	ext := filepath.Ext(originalName)
	timestamp := time.Now().Format("20060102150405")
	random := fmt.Sprintf("%06d", rand.Intn(1000000))
	return fmt.Sprintf("%s_%s%s", timestamp, random, ext)
}

r.POST("/upload", func(c *gin.Context) {
	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(400, gin.H{"message": "请选择文件"})
		return
	}

	// 生成唯一文件名
	newName := GenerateFileName(file.Filename)
	uploadPath := "uploads/2024/01/" + newName

	// 确保目录存在
	os.MkdirAll(filepath.Dir(uploadPath), 0755)

	c.SaveUploadedFile(file, uploadPath)
	c.JSON(200, gin.H{
		"message": "上传成功",
		"url":     "/uploads/2024/01/" + newName,
	})
})
```

## 静态资源服务

### 服务静态文件目录

```go
func main() {
	r := gin.Default()

	// 将 /static 路径映射到 ./static 目录
	// 访问 /static/logo.png → ./static/logo.png
	r.Static("/static", "./static")

	// 将 /uploads 路径映射到 ./uploads 目录
	r.Static("/uploads", "./uploads")

	// 服务单个文件
	r.StaticFile("/favicon.ico", "./static/favicon.ico")

	// 服务单个文件并指定响应头
	r.StaticFileFS("/robots.txt", "./static/robots.txt", http.Dir("./static"))

	r.Run(":8080")
}
```

### 从内存提供静态文件

```go
// 嵌入静态资源到二进制文件
//go:embed static
var staticFS embed.FS

func main() {
	r := gin.Default()

	// 从 embed.FS 提供静态文件
	r.StaticFS("/static", http.FS(staticFS))

	r.Run(":8080")
}
```

## 完整示例

一个完整的文件上传服务：

```go
package main

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

const MaxFileSize = 5 * 1024 * 1024 // 5MB

func GenerateFileName(originalName string) string {
	ext := filepath.Ext(originalName)
	timestamp := time.Now().Format("20060102150405")
	return fmt.Sprintf("%s%s", timestamp, ext)
}

func main() {
	r := gin.Default()
	r.MaxMultipartMemory = 8 << 20 // 8MB

	// 确保上传目录存在
	os.MkdirAll("uploads", 0755)

	// 上传接口（单文件）
	r.POST("/upload", func(c *gin.Context) {
		file, err := c.FormFile("file")
		if err != nil {
			c.JSON(400, gin.H{"message": "请选择文件"})
			return
		}

		// 大小限制
		if file.Size > MaxFileSize {
			c.JSON(400, gin.H{"message": "文件不能超过 5MB"})
			return
		}

		// 生成唯一文件名并保存
		newName := GenerateFileName(file.Filename)
		uploadPath := "uploads/" + newName
		if err := c.SaveUploadedFile(file, uploadPath); err != nil {
			c.JSON(500, gin.H{"message": "保存失败"})
			return
		}

		c.JSON(200, gin.H{
			"message": "上传成功",
			"url":     "/uploads/" + newName,
			"size":    file.Size,
		})
	})

	// 批量上传
	r.POST("/upload-multiple", func(c *gin.Context) {
		form, err := c.MultipartForm()
		if err != nil {
			c.JSON(400, gin.H{"message": "表单解析失败"})
			return
		}

		files := form.File["files"]
		var urls []string

		for _, file := range files {
			if file.Size > MaxFileSize {
				continue
			}
			newName := GenerateFileName(file.Filename)
			uploadPath := "uploads/" + newName
			c.SaveUploadedFile(file, uploadPath)
			urls = append(urls, "/uploads/"+newName)
		}

		c.JSON(200, gin.H{
			"message": fmt.Sprintf("成功上传 %d 个文件", len(urls)),
			"urls":    urls,
		})
	})

	// 静态文件服务
	r.Static("/uploads", "./uploads")

	r.Run(":8080")
}
```

## 注意事项

1. **不要信任客户端文件名**：文件名可能包含路径穿越字符（如 `../../etc/passwd`），必须用 `filepath.Base()` 或重新生成文件名

```go
// 安全做法：使用 filepath.Base 防止路径穿越
safeName := filepath.Base(file.Filename)
c.SaveUploadedFile(file, "uploads/"+safeName)
```

2. **限制文件大小**：避免恶意大文件耗尽服务器内存

3. **限制文件类型**：根据业务需求限制可上传的文件类型

4. **存储路径设计**：按日期分目录存储，便于管理

5. **CDN/OSS 考虑**：生产环境建议使用对象存储（阿里云 OSS、腾讯云 COS、AWS S3）
