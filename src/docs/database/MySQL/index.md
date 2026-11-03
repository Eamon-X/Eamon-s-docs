---
title: MySQL 入门
order: 0
---

# MySQL 入门

## 简介

- MySQL 是一个开源的关系型数据库管理系统（RDBMS），使用 SQL 进行数据管理。
- 数据以表（行 + 列）的形式存储，表与表之间通过外键建立关联。
- 支持事务、多种存储引擎（默认 InnoDB），广泛用于 Web 应用，是 LAMP/LNMP 技术栈的重要组成部分。

## 主要特性

- **关系模型**：数据组织为二维表，结构固定，适合强一致性场景。
- **事务支持**：InnoDB 引擎完整支持 ACID 事务，保证数据一致性。
- **可插拔存储引擎**：可按需选择 InnoDB、MyISAM、Memory 等引擎。
- **跨平台开源**：支持 Windows/Linux/macOS，社区版（GPL）免费使用。

## 安装 MySQL

[MySQL 官方下载](https://dev.mysql.com/downloads/)

### 验证安装

```shell
mysql --version
```

### 登录数据库

```shell
# -u 指定用户名，-p 回车后输入密码（避免明文写在命令行）
mysql -u root -p

# 连接远程主机
mysql -h 127.0.0.1 -P 3306 -u root -p
```

## 常用客户端工具

| 工具            | 类型       | 说明                             |
| --------------- | ---------- | -------------------------------- |
| mysql           | 命令行     | 官方自带，适合快速执行 SQL       |
| MySQL Workbench | 官方图形化 | 免费，官方维护                   |
| Navicat         | 图形化     | 收费，功能全面                   |
| DBeaver         | 图形化     | 免费开源，支持多种数据库         |
| DataGrip        | 图形化     | 收费，JetBrains 出品，提示智能   |

## 与 MongoDB 概念对照

| MySQL  | MongoDB |
| ------ | ------- |
| 数据库 | 数据库  |
| 表     | 集合    |
| 行     | 文档    |
| 列     | 字段    |
| 主键   | `_id`   |

## 参考文献

- [MySQL 官方文档](https://dev.mysql.com/doc/)
- [MySQL 中文文档](https://www.mysqlzh.com/)
