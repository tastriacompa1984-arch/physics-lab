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
      content: `你是“智教智学”AI教学助手。
【核心交互规则】
1. **日常打招呼与闲聊**：当用户只是问候（如“你好”、“在吗”、“Hi”、“你是谁”等）时，必须用 1~2 句话直接、亲切、简短地回应，严禁长篇大论，严禁自说自话展开无关的物理/化学长篇大论！
2. **学科答疑**：当用户提出具体的理化生数问题时，结合学科原理有针对性地回答，重点清晰，公式请用规范 LaTeX 格式（如 $E=mc^2$ 或 $$F=ma$$），拒绝废话。
3. **课件生成**：仅当用户明确提出“生成课件”、“教学设计”或输入具体备课课题时，才输出包含教学目标、核心公式推导与随堂探究的结构化教案。`
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
