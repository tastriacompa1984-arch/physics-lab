"use client";

import React, { useState } from 'react';
import { BookOpen, Zap, Trash2, ArrowRight, Play, Eye, Calendar, Settings, ShieldAlert } from 'lucide-react';

interface SavedExperiment {
  id: string;
  simId: string;
  name: string;
  subject: 'physics' | 'chemistry';
  description: string;
  savedAt: string;
  parameters: Record<string, any>;
}

interface MyExperimentsViewProps {
  onSelectSim: (simId: string) => void;
}

export default function MyExperimentsView({ onSelectSim }: MyExperimentsViewProps) {
  const [savedExperiments, setSavedExperiments] = useState<SavedExperiment[]>([
    {
      id: 'saved-1',
      simId: 'simple-pendulum',
      name: '重力场探究：超长单摆阻尼衰减',
      subject: 'physics',
      description: '将摆长设为 2.0米，在较低阻尼环境下观察摆球在 60秒 内的运动振幅变化。',
      savedAt: '2026-06-20 14:32',
      parameters: { length: 2.0, gravity: 9.8, damping: 0.05 }
    },
    {
      id: 'saved-2',
      simId: 'convex-lens',
      name: '两倍焦距处成等大实像验证',
      subject: 'physics',
      description: '验证物距等于两倍焦距时的成像规律，物距 20cm，焦距 10cm。',
      savedAt: '2026-06-19 18:15',
      parameters: { objectDistance: 20, focalLength: 10 }
    },
    {
      id: 'saved-3',
      simId: 'iron-oxygen',
      name: '铁丝在不同氧气浓度下的燃烧对照',
      subject: 'chemistry',
      description: '探索氧气纯度对铁丝燃烧剧烈程度的影响。',
      savedAt: '2026-06-18 10:05',
      parameters: { oxygenPurity: 98 }
    },
    {
      id: 'saved-4',
      simId: 'double-slit-interference',
      name: '红光双缝干涉条纹间距测定',
      subject: 'physics',
      description: '设置波长 650nm，双缝间距 0.25mm，观察光屏上的干涉条纹。',
      savedAt: '2026-06-15 16:40',
      parameters: { wavelength: 650, slitDistance: 0.25 }
    }
  ]);

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSavedExperiments(prev => prev.filter(exp => exp.id !== id));
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[var(--bg-primary)] text-[var(--text-primary)] py-10 px-4 md:px-8 relative font-sans">
      {/* Glow blobs */}
      <div className="absolute top-[-10%] left-[-15%] w-[50vw] h-[50vw] rounded-full bg-purple-900/5 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-cyan-900/5 blur-[130px] pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Title */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            我的存档实验室
          </h1>
          <p className="text-xs md:text-sm text-slate-400 mt-1.5">
            在此管理您保存的自定义物理参量预设、化学控制状态以及历史观测记录。
          </p>
        </div>

        {/* Saved Grid */}
        {savedExperiments.length === 0 ? (
          <div className="py-20 text-center border border-dashed border-[var(--border-color)] rounded-2xl bg-[var(--bg-tertiary)]/50 backdrop-blur-sm flex flex-col items-center justify-center">
            <ShieldAlert size={40} className="text-[var(--text-muted)] mb-3" />
            <h3 className="text-sm font-semibold text-[var(--text-secondary)]">暂无存档实验</h3>
            <p className="text-xs text-[var(--text-muted)] mt-1 max-w-xs">您可以在物理实验台中调整参数后，点击“保存预设”将其实时存入此空间。</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {savedExperiments.map((exp) => (
              <div
                key={exp.id}
                onClick={() => onSelectSim(exp.simId)}
                className="group p-5 rounded-2xl bg-[var(--glass-bg)] border border-[var(--border-color)] hover:border-[var(--text-muted)] backdrop-blur-md shadow-lg hover:shadow-cyan-500/2 transition-all duration-300 flex flex-col justify-between cursor-pointer"
              >
                <div>
                  {/* Top tags */}
                  <div className="flex justify-between items-center mb-3">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                      exp.subject === 'physics'
                        ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                        : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                    }`}>
                      {exp.subject === 'physics' ? '物理实验' : '化学实验'}
                    </span>
                    <div className="flex items-center gap-1.5 text-[var(--text-muted)] text-[10px]">
                      <Calendar size={11} />
                      {exp.savedAt}
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="text-sm md:text-base font-bold text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors">
                    {exp.name}
                  </h3>

                  {/* Description */}
                  <p className="text-xs text-[var(--text-secondary)] line-clamp-2 mt-2 leading-relaxed">
                    {exp.description}
                  </p>

                  {/* Parameters preview */}
                  <div className="mt-4 p-3 bg-[var(--bg-tertiary)] rounded-xl border border-[var(--border-color)] flex flex-wrap gap-x-4 gap-y-1 text-[11px] font-mono text-[var(--accent)]">
                    {Object.entries(exp.parameters).map(([key, val]) => (
                      <div key={key}>
                        <span className="text-[var(--text-muted)]">{key}:</span> {val}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer action buttons */}
                <div className="flex justify-between items-center border-t border-[var(--border-color)] pt-4 mt-5">
                  <span className="text-xs text-[var(--text-muted)] flex items-center gap-1">
                    <Settings size={12} />
                    已存储动力学参数
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => handleDelete(exp.id, e)}
                      className="p-2 bg-[var(--bg-tertiary)] hover:bg-red-950/20 border border-[var(--border-color)] hover:border-red-900/30 text-[var(--text-secondary)] hover:text-red-400 rounded-xl transition duration-200"
                      title="删除存档"
                    >
                      <Trash2 size={13} />
                    </button>
                    <button
                      onClick={() => onSelectSim(exp.simId)}
                      className="flex items-center gap-1.5 py-1.5 px-3 bg-gradient-to-tr from-[var(--accent-glow)] to-purple-500/10 border border-[var(--border-color)] hover:border-[var(--accent)] text-xs text-[var(--accent)] hover:text-[var(--text-primary)] rounded-xl transition duration-200"
                    >
                      <Play size={11} className="fill-current text-[var(--accent)] group-hover:text-white" />
                      运行仿真
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
