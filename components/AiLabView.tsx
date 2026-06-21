"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles, Bot, User, Compass, HelpCircle, Loader2, ArrowRight, BookOpen, Clock, Trash2, Plus } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

// Import simulations to display inline when generated
import { SoundWaves } from '../simulations/SoundWaves';
import { ReflectionRefraction } from '../simulations/ReflectionRefraction';
import { ConvexLens } from '../simulations/ConvexLens';
import { MeltingCurve } from '../simulations/MeltingCurve';
import { LeverBalance } from '../simulations/LeverBalance';
import { FreeFallComparison } from '../simulations/FreeFallComparison';
import { OhmsLaw } from '../simulations/OhmsLaw';
import { ProjectileMotion } from '../simulations/ProjectileMotion';
import { UniformAcceleration } from '../simulations/UniformAcceleration';
import { SimplePendulum } from '../simulations/SimplePendulum';
import { SpringMassSystem } from '../simulations/SpringMassSystem';
import { ForceComposition } from '../simulations/ForceComposition';
import { DopplerEffect } from '../simulations/DopplerEffect';
import { ClosedCircuitOhm } from '../simulations/ClosedCircuitOhm';
import { DoubleSlitInterference } from '../simulations/DoubleSlitInterference';
import { IdealGasLaw } from '../simulations/IdealGasLaw';
import { HollowBallCollision } from '../simulations/HollowBallCollision';
import { ChemistryLab } from '../simulations/ChemistryLab';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
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
      content: `### 欢迎来到 AI 智能实验生成工坊！ ✨

我是您的 **LabAI 科学探索助手**。您可以直接输入任何物理或化学命题，我将为您**自动构建动力学实验模型**并给出详细的物理原理剖析。

比如，您可以输入：
* *“帮我设计一个单摆周期与重力加速度关系的物理模型”*
* *“我想探究光的折射与全反射现象”*
* *“模拟铁丝在纯氧中剧烈燃烧的化学反应”*
* *“如何演示声音的振幅和频率对波形的影响”*`
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

    // Save to history list
    const newHistoryItem: HistoryItem = {
      id: Date.now().toString(),
      title: query.length > 15 ? query.substring(0, 15) + '...' : query,
      prompt: query,
      timestamp: '刚刚'
    };
    setHistory(prev => [newHistoryItem, ...prev]);

    // AI Generation Steps sequence simulation
    await new Promise(resolve => setTimeout(resolve, 800));
    setGenerationStep('正在装载 WebGL 物理算子与着色器...');
    await new Promise(resolve => setTimeout(resolve, 800));
    setGenerationStep('正在构建动力学网格并初始化参数...');
    await new Promise(resolve => setTimeout(resolve, 600));
    setGenerationStep('生成完成！正在流式输出实验解析与仿真模型...');

    // Prepare generated text content based on simulation
    let generatedContent = '';
    if (simId) {
      const simName = getSimulationName(simId);
      generatedContent = `### AI 智能构建成功：**${simName}** 实验模块 ✨

我已经为您在下方渲染窗口中自动生成了 **${simName}** 的实时三维交互式仿真环境。

#### 🧪 实验理论基础
根据您的要求，该实验的核心动力学及控制机制如下：

${simId === 'simple-pendulum' ? `
*   **单摆运动公式**：对于小角度单摆，摆动周期 $T$ 与摆长 $L$ 以及重力加速度 $g$ 满足以下关系：
    $$T = 2\\pi \\sqrt{\\frac{L}{g}}$$
*   **物理规律**：周期 $T$ 与摆球的质量 $m$ 以及初始摆角无关（等时性）。而在大角度下，需要引入椭圆积分进行修正。
*   **仿真调节说明**：您可以在下方实时调整 **摆长 (L)**、**重力加速度 (g)** 和 **空气阻尼系数**，并观察摆球的实时运动曲线。
` : simId === 'reflection-refraction' ? `
*   **折射定律 (Snell's Law)**：光线在交界面发生折射时，入射角 $\\theta_1$ 与折射角 $\\theta_2$ 的正弦值与介质折射率 $n_1, n_2$ 成反比：
    $$n_1 \\sin(\\theta_1) = n_2 \\sin(\\theta_2)$$
*   **全反射临界角 (Critical Angle)**：当光从光密介质射向光疏介质，且入射角大于临界角 $\\theta_c$ 时，折射光完全消失：
    $$\\theta_c = \\arcsin\\left(\\frac{n_2}{n_1}\\right)$$
` : `
*   **系统动力学算子已装载**：对应的仿真公式及计算方程已经注入下方的交互式 WebGL 实例中。
*   **实时交互**：您可以使用鼠标在下方画面上进行 **旋转 (Orbit)**、**缩放 (Zoom)** 和 **拖拽**，并通过侧边滑块调节参数。
`}

#### 📊 实验观察指导
1.  **观察运动轨迹**：留意物理量在变化过程中的动态响应。
2.  **记录数据**：系统将在数据记录仪中绘制实时曲线图。
3.  **验证公式**：通过调整滑块，对比实验输出的周期/折射角等数值与理论公式推导是否一致。`;
    } else {
      generatedContent = `### AI 概念性仿真模型装载完成 🔍

目前尚未在经典实验库中匹配到完全一致的 WebGL 三维模型。我为您装载了 **物理系统分析环境**。

#### 💡 科学原理解释
针对您的提问 *“${query}”*，其背后的核心原理为：
*   **系统守恒律**：通常涉及能量、动量或电荷的守恒方程。
*   **动力学响应**：描述物体在受到外力作用时如何随着时间演化。

#### 🛠 建议的实验搭建方案
为了深入探索该课题，建议您可以在本站 **实验库** 中选择最接近的物理系统（例如“简谐振动”或“理想气体实验”）进行参数的重组与设计。

*(下方已为您挂载通用的阻尼摆球测试环境，供您观察经典简谐衰减过程。)*`;
    }

    // Stream the content character by character
    const responseId = (Date.now() + 1).toString();
    setIsGenerating(false);
    
    // Add empty assistant message first
    setMessages(prev => [...prev, { id: responseId, role: 'assistant', content: '', isStreaming: true }]);
    
    let currentLen = 0;
    const interval = setInterval(() => {
      currentLen += 15; // Speed multiplier for streaming
      if (currentLen >= generatedContent.length) {
        clearInterval(interval);
        setMessages(prev =>
          prev.map(m =>
            m.id === responseId
              ? { ...m, content: generatedContent, isStreaming: false, simulationId: simId || 'simple-pendulum' }
              : m
          )
        );
      } else {
        setMessages(prev =>
          prev.map(m =>
            m.id === responseId
              ? { ...m, content: generatedContent.substring(0, currentLen) }
              : m
          )
        );
      }
    }, 20);
  };

  const startNewChat = () => {
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: `### 欢迎来到 AI 智能实验生成工坊！ ✨

我是您的 **LabAI 科学探索助手**。您可以直接输入任何物理或化学命题，我将为您**自动构建动力学实验模型**并给出详细的物理原理剖析。

比如，您可以输入：
* *“帮我设计一个单摆周期与重力加速度关系的物理模型”*
* *“我想探究光的折射与全反射现象”*
* *“模拟铁丝在纯氧中剧烈燃烧的化学反应”*
* *“如何演示声音的振幅和频率对波形的影响”*`
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

  // Render the selected simulation inline
  const renderInlineSimulation = (simId: string) => {
    // Standard mock callbacks for simulations
    const handleRecordData = (data: any) => console.log('Data recorded:', data);

    const simulationProps = {
      isPlaying: true,
      isGridVisible: true,
      isVectorVisible: true,
      simSpeed: 1,
      parameters: {}, // will use internal defaults
      onRecordData: handleRecordData
    };

    // Chemistry simulation wrappers
    if (simId === 'iron-oxygen') {
      return (
        <div className="w-full bg-zinc-950 border border-zinc-800/80 rounded-xl overflow-hidden shadow-2xl mt-4">
          <div className="px-4 py-2.5 bg-zinc-900 border-b border-zinc-800 flex justify-between items-center">
            <span className="text-xs text-cyan-400 font-semibold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              实时 3D 动力学仿真器：铁丝在氧气中燃烧
            </span>
            <button 
              onClick={() => onSelectSim('iron-oxygen')}
              className="text-[10px] text-zinc-400 hover:text-white px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 transition"
            >
              打开独立实验台 →
            </button>
          </div>
          <div className="relative aspect-video w-full bg-black">
            <ChemistryLab experimentId="iron-oxygen" {...simulationProps} />
          </div>
        </div>
      );
    }

    if (simId === 'kclo3-oxygen') {
      return (
        <div className="w-full bg-zinc-950 border border-zinc-800/80 rounded-xl overflow-hidden shadow-2xl mt-4">
          <div className="px-4 py-2.5 bg-zinc-900 border-b border-zinc-800 flex justify-between items-center">
            <span className="text-xs text-cyan-400 font-semibold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              实时 3D 动力学仿真器：加热氯酸钾制取氧气
            </span>
            <button 
              onClick={() => onSelectSim('kclo3-oxygen')}
              className="text-[10px] text-zinc-400 hover:text-white px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 transition"
            >
              打开独立实验台 →
            </button>
          </div>
          <div className="relative aspect-video w-full bg-black">
            <ChemistryLab experimentId="kclo3-oxygen" {...simulationProps} />
          </div>
        </div>
      );
    }

    // Physics mapping
    let SimComponent: React.ComponentType<any> | null = null;
    switch (simId) {
      case 'simple-pendulum': SimComponent = SimplePendulum; break;
      case 'spring-mass': SimComponent = SpringMassSystem; break;
      case 'reflection-refraction': SimComponent = ReflectionRefraction; break;
      case 'convex-lens': SimComponent = ConvexLens; break;
      case 'sound-waves': SimComponent = SoundWaves; break;
      case 'double-slit-interference': SimComponent = DoubleSlitInterference; break;
      case 'ideal-gas-law': SimComponent = IdealGasLaw; break;
      case 'hollow-ball-collision': SimComponent = HollowBallCollision; break;
      case 'ohms-law': SimComponent = OhmsLaw; break;
      case 'closed-circuit-ohm': SimComponent = ClosedCircuitOhm; break;
      case 'free-fall-comparison': SimComponent = FreeFallComparison; break;
      case 'uniform-acceleration': SimComponent = UniformAcceleration; break;
      case 'lever-balance': SimComponent = LeverBalance; break;
      case 'doppler-effect': SimComponent = DopplerEffect; break;
      case 'force-composition': SimComponent = ForceComposition; break;
      case 'projectile-motion': SimComponent = ProjectileMotion; break;
      case 'melting-curve': SimComponent = MeltingCurve; break;
      default: SimComponent = SimplePendulum;
    }

    return (
      <div className="w-full bg-zinc-950 border border-zinc-800/80 rounded-xl overflow-hidden shadow-2xl mt-4">
        <div className="px-4 py-2.5 bg-zinc-900 border-b border-zinc-800 flex justify-between items-center">
          <span className="text-xs text-cyan-400 font-semibold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            实时 3D 动力学仿真器：{getSimulationName(simId)}
          </span>
          <button 
            onClick={() => onSelectSim(simId)}
            className="text-[10px] text-zinc-400 hover:text-white px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 transition"
          >
            打开独立实验台 →
          </button>
        </div>
        <div className="relative aspect-video w-full bg-[#05070c]">
          <SimComponent {...simulationProps} />
        </div>
      </div>
    );
  };

  return (
    <div className="h-[calc(100vh-64px)] flex bg-zinc-950 text-slate-100 overflow-hidden font-sans">
      {/* Left Sidebar - Chat History */}
      <aside className="w-72 border-r border-zinc-800/60 bg-zinc-950 flex flex-col hidden md:flex">
        {/* Header */}
        <div className="p-4 border-b border-zinc-800/60 flex gap-2">
          <button 
            onClick={startNewChat}
            className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg border border-zinc-800 hover:border-zinc-700 bg-zinc-900/40 hover:bg-zinc-900 text-sm text-zinc-200 hover:text-white transition duration-200"
          >
            <Plus size={16} />
            新建实验生成
          </button>
        </div>

        {/* History List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5 scrollbar-thin">
          <h4 className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 px-3 mb-2">历史生成记录</h4>
          {history.length === 0 ? (
            <div className="text-xs text-zinc-600 px-3 py-4 text-center">暂无生成记录</div>
          ) : (
            history.map((item) => (
              <div
                key={item.id}
                onClick={() => loadHistoryItem(item)}
                className={`group flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition duration-200 ${
                  activeHistoryId === item.id 
                    ? 'bg-zinc-900 border border-zinc-800 text-white' 
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50'
                }`}
              >
                <div className="flex items-center gap-2.5 overflow-hidden font-sans">
                  <Clock size={14} className="text-zinc-500 flex-shrink-0" />
                  <div className="flex flex-col overflow-hidden">
                    <span className="text-xs font-medium truncate">{item.title}</span>
                    <span className="text-[10px] text-zinc-600">{item.timestamp}</span>
                  </div>
                </div>
                <button
                  onClick={(e) => deleteHistoryItem(item.id, e)}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-zinc-800 rounded text-zinc-500 hover:text-red-400 transition"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer info */}
        <div className="p-4 border-t border-zinc-800/60 bg-zinc-950 flex items-center justify-between text-[11px] text-zinc-500">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            AI 模型引擎就绪
          </span>
          <span>DeepSeek v3</span>
        </div>
      </aside>

      {/* Right Content Space - Chat Workspace */}
      <main className="flex-1 flex flex-col h-full bg-[#050508] relative">
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
                    ? 'bg-cyan-955/10 border-cyan-500/10 shadow-[0_0_15px_rgba(6,182,212,0.02)]'
                    : 'bg-zinc-900/25 border-zinc-800/40 backdrop-blur-sm'
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
                  <div className="prose prose-invert prose-sm max-w-none text-slate-200">
                    <ReactMarkdown
                      remarkPlugins={[remarkMath]}
                      rehypePlugins={[rehypeKatex]}
                      components={{
                        p: ({ children }) => <p className="mb-3 last:mb-0 text-[13px] md:text-sm leading-relaxed text-zinc-300">{children}</p>,
                        ul: ({ children }) => <ul className="list-disc pl-5 mb-3 space-y-1.5 text-[13px] md:text-sm text-zinc-400">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal pl-5 mb-3 space-y-1.5 text-[13px] md:text-sm text-zinc-400">{children}</ol>,
                        li: ({ children }) => <li className="text-[13px] md:text-sm">{children}</li>,
                        strong: ({ children }) => <strong className="text-cyan-400 font-bold">{children}</strong>,
                        h1: ({ children }) => <h1 className="text-base font-bold text-white mb-3 mt-1">{children}</h1>,
                        h2: ({ children }) => <h2 className="text-sm font-semibold text-white mb-2 mt-4">{children}</h2>,
                        h3: ({ children }) => <h3 className="text-xs font-semibold text-zinc-200 mb-1.5 mt-3">{children}</h3>,
                        pre: ({ children }) => <pre className="bg-black/40 border border-zinc-800 rounded-lg p-3 my-2.5 overflow-x-auto text-[11px] font-mono text-cyan-400">{children}</pre>,
                        code({ inline, className, children, ...props }: any) {
                          return !inline ? (
                            <code className={className} {...props}>{children}</code>
                          ) : (
                            <code className="bg-zinc-800/60 border border-zinc-700/50 text-pink-400 px-1 py-0.5 rounded text-[11px] font-mono" {...props}>
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
              <div className="flex gap-4 p-4 rounded-xl border bg-zinc-900/10 border-zinc-800/40 animate-pulse">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-purple-950 border border-purple-800/50 flex items-center justify-center text-purple-400">
                    <Sparkles size={14} className="animate-spin" style={{ animationDuration: '3s' }} />
                  </div>
                </div>
                <div className="flex-1 flex flex-col justify-center gap-1.5 py-1">
                  <span className="text-xs text-zinc-400 flex items-center gap-2">
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
        <div className="relative z-10 border-t border-zinc-800/40 bg-zinc-950/80 backdrop-blur-md px-4 md:px-8 pt-3 pb-6">
          <div className="max-w-4xl mx-auto">
            {/* Quick chips */}
            <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-none">
              {[
                '设计大摆角单摆模型',
                '光的双缝干涉实验',
                '声音的波形与振幅演示',
                '铁丝在氧气中燃烧'
              ].map((chip) => (
                <button
                  key={chip}
                  onClick={() => handleSend(chip)}
                  disabled={isGenerating}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 hover:border-cyan-500/30 text-xs text-zinc-400 hover:text-white transition duration-200 whitespace-nowrap cursor-pointer"
                >
                  <Compass size={12} className="text-cyan-400" />
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
                placeholder={isGenerating ? "正在生成中..." : "在此输入任何科学问题，AI 将为您生成 3D 动力学仿真模型..."}
                className="w-full pl-5 pr-14 py-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800 focus:border-cyan-500/50 outline-none text-sm text-slate-100 placeholder-zinc-500 focus:shadow-[0_0_20px_rgba(6,182,212,0.04)] transition duration-300 disabled:opacity-50"
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
