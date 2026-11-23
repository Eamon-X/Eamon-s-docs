---
title: 关联关系
order: 4
---

# 关联关系

GORM 支持「一对多（has many）」「一对一（has one）」「多对一（belongs to）」「多对多（many2many）」四种关联。本章沿用「表的关系」章节的学生选课例子。

## 速查：先记这几条

### 1. 外键在哪张表，决定用哪种关联

| 外键在哪 | 关联类型 | 结构体里怎么写 | 典型场景 |
| --- | --- | --- | --- |
| 「多」的一方 | has many | 父里放 `[]子` | 用户 → 订单 |
| 当前表 | belongs to | 当前里放 `子` | 订单 → 用户 |
| 对方表 + 唯一索引 | has one | 父里放 `*子` | 用户 ↔ 用户详情 |
| 都没有，多一张中间表 | many2many | 双方放 `[]对方` | 学生 ↔ 课程 |

### 2. `foreignKey` 填外键列，`references` 填被引用的列

```go
// has many / has one：外键在「对方」表
Orders []Order `gorm:"foreignKey:UserID"`

// belongs to：外键在「当前」表
User User `gorm:"foreignKey:UserID"`

// 不引用主键时（如用用户编号关联订单），用 references 指定
Orders []Order `gorm:"foreignKey:UserCode;references:Code"`
```

- `foreignKey`：存引用值的列（外键列）
- `references`：被引用的列，**默认是主键 `ID`**，只有换关联列时才需要写

### 3. 字段名符合「类型名 + ID」时，标签可以省略

外键列叫 `UserID`、关联结构体叫 `User`，GORM 能自动匹配，`gorm:"foreignKey:UserID"` 可以不写。

### 4. 行为规则（最实用的部分）

| 想做什么 | 正确做法 | 注意 |
| --- | --- | --- |
| 读关联数据 | `Preload("Orders")` | 关联**默认不加载**，不写就查不到 |
| 用关联表筛选主表 | `Joins("Orders")` | `Joins` 不填充集合，且可能出重复行 |
| 新建主记录 + 关联 | `Create` 自动级联插入 | 更新时不会删除被移除的关联 |
| 只增删改关联关系 | `Association(...).Append/Delete` | 不触碰主表，`Delete` 保留目标记录 |
| 物理删除父记录 | 手动清理子表，或配 `constraint:OnDelete:CASCADE` | 默认外键没配 CASCADE，会被数据库拦住报错 |

### 5. 三个最常见的坑

1. 一对一忘给外键加 `uniqueIndex` → 悄悄退化成一对多
2. 多对多带额外字段（如成绩）不调 `SetupJoinTable` → 中间表只建两个外键，成绩列丢失
3. `Preload` 的名字必须和**结构体字段名完全一致**（如 `Preload("Orders")`）→ 写错会报 `unsupported relations` 或直接查不到数据

## 一对多（has many）

一个用户有多笔订单：

```go
type User struct {
  ID     uint    `gorm:"primaryKey"`
  Name   string  `gorm:"size:50"`
  Orders []Order `gorm:"foreignKey:UserID"`  // 关联字段
}

type Order struct {
  ID     uint   `gorm:"primaryKey"`
  UserID uint   `gorm:"index"`               // 外键列
  Amount string `gorm:"type:decimal(10,2)"`
}
```

`foreignKey:UserID` 指明「Order 表里哪一列指向 User」。字段名规范时可以省略标签。

```go
// 1. 建用户时一并建订单（orders 的 user_id 自动回填）
user := User{
  Name:   "张三",
  Orders: []Order{{Amount: "99.00"}, {Amount: "199.00"}},
}
db.Create(&user)
// => INSERT INTO users (name) VALUES ('张三')
//    INSERT INTO orders (user_id, amount) VALUES (1, '99.00'), (1, '199.00')

// 2. 查用户时把订单一起带出来
var u User
db.Preload("Orders").First(&u, 1)

// 3. 只查某个用户的订单（不需要用户信息时，直接查子表更省）
var orders []Order
db.Where("user_id = ?", 1).Order("id DESC").Find(&orders)
```

## 多对一（belongs to）

反过来，订单属于一个用户：

```go
type Order struct {
  ID     uint `gorm:"primaryKey"`
  UserID uint `gorm:"index"`
  User   User `gorm:"foreignKey:UserID"`
}
```

> `has many` 和 `belongs to` 是同一段关系的两个方向，可以只定义一边，也可以两边都定义——两边都写不会多建列，只是两个结构体都能直接访问对方。

```go
// 1. 查订单时带出下单用户
var orders []Order
db.Preload("User").Find(&orders)
// => SELECT * FROM orders
//    SELECT * FROM users WHERE id IN (1, 2, 3)

// 2. 用 Joins 一次查完，并按用户字段筛选
db.Joins("User").Where("users.city = ?", "北京").Find(&orders)
// => SELECT orders.* FROM orders LEFT JOIN users ON users.id = orders.user_id
//    WHERE users.city = '北京'
```

