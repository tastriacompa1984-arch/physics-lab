"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Send, ArrowLeft, Bot, User, Sparkles, AlertCircle, Compass, HelpCircle, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export default function AssistantPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: `你好！我是 **智教智学 教学助手**。👋

我可以帮您解答初中/高中的物理、化学以及数学问题，并通过有趣的物理现象与实验原理为您讲解。

您有什么想探讨的问题吗？例如：
* 为什么铁丝在氧气中能剧烈燃烧，而在空气中不行？
* 怎么理解单摆的能量守恒与阻尼衰减？
* 什么是斯涅尔光的折射定律？
* 二次函数顶点坐标公式是如何推导的？`
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new message or loading state
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async (text?: string) => {
    const query = (text || inputValue).trim();
    if (!query || isLoading) return;

    if (query.length > 1000) {
      setErrorMsg('问题过长，请保持在 1000 字符以内。');
      return;
    }

    setErrorMsg(null);
    setInputValue('');
    setIsLoading(true);

    const updatedHistory: ChatMessage[] = [...messages, { role: 'user', content: query }];
    setMessages(updatedHistory);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedHistory.map(m => ({
            role: m.role,
            content: m.content
          }))
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '请求失败，请稍后重试。');
      }

      const reply = await response.json();
      setMessages(prev => [...prev, { role: 'assistant', content: reply.content }]);

    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || '网络连接失败，请稍后重试。');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  return (
    <div className="relative min-h-screen bg-[#030303] text-neutral-100 flex flex-col font-sans overflow-hidden">
      
      {/* Decorative Blur Background Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-purple-900/10 blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-cyan-900/10 blur-[120px] pointer-events-none z-0" />

      {/* Floating Star Dust overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.01)_0%,transparent_70%)] pointer-events-none z-0" />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-white/5 bg-black/40 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <a
            href="/"
            className="flex items-center justify-center w-8 h-8 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all text-neutral-400 hover:text-white"
          >
            <ArrowLeft size={16} />
          </a>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-purple-600 flex items-center justify-center shadow-lg shadow-cyan-500/10">
              <Bot size={18} className="text-black font-bold" />
            </div>
            <div>
              <span className="font-bold text-base tracking-wide bg-gradient-to-r from-white to-cyan-400 bg-clip-text text-transparent">
                智教智学 AI 教学助手
              </span>
              <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-white/5 border border-white/5 text-cyan-400 font-semibold font-mono">
                DeepSeek v3
              </span>
            </div>
          </div>
        </div>

        <a
          href="/"
          className="text-xs text-neutral-400 hover:text-cyan-400 hover:underline transition-colors flex items-center gap-1"
        >
          返回物理实验台
        </a>
      </header>

      {/* Chat Area */}
      <main className="relative z-10 flex-1 overflow-y-auto px-4 md:px-8 py-6 max-w-4xl mx-auto w-full flex flex-col justify-between">
        
        {/* Messages List */}
        <div className="flex-1 space-y-6 mb-8 scrollbar-thin">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex gap-4 p-4 rounded-2xl border transition-all duration-300 ${
                msg.role === 'user'
                  ? 'bg-cyan-950/15 border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.03)]'
                  : 'bg-white/[0.02] border-white/5'
              }`}
            >
              {/* Avatar Icon */}
              <div className="flex-shrink-0">
                {msg.role === 'user' ? (
                  <div className="w-9 h-9 rounded-full bg-cyan-950 border border-cyan-800/50 flex items-center justify-center text-cyan-400">
                    <User size={18} />
                  </div>
                ) : (
                  <div className="w-9 h-9 rounded-full bg-purple-950 border border-purple-800/50 flex items-center justify-center text-purple-400 shadow-md">
                    <Sparkles size={16} />
                  </div>
                )}
              </div>

              {/* Message Content */}
              <div className="flex-1 overflow-hidden prose prose-invert prose-sm max-w-none">
                <ReactMarkdown
                  remarkPlugins={[remarkMath]}
                  rehypePlugins={[rehypeKatex]}
                  components={{
                    p: ({ children }) => <p className="mb-3 last:mb-0 text-[0.92rem] leading-relaxed text-neutral-200">{children}</p>,
                    ul: ({ children }) => <ul className="list-disc pl-5 mb-3 space-y-1.5 text-[0.9rem] text-neutral-300">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal pl-5 mb-3 space-y-1.5 text-[0.9rem] text-neutral-300">{children}</ol>,
                    li: ({ children }) => <li className="text-[0.9rem]">{children}</li>,
                    strong: ({ children }) => <strong className="text-cyan-300 font-bold">{children}</strong>,
                    pre: ({ children }) => <pre className="bg-[#050508] border border-white/5 rounded-xl p-4 my-3 overflow-x-auto text-[0.8rem] font-mono text-cyan-400">{children}</pre>,
                    code({ inline, className, children, ...props }: any) {
                      return !inline ? (
                        <code className={className} {...props}>{children}</code>
                      ) : (
                        <code className="bg-white/5 border border-white/5 text-pink-400 px-1.5 py-0.5 rounded text-xs font-mono" {...props}>
                          {children}
                        </code>
                      );
                    }
                  }}
                >
                  {msg.content}
                </ReactMarkdown>
              </div>
            </div>
          ))}

          {/* AI Thinking Animation */}
          {isLoading && (
            <div className="flex gap-4 p-4 rounded-2xl border bg-white/[0.02] border-white/5 animate-pulse">
              <div className="flex-shrink-0">
                <div className="w-9 h-9 rounded-full bg-purple-950 border border-purple-800/50 flex items-center justify-center text-purple-400">
                  <Sparkles size={16} className="animate-spin" style={{ animationDuration: '3s' }} />
                </div>
              </div>
              <div className="flex-1 flex items-center gap-1.5 py-2">
                <span className="w-2 h-2 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-2 h-2 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-2 h-2 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </div>
            </div>
          )}

          {/* Error Message */}
          {errorMsg && (
            <div className="flex items-center gap-3 p-4 rounded-xl border border-red-500/20 bg-red-950/15 text-red-400 text-sm">
              <AlertCircle size={16} className="flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Input Bar & Suggestion Area */}
        <div className="sticky bottom-0 bg-[#030303]/80 backdrop-blur-md pt-2 pb-6 border-t border-white/5 z-20">
          
          {/* Quick Suggestion Chips */}
          <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-none scroll-smooth">
            {[
              '为什么铁在氧气中燃烧生成四氧化三铁？',
              '简述光的折射定律与全反射临界角',
              '如何使用二分法求方程的近似解？',
              '解释酸碱中和反应的微观本质'
            ].map((chip, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(chip)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/[0.03] border border-white/5 text-xs text-neutral-300 hover:text-white hover:bg-white/[0.08] hover:border-cyan-500/30 transition-all duration-300 whitespace-nowrap shadow-sm hover:shadow-cyan-500/5 cursor-pointer"
              >
                <Compass size={12} className="text-cyan-400" />
                {chip}
              </button>
            ))}
          </div>

          {/* Main Input Field */}
          <div className="relative flex items-center">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              placeholder={isLoading ? "AI 助手正在解答，请稍后..." : "向 AI 助手提问理化或数学问题，最多 1000 字..."}
              className="w-full pl-5 pr-14 py-4 rounded-2xl bg-black border border-white/5 focus:border-cyan-500/50 outline-none text-sm text-neutral-100 placeholder-neutral-500 focus:shadow-[0_0_20px_rgba(6,182,212,0.08)] transition-all duration-300 disabled:opacity-50"
            />
            <button
              onClick={() => handleSend()}
              disabled={isLoading || !inputValue.trim()}
              className="absolute right-2.5 w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-400 to-cyan-500 hover:from-cyan-300 hover:to-cyan-400 flex items-center justify-center text-black font-semibold shadow-md shadow-cyan-400/20 active:scale-95 transition-all duration-300 cursor-pointer disabled:opacity-40 disabled:pointer-events-none disabled:shadow-none"
            >
              {isLoading ? <Loader2 size={16} className="animate-spin text-black" /> : <Send size={16} />}
            </button>
          </div>
        </div>

      </main>
    </div>
  );
}
