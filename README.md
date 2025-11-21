# 下落小球手游

一个简单的手机休闲游戏，玩家控制小球在不断下落的过程中躲避触碰屏幕上边界。

## 项目结构

```
falling/
├── index.html          # 游戏主页面
├── game.js             # 游戏逻辑代码
├── i18n.js             # 多语言支持系统
├── README.md           # 项目说明文档
├── RELEASE_GUIDE.md    # 应用发布指南
├── package.json        # Node.js 依赖配置
├── capacitor.config.json  # Capacitor 移动端配置
├── resources/          # 应用资源文件夹
│   └── ASSETS_README.md   # 图标和启动画面指南
└── .gitignore         # Git 忽略文件配置
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

### 方法1：本地开发测试

1. 安装一个本地服务器（推荐使用）：

```bash
# 使用 Python 3
python3 -m http.server 8000

# 或使用 Node.js 的 http-server
npx http-server -p 8000
```

2. 打开浏览器访问 `http://localhost:8000`

### 方法2：VS Code Live Server

1. 安装 VS Code 扩展 "Live Server"
2. 右键点击 `index.html` -> "Open with Live Server"

### 方法3：直接打开（可能有CORS问题）

直接在浏览器中打开 `index.html` 文件

## 手机测试

1. 确保手机和电脑在同一局域网
2. 启动本地服务器后，查看电脑的IP地址
3. 在手机浏览器访问 `http://你的IP:8000`

## 打包成手机APP

项目已配置 Capacitor，可以打包成 iOS 和 Android 应用。

### 快速开始

```bash
# 1. 安装依赖
npm install

# 2. 添加平台
npx cap add ios      # 需要 Mac 和 Xcode
npx cap add android  # 需要 Android Studio

# 3. 生成应用图标和启动画面（可选）
# 先准备 resources/icon.png 和 resources/splash.png
npm install @capacitor/assets --save-dev
npx capacitor-assets generate

# 4. 同步文件到原生项目
npx cap sync

# 5. 打开原生项目进行开发和发布
npx cap open ios
npx cap open android
```

### 发布到应用商店

详细的发布指南请查看：**[RELEASE_GUIDE.md](./RELEASE_GUIDE.md)**

该指南包含：
- ✅ iOS App Store 发布完整流程
- ✅ Google Play 发布完整流程
- ✅ 应用图标和截图准备指南
- ✅ 签名配置和构建步骤
- ✅ 常见问题解决方案
- ✅ 应用商店优化建议

## 技术栈

- **Phaser 3** - 游戏框架
- **HTML5 Canvas** - 渲染引擎
- **Arcade Physics** - 物理引擎
- **Capacitor** - 移动端打包工具（可选）

## 核心功能

- ✅ 重力和物理碰撞系统
- ✅ 触摸拖动控制
- ✅ 相机跟随和背景滚动
- ✅ 动态平台生成
- ✅ 距离计分系统
- ✅ 游戏状态管理（开始/结束/重玩）
- ✅ 多语言支持（中文简体/繁体、英语、日语）

## 待优化功能

- [ ] 添加音效和振动反馈
- [ ] 添加粒子效果
- [ ] 增加难度递增机制（平台变小、间距变大）
- [ ] 添加特殊平台（移动平台、弹跳平台）
- [ ] 添加道具系统
- [ ] 添加本地最高分记录
- [ ] 优化触摸控制手感
- [ ] 添加暂停功能

## 版本控制

使用 Git 进行版本管理：

```bash
# 初始化 Git 仓库
git init

# 添加文件
git add .

# 提交
git commit -m "Initial commit: 完成基础游戏功能"

# 推送到远程仓库（可选）
git remote add origin <你的仓库地址>
git push -u origin main
```
