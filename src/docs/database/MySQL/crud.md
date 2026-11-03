---
title: 增删改查
order: 3
---

# 增删改查

CRUD 是数据库最基础的操作：`INSERT` 增、`DELETE` 删、`UPDATE` 改、`SELECT` 查。以下示例基于 `user` 表。

## 插入数据（INSERT）

```sql
-- 插入单条（指定字段，推荐写法）
INSERT INTO user (name, age) VALUES ('张三', 20);

-- 插入多条
INSERT INTO user (name, age) VALUES ('李四', 22), ('王五', 25);

-- 插入全部字段时可省略字段列表（不推荐，表结构变更后会报错）
INSERT INTO user VALUES (NULL, '赵六', 30, NULL, NOW());
```

## 更新数据（UPDATE）

```sql
-- 更新指定行的字段
UPDATE user SET age = 21 WHERE name = '张三';

-- 同时更新多个字段
UPDATE user SET age = 21, phone = '13800000000' WHERE id = 1;

-- 基于原值计算（如年龄加 1）
UPDATE user SET age = age + 1 WHERE id <= 10;
```

> **危险**：`UPDATE` 不带 `WHERE` 会更新全表。生产环境执行前建议先用 `SELECT` 验证 `WHERE` 条件。

## 删除数据（DELETE）

```sql
-- 删除指定行
DELETE FROM user WHERE id = 1;

-- 删除满足条件的行
DELETE FROM user WHERE age < 18;
```

> **危险**：`DELETE` 不带 `WHERE` 会清空全表。业务数据一般不物理删除，推荐软删除：加一个 `deleted` 字段做标记，查询时过滤。

## 查询数据（SELECT）

```sql
-- 查询所有字段（生产环境不推荐 SELECT *）
SELECT * FROM user;

-- 查询指定字段
SELECT name, age FROM user;

-- 给字段起别名
SELECT name AS 姓名, age AS 年龄 FROM user;
```

## WHERE 条件

| 运算符                  | 说明                                     |
| ----------------------- | ---------------------------------------- |
| `=`、`!=`、`<>`         | 等于、不等于                             |
| `>`、`>=`、`<`、`<=`    | 比较运算                                 |
| `AND`、`OR`、`NOT`      | 逻辑运算                                 |
| `IN (...)`              | 值在列表中                               |
| `BETWEEN a AND b`       | 闭区间范围                               |
| `LIKE`                  | 模糊匹配，`%` 任意个字符，`_` 单个字符   |
| `IS NULL`/`IS NOT NULL` | 判空                                     |

```sql
SELECT * FROM user WHERE age > 18 AND name LIKE '张%';
SELECT * FROM user WHERE id IN (1, 3, 5);
SELECT * FROM user WHERE age BETWEEN 18 AND 30;
SELECT * FROM user WHERE phone IS NULL;
```

> **注意**：判断空值必须用 `IS NULL`，写成 `= NULL` 永远不成立（NULL 与任何值比较结果都是 NULL）。
