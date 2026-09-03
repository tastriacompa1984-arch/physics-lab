"use client";
import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, Pause, RotateCcw, SkipForward, Grid, 
  ArrowUpRight, Plus, ClipboardList, Info, HelpCircle, BookOpen,
  Sliders, Send, ChevronRight, ChevronLeft, Trash2, ArrowUpRight as ArrowUpIcon
} from 'lucide-react';
import { SimulationInfo } from '../types';
import { QuizSection } from './QuizSection';
import { DataLogger } from './DataLogger';

export interface ParameterSchema {
  name: string;
  key: string;
  min: number;
  max: number;
  step: number;
  unit: string;
}

interface Preset {
  name: string;
  params: Record<string, number>;
}

interface SimulationContainerProps {
  sim: SimulationInfo;
  parameterSchema: ParameterSchema[];
  dataHeaders: string[];
  getDataRecord: (params: Record<string, number>) => any[];
  presets?: Preset[];
}

export const SimulationContainer: React.FC<SimulationContainerProps> = ({
  sim,
  parameterSchema,
  dataHeaders,
  getDataRecord,
  presets = []
}) => {
  // State for global simulation speed, play/pause, grid, vector overlays
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isGridVisible, setIsGridVisible] = useState<boolean>(true);
  const [isVectorVisible, setIsVectorVisible] = useState<boolean>(true);
  const [simSpeed, setSimSpeed] = useState<number>(1);
  const [stepTrigger, setStepTrigger] = useState<number>(0);
  
  // State for dynamic parameters
  const [parameters, setParameters] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    parameterSchema.forEach(p => {
      initial[p.key] = (p.min + p.max) / 2;
    });
    return initial;
  });

  // Sidebar controls
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [sidebarTab, setSidebarTab] = useState<'params' | 'theory' | 'quiz' | 'data'>('params');
  const [isMobile, setIsMobile] = useState<boolean>(false);
  useEffect(() => {
    const checkMobile = () => {
      if (typeof window !== 'undefined') {
        setIsMobile(window.innerWidth <= 768);
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // ChatGPT AI controls
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'ai'; text: string }>>([
    {
      sender: 'ai',
      text: `你好！我是 智教智学 助手。你可以直接问我实验原理（如：“解释这个实验”），或者输入指令直接控制实验（如：“暂停”、“播放”或“将初速度调到 12”）。`
    }
  ]);
  const [inputValue, setInputValue] = useState<string>('');
  const chatHistoryEndRef = useRef<HTMLDivElement>(null);

  // State for recorded table data
  const [records, setRecords] = useState<any[][]>([]);

  // Load first preset as default when simulation changes
  useEffect(() => {
    if (presets.length > 0) {
      setParameters(presets[0].params);
    } else {
      const initial: Record<string, number> = {};
      parameterSchema.forEach(p => {
        initial[p.key] = (p.min + p.max) / 2;
      });
      setParameters(initial);
    }
    setRecords([]);
    setSidebarTab('params');
    setIsPlaying(true);
    // Reset messages when simulation changes
    setMessages([
      {
        sender: 'ai',
        text: `你好！我是 智教智学 助手。当前实验为【${sim.name}】。你可以直接问我实验原理（如：“解释这个实验”），或者输入指令直接控制实验（如：“暂停”、“播放”或“将初速度设为 12”）。`
      }
    ]);
  }, [sim.id]);

  // Scroll chat history to bottom on new messages
  useEffect(() => {
    chatHistoryEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle mobile resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle single parameter change
  const handleParamChange = (key: string, value: number) => {
    setParameters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Add a record row to our data log
  const handleRecordData = () => {
    const row = getDataRecord(parameters);
    setRecords(prev => [...prev, row]);
  };

  const handleClearRecords = () => {
    setRecords([]);
  };

  const applyPreset = (preset: Preset) => {
    setParameters(preset.params);
  };

  const stepForward = () => {
    setIsPlaying(false);
    setStepTrigger(prev => prev + 1);
  };

  const resetSimulation = () => {
    setStepTrigger(0);
    if (presets.length > 0) {
      setParameters(presets[0].params);
    } else {
      const initial: Record<string, number> = {};
      parameterSchema.forEach(p => {
        initial[p.key] = (p.min + p.max) / 2;
      });
      setParameters(initial);
    }
    setIsPlaying(true);
  };

  // Natural language parsing and AI response logic
  const handleSendMessage = (textToSend?: string) => {
    const query = textToSend || inputValue;
    if (!query.trim()) return;

    // 1. Add user message
    const userMsg = { sender: 'user' as const, text: query };
    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInputValue('');

    // 2. Parser logic
    setTimeout(() => {
      const lowerText = query.toLowerCase().trim();
      let response = '';
      let cmdExecuted = false;

      // Check play/pause/reset/step
      if (lowerText.includes('暂停') || lowerText.includes('停止') || lowerText.includes('pause') || lowerText.includes('stop')) {
        setIsPlaying(false);
        response += '已暂停实验模拟。';
        cmdExecuted = true;
      } else if (lowerText.includes('播放') || lowerText.includes('开始') || lowerText.includes('运行') || lowerText.includes('继续') || lowerText.includes('play') || lowerText.includes('run') || lowerText.includes('resume')) {
        setIsPlaying(true);
        response += '已启动实验模拟。';
        cmdExecuted = true;
      }

      if (lowerText.includes('重置') || lowerText.includes('重新开始') || lowerText.includes('归零') || lowerText.includes('reset')) {
        resetSimulation();
        response += (response ? '并且' : '') + '已重置实验参数及状态为初始值。';
        cmdExecuted = true;
      }

      if (lowerText.includes('步进') || lowerText.includes('单步') || lowerText.includes('step')) {
        stepForward();
        response += (response ? '并且' : '') + '已单帧步进。';
        cmdExecuted = true;
      }

      // Check Grid/Vector toggles
      if (lowerText.includes('显示网格') || lowerText.includes('开启网格') || lowerText.includes('打开网格')) {
        setIsGridVisible(true);
        response += (response ? '并' : '') + '显示了网格线。';
        cmdExecuted = true;
      } else if (lowerText.includes('隐藏网格') || lowerText.includes('关闭网格')) {
        setIsGridVisible(false);
        response += (response ? '并' : '') + '隐藏了网格线。';
        cmdExecuted = true;
      }

      if (lowerText.includes('显示矢量') || lowerText.includes('显示箭头') || lowerText.includes('开启矢量') || lowerText.includes('打开矢量')) {
        setIsVectorVisible(true);
        response += (response ? '并' : '') + '开启了物理矢量展示。';
        cmdExecuted = true;
      } else if (lowerText.includes('隐藏矢量') || lowerText.includes('隐藏箭头') || lowerText.includes('关闭矢量')) {
        setIsVectorVisible(false);
        response += (response ? '并' : '') + '隐藏了物理矢量。';
        cmdExecuted = true;
      }

      // Check speed parsing
      if (lowerText.includes('速度') || lowerText.includes('倍速') || lowerText.includes('speed')) {
        const numMatch = lowerText.match(/\d+(\.\d+)?/);
        if (numMatch) {
          const val = parseFloat(numMatch[0]);
          if (val >= 0.1 && val <= 2.0) {
            setSimSpeed(val);
            response += (response ? '并' : '') + `将速度调整为 ${val}x。`;
            cmdExecuted = true;
          } else {
            response += '速度值超出范围 (0.1 ~ 2.0x)。';
            cmdExecuted = true;
          }
        }
      }

      // Parameter sliding changes
      let matchedParamsText = '';
      const updatedParams = { ...parameters };
      let hasUpdatedParam = false;

      parameterSchema.forEach(p => {
        if (query.includes(p.name) || lowerText.includes(p.key.toLowerCase())) {
          // Find numbers after the parameter name
          const subStr = query.substring(query.indexOf(p.name));
          const numMatch = subStr.match(/-?\d+(\.\d+)?/);
          if (numMatch) {
            let val = parseFloat(numMatch[0]);
            if (val < p.min) val = p.min;
            if (val > p.max) val = p.max;
            updatedParams[p.key] = val;
            hasUpdatedParam = true;
            matchedParamsText += `【${p.name}】设为 ${val.toFixed(p.step >= 0.1 ? (p.step >= 1 ? 0 : 1) : 2)} ${p.unit}；`;
          }
        }
      });

      if (hasUpdatedParam) {
        setParameters(updatedParams);
        response += (response ? '并' : '') + `已将 ${matchedParamsText}`;
        cmdExecuted = true;
      }

      // If no command executed or asked for explanation
      if (lowerText.includes('原理') || lowerText.includes('公式') || lowerText.includes('解释') || lowerText.includes('讲解') || lowerText.includes('explain') || lowerText.includes('theory')) {
        const theoryText = `本实验为【${sim.theory.title}】。
${sim.theory.description}
核心公式为：${sim.theory.formula || '无'}
主要考点包括：
${sim.theory.points.map((pt, i) => `${i + 1}. ${pt}`).join('\n')}`;
        response = theoryText;
        cmdExecuted = true;
      } else if (lowerText.includes('教材') || lowerText.includes('步骤') || lowerText.includes('实验步骤')) {
        if (sim.textbook) {
          response = `**教材参考** (第 ${sim.textbook.page} 页)
- **实验目的**：${sim.textbook.goal}
- **实验器材**：${sim.textbook.apparatus}
- **实验步骤**：
${sim.textbook.steps.map((st, i) => `  ${i + 1}. ${st}`).join('\n')}
- **现象描述**：${sim.textbook.phenomenon}
- **方程式**：${sim.textbook.equation || '无'}`;
          cmdExecuted = true;
        } else {
          response = '当前实验未配置教材步骤参考。';
          cmdExecuted = true;
        }
      }

      // Default response
      if (!cmdExecuted) {
        response = `我是您的实验助手，您可以输入指令控制此实验，如：
- “暂停实验”、“开始播放” 或 “重置模拟”
- “把 ${parameterSchema[0]?.name || '参数'} 设为 ${parameterSchema[0]?.min || 10}”
- “解释实验原理” 或 “展示教材步骤”

**当前实验支持的参数**：
${parameterSchema.map(p => `- ${p.name} (${p.min} ~ ${p.max} ${p.unit})`).join('\n')}`;
      }

      setMessages(prev => [...prev, { sender: 'ai', text: response }]);
    }, 350);
  };

  const SimComponent = sim.component;

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: isMobile ? '1fr' : (isSidebarOpen ? '1fr 380px' : '1fr'),
      gap: isMobile ? '16px' : '24px',
      maxWidth: '1600px',
      margin: '0 auto',
      transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      height: isMobile ? 'auto' : 'calc(100vh - 112px)',
      overflow: isMobile ? 'visible' : 'hidden'
    }} className="simulation-container simulation-container-layout">
      
      {/* Left Column: Visualizer + AI Chat console */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: isMobile ? '16px' : '20px',
        height: isMobile ? 'auto' : '100%',
        overflowY: isMobile ? 'visible' : 'auto',
        paddingRight: isMobile ? '0' : '4px'
      }} className="visualizer-col">
        
        {/* Workspace Card */}
        <div className="canvas-viewport-card glass-panel" style={{ padding: '12px', flex: 'none', position: 'relative' }}>
          
          {/* Header of Simulation */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', padding: '0 4px' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                {sim.name}
              </h2>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                {sim.subject === 'chemistry' ? '化学实验' : (sim.category === 'force' || sim.category === 'motion') ? '力学实验' : (sim.category === 'light' || sim.category === 'sound') ? '光学与声学' : sim.category === 'electricity' ? '电学实验' : '物理实验'}
              </span>
            </div>
            
            {/* Sidebar toggle button inside Visualizer */}
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className={`btn btn-secondary ${isSidebarOpen ? 'btn-active' : ''}`}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', fontSize: '0.8rem' }}
              title={isSidebarOpen ? "折叠控制台" : "展开控制台"}
            >
              <Sliders size={14} />
              {isSidebarOpen ? '收起控制面板' : '展开控制面板'}
            </button>
          </div>

          {/* Canvas Wrapper */}
          <div className="canvas-wrapper" style={{
            position: 'relative',
            width: '100%',
            height: isMobile ? 'auto' : '52vh', // auto height on mobile, 52vh on desktop
            aspectRatio: isMobile ? '16/9' : 'auto', // 16:9 on mobile, auto on desktop
            backgroundColor: '#030303',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <SimComponent
              isPlaying={isPlaying}
              isGridVisible={isGridVisible}
              isVectorVisible={isVectorVisible}
              simSpeed={simSpeed}
              parameters={parameters}
              onRecordData={(data) => {
                if (data && typeof data === 'object') {
                  Object.keys(data).forEach(k => {
                    if (parameters[k] !== data[k]) {
                      handleParamChange(k, data[k]);
                    }
                  });
                }
              }}
              {...({ stepTrigger } as any)}
            />
          </div>

          {/* Floating Controls Overlay */}
          <div className="canvas-controls-overlay" style={{ marginTop: '12px', borderRadius: '8px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button 
                onClick={() => setIsPlaying(!isPlaying)}
                className="btn btn-secondary btn-icon"
                style={{ width: '32px', height: '32px' }}
                title={isPlaying ? "暂停" : "播放"}
              >
                {isPlaying ? <Pause size={15} /> : <Play size={15} />}
              </button>
              
              <button 
                onClick={stepForward}
                className="btn btn-secondary btn-icon"
                style={{ width: '32px', height: '32px' }}
                title="单帧步进"
              >
                <SkipForward size={15} />
              </button>

              <button 
                onClick={resetSimulation}
                className="btn btn-secondary btn-icon"
                style={{ width: '32px', height: '32px' }}
                title="重置"
              >
                <RotateCcw size={15} />
              </button>
            </div>

            {/* Simulation Speed Slider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>速度: {simSpeed.toFixed(1)}x</span>
              <input
                type="range"
                min="0.1"
                max="2.0"
                step="0.1"
                value={simSpeed}
                onChange={(e) => setSimSpeed(parseFloat(e.target.value))}
                style={{ width: '70px', height: '3px' }}
              />
            </div>

            {/* Toggles for Grid & Vectors */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setIsGridVisible(!isGridVisible)}
                className={`btn btn-secondary ${isGridVisible ? 'btn-active' : ''}`}
                style={{ padding: '4px 10px', fontSize: '0.75rem', height: '32px' }}
              >
                <Grid size={12} />
                网格
              </button>
              <button
                onClick={() => setIsVectorVisible(!isVectorVisible)}
                className={`btn btn-secondary ${isVectorVisible ? 'btn-active' : ''}`}
                style={{ padding: '4px 10px', fontSize: '0.75rem', height: '32px' }}
              >
                <ArrowUpIcon size={12} />
                矢量
              </button>
              <button
                onClick={handleRecordData}
                className="btn btn-primary"
                style={{ padding: '4px 10px', fontSize: '0.75rem', height: '32px', background: 'var(--accent)', color: '#000', border: 'none', fontWeight: 600 }}
              >
                <Plus size={12} />
                记录数据
              </button>
            </div>
          </div>
        </div>

        {/* ChatGPT Style AI Input Console */}
        <div className="glass-panel" style={{
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--glass-bg)',
          border: '1px solid var(--border-color)',
          borderRadius: '12px',
          flex: isMobile ? 'none' : '1',
          minHeight: isMobile ? '300px' : '220px',
          overflow: 'hidden'
        }}>
          {/* Chat History Messages */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            paddingRight: '6px',
            marginBottom: '12px',
            maxHeight: '280px'
          }} className="ai-chat-history">
            {messages.map((msg, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                  width: '100%'
                }}
              >
                <div style={{
                  maxWidth: '85%',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  fontSize: '0.88rem',
                  lineHeight: '1.5',
                  whiteSpace: 'pre-wrap',
                  background: msg.sender === 'user' ? 'rgba(0, 243, 255, 0.08)' : 'var(--bg-tertiary)',
                  border: msg.sender === 'user' ? '1px solid rgba(0, 243, 255, 0.25)' : '1px solid var(--border-color)',
                  color: msg.sender === 'user' ? 'var(--text-primary)' : 'var(--text-secondary)'
                }}>
                  {msg.text}
                </div>
              </div>
            ))}
            <div ref={chatHistoryEndRef} />
          </div>

          {/* Quick Suggestion Chips */}
          <div style={{
            display: 'flex',
            gap: '8px',
            overflowX: 'auto',
            paddingBottom: '8px',
            marginBottom: '8px'
          }} className="suggestion-chips">
            {['解释实验原理', '暂停模拟', '开始播放', '重置实验', `设为 ${parameterSchema[0]?.name || '参数'} 的默认值`].map(chip => (
              <button
                key={chip}
                onClick={() => {
                  if (chip.startsWith('设为')) {
                    const defaultVal = ((parameterSchema[0].min + parameterSchema[0].max) / 2);
                    handleSendMessage(`将${parameterSchema[0].name}设为${defaultVal}`);
                  } else {
                    handleSendMessage(chip);
                  }
                }}
                className="btn btn-secondary"
                style={{ padding: '3px 10px', fontSize: '0.75rem', borderRadius: '100px', whiteSpace: 'nowrap', border: '1px solid var(--border-color)' }}
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Input Area */}
          <div style={{
            display: 'flex',
            gap: '10px',
            alignItems: 'center',
            position: 'relative'
          }}>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSendMessage();
              }}
              placeholder="向 AI 助手提问，或者输入“暂停”、“播放”、“把初速度设为 12”..."
              style={{
                flex: 1,
                padding: '12px 48px 12px 16px',
                borderRadius: '9999px',
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
                outline: 'none',
                fontSize: '0.85rem',
                transition: 'border-color var(--transition-fast)'
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
            />
            <button
              onClick={() => handleSendMessage()}
              className="btn btn-primary btn-icon"
              style={{
                position: 'absolute',
                right: '8px',
                width: '32px',
                height: '32px',
                background: 'var(--accent)',
                color: '#000',
                border: 'none'
              }}
            >
              <Send size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Right Column: Notion-style Sidebar drawer */}
      {isSidebarOpen && (
        <div className="parameters-panel glass-panel" style={{
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          height: isMobile ? 'auto' : '100%',
          background: 'rgba(10, 10, 12, 0.65)',
          border: '1px solid var(--border-color)',
          borderRadius: '12px',
          overflowY: isMobile ? 'visible' : 'auto',
          minHeight: isMobile ? '400px' : 'auto'
        }}>
          {/* Notion style tabs header */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', marginBottom: '16px', gap: '4px' }}>
            <button
              onClick={() => setSidebarTab('params')}
              className="tab-header-btn"
              style={{
                flex: 1,
                padding: '8px 4px',
                fontSize: '0.78rem',
                borderBottom: sidebarTab === 'params' ? '2px solid var(--accent)' : '2px solid transparent',
                color: sidebarTab === 'params' ? 'var(--accent)' : 'var(--text-secondary)',
                background: 'none',
                cursor: 'pointer',
                fontWeight: 600,
                textAlign: 'center'
              }}
            >
              <Sliders size={13} style={{ marginRight: '3px', display: 'inline', verticalAlign: 'middle' }} />
              参数
            </button>
            <button
              onClick={() => setSidebarTab('theory')}
              className="tab-header-btn"
              style={{
                flex: 1,
                padding: '8px 4px',
                fontSize: '0.78rem',
                borderBottom: sidebarTab === 'theory' ? '2px solid var(--accent)' : '2px solid transparent',
                color: sidebarTab === 'theory' ? 'var(--accent)' : 'var(--text-secondary)',
                background: 'none',
                cursor: 'pointer',
                fontWeight: 600,
                textAlign: 'center'
              }}
            >
              <Info size={13} style={{ marginRight: '3px', display: 'inline', verticalAlign: 'middle' }} />
              原理
            </button>
            <button
              onClick={() => setSidebarTab('quiz')}
              className="tab-header-btn"
              style={{
                flex: 1,
                padding: '8px 4px',
                fontSize: '0.78rem',
                borderBottom: sidebarTab === 'quiz' ? '2px solid var(--accent)' : '2px solid transparent',
                color: sidebarTab === 'quiz' ? 'var(--accent)' : 'var(--text-secondary)',
                background: 'none',
                cursor: 'pointer',
                fontWeight: 600,
                textAlign: 'center'
              }}
            >
              <HelpCircle size={13} style={{ marginRight: '3px', display: 'inline', verticalAlign: 'middle' }} />
              检测
            </button>
            <button
              onClick={() => setSidebarTab('data')}
              className="tab-header-btn"
              style={{
                flex: 1,
                padding: '8px 4px',
                fontSize: '0.78rem',
                borderBottom: sidebarTab === 'data' ? '2px solid var(--accent)' : '2px solid transparent',
                color: sidebarTab === 'data' ? 'var(--accent)' : 'var(--text-secondary)',
                background: 'none',
                cursor: 'pointer',
                fontWeight: 600,
                textAlign: 'center'
              }}
            >
              <ClipboardList size={13} style={{ marginRight: '3px', display: 'inline', verticalAlign: 'middle' }} />
              数据
            </button>
          </div>

          {/* Sidebar Tab Content */}
          <div style={{ flex: 1 }} className="sidebar-tab-content">
            {sidebarTab === 'params' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px 0' }}>
                  实验参数调节
                </h3>

                {/* Sliders */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {parameterSchema.map(p => {
                    const val = parameters[p.key] ?? (p.min + p.max) / 2;
                    return (
                      <div key={p.key} className="param-group">
                        <div className="param-label">
                          <span>{p.name}</span>
                          <span className="param-value" style={{ color: 'var(--accent)' }}>
                            {val.toFixed(p.step >= 0.1 ? (p.step >= 1 ? 0 : 1) : 2)} {p.unit}
                          </span>
                        </div>
                        <input
                          type="range"
                          min={p.min}
                          max={p.max}
                          step={p.step}
                          value={val}
                          onChange={(e) => handleParamChange(p.key, parseFloat(e.target.value))}
                        />
                      </div>
                    );
                  })}
                </div>

                {/* Presets */}
                {presets.length > 0 && (
                  <div style={{ marginTop: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                    <h4 style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '10px', fontWeight: 600 }}>环境预设</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {presets.map((pr, idx) => (
                        <button
                          key={idx}
                          onClick={() => applyPreset(pr)}
                          className="btn btn-secondary"
                          style={{ width: '100%', padding: '8px 12px', fontSize: '0.75rem', justifyContent: 'flex-start', border: '1px solid var(--border-color)' }}
                        >
                          {pr.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Portal target for ChemistryLab steps */}
                <div id="chemistry-steps-portal" style={{ marginTop: '16px' }}></div>
              </div>
            )}

            {sidebarTab === 'theory' && (
              <div style={{ lineHeight: '1.6', color: 'var(--text-secondary)' }}>
                <h3 style={{ color: 'var(--text-primary)', fontSize: '0.95rem', fontWeight: 700, marginBottom: '8px' }}>
                  {sim.theory.title}
                </h3>
                
                {sim.theory.formula && (
                  <div 
                    style={{
                      backgroundColor: 'var(--bg-tertiary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      padding: '12px',
                      textAlign: 'center',
                      fontSize: '1.1rem',
                      color: 'var(--accent)',
                      margin: '12px 0',
                      fontWeight: 600
                    }}
                  >
                    {sim.theory.formula}
                  </div>
                )}
                
                <p style={{ marginBottom: '16px', fontSize: '0.85rem' }}>{sim.theory.description}</p>
                
                <h4 style={{ color: 'var(--text-primary)', marginBottom: '8px', fontSize: '0.85rem', fontWeight: 600 }}>知识要点：</h4>
                <ul style={{ paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  {sim.theory.points.map((pt, i) => (
                    <li key={i}>{pt}</li>
                  ))}
                </ul>

                {sim.textbook && (
                  <div style={{ marginTop: '20px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <h4 style={{ color: 'var(--text-primary)', fontSize: '0.85rem', fontWeight: 600, margin: 0 }}>教材参考 (p. {sim.textbook.page})</h4>
                    </div>
                    <p style={{ margin: '0 0 6px 0', fontSize: '0.8rem' }}><strong>目的:</strong> {sim.textbook.goal}</p>
                    <p style={{ margin: '0 0 6px 0', fontSize: '0.8rem' }}><strong>器材:</strong> {sim.textbook.apparatus}</p>
                    <p style={{ margin: '0 0 6px 0', fontSize: '0.8rem' }}><strong>现象:</strong> {sim.textbook.phenomenon}</p>
                  </div>
                )}
              </div>
            )}

            {sidebarTab === 'quiz' && (
              <div style={{ maxHeight: '100%', overflowY: 'auto' }}>
                <QuizSection quiz={sim.quiz} simulationId={sim.id} />
              </div>
            )}

            {sidebarTab === 'data' && (
              <div style={{ maxHeight: '100%', overflowY: 'auto' }}>
                <DataLogger 
                  headers={dataHeaders} 
                  records={records} 
                  onClear={handleClearRecords} 
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
