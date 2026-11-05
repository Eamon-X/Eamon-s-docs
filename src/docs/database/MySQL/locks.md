---
title: 锁
order: 8
---

# 锁

事务解决了「一组操作要么全成功要么全失败」，但多个事务同时改同一行时仍会互相打架。**锁**就是数据库用来协调并发访问的机制。锁与事务、隔离级别、索引三者紧密相关。

## 锁的粒度

按「锁定范围」从小到大：

| 粒度   | 范围               | 特点                                       | 常用程度 |
| ------ | ------------------ | ------------------------------------------ | ----- |
| 全局锁 | 整个数据库实例     | `FLUSH TABLES WITH READ LOCK`，备份时用    | 极少  |
| 表锁   | 整张表             | `LOCK TABLES`，MyISAM 的主要方式，开销小   | 少    |
| 页锁   | 一页（16KB）       | 仅 BDB 引擎使用                            | 不用  |
| 行锁   | 单条索引记录       | InnoDB 默认，并发度高、开销大              | 最常用 |

**InnoDB 默认使用行锁**：只锁需要修改的行，其他事务仍可操作同表其他行。但行锁只在**命中索引**时才真正是「行级锁」，否则会退化成大范围锁定（见下文）。

## 锁的模式：共享锁与排他锁

**共享锁就是读锁，排他锁就是写锁**——同一套机制在不同层级用了两套叫法。「共享 / 排他」说的是「能不能和别人共用」（锁的本质），「读 / 写」说的是「拿来干什么」（业务意图）。

| 模式 | 常见叫法        | 行级语法                                   | 表级语法                     | 简称  |
| ---- | --------------- | ------------------------------------------ | ---------------------------- | ----- |
| 共享 | 读锁 / 共享锁   | `FOR SHARE`（旧写法 `LOCK IN SHARE MODE`） | `LOCK TABLES ... READ`       | S 锁  |
| 排他 | 写锁 / 排他锁 / 独占锁 | `FOR UPDATE`                        | `LOCK TABLES ... WRITE`      | X 锁  |

两种模式作用在不同层级：

```
共享锁 S（读锁）
├── 表级：LOCK TABLES user READ     → 锁整张表
└── 行级：SELECT ... FOR SHARE      → 锁命中的索引记录

排他锁 X（写锁）
├── 表级：LOCK TABLES user WRITE    → 锁整张表
└── 行级：SELECT ... FOR UPDATE     → 锁命中的索引记录
```

兼容规则两边通用：**读锁和读锁可以共存，读写、写写都会冲突**。

| 已持有 \ 想获取 | S 锁（读锁） | X 锁（写锁） |
| --------------- | ------------ | ------------ |
| S 锁（读锁）    | 兼容         | 冲突         |
| X 锁（写锁）    | 冲突         | 冲突         |

```sql
-- 共享锁：我要读，且不希望读的过程中被人改
SELECT * FROM account WHERE id = 1 FOR SHARE;

-- 排他锁：我要改，独占这一行
SELECT * FROM account WHERE id = 1 FOR UPDATE;
UPDATE account SET balance = balance - 100 WHERE id = 1;
```

> **注意**：`FOR SHARE` / `FOR UPDATE` 必须放在事务里（`BEGIN` 之后）。在 `autocommit=1` 下语句结束锁就释放了，等于没加锁。

**表级与行级的细微差别**：概念虽对应，但行为不完全对称。

| 对比点 | 行级 S 锁（`FOR SHARE`） | 表级 READ 锁（`LOCK TABLES ... READ`） |
| --- | --- | --- |
| 持有者能否后续写同一行 | **可以升级**：若没有其他事务持 S 锁，会升级为 X 锁 | **不可以**，直接报 `locked with a READ lock and can't be updated` |
| 理解方式 | 本质是「共享」，允许升级 | 本质是「只读」，硬性限制 |

行锁的 S → X 升级是「先查后改」的正常流程；表锁的 READ 则是真的只读。所以「读锁」这个叫法在表级更贴切，在行级更接近「共享锁」。

> 不要混淆：**意向锁（IS/IX）**是表级的「标记锁」，只表明表内有行被锁，不属于读写锁；**乐观锁 / 悲观锁**是业务层策略，不属于数据库锁类型（乐观锁甚至不用数据库锁）。

## 表级锁：加锁与解锁

行锁由 InnoDB 在事务中自动管理，而**表锁需要手动加、手动解**。

### 加表锁：LOCK TABLES

```sql
-- 读锁：本会话只能读，不能写；其他会话可以读，不能写
LOCK TABLES user READ;

-- 写锁：本会话可读写；其他会话读和写都被阻塞
LOCK TABLES user WRITE;

-- 一条语句里同时锁多张表
LOCK TABLES user READ, orders WRITE;
```

读写锁的效果对照：

| 锁类型             | 当前会话      | 其他会话          |
| ------------------ | ------------- | ----------------- |
| `LOCK TABLES ... READ`  | 只能 `SELECT` | 可以 `SELECT`，写入阻塞 |
| `LOCK TABLES ... WRITE` | 可读可写      | 读写全部阻塞      |

