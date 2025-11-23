# 微信小游戏平台

## 概述

此目录包含微信小游戏版本的代码。核心游戏逻辑与 Web 版本共享，只有平台特定的适配代码不同。

## 文件说明

- `game.js` - 微信小游戏主入口文件
- `game.json` - 游戏配置文件（屏幕方向、状态栏等）
- `project.config.json` - 微信开发者工具项目配置
- `wechat-adapter.js` - 微信平台适配器（处理存储、系统信息等）

## 使用前准备

### 1. 下载必需的库文件

在 `src/platforms/wechat/libs/` 目录下需要以下文件：

#### weapp-adapter.js
微信小游戏适配器，用于模拟 DOM 环境供 Phaser 使用。

```bash
# 从官方仓库获取
git clone https://github.com/wechat-miniprogram/minigame-adapter.git
cp minigame-adapter/lib/weapp-adapter.js src/platforms/wechat/libs/
```

或者手动下载：
https://github.com/wechat-miniprogram/minigame-adapter/blob/master/lib/weapp-adapter.js

#### phaser.min.js
Phaser 3 游戏引擎（需要本地化，不能使用 CDN）。

```bash
# 从 CDN 下载到本地
mkdir -p src/platforms/wechat/libs
curl -o src/platforms/wechat/libs/phaser.min.js \
  https://cdn.jsdelivr.net/npm/phaser@3.70.0/dist/phaser.min.js
```

### 2. 创建 libs 目录结构

```
src/platforms/wechat/
├── libs/
│   ├── weapp-adapter.js
│   └── phaser.min.js
├── game.js
├── game.json
├── project.config.json
└── wechat-adapter.js
```

### 3. 修改 game.js 导入语句

在 `game.js` 文件顶部取消注释：

```javascript
// 取消这两行的注释：
import './libs/weapp-adapter.js';
import './libs/phaser.min.js';

// 并在文件末尾取消注释：
const game = new Phaser.Game(config);
```

## 开发步骤

### 1. 安装微信开发者工具

从 [微信官方](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html) 下载并安装微信开发者工具。

### 2. 导入项目

1. 打开微信开发者工具
2. 选择"小游戏"
3. 点击"导入项目"
4. 选择 `src/platforms/wechat` 目录
5. AppID 可以使用测试号

### 3. 调试运行

在微信开发者工具中：
- 点击"编译"按钮
- 在模拟器或真机中测试
- 使用调试器查看控制台输出

## 核心代码共享

微信小游戏版本与 Web 版本共享以下核心模块：

- `src/core/game-state.js` - 游戏状态管理
- `src/core/difficulty.js` - 难度系统
- `src/core/i18n.js` - 多语言支持

**重要提示**：如果修改了核心模块的代码，所有平台都会受到影响。

## 平台差异

### 存储 API
- Web: `localStorage`
- 微信: `wx.getStorageSync()` / `wx.setStorageSync()`

### 语言检测
- Web: `navigator.language`
- 微信: `wx.getSystemInfoSync().language`

### Canvas 创建
- Web: HTML `<canvas>` 元素
- 微信: `wx.createCanvas()`

这些差异都在 `wechat-adapter.js` 中处理，核心逻辑无需关心平台差异。

## 发布前准备

### 1. 性能优化
- 压缩资源文件
- 检查包大小（主包 < 4MB）
- 优化图片和音频

### 2. 注册小游戏账号
- 访问 [微信公众平台](https://mp.weixin.qq.com/)
- 注册小游戏账号
- 获取正式 AppID

### 3. 配置域名
如果游戏需要网络请求，需要在微信公众平台配置合法域名。

### 4. 提交审核
- 在微信开发者工具中上传代码
- 在微信公众平台提交审核
- 等待审核通过后发布

## 常见问题

### Q: Phaser 报错找不到 document?
A: 确保正确导入了 `weapp-adapter.js`，它会模拟 DOM 环境。

### Q: 如何调试真机?
A: 在微信开发者工具中点击"真机调试"，扫码后可以在手机上运行并调试。

### Q: 游戏包太大怎么办?
A: 考虑使用分包加载，或者使用 CDN（需要配置合法域名）。

### Q: 如何同步修改 Web 版和微信版?
A: 只修改 `src/core/` 下的核心逻辑文件，两个平台会自动同步。如果需要修改平台特定功能（如UI样式），则分别修改对应平台的代码。

## 参考资料

- [微信小游戏开发文档](https://developers.weixin.qq.com/minigame/dev/guide/)
- [Phaser 3 官方文档](https://photonstorm.github.io/phaser3-docs/)
- [微信小游戏适配器](https://github.com/wechat-miniprogram/minigame-adapter)
