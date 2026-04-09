'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Clock, User, BookOpen, Sparkles, Loader2 } from 'lucide-react';

interface BlogPost {
  id: number;
  title: string;
  summary: string;
  created_at: string;
}

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  // 获取文章列表
  const fetchPosts = async () => {
    try {
      const response = await fetch('/api/blog');
      
      if (!response.ok) {
        throw new Error('获取文章列表失败');
      }
      
      const data = await response.json();
      setPosts(data.posts || []);
    } catch (error) {
      console.error('获取文章列表失败:', error);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  // 生成新文章
  const generateArticle = async () => {
    setGenerating(true);
    try {
      const response = await fetch('/api/blog/generate', {
        method: 'POST',
      });
      const data = await response.json();
      if (data.success) {
        // 重新获取列表
        await fetchPosts();
      } else {
        alert(data.error || '生成失败');
      }
    } catch (error) {
      console.error('生成文章失败:', error);
      alert('生成文章失败');
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  // 格式化日期
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('zh-CN');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
      {/* 顶部导航 */}
      <div className="sticky top-0 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                返回首页
              </Button>
            </Link>
            <h1 className="font-bold text-lg">💕 恋爱攻略</h1>
            <Button 
              size="sm" 
              onClick={generateArticle}
              disabled={generating}
              className="bg-pink-500 hover:bg-pink-600"
            >
              {generating ? (
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4 mr-1" />
              )}
              生成新文章
            </Button>
          </div>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <p className="text-muted-foreground">
            这里收集了一些实用的恋爱沟通技巧，助你成为哄人高手 ✨
          </p>
        </div>

        {/* 文章列表 */}
        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-pink-500" />
            <p className="mt-4 text-muted-foreground">加载中...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">暂无文章，点击右上角生成新文章</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {posts.map((post) => (
              <Link key={post.id} href={`/blog/${post.id}`}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <CardTitle className="text-xl flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-pink-500" />
                      {post.title}
                    </CardTitle>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        恋爱攻略官
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        3分钟
                      </span>
                      <span>{formatDate(post.created_at)}</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground line-clamp-3">
                      {post.summary}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
