---
title: 文件操作
order: 1
---

# 文件操作

## 读取文件

```js
import fs from "fs";

fs.readFile("./test.txt", "utf-8", (err, data) => {
  if (err) {
    console.log(err);
    return;
  }
  console.log(data);
});
```

## 写入文件

重写文件：writeFile

```js
fs.writeFile("./test.txt", "hello world", (err) => {
  if (err) {
    console.log(err);
    return;
  }
  console.log("write success");
});
```

文件追加：先读取，后写入

```js
fs.readFile("./test.txt", "utf-8", (err, data) => {
  if (err) {
    console.log(err);
    return;
  }
  fs.writeFile("./test.txt", data + "!!!", (err) => {
    if (err) {
      console.log(err);
      return;
    }
    console.log("write success");
  });
});
```