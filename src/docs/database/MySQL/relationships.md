---
title: 表的关系
order: 5
---

# 表的关系

实际项目里数据从来不是塞在一张表里的。把数据按实体拆成多张表、再用关系把它们连起来，既能减少冗余，也方便维护——这正是「关系型」数据库名字的由来。

## 为什么不把数据放在一张表里

假设把用户和订单放在同一张表：

| id | name | age | order_no | amount |
| -- | ---- | --- | -------- | ------ |
| 1  | 张三 | 20  | A001     | 99     |
| 1  | 张三 | 20  | A002     | 199    |
| 1  | 张三 | 20  | A003     | 59     |

问题显而易见：

- **冗余**：张三的姓名、年龄随着订单数重复存储
- **更新异常**：张三改名要改多行，漏改一行数据就互相矛盾
- **空值泛滥**：没有订单的用户，订单相关列全是 NULL

正确做法是拆成多张表，靠外键关联。下面每种关系都会给出**完整的建表语句 + 插入测试数据 + 查询结果**，可以直接粘到 MySQL 客户端里跑。

---

## 一对多（1:N）

最常见的关系。一个用户有多笔订单，一笔订单只属于一个用户。

**规则：外键放在「多」的一方。**

### 建表 + 插入数据

```sql
-- 主表：用户
CREATE TABLE user (
  id   INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  age  INT
);

-- 从表：订单（user_id 指向 user.id）
CREATE TABLE orders (
  id       INT AUTO_INCREMENT PRIMARY KEY,
  user_id  INT NOT NULL,
  amount   DECIMAL(10, 2) NOT NULL,
  order_no VARCHAR(20) NOT NULL,
  CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES user (id)
);

-- 插入 3 个用户
INSERT INTO user (name, age) VALUES
  ('张三', 20),
  ('李四', 25),
  ('王五', 30);

-- 插入 4 笔订单：张三 2 笔、李四 1 笔、王五 1 笔
INSERT INTO orders (user_id, amount, order_no) VALUES
  (1, 99.00,  'A001'),   -- 张三
  (1, 199.00, 'A002'),   -- 张三
  (2, 59.00,  'A003'),   -- 李四
  (3, 299.00, 'A004');   -- 王五
```

### 表内容长这样

**user 表**

| id | name | age |
| -- | ---- | --- |
| 1  | 张三 | 20  |
| 2  | 李四 | 25  |
| 3  | 王五 | 30  |

**orders 表**

| id | user_id | amount | order_no |
| -- | ------- | ------ | -------- |
| 1  | 1       | 99.00  | A001     |
| 2  | 1       | 199.00 | A002     |
| 3  | 2       | 59.00  | A003     |
| 4  | 3       | 299.00 | A004     |

### 联表查询

```sql
-- 查所有订单，带上用户姓名
SELECT o.id, u.name, o.amount, o.order_no
FROM orders o
JOIN user u ON o.user_id = u.id;
```

**查询结果**

| id | name | amount | order_no |
| -- | ---- | ------ | -------- |
| 1  | 张三 | 99.00  | A001     |
| 2  | 张三 | 199.00 | A002     |
| 3  | 李四 | 59.00  | A003     |
| 4  | 王五 | 299.00 | A004     |

类似的还有：分类 ↔ 商品、部门 ↔ 员工、文章 ↔ 评论。

---

## 一对一（1:1）

一个用户只有一份详细信息（身份证、住址等）。

一对一本质上可以合并成一张表，**拆开**通常是出于这些考虑：

| 拆表理由 | 说明                                     |
| -------- | ---------------------------------------- |
| 字段太多 | 一张表列数太多，读写变慢                 |
| 敏感信息 | 身份证等敏感字段单独隔离，便于控制权限   |
| 冷热分离 | 详情很少查询，和主表分开减小主表体积     |

**规则：外键放在任意一方，通常加上 `UNIQUE` 保证一对一。**

### 建表 + 插入数据

```sql
-- 主表（沿用上面的 user）
-- 一对一详情表
CREATE TABLE user_profile (
  id        INT AUTO_INCREMENT PRIMARY KEY,
  user_id   INT NOT NULL UNIQUE,     -- UNIQUE 保证一条记录只属于一个用户
  real_name VARCHAR(50),
  id_card   CHAR(18),
  address   VARCHAR(200),
  CONSTRAINT fk_profile_user FOREIGN KEY (user_id) REFERENCES user (id)
);

-- 只有张三和李四有详细信息（王五没有）
INSERT INTO user_profile (user_id, real_name, id_card, address) VALUES
  (1, '张三丰', '110101200401011234', '北京市朝阳区'),
  (2, '李四郎', '310101199905055678', '上海市浦东新区');
```

