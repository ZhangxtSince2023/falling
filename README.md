# 下落小球手游

一个简单的手机休闲游戏，玩家控制小球在不断下落的过程中躲避触碰屏幕上边界。

## 项目结构

```
falling/
├── index.html             # 游戏主页面
├── src/                   # 源代码目录
│   ├── game-scene.js        # 游戏主场景逻辑（入口）
│   ├── game-config.js       # 游戏配置和难度系统
│   ├── visual-effects.js    # 视觉特效系统
│   ├── localization.js      # 多语言支持系统
│   ├── haptics.js           # 振动反馈封装
│   ├── platform-system.js   # 平台生成/回收与计分
│   ├── player-controller.js # 玩家角色控制与状态
│   └── input-handler.js     # 输入处理（触摸/键盘）
├── assets/                # 游戏资源目录（预留）
├── package.json           # Node.js 依赖配置
├── capacitor.config.json  # Capacitor 移动端配置
├── www/                   # 构建输出目录（自动生成）
├── ios/                   # iOS 原生项目
│   └── App/
│       ├── App.xcworkspace  # Xcode 工作区（用这个打开）
│       └── Podfile          # CocoaPods 依赖配置
└── resources/             # 应用图标和启动画面
```

## 游戏玩法

- 小球会不断下落（通过背景向上移动来表现）
- 左右拖动屏幕来控制小球水平移动
- 小球可以落在平台上休息
- 当小球触碰到屏幕上边界时游戏失败
- 目标：尽可能下落更远的距离

## 多语言支持

游戏支持以下语言：
- 🇨🇳 简体中文
- 🇹🇼 繁体中文
- 🇺🇸 英语
- 🇯🇵 日语

**自动检测**：游戏会自动检测系统语言并显示相应的语言界面。

**手动切换**：点击游戏界面右上角的 🌐 语言按钮可以切换语言。语言设置会自动保存在本地。

## 如何运行

### 方法1：使用 npm 脚本（推荐）

```bash
# 安装依赖
npm install

# 启动本地开发服务器
npm run dev
```

打开浏览器访问 `http://localhost:8000`

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

- **Phaser 3** - 游戏框架
- **HTML5 Canvas** - 渲染引擎
- **Arcade Physics** - 物理引擎
- **Capacitor** - 移动端打包工具（可选）

## 代码架构

项目采用模块化设计，将游戏功能拆分为独立的模块：

- **game-scene.js** - 游戏主场景，负责初始化和游戏循环
- **game-config.js** - 游戏配置、颜色方案和难度系统
- **visual-effects.js** - 粒子效果、动画和视觉特效
- **localization.js** - 多语言支持和翻译系统
- **haptics.js** - 振动反馈（支持 Capacitor 和浏览器 API）
- **platform-system.js** - 平台生成、回收和计分逻辑
- **player-controller.js** - 玩家角色的状态和控制
- **input-handler.js** - 触摸和键盘输入处理

这种模块化设计使代码更易于维护和扩展。

## 核心功能

- ✅ 重力和物理碰撞系统
- ✅ 触摸拖动控制
- ✅ 相机跟随和背景滚动
- ✅ 动态平台生成
- ✅ 距离计分系统
- ✅ 游戏状态管理（开始/结束/重玩）
- ✅ 多语言支持（中文简体/繁体、英语、日语）
- ✅ 振动反馈（iOS/Android 原生支持）
- ✅ 增强视觉特效（粒子、冲击波、球体动画）

## 待优化功能

- [ ] 添加音效
- [x] 添加振动反馈
- [x] 添加粒子效果
- [x] 增加难度递增机制（平台变小、间距变大）
- [ ] 添加特殊平台（移动平台、弹跳平台）
- [ ] 添加道具系统
- [ ] 添加本地最高分记录
- [ ] 添加暂停功能

## 开发工作流

### npm 脚本

```bash
npm run dev           # 启动本地开发服务器
npm run build         # 构建到 www/
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
