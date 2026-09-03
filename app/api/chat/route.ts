import { NextResponse } from 'next/server';

// Lightweight in-memory Rate Limiting (limit to 20 requests per minute per IP)
const ipRequestCounts = new Map<string, { count: number; resetTime: number }>();

const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS = 20;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const record = ipRequestCounts.get(ip);

  if (!record) {
    ipRequestCounts.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return false;
  }

  if (now > record.resetTime) {
    ipRequestCounts.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return false;
  }

  record.count += 1;
  return record.count > MAX_REQUESTS;
}

export async function POST(request: Request) {
  try {
    // 1. Rate Limiting Check
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: '请求过于频繁，请稍后再试 (Too Many Requests)' },
        { status: 429 }
      );
    }

    // 2. Parse request payload
    const body = await request.json();
    const { messages } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: '无效的消息格式 (Invalid messages format)' },
        { status: 400 }
      );
    }

    // 3. Input Validation (Length limit: check user's last message length)
    const userMessages = messages.filter(m => m.role === 'user');
    const lastUserMessage = userMessages[userMessages.length - 1];
    if (lastUserMessage && lastUserMessage.content.length > 1000) {
      return NextResponse.json(
        { error: '输入内容过长，请保持在 1000 字符以内。' },
        { status: 400 }
      );
    }

    // 4. Retrieve API key and Base URL from Server Environment
    const apiKey = process.env.DEEPSEEK_API_KEY || '6fc33b9b3098489c9125c0e020061cfb.G0j68pOtyr0y4i8b';
    const baseUrl = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com';

    // System prompt setting
    const systemPrompt = {
      role: 'system',
      content: `你是 智教智学 教学助手。你的职责是：
- 解答初中物理问题
- 解答高中物理问题
- 解答初中化学问题
- 解答高中化学问题
- 解答中学数学问题
- 用中学生能够理解的语言回答
- 回答时尽量结合实验现象解释原理
- 输出结构清晰，适合教学场景`
    };

    // Combine system prompt and user history
    const payloadMessages = [systemPrompt, ...messages];

    // 5. Connect to DeepSeek API with Timeout (15 seconds)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch(`${baseUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: process.env.AI_MODEL || 'glm-4-flash',
          messages: payloadMessages,
          temperature: 0.7,
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('AI API Error response:', errorText);
        return NextResponse.json(
          { error: 'AI 服务暂时不可用，请稍后再试。' },
          { status: 502 }
        );
      }

      const data = await response.json();
      const assistantMessage = data?.choices?.[0]?.message;

      if (!assistantMessage) {
        return NextResponse.json(
          { error: 'AI 未返回有效回复。' },
          { status: 502 }
        );
      }

      return NextResponse.json(assistantMessage);

    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        return NextResponse.json(
          { error: 'AI 响应超时，请缩短您的问题或稍后重试。' },
          { status: 504 }
        );
      }
      throw fetchError;
    }

  } catch (err: any) {
    console.error('Internal API Route Error:', err);
    return NextResponse.json(
      { error: '服务器内部错误，请稍后再试。' },
      { status: 500 }
    );
  }
}
