'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Navbar } from '@/components/Navbar';
import { Volume2, RotateCcw, Heart, HeartCrack, MessageCircle, Send, Loader2, BookOpen } from 'lucide-react';
import type { Scenario, Message, GameState } from '@/types/game';

// 场景配置
const SCENARIOS: Scenario[] = [
  {
    id: 'forgot-anniversary',
    title: '忘记纪念日',
    description: '今天是恋爱一周年纪念日，你却完全忘记了...',
    initialMessage: '哼，今天是什么日子，你应该知道吧？我看你早就忘得一干二净了。',
    initialForgiveness: 25,
  },
];

export default function Home() {
  const [gameState, setGameState] = useState<GameState>({
    status: 'idle',
    scenario: null,
    messages: [],
    forgiveness: 0,
    effectiveCount: 0,
    negativeCount: 0,
  });
  
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [ttsAvailable, setTtsAvailable] = useState(true); // TTS服务是否可用
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // 滚动到最新消息
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [gameState.messages]);

  // 开始游戏
  const startGame = (scenario: Scenario) => {
    const initialMessage: Message = {
      id: '1',
      role: 'assistant',
      content: scenario.initialMessage,
      emoji: '😤',
      currentForgiveness: scenario.initialForgiveness,
    };
    
    setGameState({
      status: 'playing',
      scenario,
      messages: [initialMessage],
      forgiveness: scenario.initialForgiveness,
      effectiveCount: 0,
      negativeCount: 0,
    });

    // 自动播放第一条消息
    generateTTS(scenario.initialMessage);
  };

  // 发送消息
  const sendMessage = async () => {
    if (!userInput.trim() || isLoading || gameState.status !== 'playing') return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: userInput.trim(),
    };

    setGameState(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage],
    }));

    setUserInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userInput.trim(),
          history: gameState.messages.map(m => ({ role: m.role, content: m.content })),
          currentForgiveness: gameState.forgiveness,
        }),
      });

      const data = await response.json();
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.message,
        emoji: data.emoji,
        forgivenessChange: data.forgivenessChange,
        currentForgiveness: data.currentForgiveness,
      };

      const newForgiveness = data.currentForgiveness;
      const isEffective = data.forgivenessChange > 0;
      const isNegative = data.forgivenessChange < 0;

      setGameState(prev => ({
        ...prev,
        messages: [...prev.messages, aiMessage],
        forgiveness: newForgiveness,
        effectiveCount: prev.effectiveCount + (isEffective ? 1 : 0),
        negativeCount: prev.negativeCount + (isNegative ? 1 : 0),
        status: newForgiveness >= 100 ? 'won' : newForgiveness <= 0 ? 'lost' : 'playing',
      }));

      // 自动播放AI回复
      generateTTS(data.message);

    } catch {
      // 静默处理错误
    } finally {
      setIsLoading(false);
    }
  };

  // 生成语音
  const generateTTS = async (text: string) => {
    // 如果已知TTS不可用，不再尝试
    if (!ttsAvailable) return;

    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        // 静默处理错误，标记TTS不可用
        setTtsAvailable(false);
        return;
      }

      const data = await response.json();
      
      // 确保返回了有效的音频URL
      if (!data.audioUri) {
        setTtsAvailable(false);
        return;
      }

      // 只设置音频URL，不自动播放（避免浏览器自动播放策略限制）
      setAudioUri(data.audioUri);
      setIsPlaying(false);

      if (audioRef.current) {
        audioRef.current.src = data.audioUri;
      }
    } catch {
      // 静默处理错误，标记TTS不可用
      setTtsAvailable(false);
    }
  };

  // 播放/暂停语音
  const toggleAudio = async () => {
    // 如果没有音频URL，先生成
    if (!audioUri) {
      if (gameState.messages.length > 0) {
        const lastAiMessage = [...gameState.messages].reverse().find(m => m.role === 'assistant');
        if (lastAiMessage) {
          // 重置TTS状态并重新尝试
          setTtsAvailable(true);
          
          try {
            const response = await fetch('/api/tts', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ text: lastAiMessage.content }),
            });

            if (response.ok) {
              const data = await response.json();
              if (data.audioUri && audioRef.current) {
                setAudioUri(data.audioUri);
                audioRef.current.src = data.audioUri;
                await audioRef.current.play();
                setIsPlaying(true);
              }
            }
          } catch {
            // 静默处理
          }
        }
      }
      return;
    }

    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        try {
          await audioRef.current.play();
          setIsPlaying(true);
        } catch {
          // 播放失败，可能是浏览器策略限制
          setIsPlaying(false);
        }
      }
    }
  };

  // 重新开始
  const restartGame = () => {
    setGameState({
      status: 'idle',
      scenario: null,
      messages: [],
      forgiveness: 0,
      effectiveCount: 0,
      negativeCount: 0,
    });
    setUserInput('');
    setAudioUri(null);
    setIsPlaying(false);
    setTtsAvailable(true); // 重置TTS可用状态
  };

  // 获取原谅值颜色
  const getForgivenessColor = (value: number) => {
    if (value >= 70) return 'bg-green-500';
    if (value >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  // 渲染开始界面
  if (gameState.status === 'idle') {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gradient-to-b from-purple-100 to-purple-200 dark:from-purple-900 dark:to-purple-800 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-16 h-16 bg-pink-100 dark:bg-pink-900 rounded-full flex items-center justify-center">
                <Heart className="w-8 h-8 text-pink-500" />
              </div>
              <CardTitle className="text-2xl font-bold">哄哄模拟器</CardTitle>
              <p className="text-muted-foreground mt-2">
                练习哄生气的女朋友，提升你的情商和沟通能力
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground text-center mb-4">
                选择一个场景开始练习
              </p>
              {SCENARIOS.map(scenario => (
                <Button
                  key={scenario.id}
                  variant="outline"
                  className="w-full h-auto py-4 flex flex-col items-start gap-2"
                  onClick={() => startGame(scenario)}
                >
                  <span className="font-semibold">{scenario.title}</span>
                  <span className="text-xs text-muted-foreground text-left">
                    {scenario.description}
                  </span>
                </Button>
              ))}
              
              {/* 恋爱攻略入口 */}
              <div className="pt-4 border-t mt-4">
                <Link href="/blog" className="block">
                  <Button 
                    variant="ghost" 
                    className="w-full h-auto py-3 flex items-center justify-center gap-2 text-pink-600 hover:text-pink-700 hover:bg-pink-50 dark:hover:bg-pink-950"
                  >
                    <BookOpen className="w-5 h-5" />
                    <span className="font-medium">💕 恋爱攻略</span>
                    <span className="text-xs text-muted-foreground">学习哄人技巧</span>
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  // 渲染游戏结束界面
  if (gameState.status === 'won' || gameState.status === 'lost') {
    const isWon = gameState.status === 'won';
    
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gradient-to-b from-purple-100 to-purple-200 dark:from-purple-900 dark:to-purple-800 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className={`mx-auto mb-4 w-16 h-16 rounded-full flex items-center justify-center ${isWon ? 'bg-pink-100 dark:bg-pink-900' : 'bg-gray-100 dark:bg-gray-800'}`}>
                {isWon ? (
                  <Heart className="w-8 h-8 text-pink-500" />
                ) : (
                  <HeartCrack className="w-8 h-8 text-gray-500" />
                )}
              </div>
              <CardTitle className="text-2xl font-bold">
                {isWon ? '恭喜你哄好了！' : '她决定分手了...'}
              </CardTitle>
              <p className="text-muted-foreground mt-2">
                {isWon ? '你的女朋友原谅了你' : '原谅值降到了0'}
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 复盘 */}
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <h3 className="font-semibold text-center mb-3">本局复盘</h3>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">总对话轮数</span>
                  <Badge variant="secondary">{gameState.messages.filter(m => m.role === 'user').length} 轮</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">有效话术</span>
                  <Badge className="bg-green-500">{gameState.effectiveCount} 次</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">踩雷话术</span>
                  <Badge className="bg-red-500">{gameState.negativeCount} 次</Badge>
                </div>
              </div>
              
              <Button 
                className="w-full" 
                onClick={restartGame}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                再来一局
              </Button>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  // 渲染游戏界面
  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-b from-purple-100 to-purple-200 dark:from-purple-900 dark:to-purple-800 flex flex-col">
        {/* 顶部状态栏 */}
        <div className="sticky top-0 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b p-4">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-2">
              <h1 className="font-semibold">{gameState.scenario?.title}</h1>
              <Button variant="ghost" size="sm" onClick={restartGame}>
                <RotateCcw className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Heart className={`w-4 h-4 ${gameState.forgiveness >= 50 ? 'text-pink-500' : 'text-gray-400'}`} />
              <Progress 
                value={gameState.forgiveness} 
                className="flex-1"
              />
              <span className="text-sm font-medium min-w-[3rem] text-right">
                {gameState.forgiveness}%
              </span>
            </div>
          </div>
        </div>

      {/* 消息区域 */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-2xl mx-auto space-y-4">
          {gameState.messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                  message.role === 'user'
                    ? 'bg-pink-500 text-white'
                    : 'bg-white dark:bg-gray-800 shadow-sm'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">
                  {message.content}
                  {message.emoji && <span className="ml-1">{message.emoji}</span>}
                </p>
                {message.forgivenessChange !== undefined && (
                  <div className={`text-xs mt-1 ${message.role === 'assistant' ? 'text-muted-foreground' : 'text-pink-100'}`}>
                    {message.forgivenessChange > 0 ? (
                      <span className="text-green-500">原谅值 +{message.forgivenessChange}% → {message.currentForgiveness}%</span>
                    ) : message.forgivenessChange < 0 ? (
                      <span className="text-red-500">原谅值 {message.forgivenessChange}% → {message.currentForgiveness}%</span>
                    ) : (
                      <span className="text-yellow-500">原谅值不变 → {message.currentForgiveness}%</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white dark:bg-gray-800 rounded-2xl px-4 py-2 shadow-sm">
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* 输入区域 */}
      <div className="sticky bottom-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-t p-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={toggleAudio}
              disabled={!audioUri && gameState.messages.length === 0}
              title="播放语音"
            >
              {isPlaying ? (
                <span className="text-sm">⏸</span>
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </Button>
            <Textarea
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="输入你想说的话..."
              className="min-h-[44px] max-h-24 resize-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
            />
            <Button
              onClick={sendMessage}
              disabled={!userInput.trim() || isLoading}
              size="icon"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* 隐藏的音频元素 */}
      <audio
        ref={audioRef}
        onEnded={() => setIsPlaying(false)}
        className="hidden"
      />
    </div>
    </>
  );
}
