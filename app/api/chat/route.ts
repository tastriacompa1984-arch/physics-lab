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
    const apiKey = process.env.DEEPSEEK_API_KEY || 'sk-c95d83fe9fbf4109bcc77732a3352385';
    const baseUrl = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com';

    // System prompt setting
    const systemPrompt = {
      role: 'system',
      content: `你是“智教智学——基于LLM自动生成深景互动教学系统”的专业智能教学AI助手。
你的职责是：
- 深入解答初中与高中的物理、化学和数学疑难问题
- 结合生活实际现象与物理/化学实验原理进行启发式剖析
- 详细推导相关数理公式并使用标准的 LaTeX 格式展示（例如 $$公式$$ 或 $公式$）
- 解释微观机理（如分子间作用力、电子转移、动量守恒、能量相变）
- 如果用户要求生成课件或教学设计，请按照结构化的教学目标、重难点、动力学公式推导、互动实验指导输出
- 语言严谨生动，条理清晰，符合中学课标与启发式教学规范`
    };

    // Combine system prompt and user history
    const payloadMessages = [systemPrompt, ...messages];

    // 5. Connect to DeepSeek API with streaming support
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000);

    try {
      const response = await fetch(`${baseUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: process.env.AI_MODEL || 'deepseek-v4-flash',
          messages: payloadMessages,
          temperature: 0.7,
          stream: true
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('AI API Error response:', errorText);
        return NextResponse.json(
          { error: 'AI 教学引擎暂时不可用，请稍后再试。' },
          { status: 502 }
        );
      }

      // Return real-time Server-Sent Events (SSE) stream directly to client
      return new Response(response.body, {
        headers: {
          'Content-Type': 'text/event-stream; charset=utf-8',
          'Cache-Control': 'no-cache, no-transform',
          'Connection': 'keep-alive',
          'X-Accel-Buffering': 'no'
        }
      });

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
