"use client";

import React, { useRef, useState } from 'react';
import { BookOpen, Zap, Compass, Info, CheckCircle, BarChart2, Send, Sparkles } from 'lucide-react';
import { motion, Variants } from 'framer-motion';
import { Grade, Subject, SimulationInfo } from '../types';
import { FluidBackground } from './FluidBackground';

interface LandingPageProps {
  onEnterGrade: (grade: Grade, subject: Subject) => void;
  onSelectSim: (simId: string) => void;
  onGeneratePrompt: (prompt: string) => void;
  allSimulations: SimulationInfo[];
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onEnterGrade,
  onSelectSim,
  onGeneratePrompt,
  allSimulations
}) => {
  const [promptInput, setPromptInput] = useState('');

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15, delayChildren: 0.1 }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { type: 'spring', stiffness: 120, damping: 20 }
    }
  };

  const handleGenerateSubmit = () => {
    if (promptInput.trim()) {
      onGeneratePrompt(promptInput);
    }
  };

  return (
    <motion.div 
      className="relative w-full min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] flex flex-col justify-between overflow-x-hidden font-sans"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.3 } }}
    >
      {/* 3D Fluid & Particle Background */}
      <FluidBackground />

      {/* Main Hero & CTA Sections */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="flex-1 z-10 flex flex-col justify-start items-center px-6 py-12 relative max-w-7xl mx-auto w-full"
      >
        {/* Fullscreen Hero Header Section */}
        <div className="flex flex-col items-center text-center max-w-4xl mt-12 md:mt-20 mb-16">
          {/* Badge */}
          <motion.div 
            variants={itemVariants}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/5 border border-cyan-500/10 mb-6"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-[10px] md:text-xs text-cyan-300 font-bold uppercase tracking-wider">AI数字物理/化学仿照空间</span>
          </motion.div>
          
          {/* Title */}
          <motion.h1 
            variants={itemVariants}
            className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-none mb-6"
          >
            <span className="bg-gradient-to-r from-violet-400 via-indigo-300 to-cyan-400 bg-clip-text text-transparent filter drop-shadow-[0_0_20px_rgba(139,92,246,0.15)]">
              智教智学 —— AI数字仿真实验室
            </span>
          </motion.h1>
          
          {/* Subtitle */}
          <motion.p 
            variants={itemVariants}
            className="text-sm md:text-lg text-[var(--text-secondary)] leading-relaxed max-w-2xl mb-10"
          >
            输入题目，自动生成实验模型与实验过程。基于高精度三维 WebGL 算子，重塑启发式理化教育形态。
          </motion.p>

          {/* ChatGPT-style Prompter Input Box */}
          <motion.div 
            variants={itemVariants}
            className="w-full max-w-2xl bg-[var(--glass-bg)] border border-[var(--border-color)] focus-within:border-[var(--accent)]/50 rounded-2xl p-2.5 backdrop-blur-md focus-within:shadow-[0_0_30px_rgba(6,182,212,0.06)] transition-all duration-300 flex items-center relative"
          >
            <input
              type="text"
              placeholder="输入实验命题（例如：帮我模拟单摆重力加速度实验...）"
              value={promptInput}
              onChange={(e) => setPromptInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleGenerateSubmit()}
              className="flex-1 bg-transparent pl-4 pr-12 py-2 text-xs md:text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none"
            />
            <button
              onClick={handleGenerateSubmit}
              disabled={!promptInput.trim()}
              className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-400 to-indigo-500 hover:from-cyan-300 hover:to-indigo-400 flex items-center justify-center text-black font-semibold shadow-md active:scale-95 transition-all duration-200 cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
            >
              <Send size={15} />
            </button>
          </motion.div>
        </div>


        {/* Entry Cards Container - Magic UI & Aceternity UI style */}
        <div id="explore" className="w-full max-w-6xl scroll-margin-top mb-24">
          <motion.div variants={itemVariants} className="text-center mb-12">
            <h2 className="text-xl md:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              选择科学探索工坊
            </h2>
            <p className="text-xs md:text-sm text-[var(--text-secondary)] mt-2">
              点击卡片即可启动预载高精度仿真实验台
            </p>
          </motion.div>

          <motion.div 
            variants={itemVariants}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full"
          >
            {/* Junior High Physics Card */}
            <motion.div 
              onClick={() => onEnterGrade('junior', 'physics')}
              whileHover={{ scale: 1.02, y: -4, boxShadow: '0 20px 40px rgba(6, 182, 212, 0.08)' }}
              whileTap={{ scale: 0.98 }}
              className="p-8 rounded-2xl border border-[var(--border-color)] bg-[var(--glass-bg)] backdrop-blur-md hover:border-cyan-500/40 cursor-pointer flex flex-col justify-between transition-all duration-300"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-cyan-500/5 border border-cyan-500/10 flex items-center justify-center mb-6">
                  <Zap size={22} className="text-cyan-400" />
                </div>
                <h3 className="text-base md:text-lg font-bold text-[var(--text-primary)] mb-2">
                  初中物理工坊
                </h3>
                <p className="text-xs md:text-sm text-[var(--text-secondary)] leading-relaxed mb-6">
                  直观化基础物理概念认知。包含光的折射、声波干涉、透镜成像、杠杆天平及欧姆定律。
                </p>
                <div className="flex flex-wrap gap-1.5 mb-8">
                  {['声音特征', '折射反射', '凸透镜成像', '杠杆平衡', '欧姆定律'].map(t => (
                    <span key={t} className="text-[10px] text-[var(--text-muted)] bg-[var(--bg-tertiary)] border border-[var(--border-color)] px-2 py-0.5 rounded">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              <span className="text-xs font-bold text-cyan-400 flex items-center gap-1">
                开启初中实验台
                <span className="group-hover:translate-x-1 transition duration-200">➔</span>
              </span>
            </motion.div>

            {/* Senior High Physics Card */}
            <motion.div 
              onClick={() => onEnterGrade('senior', 'physics')}
              whileHover={{ scale: 1.02, y: -4, boxShadow: '0 20px 40px rgba(139, 92, 246, 0.08)' }}
              whileTap={{ scale: 0.98 }}
              className="p-8 rounded-2xl border border-[var(--border-color)] bg-[var(--glass-bg)] backdrop-blur-md hover:border-purple-500/40 cursor-pointer flex flex-col justify-between transition-all duration-300"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-purple-500/5 border border-purple-500/10 flex items-center justify-center mb-6">
                  <Compass size={22} className="text-purple-400" />
                </div>
                <h3 className="text-base md:text-lg font-bold text-[var(--text-primary)] mb-2">
                  高中物理工坊
                </h3>
                <p className="text-xs md:text-sm text-[var(--text-secondary)] leading-relaxed mb-6">
                  高阶物理解析与运动方程求解。提供抛体轨迹、机械能守恒、简谐振动与理想气体的深度拟真。
                </p>
                <div className="flex flex-wrap gap-1.5 mb-8">
                  {['平抛运动', '匀变速', '单摆能量', '力的合成', '双缝干涉'].map(t => (
                    <span key={t} className="text-[10px] text-[var(--text-muted)] bg-[var(--bg-tertiary)] border border-[var(--border-color)] px-2 py-0.5 rounded">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              <span className="text-xs font-bold text-purple-400 flex items-center gap-1">
                开启高中实验台
                <span className="group-hover:translate-x-1 transition duration-200">➔</span>
              </span>
            </motion.div>

            {/* Junior High Chemistry Card */}
            <motion.div 
              onClick={() => onEnterGrade('junior', 'chemistry')}
              whileHover={{ scale: 1.02, y: -4, boxShadow: '0 20px 40px rgba(236, 72, 153, 0.08)' }}
              whileTap={{ scale: 0.98 }}
              className="p-8 rounded-2xl border border-[var(--border-color)] bg-[var(--glass-bg)] backdrop-blur-md hover:border-pink-500/40 cursor-pointer flex flex-col justify-between transition-all duration-300"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-pink-500/5 border border-pink-500/10 flex items-center justify-center mb-6">
                  <BookOpen size={22} className="text-pink-400" />
                </div>
                <h3 className="text-base md:text-lg font-bold text-[var(--text-primary)] mb-2">
                  化学动力学工坊
                </h3>
                <p className="text-xs md:text-sm text-[var(--text-secondary)] leading-relaxed mb-6">
                  微观反应与宏观现象拟真。完全依照教材设计，呈现电解水实验、酸碱中和及气体剧烈氧化。
                </p>
                <div className="flex flex-wrap gap-1.5 mb-8">
                  {['电解水', '气体制备', '酸碱反应', '金属燃烧', '溶液配制'].map(t => (
                    <span key={t} className="text-[10px] text-[var(--text-muted)] bg-[var(--bg-tertiary)] border border-[var(--border-color)] px-2 py-0.5 rounded">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              <span className="text-xs font-bold text-pink-400 flex items-center gap-1">
                开启化学实验台
                <span className="group-hover:translate-x-1 transition duration-200">➔</span>
              </span>
            </motion.div>
          </motion.div>
        </div>

        {/* Feature Grid Highlights */}
        <motion.div variants={itemVariants} className="w-full max-w-6xl mt-6">
          <h3 className="text-center text-sm md:text-base font-bold text-[var(--text-secondary)] mb-10 tracking-widest uppercase">
            科学动力学底层技术架构
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="p-6 rounded-2xl border border-[var(--border-color)] bg-[var(--glass-bg)] backdrop-blur-sm">
              <Zap size={20} className="text-cyan-400 mb-3" />
              <h4 className="font-bold text-xs md:text-sm text-[var(--text-primary)] mb-1.5">高刷 WebGL 三维渲染</h4>
              <p className="text-[11px] md:text-xs text-[var(--text-secondary)] leading-relaxed">整合 GPU 渲染与双缓冲绘制，支持高拟真材质与流畅平滑的三维仿真画布。</p>
            </div>
            <div className="p-6 rounded-2xl border border-[var(--border-color)] bg-[var(--glass-bg)] backdrop-blur-sm">
              <Compass size={20} className="text-purple-400 mb-3" />
              <h4 className="font-bold text-xs md:text-sm text-[var(--text-primary)] mb-1.5">高精度微分方程求解</h4>
              <p className="text-[11px] md:text-xs text-[var(--text-secondary)] leading-relaxed">使用龙格库塔(RK4)及 Verlet 运动积分器，保证运动形态契合经典物理规律。</p>
            </div>
            <div className="p-6 rounded-2xl border border-[var(--border-color)] bg-[var(--glass-bg)] backdrop-blur-sm">
              <Sparkles size={20} className="text-pink-400 mb-3" />
              <h4 className="font-bold text-xs md:text-sm text-[var(--text-primary)] mb-1.5">AI 自然语言控制台</h4>
              <p className="text-[11px] md:text-xs text-[var(--text-secondary)] leading-relaxed">提供智能 AI 探索助手，支持一键式解析输入文本并自动构建三维仿真场景。</p>
            </div>
            <div className="p-6 rounded-2xl border border-[var(--border-color)] bg-[var(--glass-bg)] backdrop-blur-sm">
              <BarChart2 size={20} className="text-amber-500 mb-3" />
              <h4 className="font-bold text-xs md:text-sm text-[var(--text-primary)] mb-1.5">数据记录仪与曲线绘制</h4>
              <p className="text-[11px] md:text-xs text-[var(--text-secondary)] leading-relaxed">实时打点捕获物理规律，支持折线图展示与 CSV 格式实验数据下载功能。</p>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Footer Info */}
      <footer className="text-center py-8 px-6 border-t border-[var(--border-color)] bg-[var(--bg-secondary)] text-[10px] text-[var(--text-muted)] z-10 font-sans">
        <p>Copyright © 2026 智教智学. All Rights Reserved. Created for Educational Visualizations.</p>
        <p className="mt-1.5 text-[var(--text-muted)]">基于 Next.js 15 + Tailwind CSS + Three.js 实时渲染架构</p>
      </footer>
    </motion.div>
  );
};