### 表内容长这样

**user_profile 表**

| id | user_id | real_name | id_card            | address       |
| -- | ------- | --------- | ------------------ | ------------- |
| 1  | 1       | 张三丰    | 110101200401011234 | 北京市朝阳区   |
| 2  | 2       | 李四郎    | 310101199905055678 | 上海市浦东新区 |

### 联表查询

```sql
-- 左连接 + user_profile：王五没有详情也要显示出来
SELECT u.id, u.name, u.age, p.real_name, p.id_card
FROM user u
LEFT JOIN user_profile p ON p.user_id = u.id;
```

**查询结果**

| id | name | age | real_name | id_card            |
| -- | ---- | --- | --------- | ------------------ |
| 1  | 张三 | 20  | 张三丰    | 110101200401011234 |
| 2  | 李四 | 25  | 李四郎    | 310101199905055678 |
| 3  | 王五 | 30  | NULL      | NULL               |

---

## 多对多（M:N）

一个学生选多门课，一门课有多个学生。两张表谁也放不下对方的外键，需要**中间表**（关联表）。

**规则：中间表两边各放一个外键，并加联合 UNIQUE 防止重复。**

### 建表 + 插入数据

```sql
-- 学生表
CREATE TABLE student (
  id   INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL
);

-- 课程表
CREATE TABLE course (
  id    INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(100) NOT NULL
);

-- 中间表：每行代表一条"选课"关系
CREATE TABLE student_course (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  course_id  INT NOT NULL,
  score      DECIMAL(5, 1),                 -- 关系自身的属性（成绩）放中间表
  UNIQUE KEY uk_sc (student_id, course_id), -- 防止重复选课
  CONSTRAINT fk_sc_student FOREIGN KEY (student_id) REFERENCES student (id),
  CONSTRAINT fk_sc_course  FOREIGN KEY (course_id)  REFERENCES course (id)
);

-- 3 个学生
INSERT INTO student (name) VALUES ('小明'), ('小红'), ('小刚');

-- 3 门课
INSERT INTO course (title) VALUES ('数学'), ('语文'), ('英语');

-- 6 条选课：小明选 2 门、小红选 2 门、小刚选 1 门
INSERT INTO student_course (student_id, course_id, score) VALUES
  (1, 1, 90.0),  -- 小明 - 数学
  (1, 3, 85.5),  -- 小明 - 英语
  (2, 1, 88.0),  -- 小红 - 数学
  (2, 2, 92.0),  -- 小红 - 语文
  (3, 3, 76.5);  -- 小刚 - 英语
```

### 三张表内容

**student 表**

| id | name |
| -- | ---- |
| 1  | 小明 |
| 2  | 小红 |
| 3  | 小刚 |

**course 表**

| id | title |
| -- | ----- |
| 1  | 数学  |
| 2  | 语文  |
| 3  | 英语  |

**student_course 表（中间表）**

| id | student_id | course_id | score |
| -- | ---------- | --------- | ----- |
| 1  | 1          | 1         | 90.0  |
| 2  | 1          | 3         | 85.5  |
| 3  | 2          | 1         | 88.0  |
| 4  | 2          | 2         | 92.0  |
| 5  | 3          | 3         | 76.5  |

### 联表查询

```sql
-- 查"小明"选的所有课程和成绩（中间表连两次）
SELECT s.name, c.title, sc.score
FROM student s
JOIN student_course sc ON sc.student_id = s.id
JOIN course c          ON c.id = sc.course_id
WHERE s.name = '小明';
```

**查询结果**

| name | title | score |
| ---- | ----- | ----- |
| 小明 | 数学  | 90.0  |
| 小明 | 英语  | 85.5  |

```sql
-- 反过来：查"数学"这门课有哪些学生选
SELECT c.title, s.name, sc.score
FROM course c
JOIN student_course sc ON sc.course_id = c.id
JOIN student s         ON s.id = sc.student_id
WHERE c.title = '数学';
```

**查询结果**

| title | name | score |
| ----- | ---- | ----- |
| 数学  | 小明 | 90.0  |
| 数学  | 小红 | 88.0  |

### 同一个查询的三种写法

任务统一为：**查「选了数学课的学生姓名」**。

**① 笛卡尔积写法**（隐式连接，逗号连接）

```sql
-- 3 × 3 × 5 = 45 行两两组合，再用 WHERE 过滤掉 43 行
SELECT s.name, c.title, sc.score
FROM student s, course c, student_course sc
WHERE sc.student_id = s.id
  AND sc.course_id  = c.id
  AND c.title = '数学';
```

**② 内连接写法**（显式 JOIN）

