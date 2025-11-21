# 下落小球手游

一个简单的手机休闲游戏，玩家控制小球在不断下落的过程中躲避触碰屏幕上边界。

## 项目结构

```
falling/
├── index.html          # 游戏主页面
├── game.js             # 游戏逻辑代码
├── README.md           # 项目说明文档
├── package.json        # Node.js 依赖配置
└── .gitignore         # Git 忽略文件配置
```

## 游戏玩法

- 小球会不断下落（通过背景向上移动来表现）
- 左右拖动屏幕来控制小球水平移动
- 小球可以落在平台上休息
- 当小球触碰到屏幕上边界时游戏失败
- 目标：尽可能下落更远的距离

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

待完成游戏开发后，使用 Capacitor 打包：

```bash
# 安装 Capacitor
npm init
npm install @capacitor/core @capacitor/cli
npx cap init

# 添加平台
npx cap add ios
npx cap add android

# 打包和运行
npx cap copy
npx cap open ios    # 或 android
```

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
