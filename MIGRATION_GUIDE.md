# 迁移指南 - 从单平台到多平台架构

## 概述

本项目已成功重构为多平台架构，支持 Web/H5 和微信小游戏。核心游戏逻辑被抽离并共享，确保修改一次代码，所有平台生效。

## 主要变更

### 1. 目录结构变更

#### 旧结构
```
falling/
├── index.html
├── game.js          # 包含所有逻辑
├── i18n.js
└── package.json
```

#### 新结构
```
falling/
├── src/
│   ├── core/                    # 核心逻辑（共享）
│   │   ├── game-state.js       # 游戏状态管理
│   │   ├── difficulty.js       # 难度系统
│   │   └── i18n.js             # 多语言（已适配多平台）
│   │
│   └── platforms/              # 平台特定代码
│       ├── web/                # Web版本
│       │   ├── index.html
│       │   └── main.js
│       │
│       └── wechat/             # 微信小游戏版本
│           ├── game.js
│           ├── game.json
│           ├── project.config.json
│           ├── wechat-adapter.js
│           └── README.md
│
├── dist/                       # 构建输出
│   ├── web/
│   └── wechat/
│
├── build-web.sh                # Web构建脚本
├── build-wechat.sh             # 微信构建脚本
└── README-MULTIPLATFORM.md     # 多平台说明文档
```

### 2. 代码模块化

#### 核心模块抽离

**src/core/game-state.js**
- 游戏状态管理（score, gameOver, gameStarted 等）
- 游戏流程控制（开始、结束、重置）
- 边界碰撞检测
- 平台计数逻辑

**src/core/difficulty.js**
- 难度配置参数
- 难度计算函数
- 动态难度调整算法

**src/core/i18n.js**
- 多语言支持
- **新增**：平台适配器模式，支持不同平台的存储和语言检测
- 使用依赖注入，无需修改核心逻辑

#### 平台特定代码

**Web 版本** (src/platforms/web/)
- Phaser 配置和初始化
- DOM 操作
- 浏览器 API 调用
- 使用 `src/core/` 的共享逻辑

**微信版本** (src/platforms/wechat/)
- 微信小游戏适配
- Canvas 创建
- 微信 API 封装
- 使用相同的 `src/core/` 逻辑

### 3. 构建系统

#### 新增构建脚本

```bash
npm run build:web      # 构建 Web 版本 → dist/web/
npm run build:wechat   # 构建微信版本 → dist/wechat/
npm run build:all      # 构建所有平台
npm run serve          # 启动本地服务器测试 Web 版本
```

#### 构建流程

1. **清理** - 删除旧的 dist 目录
2. **复制核心文件** - 将 src/core/ 复制到构建目录
3. **复制平台文件** - 复制特定平台的文件
4. **输出** - 生成可部署的文件到 dist/

### 4. 原文件处理

原来的文件（`game.js`, `i18n.js`, `index.html`）被保留作为备份，但新版本不再使用它们。

**选项：**
- **保留**：作为参考和备份
- **删除**：使用 `git mv` 移到 backup/ 目录
- **归档**：创建 `legacy/` 目录存放

## 使用新架构的优势

### ✅ 代码共享
- 核心逻辑只需编写一次
- Bug 修复自动同步到所有平台
- 新功能快速移植

### ✅ 易于维护
- 职责分离：核心逻辑 vs 平台适配
- 模块化设计
- 清晰的文件组织

### ✅ 可扩展性
- 添加新平台只需实现适配层
- 不影响现有平台
- 支持独立开发和测试

### ✅ 兼容性
- 保持原有功能不变
- Web 版本完全兼容
- 可继续使用 Capacitor 打包

## 开发工作流变更

### 旧工作流
```bash
# 直接修改 game.js
vim game.js

# 刷新浏览器测试
```

### 新工作流

#### 修改游戏逻辑
```bash
# 1. 修改核心文件
vim src/core/difficulty.js

# 2. 构建所有平台
npm run build:all

# 3. 测试 Web 版本
npm run serve

# 4. 测试微信版本（在微信开发者工具中）
```

#### 修改平台特定代码
```bash
# 只修改 Web 样式
vim src/platforms/web/index.html
npm run build:web

# 只修改微信适配
vim src/platforms/wechat/wechat-adapter.js
npm run build:wechat
```

