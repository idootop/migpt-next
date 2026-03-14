# MiGPT TTS API

让小爱音箱「按需播报」，openclaw可以说话了——通过简单的 HTTP API 触发播报

## 简介

一个轻量级的 HTTP API 服务，将小米小爱音箱的 TTS 播报功能暴露为 RESTful API，方便从任何脚本、程序或服务触发语音播报。

## 核心价值

**OpenClaw 终于可以说话了！**

之前：
- ❌ OpenClaw 只能输出文本
- ❌ 无法主动播报通知
- ❌ 小爱音箱没有公开 API

现在：
- ✅ OpenClaw 可以直接播报语音
- ✅ 一行 curl 命令即可触发
- ✅ 邮件通知、系统提醒都能语音播报

## 特性

- 🎯 **简单易用**：一行 curl 命令即可触发播报
- 📦 **自动分段**：长文本自动分段播报，确保每段都能完整播报
- ⏱️ **智能等待**：根据文本长度动态计算等待时间，避免截断
- 🔗 **零依赖**：只需 Node.js，无需额外依赖
- 🚀 **稳定可靠**：基于 MiGPT-Next，复用已有的小米账号认证

## 应用场景

- 邮件通知播报
- 系统提醒（服务器重启、备份完成）
- 定时播报（天气、日程）
- 脚本自动化（cron 任务、监控告警）
- OpenClaw / Home Assistant 集成
- 任何需要语音播报的自动化场景

## 快速开始

### 1. 复制文件到 MiGPT-Next 目录

```bash
# 复制 API 服务器
cp tts-api.js ../../../apps/example/

# 或者使用安装脚本
bash install.sh
```

### 2. 启动服务

**开发模式：**
```bash
cd ../../../apps/example
node tts-api.js
```

**生产模式（systemd）：**
```bash
# 复制 systemd 服务文件
cp systemd/migpt-tts-api.service /etc/systemd/system/

# 启用开机自启
sudo systemctl daemon-reload
sudo systemctl enable migpt-tts-api.service
sudo systemctl start migpt-tts-api.service

# 查看服务状态
sudo systemctl status migpt-tts-api.service
```

### 3. 测试播报

```bash
# 简单播报
curl -X POST http://localhost:3000/speak \
  -H "Content-Type: application/json" \
  -d '{"text":"你好，世界"}'
```

## 使用示例

### OpenClaw 集成

```bash
# OpenClaw 脚本中触发播报
speak() {
  curl -s -X POST http://localhost:3000/speak \
    -H "Content-Type: application/json" \
    -d "{\"text\":\"$1\"}"
}

# 使用示例
speak "系统重启完成，所有服务正常运行"
```

### Bash 脚本

```bash
# 邮件通知播报
speak "收到新邮件，来自百夫长"

# 系统提醒播报
speak "备份完成，共备份 100 个文件"
```

### Python 脚本

```python
import requests

def speak(text):
    requests.post(
        'http://localhost:3000/speak',
        headers={'Content-Type': 'application/json'},
        json={'text': text}
    )

speak('任务执行完成')
```

## API 文档

### POST /speak

触发文本播报。

**请求：**
```http
POST /speak HTTP/1.1
Content-Type: application/json

{
  "text": "要播报的文字"
}
```

**响应：**
```json
{
  "success": true,
  "message": "播报成功",
  "chunks": 3,
  "totalLength": 287
}
```

## 配置

### 分段长度

默认每段 100 字，可根据需要调整：

```javascript
const CHUNK_LENGTH = 100; // 每段 100 字
```

### 等待时间

根据实际播报速度调整：

```javascript
const waitTime = Math.ceil(text.length * 0.27 + 1) * 1000;
```

- 实际播报速度约 0.27 秒/字
- 加 1 秒缓冲时间
- 可根据实际情况微调

## 技术实现

### 架构设计

```
OpenClaw → HTTP API → 队列文件 → MiGPT-Next → 小爱音箱
```

### 通信机制

- HTTP API 写入队列文件：`/tmp/migpt-tts-queue.txt`
- MiGPT-Next 检查队列文件并播报
- 避免小米的安全验证机制

### 核心优化

1. **分段长度：** 100 字/段（从 200 字优化）
2. **等待时间：** 动态计算 `text.length * 0.27 + 1` 秒
3. **播报速度：** 实测约 0.27 秒/字

## 测试结果

### 播报测试（1-110 数字序列）

| 段落 | 等待时间 | 实际时长 | 额外等待 |
|------|---------|---------|---------|
| 1/5 | 28秒 | 27秒 | 1秒 ✅ |
| 2/5 | 28秒 | 27秒 | 1秒 ✅ |
| 3/5 | 28秒 | 27秒 | 1秒 ✅ |
| 4/5 | 27秒 | 26秒 | 1秒 ✅ |
| 5/5 | 13秒 | 12秒 | 1秒 ✅ |

**结果：**
- ✅ 完整播报，没有遗漏数字
- ✅ 额外等待仅 1 秒
- ✅ 播报连贯流畅

## 相关链接

- **独立仓库：** https://github.com/skystone011/migpt-tts-api
- **许可证：** MIT License

## 致谢

感谢 MiGPT-Next 项目提供的核心功能，这个扩展基于 MiGPT-Next 构建。

---

**🎤 让 OpenClaw 终于可以「说话」了！**
