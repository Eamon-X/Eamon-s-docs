---
title: Nginx
order: 9
---

# Nginx

## Nginx 是什么
Nginx 是一个高度可扩展的 Web 服务器，用于处理高并发请求和提供静态内容。

## 安装 Nginx
```shell
sudo apt-get install nginx
```

## 配置文件
- 主配置文件：`/etc/nginx/nginx.conf`
- 站点配置文件：`/etc/nginx/sites-available/`
- MIME 类型映射文件：`/etc/nginx/mime.types`
- 站点配置模板文件：`/etc/nginx/sites-available/default`

### 主配置文件
主配置文件是 Nginx 的全局配置文件，包含了 Nginx 的全局配置、事件处理、进程管理、日志记录等。

```conf
# Main 全局配置区，Nginx 核心功能配置
user www-data; # Nginx 运行用户，默认是 www-data 用户
worker_processes auto; # 允许开启的工作进程数，默认是 auto，根据 CPU 核心数自动调整

# events 事件处理配置区，子进程核心配置
events {
    worker_connections 1024; # 每个工作进程的最大连接数，默认是 1024
}

# http 服务器配置区
http {
    keepalive_timeout 65; # 保持连接超时时间，默认是 65 秒
    # 针对静态资源服务器
    sendfile on; # 是否允许 nginx 调用系统 sendfile 函数来发送静态文件，这个过程避免了数据在内核空间和用户空间之间的多次拷贝。
    tcp_nopush on; # 尽量将多个数据包组合成一个完整的 TCP 段再发送
    tcp_nodelay off;    # 延迟小数据包的发送

    # server 不同服务的配置项
    server {
        listen 80 default_server; # 监听的端口号，默认是 80
        server_name _; # 服务器名称，默认是 _
        root /var/www/html; # 当用户访问网站时，Nginx 将 root 指定的路径与请求的 URI 拼接，形成完整的文件系统路径去查找并返回对应的文件。这个 root 只在“需要读文件时”生效
        index index.html index.htm; # 请求达到时，从 root 指定的路径下按顺序查找 index 等文件，如果不存在则返回 404 错误页面

        # location 不同请求路径配置项
        location / { # / 代表根路径
            proxy_pass http://localhost:3000; # 反向代理到后端服务器的地址，不走文件系统，root 被忽略
        }
        location /static/ {
        # 这个 location 没有 proxy_pass，会继承 server 的 root
        # 访问 /static/xxx 时会去 /var/www/html/static/xxx 找文件
        }
    }

    # mail 邮件代理配置区
    mail {
        # server 邮件服务器的配置项
        server {
            # 具体配置项
        }
    }
   }
```

## 日志目录
- 访问日志：`/var/log/nginx/access.log`
- 错误日志：`/var/log/nginx/error.log`

## 常用命令
```shell
# 启动 Nginx
nginx

# 停止 Nginx
nginx -s stop # 立即停止
nginx -s quit # 优雅停止，等待当前请求完成再停止

# 查看 Nginx 是否启动，可以查看默认80端口是否被占用
netstat -tupln | grep 80

# 重新打开日志文件，主要用于日志切割。当日志文件被移动或重命名后，如果不重新打开，Nginx 会继续向旧文件（可能已不存在）写入日志。
nginx -s reopen

# 测试 Nginx 配置文件是否正确，不中断服务
nginx -t

# 重新加载配置文件，在不中断服务的情况下，平滑重载配置文件
nginx -s reload
```
## 两种工作模式

**1. 静态文件服务模式**
- 使用 `root` 或 `alias` 指令指定文件所在目录
- 配合 `index` 指令指定默认首页文件
- Nginx 直接从磁盘读取文件并返回给客户端
- 适用于纯静态网站或静态资源（如图片、CSS、JS）的分发

**2. 反向代理模式**
- 使用 `proxy_pass` 指令指定后端服务器地址
- Nginx 不处理文件，仅作为中间层将请求转发给后端服务
- 后端服务处理请求后，Nginx 将响应返回给客户端
- 适用于动态应用（如 Node.js、Python 后端）

### 关键要点

这两种指令**互斥**。一旦在 `location` 块中配置了 `proxy_pass`，Nginx 就会进入反向代理模式，**不会再执行静态文件的查找逻辑**，此时 `root`、`alias`、`index` 等静态文件相关指令都会被忽略。

通常在生产环境中会同时配置两种模式：
- 静态资源（`/static`、`/assets`）使用静态文件服务模式，由 Nginx 直接处理，性能更高
- 动态请求（`/api`）使用反向代理模式，转发给后端应用服务器

### 反向代理模式

反向代理是指 Nginx 作为客户端和服务器之间的中间件，将客户端的请求转发到后端服务器，然后将服务器端的响应返回给客户端。

```text
客户端 ←→ Nginx(网关) ←→ 内网服务器
                      ↘→ 内网服务器
```

```conf
# server 反向代理服务器的配置项
server {
    location / { # / 代表根路径
        proxy_pass http://localhost:3000; # 反向代理到后端服务器的地址
    }
}
```