## API 变更

### i18n 模块

#### 旧用法
```javascript
// 直接创建全局实例
const i18n = new I18n();
```

#### 新用法
```javascript
// Web 平台（自动使用默认适配器）
import { createI18n } from '../../core/i18n.js';
const i18n = createI18n();

// 微信平台（提供平台适配器）
import { createI18n } from '../../core/i18n.js';
import { createWechatI18nPlatform } from './wechat-adapter.js';

const i18nPlatform = createWechatI18nPlatform();
const i18n = createI18n(i18nPlatform);
```

### 游戏状态管理

#### 旧方式（全局变量）
```javascript
let gameOver = false;
let gameStarted = false;
let score = 0;
```

#### 新方式（状态类）
```javascript
import { GameState } from '../../core/game-state.js';

const gameState = new GameState();

// 使用方法访问状态
if (gameState.isPlaying()) {
    // ...
}

gameState.startGame();
gameState.triggerGameOver();
```

## Git 合并策略

### 如何处理代码修改

1. **核心逻辑修改**
   - 修改 `src/core/` 下的文件
   - 所有平台自动获得更新
   - Git 正常 merge

2. **平台特定修改**
   - 修改 `src/platforms/web/` 或 `src/platforms/wechat/`
   - 只影响特定平台
   - 独立 merge，无冲突

3. **多人协作**
   - 核心逻辑：统一在 src/core/ 修改
   - 平台代码：可以并行开发
   - 构建脚本：自动处理文件复制

## 测试清单

迁移后，请确保以下功能正常：

### Web 版本
- [ ] 游戏启动正常
- [ ] 触摸控制工作
- [ ] 平台生成和移动
- [ ] 难度逐渐增加
- [ ] 分数计算正确
- [ ] 碰撞检测准确
- [ ] 游戏结束逻辑
- [ ] 重新开始功能
- [ ] 语言切换正常

### 微信小游戏版本
- [ ] 项目可在微信开发者工具中打开
- [ ] 游戏可以运行（需要先配置库文件）
- [ ] 微信存储 API 工作
- [ ] 语言检测正确（使用微信 API）
- [ ] 核心游戏逻辑与 Web 版本一致

## 常见问题

### Q: 原来的 game.js 还能用吗？
A: 可以，但建议使用新架构。旧文件可以作为备份保留。

### Q: 如何在两个平台间同步改动？
A: 只修改 `src/core/` 下的核心逻辑，构建后两个平台自动同步。

### Q: 构建失败怎么办？
A: 确保已安装 Node.js，并检查文件路径是否正确。运行 `bash -x build-web.sh` 查看详细日志。

### Q: 可以继续使用 Capacitor 吗？
A: 可以！使用 `npm run build:web` 后，将 `dist/web/` 配置为 Capacitor 的 webDir。

### Q: 如何添加新平台（如抖音小游戏）？
A:
1. 在 `src/platforms/` 下创建新目录
2. 实现平台适配器（参考 `wechat-adapter.js`）
3. 创建主入口文件，引入 `src/core/` 的逻辑
4. 添加构建脚本

## 后续步骤

1. **测试验证**
   ```bash
   npm run build:all
   npm run serve
   # 在浏览器中测试：http://localhost:8080
   ```

2. **微信小游戏开发**
   - 按照 `src/platforms/wechat/README.md` 配置
   - 下载必需的库文件
   - 在微信开发者工具中测试

3. **部署发布**
   - Web 版本：部署 `dist/web/` 到静态托管
   - 微信版本：在微信公众平台提交审核

4. **持续开发**
   - 新功能在 `src/core/` 中开发
   - 平台适配在各自目录中完成
   - 定期构建和测试所有平台

## 总结

✅ 项目已成功重构为多平台架构
✅ 核心逻辑完全共享，无需重复开发
✅ Web 版本完全兼容，可直接使用
✅ 微信小游戏版本已准备就绪，需下载库文件后可用
✅ 构建系统简单高效
✅ 易于扩展到其他平台

如有任何问题，请参考 `README-MULTIPLATFORM.md` 或查看各平台目录下的 README 文档。
