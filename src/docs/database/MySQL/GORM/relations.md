---
title: 关联关系
order: 4
---

# 关联关系

GORM 支持「一对多（has many）」「一对一（has one）」「多对一（belongs to）」「多对多（many2many）」四种关联。本章沿用「表的关系」章节的学生选课例子。

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

## 多对一（belongs to）

反过来，订单属于一个用户：

```go
type Order struct {
  ID     uint `gorm:"primaryKey"`
  UserID uint `gorm:"index"`
  User   User `gorm:"foreignKey:UserID"`
}
```

| 关联类型   | 外键放在哪   | 典型场景        |
| ---------- | ------------ | --------------- |
| has many   | 「多」的一方 | 用户 → 订单     |
| belongs to | 当前表       | 订单 → 用户     |
| has one    | 「从」的一方 | 用户 ↔ 用户详情 |
| many2many  | 中间表       | 学生 ↔ 课程     |

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

## 预加载 Preload

关联数据默认**不会**随主表一起查出来（GORM 不做自动 JOIN），必须显式 `Preload`：

```go
var users []User

db.Preload("Orders").Find(&users)                       // 加载订单
db.Preload("Orders", "amount > ?", 100).Find(&users)    // 带条件
db.Preload("Orders.OrderItems").Find(&users)            // 多层嵌套
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
```

| 方法     | 中间表         | 目标表（如 course） |
| -------- | -------------- | ------------------- |
| `Append` | 插入关联行     | 新建并插入          |
| `Delete` | 删除关联行     | **保留**            |
| `Clear`  | 删除全部关联行 | 保留                |

## 外键约束

默认 `AutoMigrate` 会一并创建物理外键，可以关闭：

```go
gorm.Config{DisableForeignKeyConstraintWhenMigrating: true}
```

| 策略     | 优点               | 缺点                           |
| -------- | ------------------ | ------------------------------ |
| 物理外键 | 数据库兜住一致性   | 约束检查有开销，不利于分库分表 |
| 逻辑外键 | 灵活、易分库分表   | 一致性靠应用层与对账保证       |

详见「表的关系」章节的实践取舍。
