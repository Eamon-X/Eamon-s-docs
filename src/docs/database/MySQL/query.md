---
title: 查询进阶
order: 4
---

# 查询进阶

## 排序（ORDER BY）

```sql
-- 按年龄升序（ASC 默认，可省略）
SELECT * FROM user ORDER BY age ASC;

-- 按年龄降序
SELECT * FROM user ORDER BY age DESC;

-- 多字段排序：先按年龄降序，年龄相同按 id 升序
SELECT * FROM user ORDER BY age DESC, id ASC;
```

## 分页（LIMIT）

```sql
-- LIMIT 偏移量, 条数：跳过 0 条取 10 条，即第 1 页
SELECT * FROM user LIMIT 0, 10;

-- 第 2 页，每页 10 条，跳过 10 条取 10 条
SELECT * FROM user LIMIT 10, 10;

-- 计算公式：LIMIT (page - 1) * size, size

-- 等价写法：LIMIT 条数 OFFSET 偏移量
SELECT * FROM user LIMIT 10 OFFSET 10;
```

> **注意**：深分页（如 `LIMIT 1000000, 10`）性能很差，因为要先扫描并丢弃前 100 万行，可改为基于主键的游标方式优化（见「索引与性能」章节）。

## 聚合函数

| 函数     | 说明     |
| -------- | -------- |
| `COUNT`  | 统计行数 |
| `SUM`    | 求和     |
| `AVG`    | 平均值   |
| `MAX`    | 最大值   |
| `MIN`    | 最小值   |

```sql
SELECT COUNT(*) FROM user;            -- 总行数
SELECT AVG(age) FROM user;            -- 平均年龄
SELECT MAX(age), MIN(age) FROM user;  -- 最大、最小年龄
```

以下示例基于同一份 `user` 表数据：

| id  | name | age  |
| --- | ---- | ---- |
| 1   | 张三 | 20   |
| 2   | 李四 | NULL |
| 3   | 王五 | 30   |

### COUNT — 统计行数

```sql
SELECT COUNT(*) FROM user;             -- 3：统计行数，包含 age 为 NULL 的行
SELECT COUNT(age) FROM user;           -- 2：只统计 age 不为 NULL 的行
SELECT COUNT(DISTINCT age) FROM user;  -- 2：先去重再统计（20、30 两个值）
```

- `COUNT(*)` 数的是**行**，不管字段是否为 NULL，最常用
- `COUNT(列)` 数的是该列**非 NULL 的值**，适合「有多少人填了手机号」这类需求
- `COUNT(*)` 与 `COUNT(1)` 效果、性能完全一致，不用纠结

### SUM — 求和

```sql
SELECT SUM(age) FROM user;             -- 50：20 + 30，NULL 被忽略
SELECT IFNULL(SUM(age), 0) FROM user;  -- 无匹配行时 SUM 返回 NULL，用 IFNULL 兜底为 0
```

- 只能用于数值列
- 忽略 NULL；查询结果为空时返回 `NULL` 而不是 0

### AVG — 平均值

```sql
SELECT AVG(age) FROM user;             -- 25：(20 + 30) / 2
SELECT AVG(IFNULL(age, 0)) FROM user;  -- 16.67：把 NULL 当 0 参与计算，50 / 3
```

> **注意**：`AVG` 会把 NULL **整行忽略**，而不是当 0 参与计算——上面第一个查询除以 2 得 25，不是 50 / 3 ≈ 16.67。两种结果含义不同，按业务需求选择。

### MAX / MIN — 最大、最小值

```sql
SELECT MAX(age), MIN(age) FROM user;   -- 30 / 20
```

- 数值按大小、字符串按字典序、日期按时间先后比较
- 无匹配行时返回 `NULL`

### 通用注意事项

- **除 `COUNT(*)` 外，所有聚合函数都会忽略 NULL**
- 无 `GROUP BY` 时聚合作用于整表（返回一行）；有 `GROUP BY` 时按组分别计算
- 聚合函数不能直接写在 `WHERE` 里（`WHERE` 先于聚合执行），过滤聚合结果要用 `HAVING`，见下文

## 分组（GROUP BY + HAVING）

