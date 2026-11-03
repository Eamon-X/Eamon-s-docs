---
title: 库与表操作
order: 2
---

# 库与表操作

本章属于 DDL（数据定义语言），操作对象是数据库和表的结构。

## 数据库操作

```sql
-- 创建数据库
CREATE DATABASE my_test;

-- 创建数据库（指定字符集，推荐 utf8mb4）
CREATE DATABASE my_test DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;

-- 不存在才创建（避免报错）
CREATE DATABASE IF NOT EXISTS my_test;

-- 查看所有数据库
SHOW DATABASES;

-- 切换当前数据库
USE my_test;

-- 查看当前使用的数据库
SELECT DATABASE();

-- 删除数据库（不可恢复，谨慎！）
DROP DATABASE my_test;
```

> **注意**：`utf8mb4` 是真正的 UTF-8 编码，能存储 emoji 等四字节字符；MySQL 中的 `utf8` 只支持三字节，不推荐使用。

## 表操作

### 创建表

```sql
CREATE TABLE user (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT '主键',
  name VARCHAR(50) NOT NULL COMMENT '姓名',
  age TINYINT UNSIGNED DEFAULT 0 COMMENT '年龄',
  phone VARCHAR(20) UNIQUE COMMENT '手机号',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';
```

**整体结构**：`CREATE TABLE 表名 (列定义1, 列定义2, ...) 表选项;`

- 属于 DDL，执行后得到的是一张**只有结构、没有数据**的空表
- 括号内每一行定义一个列（字段），列与列之间用逗号分隔，最后一列不写逗号
- 每个列定义的固定套路：**列名 + 数据类型 + 约束（可多个）+ COMMENT 注释**

以上面 `user` 表为例，逐列拆解：

| 列定义                                            | 拆解                  | 作用                                                                     |
| ------------------------------------------------- | --------------------- | ------------------------------------------------------------------------ |
| `id INT AUTO_INCREMENT PRIMARY KEY`               | 整数 + 自增 + 主键    | 插入时不写 id，自动取上一条 +1；主键意味着非空、唯一，并自动创建主键索引 |
| `name VARCHAR(50) NOT NULL`                       | 变长字符串 + 非空     | 最长 50 个字符，不给值直接报错                                           |
| `age TINYINT UNSIGNED DEFAULT 0`                  | 无符号小整数 + 默认值 | `UNSIGNED` 去掉负数区间，范围变 0~255，够存年龄且省空间；不指定时自动填 0 |
| `phone VARCHAR(20) UNIQUE`                        | 字符串 + 唯一         | 整列不允许重复，自动创建唯一索引，重复插入报错                           |
| `created_at DATETIME DEFAULT CURRENT_TIMESTAMP`   | 日期时间 + 默认当前时间 | 插入时自动记录当前时间，无需业务代码手动传                             |

**COMMENT 的作用**：`COMMENT '主键'` 是纯元数据注释，不参与任何查询逻辑，只是写进表的定义里给人看：

- `DESC user` 能看到每列的注释
- `SHOW CREATE TABLE user` 能看到完整建表语句与注释
- Navicat、DBeaver 等图形化工具会直接显示

团队规范通常强制要求写 COMMENT——半年后接手的人（包括你自己）靠它看懂每个字段的用途。

**表选项**：括号外配置的是**整张表**的属性：

- `ENGINE=InnoDB`：存储引擎，支持事务、行级锁、崩溃恢复（MySQL 5.5+ 默认）
- `DEFAULT CHARSET=utf8mb4`：字符集用完整 UTF-8，能存 emoji；MySQL 的 `utf8` 只支持三字节，不要用
- `COMMENT='用户表'`：表级注释

**执行后的效果**：

```sql
-- 结构建好后，插入一条数据验证
INSERT INTO user (name, age) VALUES ('张三', 20);
-- id 没传 → 自动为 1；created_at 没传 → 自动填当前时间

-- UNIQUE 约束生效演示
INSERT INTO user (name, phone) VALUES ('李四', '13900000000'), ('王五', '13900000000');
-- ❌ Duplicate entry '13900000000' for key 'user.phone'

-- 查看结构和注释
DESC user;
```

常用约束：

| 约束           | 说明                           |
| -------------- | ------------------------------ |
| NOT NULL       | 非空                           |
| DEFAULT        | 默认值                         |
| UNIQUE         | 唯一                           |
| PRIMARY KEY    | 主键（非空 + 唯一）            |
| AUTO_INCREMENT | 自增（用于整数主键）           |
| FOREIGN KEY    | 外键                           |

> **提示**：`user` 在 MySQL 中不是保留字，可以直接使用；但它属于非保留关键字，且容易与系统表 `mysql.user` 混淆。实际项目中用反引号 `` `user` `` 包裹，或改名为 `sys_user` 更稳妥。

### 查看表

```sql
-- 查看当前库的所有表
SHOW TABLES;

-- 查看表结构
DESC user;

-- 查看建表语句
SHOW CREATE TABLE user;
```

### 修改表（ALTER TABLE）

```sql
-- 添加字段
ALTER TABLE user ADD COLUMN email VARCHAR(100) COMMENT '邮箱';

-- 修改字段类型（MODIFY 不改名）
ALTER TABLE user MODIFY COLUMN name VARCHAR(100) NOT NULL;

-- 改名并修改类型（CHANGE 必须写新名）
ALTER TABLE user CHANGE COLUMN name username VARCHAR(100);

-- 删除字段
ALTER TABLE user DROP COLUMN email;

-- 修改表名
ALTER TABLE user RENAME TO sys_user;
-- 或
RENAME TABLE user TO sys_user;
```

### 删除与清空

```sql
-- 删除表（结构 + 数据一起删除）
DROP TABLE user;

-- 表不存在时避免报错
DROP TABLE IF EXISTS user;

-- 清空数据但保留表结构（并重置自增 ID）
TRUNCATE TABLE user;
```

### DELETE、TRUNCATE、DROP 对比

| 对比项     | DELETE               | TRUNCATE | DROP        |
| ---------- | -------------------- | -------- | ----------- |
| 删除内容   | 数据（可带 WHERE）   | 全部数据 | 结构 + 数据 |
| 保留表结构 | 是                   | 是       | 否          |
| 重置自增 ID | 否                  | 是       | —           |
| 可以回滚   | 是（事务内可回滚）   | 否       | 否          |
| 触发器     | 触发                 | 不触发   | 不触发      |

> **注意**：`DROP` 是最危险的操作，表结构和数据一起消失且无法回滚，生产环境务必先备份。
