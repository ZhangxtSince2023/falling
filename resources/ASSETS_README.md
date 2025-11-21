# 应用资源准备指南

要发布到 iOS 和 Google Play，你需要准备以下图标和启动画面资源：

## 1. 应用图标 (App Icon)

### iOS 图标要求
- 需要多种尺寸（建议准备 1024x1024 的原图，然后生成各种尺寸）
- 必须是 PNG 格式
- 不能有透明度（必须有背景色）
- 不能有圆角（iOS 会自动添加）

**所需尺寸：**
- 1024x1024 - App Store
- 180x180 - iPhone (3x)
- 120x120 - iPhone (2x)
- 167x167 - iPad Pro
- 152x152 - iPad (2x)
- 76x76 - iPad (1x)
- 60x60 - iPhone 通知
- 40x40 - Spotlight

### Android 图标要求
- 支持透明背景
- 建议使用自适应图标（Adaptive Icons）
- PNG 格式

**所需尺寸：**
- 512x512 - Google Play Store
- 192x192 - xxxhdpi
- 144x144 - xxhdpi
- 96x96 - xhdpi
- 72x72 - hdpi
- 48x48 - mdpi

### 快速生成工具推荐
1. **在线工具：** [icon.kitchen](https://icon.kitchen/) - 上传一张 1024x1024 的图标，自动生成所有平台所需尺寸
2. **在线工具：** [appicon.co](https://www.appicon.co/) - 免费生成 iOS 和 Android 图标
3. **Capacitor 插件：** `@capacitor/assets` - 自动生成所有资源

```bash
npm install @capacitor/assets --save-dev
npx capacitor-assets generate --iconBackgroundColor '#000000' --iconBackgroundColorDark '#000000'
```

## 2. 启动画面 (Splash Screen)

### 通用要求
- 建议尺寸：2732x2732（正方形）
- PNG 格式，支持透明背景
- 中心内容区域应该是安全区域（避免被裁剪）

### iOS 启动画面
- 需要支持多种设备尺寸
- 推荐使用纯色背景 + 中心 logo 的设计

### Android 启动画面
- 9-patch 图片或使用 Layer List
- 推荐使用纯色背景 + 中心 logo

### 使用 Capacitor Assets 自动生成
```bash
# 准备一个 splash.png (2732x2732) 放在 resources 文件夹
npx capacitor-assets generate
```

## 3. 文件结构

将你的资源文件按以下结构放置：

```
resources/
├── icon.png           # 1024x1024 的应用图标原图
├── splash.png         # 2732x2732 的启动画面原图
└── ASSETS_README.md   # 本文件
```

## 4. 设计建议

### 应用图标设计原则
- 简洁明了，一目了然
- 避免使用文字（特别是小字）
- 使用高对比度的颜色
- 确保在小尺寸下也清晰可见
- 体现游戏主题（本游戏是下落的小球）

### 推荐设计思路（针对下落小球游戏）
1. **方案一：** 黑色背景 + 渐变色的圆形小球
2. **方案二：** 深色背景 + 小球 + 平台元素
3. **方案三：** 简约的圆形图标，配合速度线条表现下落感

### 配色建议
- 主色：蓝色/紫色渐变（科技感）
- 辅色：白色/浅灰（对比度）
- 背景：深色/黑色（与游戏一致）

## 5. 下一步操作

1. **设计图标：** 使用 Photoshop、Figma、Canva 等工具创建 1024x1024 的图标
2. **设计启动画面：** 创建 2732x2732 的启动画面
3. **保存文件：** 将 `icon.png` 和 `splash.png` 放在 `resources/` 文件夹
4. **生成资源：**
   ```bash
   npm install @capacitor/assets --save-dev
   npx capacitor-assets generate
   ```

## 6. 免费设计工具

如果你不熟悉设计工具，可以使用以下免费工具：

- **Canva** - 在线设计工具，有很多模板
- **Figma** - 专业设计工具，免费版功能充足
- **GIMP** - 免费的 Photoshop 替代品
- **Inkscape** - 免费的矢量图形编辑器

## 7. 临时方案

如果暂时没有设计好的图标，可以使用以下临时方案快速测试：

1. 创建一个简单的纯色 + 文字的图标
2. 使用在线工具快速生成
3. 先完成应用的功能开发和测试
4. 后期再替换为正式的设计

记住：App Store 和 Google Play 在审核时会检查图标质量，最终发布时需要使用高质量的图标。
