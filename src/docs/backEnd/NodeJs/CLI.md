---
title: 脚手架
order: 3
---

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
      chalk.green(`project ${chalk.bold(projectName)} created successfully`),
    );
    console.log(chalk.yellow(`cd ${projectName} && npm install`));
  });
}
```