```sql
-- 会话 A
LOCK TABLES account READ;
SELECT * FROM account;                          -- ✅ 正常
UPDATE account SET balance = 0 WHERE id = 1;    -- ❌ Table 'account' was locked with a READ lock and can't be updated

-- 会话 B（A 持读锁期间）
SELECT * FROM account;                          -- ✅ 可以读
UPDATE account SET balance = 0 WHERE id = 1;    -- ⏳ 阻塞，直到 A 解锁
```

两个必须记住的限制：

1. **加了表锁之后，当前会话只能访问被锁定的表**。锁了 `user` 再查 `orders` 会报 `Table 'orders' was not locked with LOCK TABLES`，所以多表操作要把所有表都写进 `LOCK TABLES` 列表。
2. **`LOCK TABLES` 会隐式提交当前事务**。它和 `BEGIN ... COMMIT` 不能混用，InnoDB 表上应优先用行锁而不是表锁。

### 解表锁：UNLOCK TABLES

```sql
UNLOCK TABLES;   -- 释放当前会话持有的所有表锁
```

- 一条 `UNLOCK TABLES` 释放**本会话全部的**表锁，不能只解其中一张
- 会话断开（连接关闭）时，MySQL 会自动释放该会话的所有锁，包括表锁和行锁
- `UNLOCK TABLES` 只释放表锁，**不会**释放事务中的行锁——行锁只能靠 `COMMIT` / `ROLLBACK` 结束

### 全局读锁（备份场景）

```sql
-- 整个实例进入只读状态，所有写操作阻塞
FLUSH TABLES WITH READ LOCK;

-- 解除
UNLOCK TABLES;
```

用于 `mysqldump` 拿一致性快照，加锁期间禁止一切写入。MySQL 8.0 更推荐 `LOCK INSTANCE FOR BACKUP`（对业务影响更小）。

> MySQL 8.0 的 `LOCK TABLES ... READ LOCAL` 中 `LOCAL` 参数是 MyISAM 时代为「允许并发插入」设计的，对 InnoDB 没有实际意义。

### 各类锁的释放方式汇总

| 锁类型                | 加锁方式                          | 释放方式                              |
| --------------------- | --------------------------------- | ------------------------------------- |
| 表锁（读/写）         | `LOCK TABLES ... READ / WRITE`    | `UNLOCK TABLES`、会话断开             |
| 行锁（S / X）         | `FOR SHARE` / `FOR UPDATE`        | `COMMIT`、`ROLLBACK`、会话断开        |
| 全局读锁              | `FLUSH TABLES WITH READ LOCK`     | `UNLOCK TABLES`                       |
| 普通 DML 的隐式锁     | InnoDB 自动加                     | 事务结束（提交/回滚）                 |
| 元数据锁（MDL）       | 执行 DDL 时自动加                 | 语句或事务结束                        |

> 口诀：**表锁用 `UNLOCK TABLES` 解，行锁只能等事务结束，会话断开一切归零。**

## 意向锁

InnoDB 在给某一行加锁之前，会先在**表级**加一个「意向锁」，表示「这张表里有行被锁了」。这样别的事务想加表锁时，不用逐行检查就知道表里有没有冲突。

| 意向锁          | 含义                     |
| --------------- | ------------------------ |
| `IS`（意向共享）| 表内有行持有 S 锁        |
| `IX`（意向排他）| 表内有行持有 X 锁        |

意向锁之间基本都兼容，它们只是给「表锁 vs 行锁」提供快速判断，用户通常感知不到。

## InnoDB 行锁的三种形态

行锁锁的是**索引记录**，按索引结构的不同分为三种：

| 形态                | 锁住什么                             | 生效条件                    |
| ------------------- | ------------------------------------ | --------------------------- |
| Record Lock（记录锁）| 单条索引记录本身                     | 唯一索引**等值**命中时      |
| Gap Lock（间隙锁）  | 两条索引记录之间的「空隙」，阻止插入 | 仅 `REPEATABLE READ` 生效   |
| Next-Key Lock（临键锁） | 记录锁 + 它前面的间隙（左开右闭）  | `REPEATABLE READ` 默认行为  |

假设表里有 id = 1、5、10 三条记录：

```sql
-- 唯一索引等值命中 → 退化为 Record Lock，只锁 id=5 这一行
SELECT * FROM t WHERE id = 5 FOR UPDATE;

-- 范围查询 → Next-Key Lock，锁住 (1, 5] 和 (5, 10] 两段
SELECT * FROM t WHERE id > 1 AND id <= 10 FOR UPDATE;

-- 大于 5 → 锁 (5, 10] 以及 10 之后的间隙（supremum）
SELECT * FROM t WHERE id > 5 FOR UPDATE;
```

间隙锁的作用就是**防止其他事务在间隙里插入新行**，这也是 InnoDB 在 `REPEATABLE READ` 下能避免幻读的原因。

> 间隙锁只在 `REPEATABLE READ` 及更严格级别生效。`READ COMMITTED` 下不加间隙锁，只锁记录本身，所以会出现幻读（见「事务」章节）。

## 行锁到底锁的是什么

