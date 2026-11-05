---
title: 索引与性能
order: 6
---

# 索引与性能

索引是提高查询速度的核心手段，本质是让数据库从「逐行扫描全表」变成「按目录定位」。InnoDB 使用 **B+Tree** 结构组织索引。

## 索引的优缺点

- 优点：大幅加快 `WHERE`、`ORDER BY`、`JOIN` 的查询速度
- 缺点：占用磁盘空间；增删改时需要维护索引，写入变慢

> **原则**：索引不是越多越好，只为查询频繁的列建索引，一般单表索引不超过 5 个。

## 索引类型

| 类型     | 关键字             | 索引结构 | 说明                                                   | 常用度     |
| -------- | ------------------ | -------- | ------------------------------------------------------ | ---------- |
| 主键索引 | `PRIMARY KEY`      | B+Tree   | 唯一 + 非空，一张表只能一个；InnoDB 靠它组织整表数据   | 必备       |
| 唯一索引 | `UNIQUE`           | B+Tree   | 值不能重复，允许 NULL；用于手机号、邮箱、订单号        | 很常用     |
| 普通索引 | `INDEX` / `KEY`    | B+Tree   | 只加速查询，不做任何约束                               | 最常用     |
| 联合索引 | `INDEX(a, b, c)`   | B+Tree   | 多列组合成一个索引，遵循最左前缀                       | 很常用     |
| 全文索引 | `FULLTEXT`         | 倒排索引 | 文本分词检索；中文效果差，生产多用 ES                  | 少用       |
| 空间索引 | `SPATIAL`          | R-Tree   | 地理坐标、区域包含/相交查询                            | 很少用     |
| 哈希索引 | 无独立语法         | Hash     | Memory 引擎自动创建；InnoDB 只有自适应哈希，不能手动指定 | 无需手动建 |

### 主键索引（PRIMARY KEY）

```sql
CREATE TABLE user (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,  -- 自增主键，最常见
  name VARCHAR(50)
);
```

- **InnoDB 中主键就是聚簇索引**：叶子节点直接存放整行数据，按主键顺序物理排列，所以主键查询最快
- 没定义主键时，InnoDB 会找第一个「唯一且非空」的索引当聚簇索引；都没有就生成隐藏的 `row_id`
- 建议用**自增整数**（`INT` / `BIGINT`）。用业务字段（身份证、UUID）做主键会导致随机写入、页分裂，插入性能明显下降
- **常用度：必备**。没有主键的表在 InnoDB 里几乎等同于没有组织，规范上必须建

### 唯一索引（UNIQUE）

```sql
CREATE TABLE user (
  id    BIGINT AUTO_INCREMENT PRIMARY KEY,
  phone VARCHAR(20) UNIQUE                -- 建表时声明
);
ALTER TABLE user ADD UNIQUE KEY uk_email (email);  -- 表已存在时追加
```

- 与主键的区别：**可以有多个**、**允许 NULL**（多个 NULL 不算重复）
- 双重作用：既做唯一性校验（重复插入报 `1062 Duplicate entry`），也加速查询
- 典型用途：手机号、邮箱、订单号、外部系统 ID
- **常用度：很常用**。凡是「业务上不允许重复」的字段，优先用它而不是在代码里 `SELECT` 再判断

### 普通索引（INDEX / KEY）

```sql
ALTER TABLE user ADD INDEX idx_city (city);
```

- 只加速查询，不做任何约束，值可以重复、可以为 NULL
- 可建**前缀索引**：`ADD INDEX idx_title (title(10))`，长字符串只索引前 10 个字符，省空间但区分度下降
- 命名习惯 `idx_列名`
- **常用度：最常用**。`WHERE`、`ORDER BY`、`JOIN` 里高频出现的列都靠它

### 联合索引（多列索引）

```sql
ALTER TABLE orders ADD INDEX idx_user_status (user_id, status);
```

- 多列组合成一个索引，查询必须**从最左列开始连续命中**（详见「最左前缀原则」）
- 排列口诀：**等值查询的列在前，范围查询的列在后**，需要排序的列也尽量放进索引
- 一条联合索引常能替代多条单列索引，减少写入负担
- **常用度：很常用**。实际项目里大部分索引都是联合索引，单列索引反而是少数

### 全文索引（FULLTEXT）

```sql
-- 8.0 建中文全文索引需要 ngram 分词器
CREATE TABLE article (
  id      INT AUTO_INCREMENT PRIMARY KEY,
  content TEXT,
  FULLTEXT INDEX ft_content (content) WITH PARSER ngram
) ENGINE=InnoDB;

-- 查询用 MATCH ... AGAINST，不能用 LIKE
SELECT * FROM article
WHERE MATCH(content) AGAINST('数据库' IN NATURAL LANGUAGE MODE);
```

