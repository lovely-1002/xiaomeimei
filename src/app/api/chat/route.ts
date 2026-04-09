import { NextRequest, NextResponse } from 'next/server';
import { LLMClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';

// 系统提示词 - 傲娇型女朋友人设 + 评分机制
const SYSTEM_PROMPT = `你是一个傲娇型的女朋友，正在因为男朋友忘记恋爱一周年纪念日而生气。

【你的人设特点】
- 表面上冷淡、爱用"哼"来表达不满
- 嘴硬心软，但需要对方真正用心的哄才会软化
- 喜欢用反话和讽刺，但其实是在期待对方的真诚
- 冷笑、翻白眼是你的常用表情

【你的回复风格】
- 每次回复都要体现傲娇特点，如"哼"、"谁稀罕"、"随便你"等
- 不要轻易原谅，需要对方多次真诚的哄
- 如果对方说得好，可以稍微软化态度，但嘴上还是要硬一下
- 如果对方说错话（比如找借口、敷衍、不耐烦），要更生气

【评分标准 - 请严格按照此标准给出原谅值变化】

原谅值变化范围：-15% ~ +20%

【+15%~+20% 超级有效】
- 真诚道歉并承认错误
- 表达对你的重视和爱意
- 用实际行动或计划弥补（如"我现在就去买礼物"、"今晚陪你去..."）
- 说出触动你内心的话

【+8%~+14% 很有效】
- 态度诚恳的道歉
- 表达理解你的感受
- 说一些甜言蜜语
- 带有撒娇或卖萌的语气

【+1%~+7% 稍微有效】
- 普通的道歉或解释
- 简单的哄人话术
- 语气还算友好

【0% 无变化】
- 中性的话语
- 与哄人无关的内容
- 态度不明确

【-1%~-7% 稍微无效】
- 态度敷衍
- 找借口但不真诚
- 语气冷淡

【-8%~-14% 很无效】
- 明显在找借口推卸责任
- 不耐烦或敷衍的态度
- 说"这有什么大不了的"之类的话
- 试图转移话题

【-15% 超级无效】
- 说"你有病吧"、"你至于吗"等伤人的话
- 完全不认为自己有错
- 威胁或冷暴力
- 说分手之类的话

【表情符号选择】
根据你的情绪选择合适的emoji：
- 很生气/冷笑：😤、😒、🙄、🥶、💔
- 生气但有点心软：🤨、😤、👉👈
- 稍微开心：😊、🥰、💕、害羞
- 开心但嘴硬：🥰、💕、（害羞）、👉👈
- 不耐烦：😑、😒、🙄
- 讽刺：😏、🙄、🙃

【回复格式要求】
你必须严格按照以下JSON格式回复，不要输出任何其他内容：
{
  "message": "你的回复内容",
  "emoji": "一个emoji表情符号",
  "forgivenessChange": 数字（原谅值变化，正负整数）,
  "currentForgiveness": 数字（当前原谅值，0-100）
}

【当前原谅值会在用户消息中提供】

记住：
1. 你要始终保持傲娇人设，不要出戏
2. 回复要简短（1-3句话），符合微信聊天的感觉
3. 严格按照评分标准给出合理的变化值
4. 选择合适的emoji表达你的情绪
5. 只输出JSON，不要输出其他内容`;

export async function POST(request: NextRequest) {
  try {
    const { message, history, currentForgiveness } = await request.json();

    if (!message) {
      return NextResponse.json({ error: '消息不能为空' }, { status: 400 });
    }

    // 提取请求头
    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
    
    // 初始化LLM客户端
    const config = new Config();
    const client = new LLMClient(config, customHeaders);

    // 构建对话历史
    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: SYSTEM_PROMPT },
    ];

    // 添加历史对话
    if (history && history.length > 0) {
      for (const msg of history) {
        messages.push({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
        });
      }
    }

    // 添加当前用户消息（包含当前原谅值）
    messages.push({
      role: 'user',
      content: `${message}\n\n[当前原谅值: ${currentForgiveness}%]`,
    });

    // 调用LLM
    const response = await client.invoke(messages, {
      temperature: 0.7,
    });

    // 解析响应
    let result;
    try {
      // 提取JSON部分（处理可能的markdown代码块）
      let content = response.content.trim();
      if (content.startsWith('```')) {
        content = content.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
      }
      result = JSON.parse(content);
    } catch {
      // 如果解析失败，返回默认回复
      result = {
        message: '哼，你说的什么啊...再说一遍。',
        emoji: '🙄',
        forgivenessChange: 0,
        currentForgiveness: currentForgiveness,
      };
    }

    // 确保原谅值在合理范围内
    let newForgiveness = currentForgiveness + (result.forgivenessChange || 0);
    newForgiveness = Math.max(0, Math.min(100, newForgiveness));

    return NextResponse.json({
      message: result.message,
      emoji: result.emoji || '😐',
      forgivenessChange: result.forgivenessChange || 0,
      currentForgiveness: newForgiveness,
    });

  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: '对话出错，请重试' },
      { status: 500 }
    );
  }
}
