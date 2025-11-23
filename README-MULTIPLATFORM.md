# 下落小球 - 多平台版本

## 项目概述

这是一个跨平台的休闲小游戏，玩家控制小球在不断上升的平台中避免触碰屏幕上下边界。

### 支持的平台

- ✅ **Web / H5** - 可在浏览器中运行，也可通过 Capacitor 打包为原生 App
- ✅ **微信小游戏** - 可发布到微信平台

## 项目结构

```
falling/
├── src/
│   ├── core/                    # 核心游戏逻辑（所有平台共享）
│   │   ├── game-state.js       # 游戏状态管理
│   │   ├── difficulty.js       # 难度系统
│   │   └── i18n.js             # 多语言支持
│   │
│   ├── platforms/              # 平台特定代码
│   │   ├── web/                # Web/H5 版本
│   │   │   ├── index.html
│   │   │   └── main.js
│   │   │
│   │   └── wechat/             # 微信小游戏版本
│   │       ├── game.js
│   │       ├── game.json
│   │       ├── project.config.json
│   │       ├── wechat-adapter.js
│   │       └── README.md
│   │
│   └── shared/                 # 共享资源（图片、音频等）
│       └── assets/
│
├── dist/                       # 构建输出目录
│   ├── web/                    # Web 版本构建结果
│   └── wechat/                 # 微信版本构建结果
│
├── package.json
└── README-MULTIPLATFORM.md     # 本文件
```

## 核心设计理念

### 代码共享

所有平台共享核心游戏逻辑（`src/core/`），只有平台适配层不同：

- **游戏状态管理** (`game-state.js`) - 分数、游戏结束判定等
- **难度系统** (`difficulty.js`) - 动态难度调整算法
- **多语言** (`i18n.js`) - 支持中文、英语、日语

### 平台适配

每个平台只需要实现：
- 渲染层（Phaser 配置）
- 平台 API 适配（存储、系统信息等）
- 入口文件

这样可以确保：
✅ 游戏逻辑只需修改一次
✅ Bug 修复自动同步到所有平台
✅ 新功能可以快速移植

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 构建项目

```bash
# 构建所有平台
npm run build:all

# 或单独构建某个平台
npm run build:web      # 只构建 Web 版本
npm run build:wechat   # 只构建微信版本
```

### 3. 运行测试

#### Web 版本

```bash
# 使用任何 HTTP 服务器
npx http-server dist/web -p 8080

# 或者使用 Python
cd dist/web
python -m http.server 8080
```

然后在浏览器访问 `http://localhost:8080`

#### 微信小游戏版本

1. 下载并安装 [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)
2. 按照 `src/platforms/wechat/README.md` 中的说明准备必需文件
3. 在微信开发者工具中导入 `dist/wechat` 目录

## 开发工作流

### 修改游戏逻辑

如果要修改**游戏逻辑**（例如难度系统、分数计算），修改 `src/core/` 下的文件：

```bash
# 1. 修改核心逻辑
vim src/core/difficulty.js

# 2. 重新构建
npm run build:all

# 3. 测试所有平台
```

### 修改平台特定功能

如果只修改**某个平台的 UI 或适配**，修改对应平台目录：

```bash
# Web 版本的样式调整
vim src/platforms/web/index.html

# 微信版本的适配器
vim src/platforms/wechat/wechat-adapter.js
```

### 添加新平台

要添加新平台（如抖音小游戏、QQ 小游戏）：

1. 在 `src/platforms/` 下创建新目录
2. 实现平台适配层（参考 `wechat/wechat-adapter.js`）
3. 创建入口文件，引入 `src/core/` 的共享逻辑
4. 在 `package.json` 中添加构建脚本

## 构建脚本说明

```json
{
  "clean": "清理 dist 目录",
  "build:web": "构建 Web 版本到 dist/web/",
  "build:wechat": "构建微信版本到 dist/wechat/",
  "build:all": "构建所有平台",
  "serve": "启动本地服务器测试 Web 版本"
}
```

## 技术栈

- **游戏引擎**: Phaser 3
- **语言**: JavaScript (ES6 Modules)
- **构建工具**: npm scripts
- **原生打包**: Capacitor (可选，用于 iOS/Android)

## 多语言支持

游戏支持以下语言：
- 🇨🇳 简体中文
- 🇹🇼 繁体中文
- 🇺🇸 English
- 🇯🇵 日本語

语言会自动检测系统设置，也可以在游戏中切换。

## 游戏特性

- ✅ 动态难度系统 - 根据分数平滑调整难度
- ✅ 触摸控制 - 左右拖动控制小球
- ✅ 多语言支持 - 自动检测或手动切换
- ✅ 跨平台 - 一套核心代码，多平台运行

## 发布指南

### Web 版本

可以部署到任何静态网站托管服务：
- GitHub Pages
- Vercel
- Netlify
- Cloudflare Pages

```bash
npm run build:web
# 将 dist/web/ 上传到托管服务
```

### 微信小游戏

参考 `src/platforms/wechat/README.md` 中的详细说明。

### iOS / Android App

使用 Capacitor 将 Web 版本打包为原生 App：

```bash
npm run build:web
npm run cap:sync
npm run cap:open:ios      # 或 cap:open:android
```

## 贡献指南

如果你想为项目添加新功能或修复 Bug：

1. Fork 本仓库
2. 创建新分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

**注意**：修改核心逻辑时，请确保所有平台都测试通过。

## 常见问题

### Q: 为什么要分离核心逻辑和平台代码？

A: 这样可以：
- 减少重复代码
- 统一游戏体验
- 简化维护工作
- 快速支持新平台

### Q: 如何调试微信小游戏？

A: 参考 `src/platforms/wechat/README.md` 中的详细说明。

### Q: 可以添加其他平台吗？

A: 可以！只需实现平台适配层即可。例如：
- 抖音小游戏
- QQ 小游戏
- 支付宝小程序
- 百度小游戏

### Q: 原来的 game.js 和 i18n.js 怎么办？

A: 重构后，原来的文件可以保留作为备份，或者删除。新版本使用 `src/` 目录下的代码。

## 许可证

ISC

## 联系方式

如有问题或建议，欢迎提 Issue。
