import { NextRequest, NextResponse } from 'next/server';
import { LLMClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';

const ARTICLES_PROMPTS: Record<string, string> = {
  'golden-30-minutes': `请写一篇关于"吵架之后的黄金30分钟"的文章。

要求：
1. 风格轻松幽默，像朋友聊天一样
2. 字数300-500字
3. 内容要实用，给出具体建议
4. 可以用emoji增加趣味性
5. 开头要吸引人，结尾要有金句

要点提示：
- 吵架后30分钟是情绪冷却的关键期
- 这段时间做什么、不做什么很重要
- 如何把握这个时机挽回局面

直接输出文章内容，不要标题，不要其他说明。`,

  'worst-reply': `请写一篇关于"为什么「你说得对」是最烂的回复"的文章。

要求：
1. 风格轻松幽默，像朋友聊天一样
2. 字数300-500字
3. 内容要实用，给出具体建议
4. 可以用emoji增加趣味性
5. 开头要吸引人，结尾要有金句

要点提示：
- "你说得对"听起来像认错，其实是敷衍
- 这种回复为什么会让对方更生气
- 真正有效的认错方式是什么

直接输出文章内容，不要标题，不要其他说明。`,

  'apology-guide': `请写一篇关于"道歉的正确打开方式"的文章。

要求：
1. 风格轻松幽默，像朋友聊天一样
2. 字数300-500字
3. 内容要实用，给出具体建议
4. 可以用emoji增加趣味性
5. 开头要吸引人，结尾要有金句

要点提示：
- 真诚道歉的核心要素是什么
- 常见的道歉误区
- 如何让道歉更有说服力

直接输出文章内容，不要标题，不要其他说明。`,
};

export async function POST(request: NextRequest) {
  try {
    const { articleId } = await request.json();

    if (!articleId || !ARTICLES_PROMPTS[articleId]) {
      return NextResponse.json({ error: '文章ID无效' }, { status: 400 });
    }

    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
    const config = new Config();
    const client = new LLMClient(config, customHeaders);

    const messages: Array<{ role: 'user'; content: string }> = [
      { role: 'user', content: ARTICLES_PROMPTS[articleId] },
    ];

    const response = await client.invoke(messages, {
      temperature: 0.8,
    });

    return NextResponse.json({
      content: response.content,
    });

  } catch (error) {
    console.error('Generate article error:', error);
    return NextResponse.json(
      { error: '生成文章失败' },
      { status: 500 }
    );
  }
}
