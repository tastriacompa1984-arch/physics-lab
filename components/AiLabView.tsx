"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles, Bot, User, Compass, HelpCircle, Loader2, ArrowRight, BookOpen, Clock, Trash2, Plus, Brain, Play } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';



interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  reasoningContent?: string;
  isStreaming?: boolean;
  isThinking?: boolean;
  simulationId?: string; // If set, renders the simulation inside this message bubble
}

interface HistoryItem {
  id: string;
  title: string;
  prompt: string;
  timestamp: string;
}

interface AiLabViewProps {
  initialPrompt: string | null;
  onClearInitialPrompt: () => void;
  onSelectSim: (simId: string) => void;
  onGoToWorkbench: () => void;
  allSimulations: any[];
}

export default function AiLabView({
  initialPrompt,
  onClearInitialPrompt,
  onSelectSim,
  onGoToWorkbench,
  allSimulations
}: AiLabViewProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `### 欢迎使用 智教智学 · 基于LLM自动生成深景互动教学系统！ ✨

我是您的 **动态课件生成与科学教学助手**。老师只需输入要教的**课程内容、实验命题或重点考点**，系统将基于大语言模型（LLM）秒级生成包含**三维互动实验、动力学参数调控、微观机理解析与随堂探究测评**的深景互动教学课件！

💡 您可以直接输入教学课题，例如：
* *“帮我生成高一物理《平抛运动规律》动态课件与轨迹模拟”*
* *“制作初中物理《光的折射与全反射》课堂互动课件”*
* *“模拟初中化学《铁丝在纯氧中剧烈燃烧》微观反应与实验课件”*
* *“生成声音振幅和频率对波形影响的互动教学课件”*
* *“制作初中物理欧姆定律伏安法测电阻动态实验课件”*`
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState<string>('');
  const [history, setHistory] = useState<HistoryItem[]>([
    { id: '1', title: '单摆动力学探索', prompt: '帮我设计一个单摆周期与重力加速度关系的物理模型', timestamp: '10分钟前' },
    { id: '2', title: '光的折射与全反射', prompt: '我想探究光的折射与全反射现象', timestamp: '1小时前' },
    { id: '3', title: '铁在氧气中燃烧', prompt: '模拟铁丝在纯氧中剧烈燃烧的化学反应', timestamp: '昨天' }
  ]);
  const [activeHistoryId, setActiveHistoryId] = useState<string | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isGenerating, generationStep]);

  // Handle initial prompt from landing page
  useEffect(() => {
    if (initialPrompt) {
      handleSend(initialPrompt);
      onClearInitialPrompt();
    }
  }, [initialPrompt]);

  // Maps user prompt to simulation ID
  const mapPromptToSimulation = (prompt: string): string | undefined => {
    const text = prompt.toLowerCase();
    if (text.includes('单摆') || text.includes('摆球') || text.includes('重力加速度')) return 'simple-pendulum';
    if (text.includes('弹簧') || text.includes('阻尼') || text.includes('谐振') || text.includes('简谐')) return 'spring-mass';
    if (text.includes('折射') || text.includes('全反射') || text.includes('折射率')) return 'reflection-refraction';
    if (text.includes('透镜') || text.includes('凸透') || text.includes('成像')) return 'convex-lens';
    if (text.includes('声音') || text.includes('波形') || text.includes('频率') || text.includes('响度')) return 'sound-waves';
    if (text.includes('双缝') || text.includes('干涉') || text.includes('杨氏')) return 'double-slit-interference';
    if (text.includes('理想气体') || text.includes('气体') || text.includes('玻意耳')) return 'ideal-gas-law';
    if (text.includes('碰撞') || text.includes('动量') || text.includes('小球')) return 'hollow-ball-collision';
    if (text.includes('欧姆') || text.includes('电路') || text.includes('电阻')) return 'ohms-law';
    if (text.includes('闭合电路') || text.includes('内阻')) return 'closed-circuit-ohm';
    if (text.includes('自由落体') || text.includes('重力') || text.includes('落体')) return 'free-fall-comparison';
    if (text.includes('匀加速') || text.includes('加速度') || text.includes('速度')) return 'uniform-acceleration';
    if (text.includes('杠杆') || text.includes('平衡') || text.includes('力矩')) return 'lever-balance';
    if (text.includes('多普勒') || text.includes('红移')) return 'doppler-effect';
    if (text.includes('力的合成') || text.includes('分解') || text.includes('合力')) return 'force-composition';
    if (text.includes('平抛') || text.includes('抛体')) return 'projectile-motion';
    if (text.includes('冰') || text.includes('熔化') || text.includes('吸热')) return 'melting-curve';
    if (text.includes('铁丝') || text.includes('铁') || text.includes('氧气') || text.includes('燃烧')) return 'iron-oxygen';
    if (text.includes('氯酸钾') || text.includes('实验室制氧')) return 'kclo3-oxygen';
    if (text.includes('二氧化碳') || text.includes('氢氧化钠')) return 'co2-naoh';
    if (text.includes('电解水')) return 'electrolysis-water';
    
    return undefined;
  };

  const getSimulationName = (simId: string): string => {
    if (simId === 'iron-oxygen') return '铁丝在氧气中燃烧';
    if (simId === 'kclo3-oxygen') return '加热氯酸钾制取氧气';
    if (simId === 'co2-naoh') return '二氧化碳与氢氧化钠反应';
    if (simId === 'electrolysis-water') return '电解水实验';
    
    const sim = allSimulations.find(s => s.id === simId);
    return sim ? sim.name : '物理/化学动力学实验';
  };

  const handleSend = async (text?: string) => {
    const query = (text || inputValue).trim();
    if (!query || isGenerating) return;

    setInputValue('');
    setIsGenerating(true);
    setGenerationStep('正在通过自然语言解析实验需求...');

    // Add user message
    const userMsgId = Date.now().toString();
    setMessages(prev => [...prev, { id: userMsgId, role: 'user', content: query }]);

    // Determine target simulation
    const simId = mapPromptToSimulation(query);
    const simName = simId ? getSimulationName(simId) : '科学探究实验环境';

    // Save to history list
    const newHistoryItem: HistoryItem = {
      id: Date.now().toString(),
      title: query.length > 15 ? query.substring(0, 15) + '...' : query,
      prompt: query,
      timestamp: '刚刚'
    };
    setHistory(prev => [newHistoryItem, ...prev]);

    // Create assistant message
    const responseId = (Date.now() + 1).toString();
    setMessages(prev => [
      ...prev,
      {
        id: responseId,
        role: 'assistant',
        content: '',
        reasoningContent: '',
        isStreaming: true,
        isThinking: true,
        simulationId: simId // Only attach if an actual simulation matches
      }
    ]);

    try {
      setGenerationStep('正在生成回答...');

      // Only format as courseware design if the user explicitly asks for courseware/teaching design or selects a courseware topic
      const isExplicitCoursewareRequest = 
        query.includes('课件') || 
        query.includes('教案') || 
        query.includes('教学设计') || 
        query.includes('备课') ||
        (simId !== undefined && query.length >= 4);

      const promptContent = isExplicitCoursewareRequest
        ? `请为中学课题《${query}》生成一份高质量的互动教学课件设计，包含教学目标、核心公式推导（使用规范 LaTeX 格式如 $$公式$$ 或 $公式$）、实验探究要点与随堂探究问题链。`
        : query;

      const apiRes = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            ...messages.filter(m => m.id !== 'welcome').map(m => ({ role: m.role, content: m.content })),
            { role: 'user', content: promptContent }
          ]
        })
      });

      if (!apiRes.ok) {
        throw new Error('API request failed');
      }

      if (!apiRes.body) {
        throw new Error('Streaming not supported');
      }

      const reader = apiRes.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';
      let accumulatedContent = '';
      let accumulatedReasoning = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed === 'data: [DONE]') continue;
          if (trimmed.startsWith('data: ')) {
            try {
              const parsed = JSON.parse(trimmed.slice(6));
              const delta = parsed.choices?.[0]?.delta;
              if (delta) {
                if (delta.reasoning_content) {
                  accumulatedReasoning += delta.reasoning_content;
                }
                if (delta.content) {
                  accumulatedContent += delta.content;
                }

                setMessages(prev =>
                  prev.map(m =>
                    m.id === responseId
                      ? {
                          ...m,
                          content: accumulatedContent,
                          reasoningContent: accumulatedReasoning,
                          isThinking: !accumulatedContent && !!accumulatedReasoning
                        }
                      : m
                  )
                );
              }
            } catch (e) {}
          }
        }
      }

      setMessages(prev =>
        prev.map(m =>
          m.id === responseId
            ? { ...m, isStreaming: false, isThinking: false }
            : m
        )
      );

    } catch (e) {
      console.warn('API streaming fallback to local template:', e);
      const fallbackContent = `### 🎓 智教智学 · 动态深景互动课件生成成功：**${simName}** ✨

大语言模型已结合课标要求与教学目标，自动装配并挂载了 **${simName}** 的三维深景交互式仿真环境。老师可直接在下方三维舞台中拖拽交互、调节动力学参数并引导学生探索。

#### 📖 教学重点与探究目标
1. **现象直观认知**：观察仿真中物体的实时运动轨迹或化学反应现象，建立直观空间物理表象。
2. **定量规律探究**：通过实时调控物理量（如初速度、夹角、浓度、阻尼等），观察受控曲线与状态变化。
3. **启发式问题链**：引导学生探讨“参数变化时系统如何响应？”，验证教材中的科学定理与公式。

#### 🧪 核心动力学与深景互动实验
系统已完成运动方程的数值解算与 WebGL 场景注入，支持实时三维调控与数据打点。

#### 📊 课堂教学互动建议
1. **动态演示**：播放/暂停物理运动，引导全班观察瞬时速度与加速度状态。
2. **数据打点记录**：结合数据记录仪进行实时打点，自动绘制物理函数曲线。
3. **验证公式**：通过调整滑块，对比实验输出的数值与理论公式推导是否一致。`;

      setMessages(prev =>
        prev.map(m =>
          m.id === responseId
            ? { ...m, content: fallbackContent, isStreaming: false, isThinking: false }
            : m
        )
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const startNewChat = () => {
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: `### 欢迎使用 智教智学 · 基于LLM自动生成深景互动教学系统！ ✨

我是您的 **动态课件生成与科学教学助手**。老师只需输入要教的**课程内容、实验命题或重点考点**，系统将基于大语言模型（LLM）秒级生成包含**三维互动实验、动力学参数调控、微观机理解析与随堂探究测评**的深景互动教学课件！

💡 您可以直接输入教学课题，例如：
* *“帮我生成高一物理《平抛运动规律》动态课件与轨迹模拟”*
* *“制作初中物理《光的折射与全反射》课堂互动课件”*
* *“模拟初中化学《铁丝在纯氧中剧烈燃烧》微观反应与实验课件”*
* *“生成声音振幅和频率对波形影响的互动教学课件”*
* *“制作初中物理欧姆定律伏安法测电阻动态实验课件”*`
      }
    ]);
    setActiveHistoryId(null);
  };

  const loadHistoryItem = (item: HistoryItem) => {
    setActiveHistoryId(item.id);
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: `### 欢迎回来！ ✨
正在为您重置仿真模型并重新分析：*“${item.prompt}”*。`
      }
    ]);
    handleSend(item.prompt);
  };

  const deleteHistoryItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setHistory(prev => prev.filter(item => item.id !== id));
    if (activeHistoryId === id) {
      startNewChat();
    }
  };

  // Render clean experiment card linking to Workbench
  const renderInlineSimulation = (simId: string) => {
    const simName = getSimulationName(simId);
    return (
      <div className="mt-4 p-4 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 flex-shrink-0">
            <Sparkles size={20} />
          </div>
          <div>
            <div className="text-xs md:text-sm font-bold text-[var(--text-primary)] flex items-center gap-1.5">
              <span>配套 3D 互动实验：{simName}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 font-normal">三维动力学环境就绪</span>
            </div>
            <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
              本课件已关联对应 3D 实验模型，支持参数调控、动态轨迹观察与数据记录
            </p>
          </div>
        </div>
        <button
          onClick={() => onSelectSim(simId)}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500/20 to-purple-500/20 hover:from-cyan-500/30 hover:to-purple-500/30 border border-cyan-500/30 text-cyan-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition duration-200 flex-shrink-0 shadow-sm"
        >
          <Play size={12} className="fill-current text-cyan-400" />
          打开 3D 实验台 ➔
        </button>
      </div>
    );
  };

  return (
    <div className="h-[calc(100vh-64px)] flex bg-[var(--bg-primary)] text-[var(--text-primary)] overflow-hidden font-sans">
      {/* Left Sidebar - Chat History */}
      <aside className="w-72 border-r border-[var(--border-color)] bg-[var(--bg-secondary)] flex flex-col hidden md:flex">
        {/* Header */}
        <div className="p-4 border-b border-[var(--border-color)] flex gap-2">
          <button 
            onClick={startNewChat}
            className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg border border-[var(--border-color)] hover:border-[var(--border-color)] bg-[var(--bg-tertiary)] hover:bg-[var(--bg-tertiary)]/80 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition duration-200"
          >
            <Plus size={16} />
            新建课件生成
          </button>
        </div>

        {/* History List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5 scrollbar-thin">
          <h4 className="text-[10px] uppercase font-bold tracking-wider text-[var(--text-muted)] px-3 mb-2">已生成互动课件</h4>
          {history.length === 0 ? (
            <div className="text-xs text-[var(--text-muted)] px-3 py-4 text-center">暂无生成记录</div>
          ) : (
            history.map((item) => (
              <div
                key={item.id}
                onClick={() => loadHistoryItem(item)}
                className={`group flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition duration-200 ${
                  activeHistoryId === item.id 
                    ? 'bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] font-semibold' 
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]/50'
                }`}
              >
                <div className="flex items-center gap-2.5 overflow-hidden font-sans">
                  <Clock size={14} className="text-[var(--text-muted)] flex-shrink-0" />
                  <div className="flex flex-col overflow-hidden">
                    <span className="text-xs font-medium truncate">{item.title}</span>
                    <span className="text-[10px] text-[var(--text-muted)]">{item.timestamp}</span>
                  </div>
                </div>
                <button
                  onClick={(e) => deleteHistoryItem(item.id, e)}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-[var(--bg-tertiary)] rounded text-[var(--text-muted)] hover:text-red-400 transition"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer info */}
        <div className="p-4 border-t border-[var(--border-color)] bg-[var(--bg-secondary)] flex items-center justify-between text-[11px] text-[var(--text-muted)]">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            AI 模型引擎就绪
          </span>
          <span>DeepSeek v4-Flash</span>
        </div>
      </aside>

      {/* Right Content Space - Chat Workspace */}
      <main className="flex-1 flex flex-col h-full bg-[var(--bg-primary)] relative">
        {/* Background glow blobs */}
        <div className="absolute top-[-20%] right-[-10%] w-[45vw] h-[45vw] rounded-full bg-purple-900/5 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[45vw] h-[45vw] rounded-full bg-cyan-900/5 blur-[120px] pointer-events-none" />

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-6 relative z-10 scrollbar-thin">
          <div className="max-w-4xl mx-auto space-y-6">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-4 p-4 rounded-xl border ${
                  msg.role === 'user'
                    ? 'bg-[var(--accent-glow)] border-[var(--border-color)] shadow-[0_0_15px_rgba(6,182,212,0.02)]'
                    : 'bg-[var(--glass-bg)] border-[var(--border-color)] backdrop-blur-sm'
                }`}
              >
                {/* Avatar */}
                <div className="flex-shrink-0">
                  {msg.role === 'user' ? (
                    <div className="w-8 h-8 rounded-full bg-cyan-950 border border-cyan-800/40 flex items-center justify-center text-cyan-400">
                      <User size={15} />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/20">
                      <Sparkles size={14} />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-hidden">
                  {/* DeepSeek Harness Style Collapsible Reasoning Trajectory */}
                  {msg.reasoningContent && (
                    <details 
                      className="mb-3.5 p-3 rounded-xl bg-cyan-950/20 border border-cyan-500/20 text-xs text-neutral-300 group select-text" 
                      open={msg.isThinking}
                    >
                      <summary className="font-semibold text-cyan-400 flex items-center gap-2 cursor-pointer select-none hover:text-cyan-300">
                        <Brain size={14} className={msg.isThinking ? "animate-pulse text-cyan-400" : "text-cyan-500/70"} />
                        <span>{msg.isThinking ? "智能体思考中..." : "已完成深度思考"}</span>
                        <span className="text-[10px] text-neutral-400 ml-auto font-normal">点击展开/折叠</span>
                      </summary>
                      <div className="mt-2.5 pt-2 border-t border-cyan-500/10 font-mono text-[11px] leading-relaxed text-neutral-300 whitespace-pre-wrap">
                        {msg.reasoningContent}
                      </div>
                    </details>
                  )}

                  <div className="prose prose-invert prose-sm max-w-none text-[var(--text-primary)]">
                    <ReactMarkdown
                      remarkPlugins={[remarkMath]}
                      rehypePlugins={[rehypeKatex]}
                      components={{
                        p: ({ children }) => <p className="mb-3 last:mb-0 text-[13px] md:text-sm leading-relaxed text-[var(--text-secondary)]">{children}</p>,
                        ul: ({ children }) => <ul className="list-disc pl-5 mb-3 space-y-1.5 text-[13px] md:text-sm text-[var(--text-secondary)]">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal pl-5 mb-3 space-y-1.5 text-[13px] md:text-sm text-[var(--text-secondary)]">{children}</ol>,
                        li: ({ children }) => <li className="text-[13px] md:text-sm text-[var(--text-secondary)]">{children}</li>,
                        strong: ({ children }) => <strong className="text-[var(--accent)] font-bold">{children}</strong>,
                        h1: ({ children }) => <h1 className="text-base font-bold text-[var(--text-primary)] mb-3 mt-1">{children}</h1>,
                        h2: ({ children }) => <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-2 mt-4">{children}</h2>,
                        h3: ({ children }) => <h3 className="text-xs font-semibold text-[var(--text-primary)] mb-1.5 mt-3">{children}</h3>,
                        pre: ({ children }) => <pre className="bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg p-3 my-2.5 overflow-x-auto text-[11px] font-mono text-[var(--accent)]">{children}</pre>,
                        code({ inline, className, children, ...props }: any) {
                          return !inline ? (
                            <code className={className} {...props}>{children}</code>
                          ) : (
                            <code className="bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-pink-500 px-1 py-0.5 rounded text-[11px] font-mono" {...props}>
                              {children}
                            </code>
                          );
                        }
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  </div>

                  {/* Render Live 3D Simulation inside the message bubble */}
                  {msg.simulationId && renderInlineSimulation(msg.simulationId)}
                </div>
              </div>
            ))}

            {/* Thinking status */}
            {isGenerating && (
              <div className="flex gap-4 p-4 rounded-xl border bg-[var(--bg-tertiary)] border-[var(--border-color)] animate-pulse">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-purple-950/20 border border-purple-800/30 flex items-center justify-center text-purple-400">
                    <Sparkles size={14} className="animate-spin" style={{ animationDuration: '3s' }} />
                  </div>
                </div>
                <div className="flex-1 flex flex-col justify-center gap-1.5 py-1">
                  <span className="text-xs text-[var(--text-secondary)] flex items-center gap-2">
                    <Loader2 size={12} className="animate-spin text-purple-400" />
                    {generationStep}
                  </span>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>
        </div>

        {/* Input area */}
        <div className="relative z-10 border-t border-[var(--border-color)] bg-[var(--glass-bg)] backdrop-blur-md px-4 md:px-8 pt-3 pb-6">
          <div className="max-w-4xl mx-auto">
            {/* Quick chips */}
            <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-none">
              {[
                '高一平抛运动动态课件',
                '光的折射与全反射',
                '铁丝在纯氧中剧烈燃烧',
                '欧姆定律伏安测电阻',
                '单摆周期等时性实验'
              ].map((chip) => (
                <button
                  key={chip}
                  onClick={() => handleSend(chip)}
                  disabled={isGenerating}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] hover:border-[var(--accent)] text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition duration-200 whitespace-nowrap cursor-pointer"
                >
                  <Compass size={12} className="text-[var(--accent)]" />
                  {chip}
                </button>
              ))}
            </div>

            {/* Input Bar */}
            <div className="relative flex items-center">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                disabled={isGenerating}
                placeholder={isGenerating ? "正在生成深景互动课件中..." : "输入要教的课题或知识点，LLM 将为您生成 3D 动力学互动课件..."}
                className="w-full pl-5 pr-14 py-3.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] focus:border-[var(--accent)]/50 outline-none text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:shadow-[0_0_20px_rgba(6,182,212,0.04)] transition duration-300 disabled:opacity-50"
              />
              <button
                onClick={() => handleSend()}
                disabled={isGenerating || !inputValue.trim()}
                className="absolute right-2 w-9 h-9 rounded-lg bg-gradient-to-tr from-cyan-400 to-indigo-500 hover:from-cyan-300 hover:to-indigo-400 flex items-center justify-center text-black font-semibold shadow-md active:scale-95 transition duration-200 cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
              >
                {isGenerating ? <Loader2 size={14} className="animate-spin text-black" /> : <Send size={14} />}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
