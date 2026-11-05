---
title: 在 Node.js 中使用
order: 9
---

# 在 Node.js 中使用 MySQL

在 Node.js 中连接 MySQL 有两种常用方式：

- **`mysql2` 驱动**：性能好、支持 Promise，适合直接写 SQL 的场景
- **ORM**（Sequelize、TypeORM、Prisma 等）：用对象映射代替手写 SQL，适合复杂业务

## 使用 mysql2

### 安装

```shell
npm install mysql2
```

### 基本连接与查询

mysql2 提供 promise API，查询结果 `rows` 直接就是对象数组：

```js
// 引入 mysql2/promise（Promise 版本）
const mysql = require("mysql2/promise");

async function testConnectDB() {
  // 创建连接
  const connection = await mysql.createConnection({
    host: "localhost", // 主机地址
    port: 3306, // 端口，默认 3306
    user: "root", // 用户名
    password: "123456", // 密码
    database: "my_test", // 数据库
  });
  console.log("✅ MySQL 连接成功！");

  try {
    // 查询：返回 [rows, fields]，通常只用 rows
    // ? 是占位符，第二个参数传入对应的值，可防止 SQL 注入
    const [rows] = await connection.query(
      "SELECT * FROM user WHERE age > ?",
      [18]
    );
    console.log("📄 查询到的数据：", rows);
  } catch (err) {
    console.error("❌ 操作失败：", err);
  } finally {
    // 关闭连接
    await connection.end();
    console.log("✅ MySQL 连接已关闭");
  }
}

// 执行
testConnectDB();
```

### 连接池（推荐）

实际项目必须使用连接池：复用连接，避免每次查询都重新建立连接。

```js
// 引入 mysql2/promise
const mysql = require("mysql2/promise");

// 创建连接池（应用启动时创建一次，全局复用）
const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "123456",
  database: "my_test",
  waitForConnections: true, // 连接用尽时排队等待
  connectionLimit: 10, // 最大连接数
  maxIdle: 10, // 最大空闲连接
  idleTimeout: 60000, // 空闲连接超时（毫秒）
});

// 增删改查示例
async function crudDemo() {
  // 1. 插入
  const [result] = await pool.query(
    "INSERT INTO user (name, age) VALUES (?, ?)",
    ["张三", 20]
  );
  console.log("✅ 插入成功，自增 ID：", result.insertId);

  // 2. 查询
  const [rows] = await pool.query("SELECT * FROM user WHERE id = ?", [
    result.insertId,
  ]);
  console.log("📄 查询结果：", rows);

  // 3. 更新
  await pool.query("UPDATE user SET age = ? WHERE id = ?", [
    21,
    result.insertId,
  ]);

  // 4. 删除
  await pool.query("DELETE FROM user WHERE id = ?", [result.insertId]);
}

// 执行
crudDemo();
```

> **注意**：SQL 中的 `?` 是占位符，配合参数数组使用可以**防止 SQL 注入**。不要用字符串拼接用户输入的值。

### 事务

```js
// 从池中取出一个连接（事务内的语句必须使用同一个连接）
const connection = await pool.getConnection();
try {
  // 开启事务
  await connection.beginTransaction();
  // 扣除转出方余额
  await connection.query(
    "UPDATE account SET balance = balance - 100 WHERE id = ?",
    [1]
  );
  // 增加转入方余额
  await connection.query(
    "UPDATE account SET balance = balance + 100 WHERE id = ?",
    [2]
  );
  // 提交事务
  await connection.commit();
  console.log("✅ 转账成功");
} catch (err) {
  // 出错回滚
  await connection.rollback();
  console.error("❌ 已回滚：", err);
} finally {
  // 归还连接到池中
  connection.release();
}
```

## 使用 ORM

ORM（对象关系映射）用 JavaScript 对象表示表和行，屏蔽手写 SQL。常见选择：

| ORM      | 特点                                       |
| -------- | ------------------------------------------ |
| Sequelize | 老牌、文档全、功能稳定                    |
| TypeORM  | 装饰器风格，与 TypeScript、NestJS 配合好   |
| Prisma   | 现代化，Schema 声明式定义，类型提示极强    |
| Knex.js  | 查询构建器，介于原生 SQL 和 ORM 之间       |

### Prisma 快速上手

```shell
npm install prisma --save-dev
npm install @prisma/client
# 生成 schema.prisma 和 .env
npx prisma init
```

在 `schema.prisma` 中定义模型：

```prisma
model User {
  id   Int    @id @default(autoincrement())
  name String
  age  Int?   @default(0)
}
```

生成客户端并同步到数据库：

```shell
# 根据模型生成客户端代码
npx prisma generate
# 将模型同步到数据库
npx prisma db push
```

使用客户端操作数据：

```js
// 引入 Prisma 客户端
import { PrismaClient } from "@prisma/client";

// 创建实例
const prisma = new PrismaClient();

async function main() {
  // 1. 创建
  const user = await prisma.user.create({
    data: { name: "张三", age: 20 },
  });

  // 2. 查询：gte 等价于 SQL 的 WHERE age >= 18
  const adults = await prisma.user.findMany({
    where: { age: { gte: 18 } },
  });

  // 3. 更新
  await prisma.user.update({
    where: { id: user.id },
    data: { age: 21 },
  });

  // 4. 删除
  await prisma.user.delete({ where: { id: user.id } });
}

// 执行
main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

## mysql2 与 ORM 对比

| 特性       | mysql2          | ORM                |
| ---------- | --------------- | ------------------ |
| 学习成本   | 需要熟悉 SQL    | 需要学习框架本身   |
| 灵活性     | 完全掌控 SQL    | 复杂查询可能受限   |
| 类型安全   | 需手动处理      | 强类型支持（TS 友好） |
| 开发效率   | 写 SQL 较繁琐   | 模型定义后效率高   |
| 适用场景   | 性能敏感、复杂查询 | 常规业务、团队协作 |

> **建议**：中小项目用 mysql2 直写 SQL 完全够用；表关系复杂、团队规模大、TypeScript 项目优先考虑 ORM。两者也可以混用——日常用 ORM，复杂查询回落到原生 SQL。