```sql
-- 按年龄分组统计人数
SELECT age, COUNT(*) AS cnt FROM user GROUP BY age;

-- 分组 + 聚合 + 排序：统计每个年龄的人数并按人数降序
SELECT age, COUNT(*) AS cnt FROM user GROUP BY age ORDER BY cnt DESC;

-- HAVING：对分组结果再过滤（WHERE 中不能用聚合函数）
SELECT age, COUNT(*) AS cnt
FROM user
GROUP BY age
HAVING cnt > 2;
```

### WHERE 与 HAVING 的区别

| 对比项   | WHERE            | HAVING              |
| -------- | ---------------- | ------------------- |
| 作用时机 | 分组前过滤原始行 | 分组后过滤聚合结果  |
| 聚合函数 | 不能使用         | 可以使用            |
| 位置     | GROUP BY 之前    | GROUP BY 之后       |

## 去重（DISTINCT）

```sql
-- 查询有哪些不重复的年龄
SELECT DISTINCT age FROM user;

-- 多字段联合去重（两个字段的组合不重复）
SELECT DISTINCT age, name FROM user;
```

## 联表查询（JOIN）

以下示例基于 `user` 表和 `orders` 表（`orders.user_id` 关联 `user.id`），多表关系见「表的关系」章节。

### 从笛卡尔积说起

两张表不加任何条件地组合，就是**笛卡尔积**——左表每一行 × 右表每一行，结果行数 = m × n：

```sql
-- user 有 3 行、orders 有 4 行 → 结果 12 行，几乎没有业务意义
SELECT * FROM user, orders;            -- 老式写法（隐式连接）
SELECT * FROM user CROSS JOIN orders;  -- 显式写法
```

JOIN 的本质就是：**先做笛卡尔积，再用 `ON` 条件过滤出有意义的组合**。忘写 `ON` 不会报错，但会返回整个笛卡尔积——数据量大时直接拖垮数据库，是新手常见事故。

### 内连接（INNER JOIN）

只保留两表都匹配的行（笛卡尔积 + `ON` 过滤）：

```sql
-- 内连接：只返回两表都匹配上的记录
SELECT o.id, u.name, o.amount
FROM orders o
INNER JOIN user u ON o.user_id = u.id;
-- INNER 可省略，只写 JOIN 默认就是内连接
```

### 外连接（LEFT / RIGHT JOIN）

内连接会"丢数据"——没下过订单的用户不会出现在结果里。想保留某一侧的全部行就用外连接，匹配不上的那一侧补 NULL：

```sql
-- 左连接：左表全部保留，右表匹配不上的补 NULL
SELECT u.name, o.amount
FROM user u
LEFT JOIN orders o ON o.user_id = u.id;

-- 右连接：右表全部保留，左表匹配不上的补 NULL（少用，一般改写为左连接）
SELECT u.name, o.amount
FROM user u
RIGHT JOIN orders o ON o.user_id = u.id;
```

| 连接类型    | 结果                           |
| ----------- | ------------------------------ |
| INNER JOIN  | 只返回两表匹配的行             |
| LEFT JOIN   | 左表全部 + 右表匹配部分        |
| RIGHT JOIN  | 右表全部 + 左表匹配部分        |

### 全外连接（MySQL 不支持）

标准 SQL 的 `FULL OUTER JOIN` 保留两表全部行，MySQL 没有实现，用 `UNION` 拼接左连接和右连接来模拟：

```sql
SELECT u.name, o.amount FROM user u    LEFT  JOIN orders o ON o.user_id = u.id
UNION
SELECT u.name, o.amount FROM orders o  RIGHT JOIN user u ON o.user_id = u.id;
```

> `UNION` 默认去重，两段查询里重复的匹配行只保留一份，结果正好等于 FULL OUTER JOIN。注意第二段把 `user` 放在 RIGHT JOIN 的右侧，这样"只有订单、没有用户"的数据也能被保留。

### 自连接

同一张表和自己 JOIN，用两个别名当作"两张表"。典型场景是表内存上下级关系：

```sql
-- employee 表：id, name, manager_id（manager_id 指向同表另一行的 id）
-- 查询每个员工及其直属上级（没有上级的员工也要出现，用左连接）
SELECT e.name AS 员工, m.name AS 上级
FROM employee e
LEFT JOIN employee m ON m.id = e.manager_id;
```

### 经典场景：查"没有"数据的行

