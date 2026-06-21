"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { 
  Volume2, Sun, Thermometer, Activity, Zap, Play,
  ArrowRight, Sparkles, BookOpen, Flame, Wind, Beaker, Layers, ShieldAlert
} from 'lucide-react';
import { Grade, Category, SimulationInfo, Subject } from '../types';

interface WorkbenchGuideProps {
  grade: Grade;
  subject: Subject;
  simulations: SimulationInfo[];
  onSelectSim: (id: string) => void;
}

export const WorkbenchGuide: React.FC<WorkbenchGuideProps> = ({
  grade,
  subject,
  simulations,
  onSelectSim
}) => {
  // Category mapping
  const categoryMeta: Record<Category, { name: string; icon: React.ComponentType<any>; color: string; desc: string }> = {
    sound: { 
      name: grade === 'junior' ? '声学' : '声学与波动', 
      icon: Volume2, 
      color: '#a78bfa',
      desc: '波的传播、频率、振幅与声特性'
    },
    light: { 
      name: grade === 'junior' ? '光学' : '几何与波动光学', 
      icon: Sun, 
      color: '#fbbf24',
      desc: '光的反射折射、透镜成像与干涉'
    },
    heat: { 
      name: grade === 'junior' ? '热学' : '热力学与理想气体', 
      icon: Thermometer, 
      color: '#fb923c',
      desc: '物态变化、温度曲线与气体状态参量'
    },
    force: { 
      name: grade === 'junior' ? '力学' : '力矩与力学分析', 
      icon: Activity, 
      color: '#38bdf8',
      desc: '杠杆平衡、力矩与受力合成'
    },
    electricity: { 
      name: grade === 'junior' ? '电学' : '电学与闭合电路', 
      icon: Zap, 
      color: '#f43f5e',
      desc: '欧姆定律、串并联电路及闭合回路'
    },
    motion: { 
      name: '运动学', 
      icon: Play, 
      color: '#34d399',
      desc: '抛体运动、单摆、落体运动与多普勒效应'
    },
    chem_gas: { 
      name: '气体发生与收集', 
      icon: Wind, 
      color: '#a78bfa', 
      desc: '实验室气体制备、排水集气法与气体电解' 
    },
    chem_burning: { 
      name: '物质燃烧与氧化', 
      icon: Flame, 
      color: '#fb923c', 
      desc: '可燃物在纯氧中的剧烈燃烧及燃烧条件探究' 
    },
    chem_solution: { 
      name: '溶液与分离提取', 
      icon: Beaker, 
      color: '#34d399', 
      desc: '一定质量分数溶液配制、溶解过滤与蒸发结晶' 
    },
    chem_metal: { 
      name: '金属及其化学性质', 
      icon: Layers, 
      color: '#38bdf8', 
      desc: '对比镁锌铁铜与酸的反应，排列活动性顺序' 
    },
    chem_acidbase: { 
      name: '常见酸碱盐性质', 
      icon: ShieldAlert, 
      color: '#f43f5e', 
      desc: '酸碱指示剂显色变色、中和反应的微观中和放热' 
    }
  };

  // Group simulations by category
  const groupedSims = simulations.reduce((acc, sim) => {
    if (!acc[sim.category]) {
      acc[sim.category] = [];
    }
    acc[sim.category].push(sim);
    return acc;
  }, {} as Record<Category, SimulationInfo[]>);

  // Active categories list
  const activeCategories = (Object.keys(categoryMeta) as Category[]).filter(
    cat => groupedSims[cat] && groupedSims[cat].length > 0
  );

  // Featured Simulation selection
  const featuredSim = subject === 'physics'
    ? (grade === 'junior'
        ? simulations.find(s => s.id === 'convex-lens') || simulations[0]
        : simulations.find(s => s.id === 'doppler-effect') || simulations[0])
    : (simulations.find(s => s.id === 'electrolysis-water') || simulations[0]);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { type: 'spring' as const, stiffness: 100, damping: 15 }
    }
  };

  return (
    <motion.div 
      className="workbench-guide"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      style={{
        padding: '8px 4px 40px 4px',
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '32px'
      }}
    >
      {/* 头部欢迎与统计 */}
      <motion.div variants={itemVariants} className="guide-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <Sparkles size={16} style={{ color: 'var(--accent)' }} />
          <span style={{ 
            fontSize: '0.8rem', 
            textTransform: 'uppercase', 
            letterSpacing: '0.15em', 
            color: 'var(--accent)',
            fontWeight: 600
          }}>
            {subject === 'physics' ? 'PHYSICS LAB ENGINE' : 'CHEMISTRY COLLISION ENGINE'}
          </span>
        </div>
        <h1 style={{ 
          fontSize: '2rem', 
          fontWeight: 700, 
          marginBottom: '10px', 
          background: 'linear-gradient(90deg, #fff, var(--text-secondary))',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          {subject === 'physics' ? '探索物理宇宙的科学法则' : '解密化学反应的微观图景'}
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', maxWidth: '750px', lineHeight: '1.6' }}>
          {subject === 'physics' 
            ? '欢迎来到交互式物理虚拟实验室。这里为您准备了高度拟真的图形渲染及可调控公式参数的动态物理模型，让物理概念在您的每一次点击与探索中变得直观清晰。'
            : '欢迎来到微观化学反应粒子实验室。在这里，您可以通过控制加热、通气、滴加、搅拌等实验动作，实时观察分子、原子、离子在微观层面的碰撞反应与物性转换。'}
        </p>

        {/* 实验室状态指示 */}
        <div style={{ 
          display: 'flex', 
          gap: '16px', 
          marginTop: '20px', 
          flexWrap: 'wrap' 
        }}>
          <div className="glass-panel" style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--success)', display: 'inline-block', boxShadow: '0 0 8px var(--success)' }}></span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              阶段：{subject === 'physics' 
                ? (grade === 'junior' ? '初中物理体系' : '高中物理体系')
                : (grade === 'junior' ? '初中化学体系' : '高中化学体系')}
            </span>
          </div>
          <div className="glass-panel" style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BookOpen size={14} style={{ color: 'var(--accent)' }} />
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              已装载：{simulations.length} 个虚拟仿真实验
            </span>
          </div>
        </div>
      </motion.div>


      {/* 特色实验推荐 Banner */}
      {featuredSim && (
        <motion.div variants={itemVariants} className="featured-banner-wrapper">
          <div 
            className="glass-panel featured-banner"
            style={{
              padding: '30px',
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '24px',
              position: 'relative',
              overflow: 'hidden',
              background: 'linear-gradient(135deg, rgba(0, 243, 255, 0.03) 0%, rgba(10, 10, 10, 0.4) 100%)',
              borderLeft: '4px solid var(--accent)'
            }}
          >
            {/* 特色发光灯效 */}
            <div style={{
              position: 'absolute',
              width: '150px',
              height: '150px',
              borderRadius: '50%',
              background: 'var(--accent)',
              filter: 'blur(100px)',
              top: '-50px',
              right: '-50px',
              opacity: 0.15,
              pointerEvents: 'none'
            }}></div>

            <div style={{ flex: '1 1 500px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="featured-tag">今日推荐</span>
                <span style={{ 
                  fontSize: '0.75rem', 
                  color: categoryMeta[featuredSim.category]?.color || 'var(--accent)', 
                  fontWeight: 600,
                  backgroundColor: `${categoryMeta[featuredSim.category]?.color || 'var(--accent)'}15`,
                  padding: '2px 8px',
                  borderRadius: '4px',
                  border: `1px solid ${categoryMeta[featuredSim.category]?.color || 'var(--accent)'}33`
                }}>
                  {categoryMeta[featuredSim.category]?.name}
                </span>
              </div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {featuredSim.name}
              </h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5', maxWidth: '600px' }}>
                {featuredSim.description}
              </p>
            </div>

            <div>
              <button 
                onClick={() => onSelectSim(featuredSim.id)}
                className="btn btn-primary start-featured-btn"
                style={{
                  padding: '12px 24px',
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 0 16px var(--accent-glow)',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                <span>即刻开始实验</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* 实验分类卡片网格 */}
      <motion.div variants={itemVariants} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>实验项目分类导航</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400 }}>CATEGORIES</span>
        </h2>

        <div className="categories-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
          gap: '20px'
        }}>
          {activeCategories.map(cat => {
            const meta = categoryMeta[cat];
            const CatIcon = meta.icon;
            const sims = groupedSims[cat] || [];

            return (
              <div 
                key={cat} 
                className="glass-panel category-card"
                style={{
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                  position: 'relative',
                  borderTop: `2px solid ${meta.color}66`,
                  transition: 'transform var(--transition-normal), box-shadow var(--transition-normal)'
                }}
              >
                {/* 装饰发光点 */}
                <div style={{
                  position: 'absolute',
                  width: '3px',
                  height: '3px',
                  borderRadius: '50%',
                  backgroundColor: meta.color,
                  boxShadow: `0 0 10px 3px ${meta.color}`,
                  top: '12px',
                  right: '12px'
                }}></div>

                {/* 分类标题 */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ 
                    width: '36px', 
                    height: '36px', 
                    borderRadius: '6px', 
                    backgroundColor: `${meta.color}15`, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    border: `1px solid ${meta.color}25`
                  }}>
                    <CatIcon size={18} style={{ color: meta.color }} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {meta.name}
                    </h3>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {meta.desc}
                    </p>
                  </div>
                </div>

                {/* 实验列表 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                  {sims.map(sim => (
                    <button
                      key={sim.id}
                      onClick={() => onSelectSim(sim.id)}
                      className="category-sim-link"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '6px',
                        backgroundColor: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid var(--border-color)',
                        color: 'var(--text-secondary)',
                        textAlign: 'left',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        transition: 'all var(--transition-fast)'
                      }}
                    >
                      <span className="sim-name-text" style={{ fontWeight: 500 }}>{sim.name}</span>
                      <ArrowRight size={12} className="sim-arrow-icon" style={{ opacity: 0.5, transition: 'all var(--transition-fast)' }} />
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
};
