---
title: 索引与性能
order: 5
---

# 索引与性能

索引是提高查询速度的核心手段，本质是让数据库从「逐行扫描全表」变成「按目录定位」。InnoDB 使用 **B+Tree** 结构组织索引。

## 索引的优缺点

- 优点：大幅加快 `WHERE`、`ORDER BY`、`JOIN` 的查询速度
- 缺点：占用磁盘空间；增删改时需要维护索引，写入变慢

> **原则**：索引不是越多越好，只为查询频繁的列建索引，一般单表索引不超过 5 个。

## 索引类型

| 类型     | 关键字              | 说明                                 |
| -------- | ------------------- | ------------------------------------ |
| 主键索引 | `PRIMARY KEY`       | 唯一 + 非空，一张表只能有一个        |
| 唯一索引 | `UNIQUE`            | 值不能重复，允许 NULL                |
| 普通索引 | `INDEX`             | 最基础的索引，无约束                 |
| 联合索引 | `INDEX(a, b, c)`    | 多列组合成一个索引                   |
| 全文索引 | `FULLTEXT`          | 文本检索，中文场景一般用 ES 代替     |

## 索引基本操作

```sql
-- 建表时创建
CREATE TABLE user (
  id INT AUTO_INCREMENT PRIMARY KEY,  -- 主键索引
  name VARCHAR(50),
  phone VARCHAR(20) UNIQUE,           -- 唯一索引
  INDEX idx_name (name)               -- 普通索引
);

-- 已有表上添加索引
CREATE INDEX idx_age ON user (age);
ALTER TABLE user ADD INDEX idx_name_age (name, age);

-- 添加唯一索引
CREATE UNIQUE INDEX idx_phone ON user (phone);

-- 查看表的索引
SHOW INDEX FROM user;

-- 删除索引
DROP INDEX idx_age ON user;
```

## 最左前缀原则

联合索引 `(name, age)` 相当于建立了 `(name)`、`(name, age)` 两个索引，查询条件必须**从最左列开始连续命中**：

```sql
-- ✅ 能命中：从最左列 name 开始
SELECT * FROM user WHERE name = '张三';
SELECT * FROM user WHERE name = '张三' AND age = 20;

-- ❌ 不能命中：缺少最左列 name
SELECT * FROM user WHERE age = 20;
```

> **注意**：遇到范围查询（`>`、`<`、`BETWEEN`、`LIKE`）后，后面的列会停止命中，因此把等值查询的列放在联合索引的前面。

## 使用 EXPLAIN 分析查询

在 `SELECT` 前加 `EXPLAIN` 可以查看执行计划：

```sql
EXPLAIN SELECT * FROM user WHERE name = '张三';
```

关键字段：

| 字段  | 说明         | 关注点                                                             |
| ----- | ------------ | ------------------------------------------------------------------ |
| type  | 访问类型     | 至少达到 `range`，最好 `ref`/`const`；`ALL` 表示全表扫描           |
| key   | 实际使用的索引 | 为 `NULL` 说明没用上索引                                          |
| rows  | 预估扫描行数 | 越小越好                                                           |
| Extra | 附加信息     | `Using filesort`、`Using temporary` 需要优化                       |

`type` 常见级别（从优到差）：`system > const > eq_ref > ref > range > index > ALL`。

## 常见索引失效场景

| 场景                   | 示例                              | 说明                       |
| ---------------------- | --------------------------------- | -------------------------- |
| 对索引列使用函数或运算 | `WHERE YEAR(created_at) = 2026`   | 索引列被加工后失效         |
| 隐式类型转换           | 字符串列写 `WHERE phone = 13800000000` | 类型不一致导致失效    |
| 前导模糊查询           | `LIKE '%三'`                      | `%` 在开头无法走索引       |
| 违反最左前缀           | 联合索引 `(a,b)` 只用 b 查询      | 缺少最左列                 |
| OR 连接非索引列        | `WHERE name = 'x' OR remark = 'y'` | 有一列无索引即全表扫描    |
| 不等于 / NOT IN        | `WHERE age != 18`                 | 优化器可能放弃索引         |

## 优化建议

- 只查询需要的字段，避免 `SELECT *`
- 深分页用游标方式：`WHERE id > 上次最大 id LIMIT 10`
- 避免在索引列上做函数运算，把运算移到等号右边
- 大表加字段、加索引用 `pt-online-schema-change` 等工具在线执行
- 开启慢查询日志定位问题 SQL：`SET GLOBAL slow_query_log = ON`
