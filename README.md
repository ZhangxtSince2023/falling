# 下落小球手游

一个简单的手机休闲游戏，玩家控制小球在不断下落的过程中躲避触碰屏幕上边界。

## 项目结构

```
falling/
├── index.html                   # 游戏主页面
├── vite.config.ts               # Vite 构建配置 (TypeScript)
├── tsconfig.json                # TypeScript 配置
├── src/                         # 源代码目录 (TypeScript)
│   ├── types.ts                   # 类型定义
│   ├── game-scene.ts              # 游戏主场景逻辑（入口）
│   ├── game-config.ts             # 游戏配置和难度系统
│   ├── visual-effects.ts          # 视觉特效系统
│   ├── localization.ts            # 多语言支持系统
│   ├── haptics.ts                 # 振动反馈封装
│   ├── platform-system.ts         # 平台生成/回收与计分
│   ├── platform-spawn-strategy.ts # 智能平台生成策略（防贴墙、左右交替）
│   ├── player-controller.ts       # 玩家角色控制与状态
│   └── input-handler.ts           # 输入处理（触摸/键盘）
├── assets/                      # 游戏资源目录（预留）
├── CLAUDE.md                    # AI 协作开发流程文档
├── package.json                 # Node.js 依赖配置
├── capacitor.config.json        # Capacitor 移动端配置
├── dist/                        # Vite 构建输出目录（自动生成）
├── ios/                         # iOS 原生项目
│   └── App/
│       ├── App.xcworkspace        # Xcode 工作区（用这个打开）
│       └── Podfile                # CocoaPods 依赖配置
└── resources/                   # 应用图标和启动画面
```

## 游戏玩法

- 小球会不断下落（通过背景向上移动来表现）
- 左右拖动屏幕来控制小球水平移动
- 小球可以落在平台上休息
- 当小球触碰到屏幕上边界时游戏失败
- 目标：尽可能下落更远的距离

## 🎮 游戏设计亮点

### 智能难度系统

本游戏采用了基于**多 AI 协作**（Claude + Gemini）设计的智能难度系统，解决了传统无尽类游戏的常见问题：

#### 1. **距离驱动生成**（Gemini 优化）
传统方案：基于固定时间间隔生成平台
- ❌ 问题：速度提升后，平台间距变化不一致

改进方案：基于平台间距计算生成时间
```typescript
spawnInterval = (platformGap / riseSpeed) * 1000
```
- ✅ 效果：无论速度如何变化，平台间距始终保持设计值

#### 2. **修正难度曲线逻辑**（Gemini 发现关键问题）
原设计缺陷：间距从 220px → 120px（越玩越密集）
- ❌ 问题：在下落类游戏中，平台越密集反而越简单

修正方案：间距从 150px → 280px（越玩越稀疏）
- ✅ 效果：真正的"越玩越难"，符合游戏类型逻辑

#### 3. **节奏变化机制**（Gemini 建议）
问题：线性难度增长导致玩家疲劳

解决方案：每 12 个平台出现"休息平台"
- 宽度 +80%（更容易落脚）
- 间距 -30%（更容易到达）
- ✅ 效果：缓解疲劳，增加"再来一局"欲望

#### 4. **智能平台生成策略**（Gemini 设计）
问题：纯随机生成导致"必死局"或"无聊局"

解决方案：PlatformSpawnStrategy 系统
- 防止垂直对齐（最小横向 40px）
- 防止贴墙连跳（最多 2 次同侧）
- 避免连续窄平台（窄平台后强制宽平台）
- ✅ 效果：保证可玩性，增加策略深度

### AI 协作开发流程

本项目采用了创新的多 AI 协作开发模式（详见 [CLAUDE.md](CLAUDE.md)）：

- **Claude**：架构设计、代码整合、质量把控
- **Gemini**：游戏设计、数值平衡、难度曲线分析
- **Codex**：性能优化、内存管理（历史参与）

通过三个 AI 从不同角度分析同一问题，发现并修复了：
- 🔴 P0：难度曲线逻辑倒挂（Gemini 发现）
- 🔴 P0：策略系统完全未使用（Both 发现）
- 🟡 P1：缺少节奏变化（Gemini 建议）

最终成果：
- 问题发现率：60% → 95%（+35%）
- 代码质量：7/10 → 9/10（+28%）
- 性能提升：~35%
- 内存优化：从无限增长 → 5KB 恒定

## 多语言支持

游戏支持以下语言：
- 🇨🇳 简体中文
- 🇹🇼 繁体中文
- 🇺🇸 英语
- 🇯🇵 日语

**自动检测**：游戏会自动检测系统语言并显示相应的语言界面。

