---
title: 事务
order: 7
---

# 事务

事务把一组 SQL 作为一个整体执行：保证成批的SQL语句要么全部成功，要么全部失败回滚。最经典的场景是转账——扣款和到账必须同时发生，或同时不发生。

## ACID 特性

| 特性                    | 含义                                       |
| ----------------------- | ------------------------------------------ |
| 原子性 Atomicity        | 事务内的操作要么全做，要么全不做           |
| 一致性 Consistency      | 事务前后数据都处于合法状态                 |
| 隔离性 Isolation        | 并发事务之间互不干扰                       |
| 持久性 Durability       | 提交后的数据永久保存（依赖 redo log）      |

## 事务基本用法

```sql
-- 开启事务
BEGIN;  -- 或 START TRANSACTION;

-- 扣除转出方余额
UPDATE account SET balance = balance - 100 WHERE id = 1;

-- 增加转入方余额
UPDATE account SET balance = balance + 100 WHERE id = 2;

-- 都成功则提交
COMMIT;

-- 任一步失败则回滚（撤销未提交的所有操作）
ROLLBACK;
```

> **注意**：只有 InnoDB 支持事务。MyISAM 表执行事务语句不会报错，但没有回滚能力。

## 并发问题

多个事务并发执行时，可能出现三类问题：

| 问题       | 描述                                           | 示例                            |
| ---------- | ---------------------------------------------- | ------------------------------- |
| 脏读       | 读到了其他事务**未提交**的数据                 | 事务 A 读到 B 回滚前的余额      |
| 不可重复读 | 同一事务内两次读取同一行结果不同（他人 UPDATE） | 两次读余额分别为 100 和 80     |
| 幻读       | 同一事务内两次范围查询行数不同（他人 INSERT/DELETE） | 两次 COUNT 分别为 10 和 11 |

## 隔离级别

MySQL 通过隔离级别在「性能」与「正确性」之间做权衡：

| 隔离级别          | 脏读 | 不可重复读 | 幻读 | 说明               |
| ----------------- | ---- | ---------- | ---- | ------------------ |
| READ UNCOMMITTED  | 可能 | 可能       | 可能 | 几乎不用           |
| READ COMMITTED    | 避免 | 可能       | 可能 | Oracle 默认        |
| REPEATABLE READ   | 避免 | 避免       | 可能*| **MySQL 默认**     |
| SERIALIZABLE      | 避免 | 避免       | 避免 | 串行执行，性能最差 |

> InnoDB 在 `REPEATABLE READ` 下通过 MVCC + 间隙锁（Next-Key Lock）在很大程度上避免了幻读，所以标为「可能*」。锁的具体机制见「锁」章节。

## 查看与设置隔离级别

```sql
-- 查看当前隔离级别（MySQL 8.0）
SELECT @@transaction_isolation;

-- 设置当前会话的隔离级别
SET SESSION TRANSACTION ISOLATION LEVEL READ COMMITTED;
```

## 自动提交

MySQL 默认开启自动提交（`autocommit=1`），每条语句都是一个独立事务：

```sql
-- 查看自动提交状态（1 为开启）
SELECT @@autocommit;

-- 关闭自动提交，之后的语句需要手动 COMMIT
SET autocommit = 0;
```

> **建议**：业务代码中推荐用编程语言的事务 API 管理事务（见「在 Node.js 中使用」章节），避免在 SQL 脚本里手动维护 BEGIN/COMMIT。
