#!/bin/bash

# MiGPT TTS API 安装脚本

set -e

echo "🎧 MiGPT TTS API 安装脚本"
echo "=========================="

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 错误：未安装 Node.js"
    echo "请先安装 Node.js >= 16"
    exit 1
fi

echo "✅ Node.js 版本: $(node --version)"

# 获取 MiGPT-Next 路径
read -p "请输入 MiGPT-Next 安装路径 (默认: /home/pi/migpt-next): " MIGPT_PATH
MIGPT_PATH=${MIGPT_PATH:-/home/pi/migpt-next}

if [ ! -d "$MIGPT_PATH" ]; then
    echo "❌ 错误：MiGPT-Next 目录不存在: $MIGPT_PATH"
    exit 1
fi

echo "✅ MiGPT-Next 路径: $MIGPT_PATH"

# 复制文件
echo "📦 复制文件..."
cp tts-api.js "$MIGPT_PATH/apps/example/"
echo "✅ tts-api.js 已复制到 $MIGPT_PATH/apps/example/"

# 安装 systemd 服务
read -p "是否安装 systemd 服务? (y/n): " INSTALL_SYSTEMD

if [ "$INSTALL_SYSTEMD" = "y" ] || [ "$INSTALL_SYSTEMD" = "Y" ]; then
    echo "🔧 安装 systemd 服务..."
    
    # 替换路径
    sed "s|/path/to/migpt-next|$MIGPT_PATH|g" systemd/migpt-tts-api.service > /tmp/migpt-tts-api.service
    
    # 复制到 systemd 目录
    sudo cp /tmp/migpt-tts-api.service /etc/systemd/system/
    
    # 重载 systemd
    sudo systemctl daemon-reload
    
    # 启用开机自启
    sudo systemctl enable migpt-tts-api.service
    
    # 启动服务
    sudo systemctl start migpt-tts-api.service
    
    echo "✅ systemd 服务已安装并启动"
    echo "📊 服务状态: sudo systemctl status migpt-tts-api.service"
    echo "📝 查看日志: sudo journalctl -u migpt-tts-api.service -f"
fi

# 测试服务
echo "🧪 测试服务..."
sleep 2

# 检查服务状态
if sudo systemctl is-active --quiet migpt-tts-api.service; then
    echo "✅ 服务运行正常"
    
    # 测试 API
    echo "📢 测试播报..."
    curl -s -X POST http://localhost:3000/speak \
      -H "Content-Type: application/json" \
      -d '{"text":"安装成功，服务运行正常"}' || true
    
    echo ""
    echo "✅ 安装完成！"
    echo ""
    echo "📋 使用方法:"
    echo "  curl -X POST http://localhost:3000/speak \\"
    echo "    -H \"Content-Type: application/json\" \\"
    echo "    -d '{\"text\":\"要播报的文字\"}'"
    echo ""
else
    echo "⚠️  服务未运行，请手动检查"
    echo "📊 服务状态: sudo systemctl status migpt-tts-api.service"
fi
