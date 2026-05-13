---
title: 模块化
order: 2
---

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
