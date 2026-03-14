#!/usr/bin/env node

/**
 * MiGPT 播报 HTTP API 服务器（简化版）
 *
 * 功能：
 * - 接收文本，自动分段播报
 * - 支持大文本（自动拆分成多段）
 * - 提供 RESTful API 供 OpenClaw 调用
 *
 * 使用方法：
 *   node tts-api.js
 *
 * OpenClaw 调用方式：
 *   curl -X POST http://localhost:3000/speak \
 *     -H "Content-Type: application/json" \
 *     -d '{"text":"要播报的文字"}'
 *
 * 或者在 OpenClaw 中使用 exec：
 *   curl -s -X POST http://localhost:3000/speak \
 *     -H "Content-Type: application/json" \
 *     -d "{\"text\":\"{{要播报的文字}}\"}"
 */

import http from 'http';
import fs from 'fs';

const PORT = 3000;
const PID_FILE = '/tmp/migpt-tts-api.pid';
const QUEUE_FILE = '/tmp/migpt-tts-queue.txt';
const PROCESSED_FILE = '/tmp/migpt-tts-processed.txt';

// 写入 PID
fs.writeFileSync(PID_FILE, process.pid.toString());

// 文本分段长度
const CHUNK_LENGTH = 100; // 每段 100 字（减少分段长度，确保每段能完整播报）

// 文本分段函数（按逗号分割，保持语义完整）
function splitText(text, chunkLength) {
  const chunks = [];

  // 按逗号分割成数组
  const items = text.split(',').map(s => s.trim()).filter(s => s);

  let currentChunk = [];

  for (const item of items) {
    // 将当前段转为字符串（带逗号）
    const chunkStr = currentChunk.join(', ');

    // 如果添加后不超过限制，则添加到当前段
    if (!chunkStr || (chunkStr + ', ' + item).length <= chunkLength) {
      currentChunk.push(item);
    }
    // 否则，保存当前段，开始新段
    else {
      chunks.push(chunkStr);
      currentChunk = [item];
    }
  }

  // 保存最后一段
  if (currentChunk.length > 0) {
    chunks.push(currentChunk.join(', '));
  }

  return chunks;
}

// 睡眠函数
function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

// 写入队列并等待播报
async function writeAndSpeak(text) {
  // 写入队列
  fs.writeFileSync(QUEUE_FILE, text);

  // 根据文本长度动态计算等待时间
  // 实际播报速度约 0.27 秒/字，加 1 秒缓冲
  const waitTime = Math.ceil(text.length * 0.27 + 1) * 1000;

  console.log(`⏱  等待时间: ${waitTime/1000} 秒 (文本 ${text.length} 字)`);

  // 等待播报完成
  await sleep(waitTime);
}

// HTTP 服务器
const server = http.createServer(async (req, res) => {
  // 设置 CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // 处理 OPTIONS 预检请求
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // 只处理 POST 请求
  if (req.method !== 'POST') {
    res.writeHead(405, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: '只支持 POST 请求' }));
    return;
  }

  // 路由处理
  if (req.url === '/speak') {
    // 解析请求体
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', async () => {
      try {
        const { text } = JSON.parse(body);

        if (!text) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: '缺少 text 参数' }));
          return;
        }

        console.log(`📤 收到播报请求 (${text.length} 字): ${text.substring(0, 50)}...`);

        // 分段
        const chunks = splitText(text, CHUNK_LENGTH);
        console.log(`📦 分成 ${chunks.length} 段`);

        // 依次播报每段
        for (let i = 0; i < chunks.length; i++) {
          const chunk = chunks[i];
          console.log(`🔊 播报第 ${i + 1}/${chunks.length} 段: ${chunk.substring(0, 50)}...`);

          // 写入队列并等待播报
          await writeAndSpeak(chunk);

          // 段与段之间暂停 1 秒
          if (i < chunks.length - 1) {
            await sleep(1000);
          }
        }

        console.log('✅ 全部播报完成');

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          message: '播报成功',
          chunks: chunks.length,
          totalLength: text.length
        }));
      } catch (error) {
        console.error('❌ 处理请求失败:', error.message);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message }));
      }
    });
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: '路径不存在' }));
  }
});

// 启动服务器
server.listen(PORT, () => {
  console.log('🎧 MiGPT 播报 HTTP API 服务器已启动');
  console.log(`📍 监听地址: http://localhost:${PORT}/speak`);
  console.log(`📍 PID 文件: ${PID_FILE}`);
  console.log(`📍 队列文件: ${QUEUE_FILE}`);
  console.log(`\n📋 使用方法:`);
  console.log(`  curl -X POST http://localhost:${PORT}/speak \\`);
  console.log(`    -H "Content-Type: application/json" \\`);
  console.log(`    -d '{"text":"要播报的文字"}'`);
  console.log(`\n📊 配置:`);
  console.log(`  分段长度: ${CHUNK_LENGTH} 字`);
  console.log(`  段间延迟: 1000ms`);
});

// 优雅退出
process.on('SIGTERM', () => {
  console.log('👋 正在停止服务器...');
  if (fs.existsSync(PID_FILE)) {
    fs.unlinkSync(PID_FILE);
  }
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('👋 正在停止服务器...');
  if (fs.existsSync(PID_FILE)) {
    fs.unlinkSync(PID_FILE);
  }
  process.exit(0);
});