- 结构是**倒排索引**（词 → 文档），和 B+Tree 完全不同，所以不能用于 `=`、`>` 这类比较
- InnoDB 5.6+ 支持；中文必须指定 `ngram` 分词器，否则按空格切词，中文整段被当成一个词
- 只适合简单站内搜索。**中文分词、相关性排序、高亮、同义词**这些需求 MySQL 都很弱，生产环境基本用 Elasticsearch / Meilisearch
- **常用度：少用**。小项目临时搜索可以用，正经搜索场景不要选它

### 空间索引（SPATIAL）

```sql
CREATE TABLE shop (
  id       INT AUTO_INCREMENT PRIMARY KEY,
  name     VARCHAR(50),
  location POINT NOT NULL SRID 4326,     -- 经纬度点（WGS84 坐标系）
  SPATIAL INDEX idx_location (location)
);

-- 插入：经度在前、纬度在后
INSERT INTO shop (name, location) VALUES
  ('店A', ST_GeomFromText('POINT(116.404 39.915)', 4326));

-- 查询：必须用空间函数，索引才会生效
SELECT name FROM shop
WHERE ST_Within(location, ST_GeomFromText(
  'POLYGON((116.39 39.90, 116.42 39.90, 116.42 39.93, 116.39 39.93, 116.39 39.90))',
  4326
));
```

要点：

| 项目         | 说明                                                          |
| ------------ | ------------------------------------------------------------- |
| 索引结构     | **R-Tree**，按「最小包围矩形（MBR）」组织，不支持排序和范围比较 |
| 只能用空间类型 | 列必须是 `POINT`、`LINESTRING`、`POLYGON` 等几何类型且 `NOT NULL` |
| 只能单列     | 不能建 `(location, city)` 这样的联合空间索引                   |
| 必须配空间函数 | `ST_Within`、`ST_Contains`、`MBRContains`、`&&` 才会走索引；普通 `WHERE` 比较用不上 |
| 距离查询不是索引 | `ST_Distance` / `ST_Distance_Sphere` **不能**直接走空间索引，要先用矩形范围粗筛再精算 |
| SRID 必须一致 | 8.0 里参与比较的两个几何对象 SRID 不同会直接报错                |

「附近 1 公里」的标准写法是两段式：

```sql
SET @me = ST_GeomFromText('POINT(116.404 39.915)', 4326);

SELECT s.name, ST_Distance_Sphere(s.location, @me) AS distance_m
FROM shop s
WHERE ST_Within(s.location, <以 @me 为中心的矩形>)   -- ① 走空间索引，粗筛
  AND ST_Distance_Sphere(s.location, @me) <= 1000    -- ② 球面精确距离
ORDER BY distance_m;
```

- 典型场景：外卖/打车查附近门店与骑手、地图判断点落在哪个行政区、房产按地图框选
- **常用度：很少用**。如果只是「按城市、区县筛选」，存 `city_id` 建普通索引就够了
- **常见误解**：把经纬度存成两个 `DECIMAL(10,6)` 列再加 B+Tree 索引，那不叫空间索引——只能做矩形粗筛，跨经度 ±180 会出错，也判断不了多边形区域

### 哈希索引

- **Memory 引擎**自动把索引建成哈希，只支持等值查询（`=`、`IN`），不支持范围、排序
- **InnoDB 没有用户可建的哈希索引**，只有内部的「自适应哈希索引」（optimizer 自动维护，无法手动开关或指定）
- **常用度：无需手动建**。理解它「只能等值、不能范围」即可，实际写 SQL 时用不到

## 索引基本操作

### 创建索引

**建表时创建**：

```sql
CREATE TABLE user (
  id INT AUTO_INCREMENT PRIMARY KEY,  -- 主键索引
  name VARCHAR(50),
  phone VARCHAR(20) UNIQUE,           -- 唯一索引
  INDEX idx_name (name)               -- 普通索引
);
```

**两种添加语法（等价）**：已有表上加索引有两条路，MySQL 内部把 `CREATE INDEX` 也当作 `ALTER TABLE ... ADD` 执行：

```sql
-- 写法 A：ALTER TABLE 子句（DDL 修改表结构）
ALTER TABLE user ADD INDEX idx_age (age);

-- 写法 B：独立语句
CREATE INDEX idx_age ON user (age);
```

区别在于 `ALTER TABLE` **能和其他结构变更合并成一条语句**，也能显式指定加锁算法。

**常见索引操作一览**：

