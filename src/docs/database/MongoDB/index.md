---
title: MongoDB 入门
order: 0
---

# MongoDB 入门

## 简介

MongoDB 是一个底层由 C++ 实现的数据库，它支持实时应用和高并发场景，同时提供了丰富的查询和索引功能，使开发能够快速构建和部署应用。

MongoDB 是一个基于文档存储（数据都是以文件存储在磁盘上）的分布式（可以分布到多个节点上）的 NoSQL 数据库（非关系型数据库）。

MongoDB 的数据结构由键值对（key-value）组成，每个键值对都有一个唯一的键（key）和一个值（value）。

**适用场景**：

- 对数据处理性能要求较高的场景，例如实时应用、高并发场景
- 需要借助缓存层来处理数据的场景
- 需要高度伸缩性（水平扩展）的场景

## 特性

- 文档型数据库，较强可扩展性，拥有强大的查询语言，多种存储引擎
- 高性能、高可用、水平扩展；支持数据嵌入、子文档查询、支持副本集与分片
- 多种查询类型支持，且支持数据聚合查询、文本检索、地理位置查询

## 下载安装

[下载 MongoDB Community Server](https://www.mongodb.com/zh-cn/docs/manual/administration/install-community/?operating-system=windows&windows-installation-method=msiexec)

Windows 下使用 msi 安装包安装时注意：

- 安装方式选择 **Complete**（完整安装）
- **Install MongoD as a Service**：勾选后 MongoDB 会注册为 Windows 服务，开机自启，服务名默认为 `MongoDB`
- 取消勾选 **Install MongoDB Compass**（官方图形化客户端），可以加快安装速度，需要时再单独安装

安装完成后，默认数据目录为 `C:\Program Files\MongoDB\Server\<版本>\data`，默认端口为 **27017**。

### 验证安装

```shell
# 查看数据库服务版本
mongod --version

# 查看交互式命令行版本
mongosh --version
```

### 启动与连接

```shell
# MongoDB 注册为服务后，使用管理员权限管理服务
net start MongoDB   # 启动服务
net stop MongoDB    # 停止服务
```

服务启动后，使用 `mongosh` 连接本地数据库（详见 [mongsh 基础操作](./shell)）。

## 图形化客户端

- [Navicat Premium](https://www.navicat.com.cn/products)：功能强大的数据库客户端工具，支持连接 MongoDB
- [MongoDB Compass](https://www.mongodb.com/products/compass)：MongoDB 官方免费图形化工具

## 参考文献

- [MongoDB 官方文档](https://www.mongodb.com/docs/)
- [MongoDB 中文文档](https://mongodb.net.cn/)
