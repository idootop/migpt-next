#!/bin/bash

# OpenClaw 语音播报示例

# 播报函数
speak() {
    local text="$1"
    curl -s -X POST http://localhost:3000/speak \
        -H "Content-Type: application/json" \
        -d "{\"text\":\"$text\"}"
}

# 示例 1：简单的播报
echo "示例 1：简单的播报"
speak "你好，世界"

sleep 5

# 示例 2：播报变量
echo "示例 2：播报变量"
MESSAGE="系统重启完成，所有服务正常运行"
speak "$MESSAGE"

sleep 5

# 示例 3：播报数字列表
echo "示例 3：播报数字列表"
NUMBERS="1, 2, 3, 4, 5, 6, 7, 8, 9, 10"
speak "$NUMBERS"

sleep 5

# 示例 4：播报长文本（自动分段）
echo "示例 4：播报长文本（自动分段）"
LONG_TEXT="这是一段很长的文本，会自动分段播报，确保每段都能完整播报。系统会根据文本长度动态计算等待时间，避免截断。这样可以提高播报的可靠性和准确性。"
speak "$LONG_TEXT"

sleep 5

# 示例 5：播报系统信息
echo "示例 5：播报系统信息"
UPTIME=$(uptime -p)
CPU_USAGE=$(top -bn1 | grep "Cpu(s)" | sed "s/.*, *\([0-9.]*\)%* id.*/\1/" | awk '{print 100 - $1}')
MEMORY_USAGE=$(free -m | awk '/Mem/{printf("%.0f", $3/$2*100)}')
speak "系统已运行 $UPTIME，CPU 使用率 $CPU_USAGE%，内存使用率 $MEMORY_USAGE%"

echo "✅ 所有示例完成"
