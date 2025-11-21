# 下落小球 - iOS 和 Android 发布指南

本指南将帮助你把游戏发布到 **App Store (iOS)** 和 **Google Play (Android)**。

---

## 📋 前置准备清单

### 共同要求
- [ ] 已完成游戏开发和测试
- [ ] 准备好应用图标（1024x1024 PNG）
- [ ] 准备好启动画面（2732x2732 PNG）
- [ ] 准备应用描述、关键词、截图等商店素材

### iOS 发布要求
- [ ] 拥有 Apple Developer 账号（$99/年）
- [ ] Mac 电脑（用于构建和发布 iOS 应用）
- [ ] 安装 Xcode（最新版本）
- [ ] 安装 CocoaPods (`sudo gem install cocoapods`)

### Android 发布要求
- [ ] 拥有 Google Play Developer 账号（$25 一次性费用）
- [ ] 安装 Android Studio
- [ ] 安装 Java JDK (推荐 JDK 17)
- [ ] 配置 Android SDK

---

## 🚀 步骤 1：环境配置和依赖安装

### 1.1 安装 Node.js 依赖

```bash
npm install
```

这将安装 Capacitor 和所有必需的依赖。

### 1.2 添加移动平台

```bash
# 添加 iOS 平台 (需要在 Mac 上运行)
npx cap add ios

# 添加 Android 平台
npx cap add android
```

运行后会创建 `ios/` 和 `android/` 文件夹。

### 1.3 生成应用图标和启动画面

首先，将你的图标和启动画面放在 `resources/` 文件夹：
- `resources/icon.png` - 1024x1024
- `resources/splash.png` - 2732x2732

然后运行：

```bash
# 安装 Capacitor Assets 工具
npm install @capacitor/assets --save-dev

# 自动生成所有平台的图标和启动画面
npx capacitor-assets generate
```

### 1.4 同步文件到原生项目

```bash
npx cap sync
```

---

## 📱 步骤 2：iOS 发布流程

### 2.1 在 Xcode 中打开项目

```bash
npx cap open ios
```

### 2.2 配置项目设置

在 Xcode 中：

1. **选择项目 (App)**，在左侧导航栏
2. **General 标签页**：
   - **Display Name**: 下落小球
   - **Bundle Identifier**: com.falling.game（或你自己的唯一 ID）
   - **Version**: 1.0.0
   - **Build**: 1
   - **Deployment Target**: iOS 13.0 或更高

3. **Signing & Capabilities**：
   - 勾选 "Automatically manage signing"
   - 选择你的 Apple Developer Team
   - 确保 Bundle Identifier 是唯一的

### 2.3 在真机上测试

1. 连接你的 iPhone 到 Mac
2. 在 Xcode 顶部选择你的设备
3. 点击运行按钮 (▶️) 进行测试

### 2.4 配置 App Store Connect