```sql
SELECT s.name, c.title, sc.score
FROM student s
JOIN student_course sc ON sc.student_id = s.id
JOIN course c          ON c.id = sc.course_id
WHERE c.title = '数学';
```

**③ 子查询写法**

```sql
-- 嵌套 IN：先找数学的 id，再找选它的学生 id，最后查学生
SELECT name FROM student
WHERE id IN (
  SELECT student_id FROM student_course
  WHERE course_id = (SELECT id FROM course WHERE title = '数学')
);

-- 行构造器写法：多列 IN 一次搞定（MySQL 支持）
SELECT name FROM student
WHERE (id, '数学') IN (
  SELECT sc.student_id, c.title
  FROM student_course sc JOIN course c ON c.id = sc.course_id
);
```

**三种写法结果完全相同**

| name | title | score |
| ---- | ----- | ----- |
| 小明 | 数学  | 90.0  |
| 小红 | 数学  | 88.0  |

**转换关系**：笛卡尔积是所有 JOIN 的理论基础，内连接是「笛卡尔积 + 连接条件」，子查询则是把「关联」改写成「属于某个集合」。

```
笛卡尔积（45 行）
   │ + WHERE 连接条件（student_id / course_id 匹配）
   ▼
内连接（等价改写）
   │ 语义转换：把"关联某张表"改写成"属于某个集合"
   ▼
子查询（IN / EXISTS）
```

| 方向            | 写法 A                                        | 写法 B（等价）                        |
| --------------- | --------------------------------------------- | ------------------------------------- |
| 隐式 ↔ 内连接   | `FROM s, c, sc WHERE ...`                     | `FROM s JOIN sc ON ... JOIN c ON ...` |
| 内连接 → 子查询 | `JOIN student_course sc ON sc.student_id = s.id` | `WHERE s.id IN (SELECT student_id ...)` |
| 子查询 → 内连接 | `IN (SELECT student_id ...)`                  | `JOIN student_course` + `DISTINCT`（必须去重） |
| 内连接 → 外连接 | `JOIN`                                        | `LEFT JOIN`（只需改关键字）           |

> **不可逆**：内连接、子查询的结果不能还原成笛卡尔积——过滤时信息已经丢掉了。

### 外连接：查「没选课的学生」

内连接和 `IN` 子查询天生做不到，必须用左连接保住主表全量：

```sql
-- 当前 3 个学生都选了课，所以结果是空集
-- 若插入一个不选课的学生，只有这条 SQL 能查出他
SELECT s.name
FROM student s
LEFT JOIN student_course sc ON sc.student_id = s.id
WHERE sc.id IS NULL;
```

同样需求的另外两种写法：

```sql
-- ❌ NOT IN：子查询里若有 NULL，结果永远是空集
SELECT name FROM student
WHERE id NOT IN (SELECT student_id FROM student_course);

-- ✅ NOT EXISTS：不受 NULL 影响，有索引时可提前短路
SELECT name FROM student s
WHERE NOT EXISTS (
  SELECT 1 FROM student_course sc WHERE sc.student_id = s.id
);
```

> **条件位置陷阱**：LEFT JOIN 时右表的过滤条件要写在 `ON` 里。写进 `WHERE` 会把补出的 NULL 行筛掉，外连接直接退化成内连接。

### 优缺点与选型

| 写法       | 优点                                        | 缺点                                            | 什么时候用                    |
| ---------- | ------------------------------------------- | ----------------------------------------------- | ----------------------------- |
| 笛卡尔积   | 所有 JOIN 的理论基础，帮助理解原理          | 45 行里 43 行是垃圾；忘写条件直接返回全组合     | 几乎不用，只作原理理解        |
| 内连接     | 连接条件与过滤条件分离，可读性好；优化器最成熟 | 会丢掉「没选课的学生」这类不匹配数据            | **多对多查询的默认选择**      |
| 子查询     | 语义接近自然语言（「属于某个集合」）；支持嵌套 | 深层嵌套可读性差；大结果集偏慢；`NOT IN` 有 NULL 陷阱 | 子查询结果小、只判断存在性时 |
| 外连接     | 保住一侧全量，能查「没有 XX」的记录         | 结果集更大；条件位置写错会退化成内连接          | 查未选课学生、零订单用户等    |

选型口诀：**默认内连接 → 只需判断存在用 EXISTS → 查「没有」用 LEFT JOIN + IS NULL → 笛卡尔积只用来理解原理**。

### 性能差异

三种写法在优化器眼里往往并不像你写的那么不同，但有几处是真实差异：

