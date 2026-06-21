#!/bin/bash

# 设置 Node.js 路径以确保 Vite 和 npm 能够正常运行
export PATH="/Users/songqing/Documents/node-bin/bin:$PATH"

echo "=== 🚀 开始推送并部署物理实验工坊 ==="

# 1. 检查是否添加了 origin
if ! git remote | grep -q "^origin$"; then
    echo "🔗 正在关联 GitHub 仓库..."
    git remote add origin https://github.com/tastriacompa1984-arch/physics-lab.git
fi

# 2. 推送代码至 main 分支
echo "📤 正在推送代码至 GitHub main 分支 (如果弹出提示，请输入您的 GitHub Token/密码)..."
git push -u origin main

if [ $? -eq 0 ]; then
    echo "✅ 代码推送成功！"
else
    echo "❌ 代码推送失败，请检查您的 GitHub 权限或 SSH 配置。"
    exit 1
fi

# 3. 部署至 gh-pages 分支
echo "📦 正在执行自动化构建并部署到 GitHub Pages..."
npm run deploy

if [ $? -eq 0 ]; then
    echo "🎉 部署完成！您的物理实验工坊已经成功发布！"
else
    echo "❌ 部署失败，请检查编译是否有报错。"
    exit 1
fi
