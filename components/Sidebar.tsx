"use client";
import React, { useState, useEffect } from 'react';
import { 
  Volume2, Sun, Thermometer, Zap, ShieldAlert, 
  ChevronDown, ChevronRight, Activity, ZapOff, Play, Search,
  Flame, Wind, Beaker, Layers
} from 'lucide-react';
import { Grade, Category, SimulationInfo } from '../types';

interface SidebarProps {
  grade: Grade;
  simulations: SimulationInfo[];
  selectedSimId: string | null;
  onSelectSim: (id: string) => void;
  isOpen: boolean;
  onClose: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

interface CategoryGroup {
  id: Category;
  name: string;
  icon: React.ComponentType<any>;
  sims: SimulationInfo[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  grade,
  simulations,
  selectedSimId,
  onSelectSim,
  isOpen,
  onClose,
  searchQuery,
  onSearchChange
}) => {
  // Define categories and mapping icons
  const categoryMeta: Record<Category, { name: string; icon: React.ComponentType<any> }> = {
    sound: { name: grade === 'junior' ? '声学' : '声学实验', icon: Volume2 },
    light: { name: grade === 'junior' ? '光学' : '光学实验', icon: Sun },
    heat: { name: grade === 'junior' ? '热学' : '热学实验', icon: Thermometer },
    force: { name: grade === 'junior' ? '力学' : '力学实验', icon: Activity },
    electricity: { name: grade === 'junior' ? '电学' : '电学与闭合电路', icon: Zap },
    motion: { name: '运动与运动学', icon: Play },
    chem_gas: { name: '气体发生与收集', icon: Wind },
    chem_burning: { name: '物质燃烧与氧化', icon: Flame },
    chem_solution: { name: '溶液与物质分离', icon: Beaker },
    chem_metal: { name: '金属及其化学性质', icon: Layers },
    chem_acidbase: { name: '常见酸碱盐性质', icon: ShieldAlert }
  };

  const [groupedCategories, setGroupedCategories] = useState<CategoryGroup[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Record<Category, boolean>>({
    sound: true,
    light: true,
    heat: true,
    force: true,
    electricity: true,
    motion: true,
    chem_gas: true,
    chem_burning: true,
    chem_solution: true,
    chem_metal: true,
    chem_acidbase: true
  });

  useEffect(() => {
    const groups: Record<Category, SimulationInfo[]> = {
      sound: [],
      light: [],
      heat: [],
      force: [],
      electricity: [],
      motion: [],
      chem_gas: [],
      chem_burning: [],
      chem_solution: [],
      chem_metal: [],
      chem_acidbase: []
    };

    simulations.forEach(sim => {
      if (groups[sim.category]) {
        groups[sim.category].push(sim);
      }
    });

    const activeGroups: CategoryGroup[] = [];
    Object.keys(groups).forEach(key => {
      const cat = key as Category;
      if (groups[cat].length > 0) {
        activeGroups.push({
          id: cat,
          name: categoryMeta[cat].name,
          icon: categoryMeta[cat].icon,
          sims: groups[cat],
        });
      }
    });

    setGroupedCategories(activeGroups);
  }, [simulations, grade]);

  const toggleCategory = (cat: Category) => {
    setExpandedCategories(prev => ({
      ...prev,
      [cat]: !prev[cat]
    }));
  };

  return (
    <aside 
      className={`sidebar ${isOpen ? 'open' : ''}`}
      style={{
        height: '100%',
        backgroundColor: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        userSelect: 'none'
      }}
    >
      {/* Title / Info banner */}
      <div style={{ padding: '20px 24px 12px 24px', borderBottom: '1px solid var(--border-color)' }}>
        <h3 style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
          实验目录 ({grade === 'junior' ? '初中' : '高中'})
        </h3>
      </div>

      {/* Mobile Search Bar */}
      <div className="sidebar-search-container">
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Search 
            size={16} 
            style={{ position: 'absolute', left: '12px', color: 'var(--text-muted)', pointerEvents: 'none' }} 
          />
          <input
            type="text"
            placeholder="搜索实验..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px 8px 36px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-tertiary)',
              color: 'var(--text-primary)',
              outline: 'none',
              fontSize: '0.85rem'
            }}
          />
        </div>
      </div>

      {/* Accordions */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
        {groupedCategories.map(group => {
          const Icon = group.icon;
          const isExpanded = expandedCategories[group.id];

          return (
            <div key={group.id} style={{ marginBottom: '8px' }}>
              {/* Accordion Header */}
              <div
                onClick={() => toggleCategory(group.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  backgroundColor: 'var(--bg-tertiary)',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  transition: 'background-color var(--transition-fast)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Icon size={18} style={{ color: 'var(--accent)' }} />
                  <span>{group.name}</span>
                </div>
                {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </div>

              {/* Accordion Body (Simulation list) */}
              {isExpanded && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', padding: '4px 0 0 12px' }}>
                  {group.sims.map(sim => {
                    const isSelected = selectedSimId === sim.id;
                    return (
                      <button
                        key={sim.id}
                        onClick={() => {
                          onSelectSim(sim.id);
                          onClose(); // Close mobile menu if open
                        }}
                        style={{
                          display: 'block',
                          width: '100%',
                          textAlign: 'left',
                          padding: '12px 16px',
                          borderRadius: '6px',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '0.85rem',
                          fontWeight: isSelected ? 600 : 400,
                          backgroundColor: isSelected ? 'var(--accent-glow)' : 'transparent',
                          color: isSelected ? 'var(--accent)' : 'var(--text-secondary)',
                          transition: 'all var(--transition-fast)',
                          outline: 'none',
                          borderLeft: isSelected ? '3px solid var(--accent)' : '3px solid transparent'
                        }}
                      >
                        {sim.name}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
        {groupedCategories.length === 0 && (
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
            没有找到匹配的实验
          </div>
        )}
      </div>
    </aside>
  );
};