| 对比                     | 差异                                                   | 结论                          |
| ------------------------ | ------------------------------------------------------ | ----------------------------- |
| 隐式连接 vs 内连接       | 优化器会把 `FROM a, b WHERE a.x = b.x` 重写成 `JOIN ... ON`，`EXPLAIN` 完全一致 | 无性能差异，用显式 JOIN 更好读 |
| 真正的笛卡尔积           | 结果 m × n 行，无索引可用                              | 数据量一大必然超时，生产中禁用 |
| `IN` 子查询 vs JOIN      | 8.0 会改写为 semi-join，性能相当；5.5 及更早可能物化临时表 | 新版本基本等价，老版本子查询偏慢 |
| `NOT IN` vs `NOT EXISTS` | `NOT IN` 遇 NULL 退化为逐行比对；`NOT EXISTS` 可走索引、找到即短路 | **优先用 `NOT EXISTS`**        |
| 子查询改 JOIN 加 `DISTINCT` | 去重需要排序或临时表                                   | 用 `EXISTS` 可免去重           |
| 内连接 vs 外连接         | 外连接的 JOIN 顺序被锁死（左表必须是驱动表），谓词下推受限，结果集更大 | 有真实差距，按需求取舍        |

**外连接为什么可能更慢**：本例的最优路径是「`course` 按 `title='数学'` 取 1 行 → 走 `student_course.course_id` 取 2 行 → 主键回 `student`」，只碰几行。改成 LEFT JOIN 后驱动表固定为 `student`，变成「扫描全部学生 → 逐行查中间表」，数据量一上来差距就线性放大。MySQL 8.0 在能证明右表非空时会自动把外连接降级为内连接，但**不要依赖这个优化**。

### 多对多必备的反向索引

中间表只建一个联合唯一键是不够的：

```sql
-- uk_sc 只能从最左列 student_id 开始用（按学生查课程 OK）
UNIQUE KEY uk_sc (student_id, course_id);

-- 按课程查学生是从 course_id 出发，必须补一条反向索引
KEY idx_course_student (course_id, student_id);
```

缺了第二条索引，「查数学课有哪些学生」就会全表扫描中间表——这时三种写法的性能都一样烂，**跟选哪种语法无关**。

> 验证方法：别猜，对写好的 SQL 跑 `EXPLAIN ANALYZE`。重点看 `type` 是否为 `ALL`（全表扫描）、`rows` 估计是否过大、有没有出现 `Using temporary` / `Using filesort`。

类似的还有：文章 ↔ 标签、用户 ↔ 角色（权限系统的经典设计）。

---

## 外键约束的删除/更新行为

`FOREIGN KEY` 可以指定主表数据变化时从表怎么跟着变：

```sql
-- 以 orders 表为例，删除用户时订单跟着删
CONSTRAINT fk_orders_user
  FOREIGN KEY (user_id) REFERENCES user (id)
  ON DELETE CASCADE     -- 主表删除时：从表关联行也删除
  ON UPDATE CASCADE;    -- 主表更新主键时：从表跟着更新
```

| 行为        | 效果                                  |
| ----------- | ------------------------------------- |
| `CASCADE`   | 主表删，从表关联数据跟着删            |
| `SET NULL`  | 主表删，从表外键置为 NULL（列需可空） |
| `RESTRICT`  | 主表有关联数据时禁止删除（默认行为）  |
| `NO ACTION` | 同 RESTRICT（InnoDB 中两者等价）      |

> **实际项目怎么选**：大公司普遍倾向「逻辑外键」——数据库不建 `FOREIGN KEY` 约束，只保证字段值正确，关联逻辑由应用层（或定期对账脚本）维护。原因是外键带来额外的约束检查开销，且不利于分库分表。学习阶段和中小项目用物理外键没问题，能兜住数据一致性。

## 三种关系与 JOIN 的对应

| 关系   | 典型查询                                            |
| ------ | --------------------------------------------------- |
| 一对多 | `JOIN orders o ON o.user_id = u.id`                 |
| 一对一 | `JOIN user_profile p ON p.user_id = u.id`           |
| 多对多 | 中间表连两次：`student JOIN student_course JOIN course` |

更多 JOIN 语法（内连接/外连接/笛卡尔积/自连接）见「查询进阶」章节。

## 与 MongoDB 的对照

| 关系   | MySQL 做法          | MongoDB 做法                   |
| ------ | ------------------- | ------------------------------ |
| 一对多 | 外键 + JOIN         | 内嵌数组 或 引用 + `$lookup`   |
| 一对一 | 拆表 + UNIQUE 外键  | 直接内嵌成一个文档             |
| 多对多 | 中间表              | 双方存对方 ID 数组             |

关系型数据库靠「外键 + JOIN」，文档数据库靠「内嵌或引用」，这是两类数据库最本质的思维差异。
