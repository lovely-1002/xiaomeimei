import { NextRequest, NextResponse } from 'next/server';
import { TTSClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();

    if (!text) {
      return NextResponse.json({ error: '文本不能为空' }, { status: 400 });
    }

    // 提取请求头
    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
    
    // 初始化TTS客户端
    const config = new Config();
    const client = new TTSClient(config, customHeaders);

    // 调用TTS API
    const response = await client.synthesize({
      uid: 'user-' + Date.now(),
      text: text,
      speaker: 'saturn_zh_female_tiaopigongzhu_tob', // 调皮公主 - 符合傲娇人设
      audioFormat: 'mp3',
      sampleRate: 24000,
      speechRate: 0,  // 正常语速
      loudnessRate: 0, // 正常音量
    });

    return NextResponse.json({
      audioUri: response.audioUri,
    });

  } catch (error) {
    console.error('TTS API error:', error);
    return NextResponse.json(
      { error: '语音合成失败' },
      { status: 500 }
    );
  }
}
