# 简介

Node.js 是一个除浏览器外能够运行 Javascript 的运行环境

ECMAScript 和 JavaScript 的关系是，前者是后者的规格，后者是前者的一种实现。ES6 就是指 ECMAScript 6

![Pasted image 20260105101125](../../../assets/Pasted%20image%2020260105101125.png)

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

# 模块化

## ECMAScript Modules

ECMAScript Modules（ES 模块）是 JavaScript 的原生模块系统，提供编译时静态加载，支持 tree shaking 等优化，与 CommonJS（运行时加载）相比效率更高。‌

‌ES 模块与 CommonJS 的关键区别在于加载时机和引用机制 ‌：ES 模块是编译时加载，输出值为引用，支持静态分析；CommonJS 是运行时加载，输出值为拷贝。Node.js 中 import 可加载 CommonJS 模块，但 require()无法加载 ES 模块。

‌ 低版本的 NodeJs（18 及以下）会提示“set "type": "module" in the package.json or use the .mjs extension”，高版本（20 及以上）默认启用 ESM 模块解析，则不会提示。

核心是：

- import：导入
- export：导出

## CommonJS

核心是：

- require：导入
- module.exports：导出（module.可以省略）

```js
exports = module.exports = {};
```

# 脚手架

脚手架是一个能够创建项目初始化代码文件及目录的全局命令行工具

- 全局命令行执行能力
- 命令行交互能力
- 项目初始化代码下载能力

## 实现过程

### 1. 创建自定义全局命令

1. 新建文件夹`bin`并新建文件`cli.js`
2. 在项目根目录使用`npm init`初始化项目
3. ```json
   {
     "name": "mycli",
     "version": "1.0.0",
     "description": "",
     "main": "file.js",
     "bin": {
       "mycli": "bin/cli.js"
     },
     "scripts": {
       "test": "echo \"Error: no test specified\" && exit 1"
     },
     "author": "",
     "license": "ISC"
   }
   ```
4. 注册 npm 全局命令：
   - 在根目录下执行`npm link`
   - npm uninstall -g mycli 卸载链接

### 2. 命令参数接收处理

```bash
mycli # 执行全局命令
mycli --help
```

```js
#! /usr/bin/env node

console.log(process.argv);
/*
[
  'C:\\nvm4w\\nodejs\\node.exe', // 使用哪个程序来执行代码
  'C:\\nvm4w\\nodejs\\node_modules\\mycli\\bin\\cli.js', // 当前执行代码的所在路径
  '--help' // 当前参数
]
*/

const args = process.argv.slice(2);

console.log(args);

if (args[0] === "--help") {
  console.log("cli help");
}
```

实际中更多使用`commander`工具处理

```js
#! /usr/bin/env node

import { program } from "commander";

program.option("-f --framwork <framework>", "设置框架");

// 处理自定义指令
program
  .command("create <project-name> [other...]")
  .alias("crt") // create的别名
  .description("创建项目") // --help时显示的描述
  .action((projectName, other) => {
    console.log(projectName, other);
  }); // 处理create命令

program.parse(process.argv);
```

### 3. 终端交互

使用`inquirer`工具处理

```js
import inquirer from "inquirer";

inquirer
  .prompt([
    {
      type: "input", // 用户可输入内容
      name: "userName",
      message: "请输入你的名字",
    },
    {
      type: "select", // 单选
      name: "framework",
      message: "请选择你要使用的框架",
      choices: ["express", "koa", "egg"],
    },
  ])
  .then((answers) => {
    console.log(answers);
  });
```

### 4. 下载远程项目代码

使用`download-git-repo`工具处理

```js
import downloadGitRepo from "download-git-repo";
import path from "path";

function downloadTemplate(templateName, projectName) {
  const downloadUrl = `direct:https://gitee.com/beiyaoyaoyao/${templateName}-template.git`;
  const downloadPath = path.resolve(process.cwd(), projectName);

  downloadGitRepo(downloadUrl, downloadPath, { clone: true }, (err) => {
    if (err) {
      console.log(`download ${templateName} template failed: ${err}`);
      return;
    }
    console.log(`download ${templateName} template success`);
  });
}
```

### 5. 优化命令行提示

使用`ora`和`chalk`工具处理

```js
import ora from "ora";
import chalk from "chalk";

function downloadTemplate(templateName, projectName) {
  const spinner = ora(`download ${templateName} template`).start();
  const downloadUrl = `direct:https://gitee.com/beiyaoyaoyao/${templateName}-template.git`;
  const downloadPath = path.resolve(process.cwd(), projectName);

  downloadGitRepo(downloadUrl, downloadPath, { clone: true }, (err) => {
    if (err) {
      spinner.fail(`download ${templateName} template failed: ${err}`);
      return;
    }
    spinner.succeed(`download ${templateName} template success`);

    console.log(
      chalk.green(`project ${chalk.bold(projectName)} created successfully`)
    );
    console.log(chalk.yellow(`cd ${projectName} && npm install`));
  });
}
```

# 原生 Node 开发 Web 服务器

```js
import http from "http";

// 1. 创建一个HTTP服务器
const server = http.createServer();

// 服务器监听端口8080
server.listen(8080, "localhost", () => {
  console.log("服务器运行在 http://localhost:8080/");
});

// 2. 服务器接收请求并处理
server.on("request", (req, res) => {
  // 3. 响应处理结果并断开链接
  if (req.url === "/") {
    res.statusCode = 200;
    res.setHeader("Content-Type", "text/plain; charset=utf-8"); // 服务器数据响应类型：text/plain 文本类型；charset=utf-8 编码类型
    res.end("Hello, World!\n");
  } else if (req.url === "/html") {
    res.statusCode = 200;
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.end("<h1>Hello, World!</h1>\n");
  } else {
    res.statusCode = 404;
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.end("404 Not Found\n");
  }
});
```

**nodemon 工具**：监听文件变化，自动重启服务器

全局安装：

```bash
npm install -g nodemon
```

使用：

```bash
nodemon server.js
```
## 服务器数据响应类型
- text/plain 文本类型（需要指定编码类型）
- text/html HTML 类型（需要指定编码类型）
- application/json JSON 类型（需要指定编码类型）
- application/javascript JavaScript 类型（需要指定编码类型）
- image/png PNG 图片类型（二进制类型是按字节传输的，不需要字符编码信息）
- image/jpeg JPEG 图片类型（二进制类型是按字节传输的，不需要字符编码信息）
- audio/mpeg MP3 音频类型（二进制类型是按字节传输的，不需要字符编码信息）
- video/mp4 MP4 视频类型（二进制类型是按字节传输的，不需要字符编码信息）

## 编码类型
- charset=utf-8 万国码
- charset=gbk 国标码