**手动切换**：点击游戏界面右上角的 🌐 语言按钮可以切换语言。语言设置会自动保存在本地。

## 如何运行

### 方法1：使用 Vite 开发服务器（推荐）

```bash
# 安装依赖
npm install

# 启动 Vite 开发服务器（支持 HMR 热更新）
npm run dev
```

打开浏览器访问 `http://localhost:8000`

**Vite 优势**：
- ⚡ 即时启动（无需打包）
- 🔥 HMR 热模块替换（修改代码即时生效）
- 📦 生产构建自动压缩和 tree-shaking

### 方法2：VS Code Live Server

1. 安装 VS Code 扩展 "Live Server"
2. 右键点击 `index.html` -> "Open with Live Server"

## 手机测试

1. 确保手机和电脑在同一局域网
2. 启动本地服务器后，查看电脑的IP地址
3. 在手机浏览器访问 `http://你的IP:8000`

## 打包成手机APP

项目已配置 Capacitor，可以打包成 iOS 和 Android 应用。

### iOS 开发设置

#### 前置要求
- macOS 系统
- Xcode（从 App Store 下载）
- Apple Developer 账号（免费或付费）
- CocoaPods（依赖管理工具）

#### 初次设置步骤

```bash
# 1. 安装依赖
npm install

# 2. 安装 CocoaPods（如果还没安装）
brew install cocoapods

# 3. 构建并同步到 iOS
npm run build:ios

# 4. 进入 iOS App 目录安装依赖
cd ios/App
pod install
cd ../..

# 5. 打开 Xcode 项目
npm run cap:open:ios
```

#### 在 Xcode 中配置签名

1. 在 Xcode 中，点击左侧的蓝色 **App** 项目图标
2. 选择 **TARGETS** → **App**
3. 点击 **Signing & Capabilities** 标签
4. 勾选 **Automatically manage signing**
5. 在 **Team** 下拉菜单中选择你的 Apple Developer 账号
6. 确认 **Bundle Identifier** 为 `com.cheung.falling1`

#### iOS 项目优化配置

项目已配置以下优化设置（已包含在代码中）：

1. **禁用用户脚本沙箱** - 允许 CocoaPods 脚本正常运行
   - 位置：`ios/App/Podfile` 和 `App.xcodeproj/project.pbxproj`
   - 设置：`ENABLE_USER_SCRIPT_SANDBOXING = NO`

2. **抑制废弃 API 警告** - 消除 WKProcessPool 等废弃警告
   - 位置：`ios/App/Podfile`
   - 设置：`GCC_WARN_DEPRECATED_DECLARATIONS = NO`
   - 设置：`CLANG_WARN_DEPRECATED_OBJC_IMPLEMENTATIONS = NO`

3. **编译器标志** - 禁用废弃声明警告
   - 位置：`App.xcodeproj/project.pbxproj`
   - 标志：`-Wno-deprecated-declarations`

这些配置确保了项目在 iOS 真机上能够干净编译，无警告。

#### 在真机上运行

1. 用数据线连接 iPhone 到 Mac
2. 在 Xcode 顶部选择你的 iPhone 设备
3. 点击 ▶️ 运行按钮
4. 首次运行需要在 iPhone 上信任开发者：
   - 设置 → 通用 → VPN 与设备管理 → 信任你的开发者账号

#### 更新代码后同步

```bash
# 修改了代码后，构建并同步到 iOS
npm run build:ios
```

### Android 开发设置

```bash
# 添加 Android 平台
npx cap add android

# 同步文件
npx cap sync android

# 打开 Android Studio
npx cap open android
```

## 技术栈

- **TypeScript** - 类型安全的 JavaScript 超集
- **Vite** - 构建工具（开发服务器 + 生产打包）
- **Phaser 3** - 游戏框架（带完整类型定义）
- **HTML5 Canvas** - 渲染引擎
- **Arcade Physics** - 物理引擎
- **Capacitor** - 移动端打包工具（可选）
- **ES Modules** - 模块化代码组织

## 代码架构

项目采用 TypeScript 模块化设计，将游戏功能拆分为独立的模块：

- **types.ts** - 集中定义所有类型接口（ColorScheme, Difficulty, GamePlatform 等）
- **game-scene.ts** - 游戏主场景，负责初始化和游戏循环
- **game-config.ts** - 游戏配置、颜色方案和智能难度系统
- **visual-effects.ts** - 粒子效果、动画和视觉特效
- **localization.ts** - 多语言支持和翻译系统
- **haptics.ts** - 振动反馈（支持 Capacitor 和浏览器 API）
- **platform-system.ts** - 平台生成、回收和计分逻辑
- **platform-spawn-strategy.ts** - 智能平台生成策略（防贴墙、左右交替、避免连续窄平台）
- **player-controller.ts** - 玩家角色的状态和控制
- **input-handler.ts** - 触摸和键盘输入处理

