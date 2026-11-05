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

### 把查询结果插入（INSERT ... SELECT）

需要插入的数据已经存在于数据库里时，不用先查出来再拼 `VALUES`，直接让 `SELECT` 的结果作为数据源：

```sql
INSERT INTO 目标表 (列1, 列2, ...)
SELECT 列1, 列2, ...
FROM 来源表
WHERE 条件;
```

**① 复制本表的部分行**（做备份、按条件克隆）：

```sql
-- 把 30 岁以上的用户复制一份，id 交给自增生成，不复制原 id
INSERT INTO user (name, age, phone)
SELECT name, age, phone
FROM user
WHERE age >= 30;
```

**② 从其他表导入**（配合 JOIN 把关联数据摊平成一行）：

```sql
-- 把"已支付订单"写入订单归档表
INSERT INTO orders_archive (order_no, user_name, amount)
SELECT o.order_no, u.name, o.amount
FROM orders o
JOIN user u ON u.id = o.user_id
WHERE o.status = 'paid';
```

**③ 把聚合结果写入汇总表**（报表场景，避免每次实时统计）：

```sql
-- 每个用户的订单总数和总金额，写入统计表
INSERT INTO user_stat (user_id, order_count, total_amount)
SELECT user_id, COUNT(*), SUM(amount)
FROM orders
GROUP BY user_id;
```

**④ 复制到另一张表时避免重复**：

```sql
-- IGNORE：遇到唯一键冲突就跳过该行，不报错
INSERT IGNORE INTO user (name, phone)
SELECT name, phone FROM user_old;

-- ON DUPLICATE KEY UPDATE：存在则更新，不存在则插入
INSERT INTO user_stat (user_id, order_count, total_amount)
SELECT user_id, COUNT(*), SUM(amount) FROM orders GROUP BY user_id
ON DUPLICATE KEY UPDATE
  order_count  = VALUES(order_count),
  total_amount = VALUES(total_amount);
```

`INSERT ... SELECT` 的几个要点：

| 要点             | 说明                                                        |
| ---------------- | ----------------------------------------------------------- |
| 列按**位置**对应 | 目标列数必须与 `SELECT` 列数一致，顺序对齐，不看列名        |
| 不能用 `VALUES`  | `INSERT ... SELECT` 和 `INSERT ... VALUES` 是两种语法，不能混写 |
| 不加 `WHERE`     | 会复制来源表的全部行，重复执行会不断追加数据                |
| 大批量建议加事务 | 几万行以上可以分批（加 `LIMIT`）执行，避免长事务锁表         |

> **和"先查询再循环插入"的区别**：应用层 `SELECT` 出 1000 条再 `INSERT` 1000 次，是 1000 次网络往返 + 1000 个事务；`INSERT ... SELECT` 一条语句在数据库内部完成，通常快一个数量级。

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
| `NOT IN (...)`          | 不在列表中                               |
| `BETWEEN a AND b`       | 闭区间范围                               |
| `NOT BETWEEN a AND b`   | 不在闭区间范围                           |
| `LIKE`                  | 模糊匹配，`%` 任意个字符，`_` 单个字符   |
| `NOT LIKE`              | 不模糊匹配，`%` 任意个字符，`_` 单个字符 |
| `IS NULL`/`IS NOT NULL` | 判空                                     |

```sql
SELECT * FROM user WHERE age > 18 AND name LIKE '张%'; # 查询年龄大于 18 岁且姓名以 '张' 开头的用户
SELECT * FROM user WHERE name NOT LIKE '王%'; # 查询姓名不以 '王' 开头的用户
SELECT * FROM user WHERE id IN (1, 3, 5); # 查询 id 为 1、3、5 的用户
SELECT * FROM user WHERE age BETWEEN 18 AND 30;
SELECT * FROM user WHERE phone IS NULL;
```

> **注意**：判断空值必须用 `IS NULL`，写成 `= NULL` 永远不成立（NULL 与任何值比较结果都是 NULL）。