### 用非主键列关联：`references`

默认外键引用主表的**主键**（`users.id`）。如果业务上要用别的列关联，比如外部系统给的用户编号，就用 `references` 指定被引用的列：

```go
type User struct {
  ID     uint    `gorm:"primaryKey"`
  Code   string  `gorm:"size:32;uniqueIndex"`  // 业务唯一编号，如 "U1001"
  Orders []Order `gorm:"foreignKey:UserCode;references:Code"`
}

type Order struct {
  ID       uint   `gorm:"primaryKey"`
  UserCode string `gorm:"size:32;index"`  // 存的是 users.code，不是 users.id
}
```

```go
db.Preload("Orders").First(&u, 1)
// 关联条件变成：orders.user_code = users.code
// => SELECT * FROM orders WHERE user_code IN ('U1001', ...)
```

两个标签的分工：

| 标签 | 写什么 | 在哪张表 |
| --- | --- | --- |
| `foreignKey` | 存引用值的列（外键列） | belongs to 在**当前**表；has many / has one 在**对方**表 |
| `references` | 被引用的列，**不写默认主键 ID** | 被关联的那张表 |

> `references` 指向的列必须有**唯一索引**（或至少唯一），否则一个 Code 能对出多条 User，关联就退化成一对多。上面的 `uniqueIndex` 别漏。

## 一对一（has one）

```go
type User struct {
  ID      uint         `gorm:"primaryKey"`
  Name    string       `gorm:"size:50"`
  Profile *UserProfile `gorm:"foreignKey:UserID"`
}

type UserProfile struct {
  ID     uint   `gorm:"primaryKey"`
  UserID uint   `gorm:"uniqueIndex"`  // 唯一索引保证一对一
  IDCard string `gorm:"size:18"`
}
```

> 一对一的关键是外键列加**唯一索引**，否则就变成了「一个用户可以有多份详情」。

```go
// 1. 用户和详情一起创建
db.Create(&User{
  Name:    "张三",
  Profile: &UserProfile{IDCard: "110101199001011234"},
})
// => INSERT INTO users (name) VALUES ('张三')
//    INSERT INTO user_profiles (user_id, id_card) VALUES (1, '110101199001011234')

// 2. 查用户时带出详情
var u User
db.Preload("Profile").First(&u, 1)
if u.Profile != nil {
  fmt.Println(u.Profile.IDCard)
}
```

## 多对多（many2many）

```go
type Student struct {
  ID      uint     `gorm:"primaryKey"`
  Name    string   `gorm:"size:50"`
  Courses []Course `gorm:"many2many:student_course;"`
}

type Course struct {
  ID       uint      `gorm:"primaryKey"`
  Title    string    `gorm:"size:100"`
  Students []Student `gorm:"many2many:student_course;"`
}
```

自动建中间表 `student_course(student_id, course_id)`。

```go
// 1. 选课：中间表插一行关系
db.Model(&student).Association("Courses").Append(&course)
// => INSERT INTO student_course (student_id, course_id) VALUES (1, 2)

// 2. 查学生选了哪些课
var s Student
db.Preload("Courses").First(&s, 1)
for _, c := range s.Courses {
  fmt.Println(c.Title)
}

// 3. 反查：这门课有哪些学生
var c Course
db.Preload("Students").First(&c, 2)

// 4. 退课：只删中间表的关系，course 表的数据不动
db.Model(&student).Association("Courses").Delete(&course)
// => DELETE FROM student_course WHERE student_id = 1 AND course_id = 2
```

### 中间表带额外字段（如成绩）

```go
type StudentCourse struct {
  StudentID uint    `gorm:"primaryKey"`
  CourseID  uint    `gorm:"primaryKey"`
  Score     float64 `gorm:"type:decimal(5,1)"`
}

// 必须在 AutoMigrate 之前注册
db.SetupJoinTable(&Student{}, "Courses", &StudentCourse{})
db.AutoMigrate(&Student{}, &Course{}, &StudentCourse{})
```

对应 MySQL 里的三张表：

```sql
CREATE TABLE student (id INT PRIMARY KEY, name VARCHAR(50));
CREATE TABLE course  (id INT PRIMARY KEY, title VARCHAR(100));
CREATE TABLE student_course (
  student_id INT, course_id INT, score DECIMAL(5,1),
  PRIMARY KEY (student_id, course_id)
);
```

> 自定义中间模型后，`Association("Courses").Append(...)` 只会写两个外键，**不会写 score**。要写成绩必须手动 `db.Create(&StudentCourse{...})`。

