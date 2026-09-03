"use client";

import React from 'react';
import { ShieldCheck, Cpu, Code2, Sparkles, Database, Layers } from 'lucide-react';

export default function AboutView() {
  const techStack = [
    { name: 'WebGL / Three.js', desc: '用于构建网页三维实时仿真渲染画布，支持平移、缩放、灯光投影与材质反射。', icon: Cpu, color: 'text-cyan-400' },
    { name: 'React Three Fiber', desc: '以 React 生命周期的声明式组件形式控制 Three.js 场景，提升渲染调度及组件复用性。', icon: Layers, color: 'text-purple-400' },
    { name: 'Framer Motion', desc: '流畅顺滑的视图过渡及 UI 微交互动画，实现极佳的 SaaS 产品交互体验。', icon: Sparkles, color: 'text-pink-400' },
    { name: 'KaTeX Formula', desc: '集成在 Markdown 流式输出中的 LaTeX 专业公式解析库，极速展现复杂的物理计算方程。', icon: Code2, color: 'text-emerald-400' }
  ];

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[var(--bg-primary)] text-[var(--text-primary)] py-12 px-4 md:px-8 relative overflow-hidden font-sans">
      {/* Background decoration */}
      <div className="absolute top-[-20%] right-[-15%] w-[60vw] h-[60vw] rounded-full bg-purple-900/5 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-15%] left-[-15%] w-[60vw] h-[60vw] rounded-full bg-cyan-900/5 blur-[150px] pointer-events-none" />

      <div className="max-w-4xl mx-auto relative z-10">
        {/* Title */}
        <div className="text-center mb-16">
          <span className="text-[10px] uppercase font-bold tracking-widest text-cyan-400 px-3 py-1 rounded-full bg-cyan-500/5 border border-cyan-500/10">教学系统介绍</span>
          <h1 className="text-2xl md:text-4xl font-black tracking-tight bg-gradient-to-r from-white via-slate-200 to-cyan-400 bg-clip-text text-transparent mt-4">
            智教智学——基于LLM自动生成深景互动教学系统
          </h1>
          <p className="text-xs md:text-sm text-[var(--text-secondary)] max-w-2xl mx-auto mt-4 leading-relaxed">
            智教智学 致力于通过大语言模型（LLM）智能驱动与高精度 WebGL/Three.js 实时动力学仿真，重塑启发式理化教育形态。教师只需输入教学课题或知识点，系统即可秒级生成具备三维交互与微观现象拟真的深景课件，让抽象科学规律在课堂上具象呈现。
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
          <div className="p-6 rounded-2xl bg-[var(--glass-bg)] border border-[var(--border-color)] backdrop-blur-md">
            <h3 className="text-base md:text-lg font-bold text-[var(--text-primary)] mb-2.5 flex items-center gap-2">
              <ShieldCheck className="text-cyan-400" size={18} />
              高精度动力学算子
            </h3>
            <p className="text-xs md:text-sm text-[var(--text-secondary)] leading-relaxed">
              底层封装经典物理动力学计算方程（如欧拉-克罗默积分、斯涅尔折射、双缝干涉强度公式），保证三维场景的运动响应与物理客观规律高度吻合。
            </p>
          </div>
          <div className="p-6 rounded-2xl bg-[var(--glass-bg)] border border-[var(--border-color)] backdrop-blur-md">
            <h3 className="text-base md:text-lg font-bold text-[var(--text-primary)] mb-2.5 flex items-center gap-2">
              <Database className="text-purple-400" size={18} />
              化学动力学仿真引擎
            </h3>
            <p className="text-xs md:text-sm text-[var(--text-secondary)] leading-relaxed">
              引入微观分子化学反应态模型（如气体分子扩散、热学相变、化学方程式的动态反应及配平演示），支持仪器交互、试剂滴加及高帧率效果。
            </p>
          </div>
        </div>

        {/* Tech Stack List */}
        <div>
          <h3 className="text-lg font-bold text-[var(--text-primary)] mb-6 border-b border-[var(--border-color)] pb-3 flex items-center gap-2">
            技术栈与渲染架构
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {techStack.map((tech) => {
              const IconComp = tech.icon;
              return (
                <div 
                  key={tech.name}
                  className="p-5 rounded-2xl bg-[var(--bg-tertiary)]/50 border border-[var(--border-color)] hover:border-[var(--text-muted)] transition-all duration-200"
                >
                  <div className="flex items-center gap-3 mb-2.5">
                    <div className="p-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)]">
                      <IconComp className={tech.color} size={16} />
                    </div>
                    <span className="text-sm font-bold text-[var(--text-primary)]">{tech.name}</span>
                  </div>
                  <p className="text-[11px] md:text-xs text-[var(--text-secondary)] leading-relaxed">
                    {tech.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footnote */}
        <div className="text-center text-[10px] text-[var(--text-muted)] mt-20">
          © 2026 智教智学——基于LLM自动生成深景互动教学系统 | 构建下一代启发式物理化学数字化互动教学平台。
        </div>
      </div>
    </div>
  );
}