```sql
-- 普通索引（KEY 是 INDEX 的同义词）
ALTER TABLE user ADD INDEX idx_name (name);
ALTER TABLE user ADD KEY idx_name (name);          -- 完全等价

-- 唯一索引：列值不允许重复
ALTER TABLE user ADD UNIQUE KEY uk_phone (phone);

-- 主键（一张表只能有一个，列必须非空）
ALTER TABLE user ADD PRIMARY KEY (id);

-- 联合索引：顺序有讲究，遵循最左前缀
ALTER TABLE user ADD INDEX idx_name_age (name, age);

-- 前缀索引：长字符串只索引前 N 个字符，省空间
ALTER TABLE user ADD INDEX idx_title (title(10));

-- 全文索引 / 空间索引
ALTER TABLE user ADD FULLTEXT INDEX ft_content (content);
ALTER TABLE user ADD SPATIAL INDEX sp_location (location);
```

对应的独立语句：`CREATE UNIQUE INDEX uk_phone ON user (phone);`、`CREATE INDEX idx_name_age ON user (name, age);`。

**一条语句做多件事**，加字段和建索引合并，只走一次表结构变更：

```sql
ALTER TABLE user
  ADD COLUMN age INT,
  ADD INDEX idx_age (age);
```

**在线变更（避免锁表）**，大表加索引时显式指定算法：

```sql
ALTER TABLE user
  ADD INDEX idx_name (name),
  ALGORITHM=INPLACE,   -- 尽量不拷整表
  LOCK=NONE;           -- 允许并发读写
```

`ALGORITHM` / `LOCK` 只有 `ALTER TABLE` 语法能写，`CREATE INDEX` 不支持。若当前版本或索引类型不支持，MySQL 会直接报错，而不是悄悄锁表。

**索引名的自动生成规则**：省略索引名时取第一列的列名，重名时追加 `_2`、`_3`：

```sql
ALTER TABLE user ADD INDEX (name);   -- 自动叫 name
ALTER TABLE user ADD INDEX (name);   -- 再建一次 → name_2
```

自动名在后续 `DROP INDEX` 时很难记，所以规范上通常手写 `idx_列名` / `uk_列名`。

| 创建注意点       | 说明                                                       |
| ---------------- | ---------------------------------------------------------- |
| 索引不是越多越好 | 每个索引都会拖慢 `INSERT` / `UPDATE` / `DELETE` 并占用磁盘 |
| 大表加索引有风险 | 先确认支持 `ALGORITHM=INPLACE, LOCK=NONE`，否则可能锁写   |
| 联合索引顺序     | `(a, b)` 可用于 `WHERE a`、`WHERE a AND b`，不能单独用于 `WHERE b` |
| 重复索引要清理   | 已有 `(a, b)` 时，单独 `(a)` 通常可直接删掉                |
| 前缀索引的代价   | 只索引前 N 个字符，前缀区分度低时需回表次数变多            |

### 查看索引

```sql
-- 查看整张表的索引
SHOW INDEX FROM user;

-- 或查看建表语句（索引会一并出现在输出里）
SHOW CREATE TABLE user;

-- 精确查询某张表的索引信息
SELECT index_name, column_name, non_unique
FROM information_schema.STATISTICS
WHERE table_schema = 'my_db' AND table_name = 'user';
```

`SHOW INDEX` 返回的关键字段：

| 字段           | 说明                                                     |
| -------------- | -------------------------------------------------------- |
| `Key_name`     | 索引名，`PRIMARY` 表示主键                               |
| `Non_unique`   | `0` 为唯一索引（含主键），`1` 为普通索引                 |
| `Seq_in_index` | 该列在联合索引中的位置，从 1 开始（判断最左前缀用）      |
| `Column_name`  | 索引列名                                                 |
| `Collation`    | `A` 升序、`D` 降序                                       |
| `Cardinality`  | 预估的不同值数量，越大区分度越高，索引效果越好           |
| `Index_type`   | `BTREE`（默认）、`FULLTEXT`、`SPATIAL`                   |

> 联合索引会在 `SHOW INDEX` 里展开成多行，每列一行，用 `Seq_in_index` 分先后——所以看到同一个 `Key_name` 出现多次是正常的。

### 删除索引

```sql
-- 删除普通/唯一索引（两种写法等价）
ALTER TABLE user DROP INDEX idx_age;
DROP INDEX idx_age ON user;

-- 删除主键
ALTER TABLE user DROP PRIMARY KEY;

-- 重命名索引（8.0 支持，不是删除但常配合整理索引）
ALTER TABLE user RENAME INDEX old_name TO new_name;
```

> **删主键的前置条件**：如果主键列带 `AUTO_INCREMENT`，必须先去掉自增属性（`ALTER TABLE user MODIFY id INT`），否则报错。同样，被外键引用的索引不能直接删除，需先解除外键约束。

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