```go
// 录成绩：直接写中间表
db.Create(&StudentCourse{StudentID: 1, CourseID: 2, Score: 95.5})
// => INSERT INTO student_course (student_id, course_id, score) VALUES (1, 2, 95.5)

// 查某个学生的成绩单（带课程名要再 Joins 一次 course 表）
var records []StudentCourse
db.Where("student_id = ?", 1).Find(&records)

// 改成绩
db.Model(&StudentCourse{}).
  Where("student_id = ? AND course_id = ?", 1, 2).
  Update("score", 88)
```

## 预加载 Preload

关联数据默认**不会**随主表一起查出来（GORM 不做自动 JOIN），必须显式 `Preload`：

```go
var users []User

db.Preload("Orders").Find(&users)                       // 加载订单
db.Preload("Orders", "amount > ?", 100).Find(&users)    // 带条件
db.Preload("Orders.OrderItems").Find(&users)            // 多层嵌套

// 自定义预加载：只取部分列并排序
db.Preload("Orders", func(db *gorm.DB) *gorm.DB {
  return db.Select("id", "user_id", "amount").Order("amount DESC")
}).Find(&users)

// 一次预加载结构体里的所有关联（需 import "gorm.io/gorm/clause"）
db.Preload(clause.Associations).Find(&users)
```

### N+1 问题

```go
// ❌ 循环里逐条查：1 次主查询 + N 次子查询
for _, u := range users {
  db.Where("user_id = ?", u.ID).Find(&u.Orders)
}

// ✅ Preload：2 条 SQL（主表 1 条 + 关联表 1 条 IN 查询）
db.Preload("Orders").Find(&users)
```

`Preload` 不是 JOIN，而是「先查主表，再用 `WHERE user_id IN (...)` 查关联表」，不会产生重复行。

### Preload vs Joins

| 方式      | SQL 形态                  | 适用场景                               |
| --------- | ------------------------- | -------------------------------------- |
| `Preload` | 2 条独立查询              | 需要拿到完整关联集合（一对多、多对多） |
| `Joins`   | 单条 JOIN，只填充当前对象 | 用关联表**筛选**主表，或填充单个关联对象 |

```go
// 只查下过订单的用户（用 JOIN 过滤，不需要订单明细）
db.Joins("Orders").Find(&users)

// Joins 能填充「单个」关联对象（belongs to / has one）
var orders []Order
db.Joins("User").Find(&orders)   // orders[i].User 有值

// 条件写在关联表上，记得带表名
db.Joins("Orders").Where("orders.amount > ?", 100).Find(&users)
```

> 一对多/多对多要拿**集合**时用 `Preload`；用关联表条件筛选、且只关心主表结果时用 `Joins`。混用容易查出重复的 User。

## 关联操作 Association

`Association` 用于增删改关联关系，不触碰主表：

```go
db.Model(&student).Association("Courses").Append(&course)    // 追加关系
db.Model(&student).Association("Courses").Replace(&c1, &c2)  // 替换全部
db.Model(&student).Association("Courses").Delete(&course)    // 解除关系
db.Model(&student).Association("Courses").Clear()            // 清空关系
count := db.Model(&student).Association("Courses").Count()   // 统计

// 查询关联数据（等价于 Preload，但只针对单个对象）
var courses []Course
db.Model(&student).Association("Courses").Find(&courses)
```

常见组合：先查学生，再按业务追加/移除课程：

```go
var s Student
db.First(&s, 1)   // 必须先有主键，Association 才知道操作谁

var c Course
db.First(&c, 2)

db.Model(&s).Association("Courses").Append(&c)  // s 选上 c 这门课
```

| 方法     | 中间表         | 目标表（如 course） |
| -------- | -------------- | ------------------- |
| `Append` | 插入关联行     | 新建并插入          |
| `Delete` | 删除关联行     | **保留**            |
| `Clear`  | 删除全部关联行 | 保留                |

## 外键约束

默认 `AutoMigrate` 会一并创建物理外键：

```sql
ALTER TABLE orders ADD CONSTRAINT fk_users_orders
  FOREIGN KEY (user_id) REFERENCES users (id);
```

想让删除用户时数据库自动删掉其订单，在关联字段上加 `constraint`：

```go
type User struct {
  Orders []Order `gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE"`
}
// => ... FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
```

不需要物理外键（分库分表场景）可以全局关闭：

```go
gorm.Config{DisableForeignKeyConstraintWhenMigrating: true}
```

| 策略     | 优点               | 缺点                           |
| -------- | ------------------ | ------------------------------ |
| 物理外键 | 数据库兜住一致性   | 约束检查有开销，不利于分库分表 |
| 逻辑外键 | 灵活、易分库分表   | 一致性靠应用层与对账保证       |

详见「表的关系」章节的实践取舍。
