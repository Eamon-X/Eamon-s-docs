---
title: MongoDB数据持久化存储
order: 6
---
# MongoDB数据持久化存储

## 介绍
MongoDB 是一个底层由C++ 实现的数据库，它支持实时应用和高并发场景，同时提供了丰富的查询和索引功能，使开发能够快速构建和部署应用。
MongoDB 是一个基于文档存储（数据都是以文件存储在磁盘上）的分布式（可以分布到多个节点上）的 NoSQL 数据库（非关系型数据库）。
MongoDB 的数据结构由键值对(key-value)组成，每个键值对都有一个唯一的键(key)和一个值(value)。
MongoDB 适合对数据处理性能要求较高的场景，例如实时应用、高并发场景等；适合需要借助缓存层来处理数据的场景；适合需要高度的伸缩性（水平扩展）的场景。

## 特性
- 文档型数据库，较强可扩展性，拥有强大的查询语言，多种存储引擎
- 高性能、高可用、水平扩展；支持数据嵌入，子文档查询、支持副本集与分片
- 多种查询类型支持，且支持数据聚合查询、文本检索、地址位置查询


## 下载

[下载MongoDB](https://www.mongodb.com/zh-cn/docs/manual/administration/install-community/?operating-system=windows&windows-installation-method=msiexec)

## Mongo Shell
```js
// app.js
import mongoose from "mongoose";
```