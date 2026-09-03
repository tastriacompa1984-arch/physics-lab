"use client";

import React from 'react';
import { ArrowLeft, Sparkles } from 'lucide-react';

export default function AiLabPage() {
  return (
    <div className="min-h-screen bg-[#030303] text-neutral-100 flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-purple-900/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-cyan-900/5 blur-[120px] pointer-events-none" />

      <div className="relative z-10 max-w-md text-center flex flex-col items-center">
        <div className="w-16 h-16 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-center text-cyan-400 mb-6 shadow-xl shadow-cyan-500/5">
          <Sparkles size={32} className="animate-pulse" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white to-cyan-300 bg-clip-text text-transparent mb-3">
          动态课件生成工坊
        </h1>
        <p className="text-sm text-neutral-400 leading-relaxed mb-8">
          智教智学——基于大语言模型（LLM）与动力学仿真环境，教师只需输入教学内容，系统即可自动生成包含三维深景实验的互动课件。
        </p>
        <a
          href="/"
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all text-sm text-neutral-300 hover:text-white"
        >
          <ArrowLeft size={16} />
          返回深景教学系统
        </a>
      </div>
    </div>
  );
}
