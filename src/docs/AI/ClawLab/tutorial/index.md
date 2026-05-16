---
title: 原理及概述
order: 0
---

# Gateway–Node–Channel 机制

## 三者各自是什么

### 1）Gateway（大门 / 中枢）

整个 OpenClaw 的核心进程（Node.js 守护进程）

- **默认端口**：18789（WebSocket）
- **职责**：接收消息、鉴权、路由、会话管理、Agent 调度、工具执行、返回结果
- **比喻**：龙虾的大脑 + 中枢神经 + 总调度室

### 2）Channel（通道 / 聊天口）

连接外部 IM 平台的适配器

- **例子**：Telegram、WhatsApp、Discord、Slack、Moltbook
- **特点**：
  - 一个平台 = 一个 Channel
  - 把外部消息统一成 Gateway 内部标准格式
  - 双向：收消息 → 给 Gateway；结果 → 发回 IM

### 3）Node（节点 / 设备端）

物理 / 虚拟设备，用来执行"动手操作"

- **例子**：你的手机、电脑、服务器、IoT 设备、远程 CLI
- **特点**：
  - 角色：`role: node`（握手时声明）
  - 必须被 Gateway **配对 / 批准（pairing）** 才能接入
  - 负责：文件操作、截屏、命令行、浏览器、App 控制、硬件访问
- **比喻**：龙虾的爪子、触手、手脚

## 完整工作流

1. **用户发消息**（Telegram/WhatsApp）
   → Channel 接收 → 格式标准化 → 发给 Gateway

2. **Gateway 处理**
   - 鉴权（是谁、有没有权限）
   - 会话路由（绑定到对应 Agent 会话）
   - 加载记忆、Skill、上下文
   - 决定：是纯聊天 → 直接回答；需要动手 → 派发给 Node

3. **Node 执行**（如果需要操作）
   → Gateway 发指令给 Node → Node 执行（如截图、运行命令）→ 返回结果给 Gateway

4. **Gateway 生成最终回复**
   → 发给 Channel → 回复给用户

**一句话流程**：`IM`(Instant Messenger 即时通讯软件) → Channel → Gateway → Agent → Node（干活）→ Gateway → Channel → IM