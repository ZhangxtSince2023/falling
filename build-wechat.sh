#!/bin/bash

# 构建微信小游戏版本
echo "Building WeChat mini-game version..."

# 清理并创建输出目录
rm -rf dist/wechat
mkdir -p dist/wechat/core
mkdir -p dist/wechat/libs

# 复制核心文件
cp -r src/core/* dist/wechat/core/

# 复制微信平台文件
cp src/platforms/wechat/game.js dist/wechat/
cp src/platforms/wechat/game.json dist/wechat/
cp src/platforms/wechat/project.config.json dist/wechat/
cp src/platforms/wechat/wechat-adapter.js dist/wechat/

echo "WeChat build complete! Output: dist/wechat/"
echo ""
echo "IMPORTANT: You still need to:"
echo "1. Download weapp-adapter.js to dist/wechat/libs/"
echo "2. Download phaser.min.js to dist/wechat/libs/"
echo "3. Uncomment the import statements in dist/wechat/game.js"
echo ""
echo "See src/platforms/wechat/README.md for details"
