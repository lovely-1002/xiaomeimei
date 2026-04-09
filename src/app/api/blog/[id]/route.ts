import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 博客文章接口
interface BlogPost {
  id: number;
  title: string;
  summary: string;
  content: string;
  created_at: string;
}

// 获取文章详情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const client = getSupabaseClient();
    
    const { data, error } = await client
      .from('blog_posts')
      .select('*')
      .eq('id', parseInt(id))
      .maybeSingle();
    
    if (error) throw new Error(`查询失败: ${error.message}`);
    
    if (!data) {
      return NextResponse.json(
        { error: '文章不存在' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ post: data as BlogPost });
  } catch (error) {
    console.error('获取文章详情失败:', error);
    return NextResponse.json(
      { error: '获取文章详情失败' },
      { status: 500 }
    );
  }
}
