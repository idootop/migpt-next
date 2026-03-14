#!/usr/bin/env python3
"""
OpenClaw 语音播报 Python 示例
"""

import requests
import time

# API 配置
API_URL = "http://localhost:3000/speak"

def speak(text):
    """
    触发语音播报
    
    Args:
        text (str): 要播报的文本
    """
    try:
        response = requests.post(
            API_URL,
            headers={"Content-Type": "application/json"},
            json={"text": text}
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ 播报成功: {result['chunks']} 段，总长度 {result['totalLength']} 字")
        else:
            print(f"❌ 播报失败: {response.status_code}")
    except requests.exceptions.RequestException as e:
        print(f"❌ 请求失败: {e}")

if __name__ == "__main__":
    # 示例 1：简单的播报
    print("示例 1：简单的播报")
    speak("你好，世界")
    time.sleep(5)
    
    # 示例 2：播报变量
    print("\n示例 2：播报变量")
    message = "系统重启完成，所有服务正常运行"
    speak(message)
    time.sleep(5)
    
    # 示例 3：播报数字列表
    print("\n示例 3：播报数字列表")
    numbers = "1, 2, 3, 4, 5, 6, 7, 8, 9, 10"
    speak(numbers)
    time.sleep(5)
    
    # 示例 4：播报长文本（自动分段）
    print("\n示例 4：播报长文本（自动分段）")
    long_text = "这是一段很长的文本，会自动分段播报，确保每段都能完整播报。系统会根据文本长度动态计算等待时间，避免截断。这样可以提高播报的可靠性和准确性。"
    speak(long_text)
    time.sleep(5)
    
    # 示例 5：播报系统信息
    print("\n示例 5：播报系统信息")
    import psutil
    uptime = time.time() - psutil.boot_time()
    hours = int(uptime // 3600)
    minutes = int((uptime % 3600) // 60)
    uptime_str = f"{hours} 小时 {minutes} 分钟"
    
    cpu_usage = psutil.cpu_percent()
    memory_usage = psutil.virtual_memory().percent
    
    speak(f"系统已运行 {uptime_str}，CPU 使用率 {cpu_usage}%，内存使用率 {memory_usage}%")
    
    print("\n✅ 所有示例完成")