```sql
-- 查询没有订单的用户（左连接 + 判空）
SELECT u.name
FROM user u
LEFT JOIN orders o ON o.user_id = u.id
WHERE o.id IS NULL;
```

> **ON 与 WHERE 的区别**：LEFT JOIN 时，右表的过滤条件应写在 `ON` 里而不是 `WHERE` 里。写在 `WHERE` 里会把 NULL 行过滤掉，外连接退化成内连接：

```sql
-- 条件放 ON：所有用户都保留，只是没匹配上大额订单的用户订单列为 NULL
SELECT u.name, o.amount
FROM user u
LEFT JOIN orders o ON o.user_id = u.id AND o.amount > 100;
```

## 子查询

```sql
-- WHERE 中使用：查询年龄大于平均年龄的用户
SELECT * FROM user WHERE age > (SELECT AVG(age) FROM user);

-- IN 子查询：查询有订单的用户
SELECT * FROM user WHERE id IN (SELECT user_id FROM orders);

-- EXISTS 子查询：同样查询有订单的用户（外表大时通常更快）
SELECT * FROM user u WHERE EXISTS (
  SELECT 1 FROM orders o WHERE o.user_id = u.id
);
```

### IN 的进阶用法

**NOT IN 与 NULL 陷阱**：

```sql
-- 没有订单的用户
SELECT * FROM user
WHERE id NOT IN (SELECT user_id FROM orders WHERE user_id IS NOT NULL);
```

> **注意**：如果子查询结果含 `NULL`，`NOT IN` 会匹配不到任何行（`x NOT IN (1, 2, NULL)` 的结果永远是 UNKNOWN）。所以 `NOT IN` 前要在子查询里过滤 NULL，或改用 `NOT EXISTS`。

**行构造器：多列组合匹配**，`IN` 不只能匹配一列，还可以多列成对匹配：

```sql
-- 广东省深圳、浙江省杭州的用户
SELECT * FROM user
WHERE (province, city) IN (('广东', '深圳'), ('浙江', '杭州'));

-- 等价于
SELECT * FROM user
WHERE (province = '广东' AND city = '深圳')
   OR (province = '浙江' AND city = '杭州');

-- 经典场景：查询"每个用户金额最大的订单"
SELECT * FROM orders o
WHERE (o.user_id, o.amount) IN (
  SELECT o2.user_id, MAX(o2.amount)
  FROM orders o2
  GROUP BY o2.user_id
);
```

**关联子查询**，子查询里引用外层的列，外层每一行都会执行一次子查询：

```sql
-- 下过金额超过 100 的订单的用户
SELECT * FROM user u
WHERE u.id IN (
  SELECT o.user_id FROM orders o
  WHERE o.amount > 100
    AND o.user_id = u.id   -- 引用了外层的 u.id
);
```

**搭配 ANY / ALL**，`IN` 是「等于其中任意一个」，`ANY`/`ALL` 则把比较运算符也带进去：

```sql
-- 金额大于"任意一个北京用户订单金额"（即大于最小值）
SELECT * FROM orders
WHERE amount > ANY (
  SELECT o.amount FROM orders o
  JOIN user u ON o.user_id = u.id
  WHERE u.city = '北京'
);

-- 金额大于"所有北京用户订单金额"（即大于最大值）
SELECT * FROM orders
WHERE amount > ALL (
  SELECT o.amount FROM orders o
  JOIN user u ON o.user_id = u.id
  WHERE u.city = '北京'
);
```

### 子查询使用建议

| 场景                         | 建议                          |
| ---------------------------- | ----------------------------- |
| 子查询结果很小、外表大       | `IN` 合适                     |
| 子查询要引用外表（关联子查询） | 优先 `EXISTS`，语义更清晰   |
| `NOT IN`                     | 必须防 NULL，或改 `NOT EXISTS` |
| 子查询返回大量数据           | 改写成 `JOIN`，性能通常更好   |

## 执行顺序

一条 `SELECT` 语句的逻辑执行顺序：

```text
FROM → JOIN → ON → WHERE → GROUP BY → HAVING → SELECT → DISTINCT → ORDER BY → LIMIT
```

> **理解执行顺序**：`WHERE` 在 `SELECT` 之前执行，所以 `WHERE` 中不能用 `SELECT` 里定义的别名；而 `ORDER BY` 在 `SELECT` 之后，可以用别名。
