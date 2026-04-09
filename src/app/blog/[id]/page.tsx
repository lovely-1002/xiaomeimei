'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Clock, User, BookOpen, Loader2 } from 'lucide-react';

interface BlogPost {
  id: number;
  title: string;
  summary: string;
  content: string;
  created_at: string;
}

export default function ArticlePage() {
  const params = useParams();
  const [article, setArticle] = useState<BlogPost | null>(null);
  const [otherPosts, setOtherPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  // 获取文章详情
  const fetchArticle = async () => {
    try {
      const articleRes = await fetch(`/api/blog/${params.id}`);
      
      if (!articleRes.ok) {
        throw new Error('获取文章失败');
      }
      
      const articleData = await articleRes.json();
      setArticle(articleData.post || null);
      
      try {
        const postsRes = await fetch('/api/blog');
        if (postsRes.ok) {
          const postsData = await postsRes.json();
          setOtherPosts((postsData.posts || []).filter((p: BlogPost) => p.id !== parseInt(params.id as string)).slice(0, 2));
        }
      } catch (e) {
        console.error('获取文章列表失败:', e);
      }
    } catch (error) {
      console.error('获取文章详情失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticle();
  }, [params.id]);

  // 格式化日期
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('zh-CN');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground mb-4">文章不存在</p>
            <Link href="/blog">
              <Button>返回列表</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
      {/* 顶部导航 */}
      <div className="sticky top-0 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/blog">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                返回列表
              </Button>
            </Link>
            <h1 className="font-bold text-lg">💕 恋爱攻略</h1>
            <div className="w-20" />
          </div>
        </div>
      </div>

      {/* 文章内容 */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-pink-500" />
              {article.title}
            </CardTitle>
            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
              <span className="flex items-center gap-1">
                <User className="w-4 h-4" />
                恋爱攻略官
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                3分钟
              </span>
              <span>{formatDate(article.created_at)}</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="prose prose-pink dark:prose-invert max-w-none">
              {article.content.split('\n\n').map((paragraph, index) => (
                <p key={index} className="mb-4 text-foreground leading-relaxed">
                  {paragraph}
                </p>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 底部推荐 */}
        {otherPosts.length > 0 && (
          <div className="mt-8">
            <h3 className="font-semibold mb-4">📖 其他文章</h3>
            <div className="grid gap-4">
              {otherPosts.map((otherPost) => (
                <Link key={otherPost.id} href={`/blog/${otherPost.id}`}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="py-4">
                      <h4 className="font-medium">{otherPost.title}</h4>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                        {otherPost.summary}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