这是最容易踩坑的地方：**InnoDB 锁的是索引，不是数据行**。

```sql
-- ✅ phone 上有索引：只锁命中的那一行
SELECT * FROM user WHERE phone = '13800000000' FOR UPDATE;

-- ❌ name 没索引：全表扫描时给扫过的每一行都加锁，约等于锁全表
SELECT * FROM user WHERE name = '张三' FOR UPDATE;
```

| 查询条件                 | 实际锁定范围                              |
| ------------------------ | ----------------------------------------- |
| 唯一索引等值查询         | 单条记录（Record Lock）                   |
| 普通索引等值查询         | 命中记录 + 该值前后的间隙                 |
| 无索引条件               | 扫描到的所有记录 + 所有间隙 ≈ 锁全表      |
| 范围查询                 | 范围内所有记录及间隙（Next-Key Lock）     |

> **实践建议**：`FOR UPDATE` 的 `WHERE` 条件一定要走索引。否则并发稍高就会大面积阻塞，甚至比表锁更糟。

## 元数据锁（MDL）

除了数据锁，MySQL 还有一层**元数据锁**：执行 DDL（`ALTER TABLE`、`DROP TABLE`）时会对表加 MDL 排他锁，普通的 `SELECT` / `INSERT` 加 MDL 共享锁。

典型现象：一个长事务在跑，`ALTER TABLE` 一直卡住；而后续所有对这张表的查询也跟着排队——因为 `ALTER TABLE` 的 MDL 请求会优先，形成阻塞队列。

```sql
-- 排查：谁持有/等待 MDL
SELECT * FROM performance_schema.metadata_locks;
```

> 这就是「不要在业务高峰期做 DDL」的原因，也是长事务必须尽量避免的原因之一。

## 死锁

两个事务各自持有对方需要的锁，互相等待，形成环。

```sql
-- 事务 A                      -- 事务 B
BEGIN;                        BEGIN;
UPDATE account SET ... WHERE id = 1;   -- A 锁住 1
                              UPDATE account SET ... WHERE id = 2; -- B 锁住 2
UPDATE account SET ... WHERE id = 2;   -- A 等 B 释放 2
                              UPDATE account SET ... WHERE id = 1; -- B 等 A 释放 1
                                  ↑ 死锁
```

InnoDB 有**死锁检测**（`innodb_deadlock_detect`，默认开启），发现环后会自动回滚**代价较小**的那个事务，报 `1213 Deadlock found`。如果关闭检测，则靠 `innodb_lock_wait_timeout`（默认 50 秒）超时。

```sql
-- 查看最近一次死锁的详细信息
SHOW ENGINE INNODB STATUS;
-- 输出中找 LATEST DETECTED DEADLOCK 一段
```

避免死锁的四条经验：

1. **固定加锁顺序**：所有事务按同样的顺序访问资源（比如永远先小 id 后大 id）
2. **事务尽量短**：不要在事务里做 HTTP 请求、文件操作、发消息
3. **缩小锁范围**：`WHERE` 走索引，只锁必要的行
4. **批量操作分批**：一次更新 10 万行会长时间持有大量锁，改成每批 1000 行

## 悲观锁与乐观锁

这两个是**业务层的并发控制策略**，不是数据库自带的锁类型：

| 对比       | 悲观锁                        | 乐观锁                              |
| ---------- | ----------------------------- | ----------------------------------- |
| 思路       | 先锁住，再操作                | 先操作，提交时校验是否被改过        |
| 数据库实现 | `SELECT ... FOR UPDATE`       | 版本号 / 时间戳字段 + 条件更新      |
| 冲突少时   | 多余开销（白锁）              | 高效                                |
| 冲突多时   | 阻塞等待，可能死锁            | 大量重试                            |
| 适用场景   | 库存扣减、账户余额等强一致场景 | 更新冲突少、可重试的读改写场景      |

```sql
-- 悲观锁：先锁定再算
BEGIN;
SELECT stock FROM product WHERE id = 1 FOR UPDATE;
-- 校验库存后更新
UPDATE product SET stock = stock - 1 WHERE id = 1;
COMMIT;
```

```sql
-- 乐观锁：靠 version 保证「读到的值没被别人改过」
UPDATE product
SET stock = stock - 1, version = version + 1
WHERE id = 1 AND version = 3;   -- 影响行数为 0 说明被别人改过，业务层重试
```

## 排查锁等待

```sql
-- 当前有哪些锁
SELECT * FROM performance_schema.data_locks;

-- 谁在等谁（8.0）
SELECT * FROM performance_schema.data_lock_waits;

-- 查看当前连接与正在执行的 SQL
SHOW PROCESSLIST;
```

> MySQL 5.7 对应的是 `information_schema.innodb_locks` 和 `innodb_lock_waits`。

## 实践清单

- 事务尽量短，锁在事务结束时才释放
- `FOR UPDATE` 的查询条件必须走索引
- 需要并发控制时优先考虑乐观锁，冲突真的很多再用悲观锁
- 多表操作按固定顺序加锁，避免死锁
- 大批量更新拆成小批，每批提交
- 业务高峰期避免 DDL，防止 MDL 阻塞整表
