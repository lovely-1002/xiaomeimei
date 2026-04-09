// 游戏场景配置
export interface Scenario {
  id: string;
  title: string;
  description: string;
  initialMessage: string;
  initialForgiveness: number;
}

// 对话消息
export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  emoji?: string;
  forgivenessChange?: number;
  currentForgiveness?: number;
}

// 游戏状态
export interface GameState {
  status: 'idle' | 'playing' | 'won' | 'lost';
  scenario: Scenario | null;
  messages: Message[];
  forgiveness: number;
  effectiveCount: number;
  negativeCount: number;
}

// API响应
export interface ChatResponse {
  message: string;
  emoji: string;
  forgivenessChange: number;
  currentForgiveness: number;
}

export interface TTSResponse {
  audioUri: string;
}