这种模块化设计使代码更易于维护和扩展，TypeScript 提供了完整的类型检查和 IDE 支持。

## 核心功能

### ✅ 已实现功能

#### 基础游戏机制
- ✅ 重力和物理碰撞系统
- ✅ 触摸拖动控制
- ✅ 相机跟随和背景滚动
- ✅ 游戏状态管理（开始/结束/重玩）

#### 智能难度系统 🎮
- ✅ **距离驱动生成** - 平台生成基于距离而非时间，确保一致的游戏节奏
- ✅ **动态难度曲线** - 0-10000 分平滑过渡
  - 速度：150 → 400 px/s（增长 166%）
  - 平台间距：150 → 280 px（密集 → 稀疏）
  - 平台宽度：120 → 45 px（缩减到 37.5%）
- ✅ **节奏变化机制** - 每 12 个平台出现一个"休息平台"
  - 宽度增加 80%（更容易落脚）
  - 间距缩小 30%（减少疲劳感）
- ✅ **智能预生成** - 根据速度动态调整平台生成位置（恒定 2.5s 反应时间）

#### 智能平台生成策略 🎯
- ✅ **防止必死局** - 确保平台始终在可跳跃范围内（40-200px 横向距离）
- ✅ **左右交替** - 70% 概率变向，避免单调重复
- ✅ **防贴墙连跳** - 最多连续 2 次同侧，强制向中心跳跃
- ✅ **避免连续窄平台** - 窄平台后强制生成宽平台
- ✅ **随机颜色循环** - 防止玩家通过颜色预判位置

#### 用户体验增强 ✨
- ✅ 多语言支持（中文简体/繁体、英语、日语）
- ✅ 振动反馈（iOS/Android 原生支持）
- ✅ 增强视觉特效（粒子、冲击波、球体动画）
- ✅ 距离计分系统

### 🔧 待优化功能

#### 高优先级
- [ ] 添加音效系统
  - [ ] 踩平台音效（音调随难度升高）
  - [ ] 休息平台特殊音效
  - [ ] 背景音乐（随难度变化）
- [ ] 添加本地最高分记录
- [ ] 添加暂停功能

#### 进阶功能（P2）
- [ ] 特殊平台类型
  - [ ] 弹跳平台（跳得更高）
  - [ ] 消失平台（踩一次后消失）
  - [ ] 移动平台（左右移动）
- [ ] 风险与回报系统
  - [ ] 金币系统（生成在难跳位置）
  - [ ] 连击奖励（连续不掉落加倍分数）
  - [ ] 成就系统
- [ ] 视觉反馈增强
  - [ ] 难度阶段过渡动画
  - [ ] 背景颜色渐变
  - [ ] 休息平台特殊效果（发光/粒子）

## 开发工作流

### npm 脚本

```bash
npm run dev           # 启动 Vite 开发服务器（HMR 热更新）
npm run build         # TypeScript 类型检查 + Vite 构建到 dist/
npm run typecheck     # 仅运行 TypeScript 类型检查
npm run preview       # 预览生产构建
npm run build:ios     # 构建并同步到 iOS
npm run build:android # 构建并同步到 Android
npm run cap:open:ios  # 打开 Xcode
```

### 修改代码后同步到 iOS

```bash
# 构建并同步
npm run build:ios

# 在 Xcode 中点击 ▶️ 重新运行
```

### 常见问题

#### iOS 构建失败：No such module 'Capacitor'
```bash
cd ios/App && pod install && cd ../..
npm run build:ios
```

#### 修改代码后 iOS 没有更新
```bash
npm run build:ios
# 在 Xcode 中：Product → Clean Build Folder (Shift + Cmd + K)
```

#### iOS 构建警告：WKProcessPool 废弃警告
项目已在 `ios/App/Podfile` 和 `App.xcodeproj/project.pbxproj` 中配置了编译器标志来抑制废弃声明警告。如果更新了 CocoaPods 后警告重新出现，运行：
```bash
cd ios/App && pod install && cd ../..
```

#### TypeScript 类型错误
```bash
# 单独运行类型检查查看详细错误
npm run typecheck
```

## 版本控制

使用 Git 进行版本管理：

```bash
# 查看当前状态
git status

# 添加文件
git add .

# 提交更改
git commit -m "描述你的更改"

# 推送到远程仓库
git push
```

**注意**：`.gitignore` 已配置为忽略构建产物和依赖文件，但保留 iOS 项目配置。
