#!/bin/bash

# 构建 Web 版本
echo "Building Web version..."

# 清理并创建输出目录
rm -rf dist/web
mkdir -p dist/web/core

# 复制核心文件
cp -r src/core/* dist/web/core/

# 复制 Web 平台文件
cp src/platforms/web/index.html dist/web/
cp src/platforms/web/main.js dist/web/

echo "Web build complete! Output: dist/web/"
echo "To test: npx http-server dist/web -p 8080"