1. 访问 [App Store Connect](https://appstoreconnect.apple.com/)
2. 创建新应用：
   - 点击 "我的 App" → "+" → "新建 App"
   - 填写应用信息：
     - **平台**: iOS
     - **名称**: 下落小球
     - **主要语言**: 简体中文
     - **Bundle ID**: 选择你配置的 ID
     - **SKU**: 可以使用 `falling-game-001`

3. 准备商店素材：
   - **App 图标**: 1024x1024（已在项目中）
   - **屏幕截图**:
     - iPhone 6.7" (1290x2796) - 至少 1 张
     - iPhone 6.5" (1284x2778) - 至少 1 张
     - iPhone 5.5" (1242x2208) - 至少 1 张（如果支持旧设备）
   - **描述**: 详细的游戏说明
   - **关键词**: 游戏,休闲,下落,小球
   - **支持 URL**: 你的网站或 GitHub 仓库
   - **隐私政策 URL**: （如果收集用户数据需要）

### 2.5 构建和上传

#### 方法 1: 使用 Xcode (推荐)

1. 在 Xcode 中选择 "Any iOS Device (arm64)"
2. 菜单栏: **Product** → **Archive**
3. 等待归档完成
4. 在 Organizer 窗口点击 "Distribute App"
5. 选择 "App Store Connect" → "Upload"
6. 按照向导完成上传

#### 方法 2: 使用命令行

```bash
# 构建归档
xcodebuild -workspace ios/App/App.xcworkspace \
  -scheme App \
  -sdk iphoneos \
  -configuration Release \
  archive -archivePath $PWD/build/App.xcarchive

# 导出 IPA
xcodebuild -exportArchive \
  -archivePath $PWD/build/App.xcarchive \
  -exportOptionsPlist ios/App/exportOptions.plist \
  -exportPath $PWD/build

# 上传到 App Store Connect
xcrun altool --upload-app \
  -f build/App.ipa \
  -u your-apple-id@email.com \
  -p your-app-specific-password
```

### 2.6 提交审核

1. 在 App Store Connect 中，选择你的应用
2. 等待构建版本出现在 "构建版本" 部分（可能需要几分钟）
3. 选择构建版本，填写 "此版本的新增内容"
4. 填写年龄分级问卷
5. 点击 "提交审核"

**审核时间**: 通常 24-48 小时

---

## 🤖 步骤 3：Android 发布流程

### 3.1 在 Android Studio 中打开项目

```bash
npx cap open android
```

### 3.2 配置项目设置

#### 修改 `android/app/build.gradle`

```gradle
android {
    namespace "com.falling.game"
    compileSdkVersion 34

    defaultConfig {
        applicationId "com.falling.game"  // 你的唯一包名
        minSdkVersion 22
        targetSdkVersion 34
        versionCode 1
        versionName "1.0.0"
    }

    buildTypes {
        release {
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}
```

### 3.3 生成签名密钥

Android 应用必须使用密钥签名。在项目根目录运行：

```bash
# 生成密钥库文件
keytool -genkey -v -keystore my-release-key.keystore \
  -alias falling-game \
  -keyalg RSA -keysize 2048 -validity 10000

# 按提示输入信息：
# - 密钥库密码（妥善保管！）
# - 你的姓名
# - 组织单位
# - 组织
# - 城市
# - 省份
# - 国家代码 (CN)
```

**重要**: 将 `my-release-key.keystore` 保存在安全的地方，并备份！丢失将无法更新应用。

### 3.4 配置签名

创建 `android/keystore.properties`:

```properties
storeFile=/path/to/my-release-key.keystore
storePassword=你的密钥库密码
keyAlias=falling-game
keyPassword=你的密钥密码
```

修改 `android/app/build.gradle`，在 `android {` 块前添加：

```gradle
def keystorePropertiesFile = rootProject.file("keystore.properties")
def keystoreProperties = new Properties()
keystoreProperties.load(new FileInputStream(keystorePropertiesFile))

android {
    // ... 现有配置

    signingConfigs {
        release {
            keyAlias keystoreProperties['keyAlias']
            keyPassword keystoreProperties['keyPassword']
            storeFile file(keystoreProperties['storeFile'])
            storePassword keystoreProperties['storePassword']
        }
    }

    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}
```

### 3.5 构建发布版本 APK/AAB

```bash
cd android

# 构建 AAB (推荐用于 Google Play)
./gradlew bundleRelease

# 或构建 APK (用于测试或其他分发渠道)
./gradlew assembleRelease
```

生成的文件位置：
- AAB: `android/app/build/outputs/bundle/release/app-release.aab`
- APK: `android/app/build/outputs/apk/release/app-release.apk`

### 3.6 配置 Google Play Console

1. 访问 [Google Play Console](https://play.google.com/console/)
2. 创建新应用：
   - 点击 "创建应用"
   - **应用名称**: 下落小球
   - **默认语言**: 简体中文（中国）
   - **应用类型**: 游戏
   - **免费或付费**: 免费

3. 填写应用详情：
   - **应用类别**: 休闲游戏
   - **简短说明**: (80 字以内) "控制小球下落，避开边界，挑战最远距离！"
   - **完整说明**: (4000 字以内) 详细介绍游戏玩法、特点等

4. 准备商店素材：
   - **应用图标**: 512x512 PNG
   - **宣传图片**: 1024x500 JPG/PNG
   - **手机截图**: 至少 2 张 (最多 8 张)
     - 推荐尺寸: 1080x1920 或 1080x2400
   - **7 寸平板截图**: (可选)
   - **10 寸平板截图**: (可选)

5. 填写内容分级问卷

6. 设置定价和分发：
   - 选择分发的国家/地区
   - 确认免费或付费

### 3.7 上传和发布

#### 内部测试 (推荐先测试)

1. 在左侧菜单选择 "测试" → "内部测试"
2. 创建新版本
3. 上传 AAB 文件
4. 填写版本说明
5. 保存并审核
6. 添加测试人员的邮箱
7. 开始发布

#### 正式发布

1. 在左侧菜单选择 "发布" → "制作版本"
2. 创建新版本
3. 上传 AAB 文件
4. 填写版本说明（告诉用户新版本的变化）
5. 审核并发布

**审核时间**: 通常几小时到几天不等

---

## 📸 截图和宣传素材建议

### 截图内容建议
1. **首屏**: 游戏开始界面
2. **游戏进行中**: 小球在平台间下落
3. **高分展示**: 展示分数系统
4. **游戏结束**: 重新开始界面

### 截图制作方法

#### 在真机上截图
1. 在手机上运行游戏
2. 截取关键场景
3. 使用图片编辑工具调整到要求尺寸

#### 使用在线工具添加设备外框
- [Mockuphone](https://mockuphone.com/)
- [Smartmockups](https://smartmockups.com/)
- [Previewed](https://previewed.app/)

### 描述文案建议

**简短描述 (100 字以内)**:
```
控制小球向下不断下落，躲避触碰屏幕边界！
简单操作，无尽挑战，测试你的反应速度和专注力。
看你能下落多远？
```

**完整描述**:
```
🎮 游戏特色：
• 简单直观的触控操作
• 流畅的物理引擎
• 无尽的下落挑战
• 实时分数记录
• 精美简约的视觉设计

🕹️ 游戏玩法：
在这个令人上瘾的休闲游戏中，你将控制一个不断下落的小球。通过左右滑动屏幕来控制小球的移动，避免触碰到屏幕的顶部边界。小球可以落在平台上稍作休息，但要小心——平台会不断上升！

挑战你的反应速度和专注力，看看你能下落多远！

🎯 如何游戏：
• 左右拖动屏幕控制小球移动
• 避免小球触碰屏幕顶部
• 利用平台调整位置
• 尽可能下落更远的距离

适合所有年龄段玩家，随时随地开始一局快节奏的挑战！
```

---

## 🔧 常见问题和解决方案

### iOS 常见问题

**Q: 构建失败 "No signing certificate found"**
A: 在 Xcode 的 Signing & Capabilities 中，选择正确的 Team 和开启 Automatically manage signing。

**Q: "This bundle is invalid" 错误**
A: 检查 Info.plist 中的配置，确保所有必需的权限和配置都正确。

**Q: 应用被拒绝**
A: 仔细阅读拒绝理由，常见原因：
- 缺少隐私政策
- 应用描述不准确
- 应用崩溃或功能不完整
- 违反应用商店指南

### Android 常见问题

**Q: "Error: keystore not found"**
A: 检查 keystore.properties 中的路径是否正确，使用绝对路径。

**Q: 构建失败 "SDK location not found"**
A: 在 android/local.properties 中添加 SDK 路径：
```
sdk.dir=/path/to/Android/sdk
```

**Q: 上传时提示版本冲突**
A: 增加 build.gradle 中的 versionCode。

---

## 📊 发布后的工作

### 监控和更新

1. **监控应用性能**：
   - App Store: App Analytics
   - Google Play: Google Play Console 统计

2. **收集用户反馈**：
   - 阅读评论和评分
   - 通过邮件或社交媒体收集反馈

3. **定期更新**：
   - 修复 bug
   - 添加新功能
   - 优化性能
   - 每次更新增加版本号

### 更新发布流程

更新应用时：

1. **更新版本号**：
   - iOS: Xcode 中的 Version 和 Build
   - Android: build.gradle 中的 versionCode 和 versionName

2. **重新构建和上传**：
   - 按照上述步骤重新构建
   - 上传到相应的应用商店

3. **填写更新日志**：
   - 说明此次更新的内容
   - 列出新功能和修复的问题

---

## 💡 优化建议

### 应用性能优化
- 优化游戏加载时间
- 减少内存占用
- 确保在低端设备上流畅运行

### ASO (应用商店优化)
- 选择合适的关键词
- 优化应用标题和描述
- 使用吸引人的图标和截图
- 鼓励满意的用户给予好评

### 营销和推广
- 在社交媒体分享
- 创建游戏演示视频
- 在游戏社区宣传
- 考虑适当的广告投放

---

## 🆘 需要帮助？

### 官方文档
- [Capacitor 官方文档](https://capacitorjs.com/docs)
- [Apple Developer 文档](https://developer.apple.com/documentation/)
- [Android 开发者文档](https://developer.android.com/docs)

### 社区支持
- [Capacitor 社区论坛](https://forum.ionicframework.com/)
- [Stack Overflow](https://stackoverflow.com/)

---

## ✅ 发布检查清单

在提交到应用商店之前，确保：

- [ ] 应用在真机上测试通过，没有崩溃
- [ ] 所有功能正常工作
- [ ] 图标和启动画面正确显示
- [ ] 应用描述准确无误
- [ ] 准备了至少 3 张质量良好的截图
- [ ] 版本号和构建号正确
- [ ] 已阅读并遵守应用商店指南
- [ ] 如需要，已准备隐私政策
- [ ] 已测试不同屏幕尺寸的兼容性
- [ ] 已准备好回应可能的审核问题

---

祝你发布顺利！🎉

如有任何问题，请参考官方文档或在开发者社区寻求帮助。
