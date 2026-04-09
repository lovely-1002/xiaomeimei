import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { LLMClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';

// 文章生成提示词列表
const ARTICLE_TOPICS = [
  {
    title: '如何在吵架中保持冷静',
    prompt: `请写一篇关于"如何在吵架中保持冷静"的文章。

要求：
1. 风格轻松幽默，像朋友聊天一样
2. 字数300-500字
3. 内容要实用，给出具体建议
4. 可以用emoji增加趣味性
5. 开头要吸引人，结尾要有金句

要点提示：
- 吵架时情绪失控的危害
- 实用的冷静技巧
- 如何在冷静后有效沟通

直接输出文章内容，不要标题，不要其他说明。`,
  },
  {
    title: '为什么女朋友生气时不想说话',
    prompt: `请写一篇关于"为什么女朋友生气时不想说话"的文章。

要求：
1. 风格轻松幽默，像朋友聊天一样
2. 字数300-500字
3. 内容要实用，给出具体建议
4. 可以用emoji增加趣味性
5. 开头要吸引人，结尾要有金句

要点提示：
- 沉默背后的心理原因
- 什么时候该给空间，什么时候该主动
- 如何打破沉默僵局

直接输出文章内容，不要标题，不要其他说明。`,
  },
  {
    title: '如何正确表达你的委屈',
    prompt: `请写一篇关于"如何正确表达你的委屈"的文章。

要求：
1. 风格轻松幽默，像朋友聊天一样
2. 字数300-500字
3. 内容要实用，给出具体建议
4. 可以用emoji增加趣味性
5. 开头要吸引人，结尾要有金句

要点提示：
- 为什么表达委屈很重要
- 表达委屈的正确方式
- 避免让对方觉得你在指责

直接输出文章内容，不要标题，不要其他说明。`,
  },
  {
    title: '吵架后如何破冰',
    prompt: `请写一篇关于"吵架后如何破冰"的文章。

要求：
1. 风格轻松幽默，像朋友聊天一样
2. 字数300-500字
3. 内容要实用，给出具体建议
4. 可以用emoji增加趣味性
5. 开头要吸引人，结尾要有金句

要点提示：
- 破冰的最佳时机
- 实用的破冰技巧
- 如何避免冷战升级

直接输出文章内容，不要标题，不要其他说明。`,
  },
  {
    title: '如何避免翻旧账',
    prompt: `请写一篇关于"如何避免翻旧账"的文章。

要求：
1. 风格轻松幽默，像朋友聊天一样
2. 字数300-500字
3. 内容要实用，给出具体建议
4. 可以用emoji增加趣味性
5. 开头要吸引人，结尾要有金句

要点提示：
- 为什么人会忍不住翻旧账
- 翻旧账对关系的伤害
- 如何就事论事解决问题

直接输出文章内容，不要标题，不要其他说明。`,
  },
];

// 博客文章接口
interface BlogPost {
  id: number;
  title: string;
  summary: string;
  content: string;
  created_at: string;
}

export async function POST(request: NextRequest) {
  try {
    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
    const client = getSupabaseClient();
    
    // 获取已存在的文章标题，避免重复
    const { data: existingPosts, error: fetchError } = await client
      .from('blog_posts')
      .select('title');
    
    if (fetchError) throw new Error(`查询失败: ${fetchError.message}`);
    
    const existingTitles = new Set(existingPosts?.map((p: { title: string }) => p.title) || []);
    
    // 找一个还没用过的主题
    const availableTopics = ARTICLE_TOPICS.filter(t => !existingTitles.has(t.title));
    
    if (availableTopics.length === 0) {
      return NextResponse.json(
        { error: '所有主题都已生成过文章' },
        { status: 400 }
      );
    }
    
    // 随机选择一个主题
    const topic = availableTopics[Math.floor(Math.random() * availableTopics.length)];
    
    // 调用LLM生成文章
    const config = new Config();
    const llmClient = new LLMClient(config, customHeaders);
    
    const messages: Array<{ role: 'user'; content: string }> = [
      { role: 'user', content: topic.prompt },
    ];
    
    const response = await llmClient.invoke(messages, {
      temperature: 0.8,
    });
    
    const content = response.content;
    
    // 生成摘要（取前150个字符）
    const summary = content.length > 150 
      ? content.substring(0, 150) + '...'
      : content;
    
    // 保存到数据库
    const { data, error } = await client
      .from('blog_posts')
      .insert({
        title: topic.title,
        summary,
        content,
      })
      .select()
      .single();
    
    if (error) throw new Error(`保存失败: ${error.message}`);
    
    return NextResponse.json({ 
      success: true, 
      post: data as BlogPost 
    });
  } catch (error) {
    console.error('生成文章失败:', error);
    return NextResponse.json(
      { error: '生成文章失败' },
      { status: 500 }
    );
  }
}
