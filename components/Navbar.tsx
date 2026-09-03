"use client";

import React from 'react';
import { Sun, Moon, Search, Menu, X, Sparkles, LayoutDashboard, Brain, BookOpen, HelpCircle } from 'lucide-react';
import { Grade, Subject } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

interface NavbarProps {
  currentGrade: Grade;
  onGradeChange: (grade: Grade) => void;
  currentSubject: Subject;
  onSubjectChange: (subject: Subject) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  isLightMode: boolean;
  onToggleTheme: () => void;
  isMobileMenuOpen: boolean;
  onToggleMobileMenu: () => void;
  onToggleSidebar?: () => void;
  onGoHome: () => void;
  
  // Custom navigation props added for the refactored SPA
  currentView: 'landing' | 'workbench' | 'ai-lab' | 'my-experiments' | 'about';
  onViewChange: (view: 'landing' | 'workbench' | 'ai-lab' | 'my-experiments' | 'about') => void;
  isMobileCatalogOpen?: boolean;
  onToggleMobileCatalog?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentGrade,
  onGradeChange,
  currentSubject,
  onSubjectChange,
  searchQuery,
  onSearchChange,
  isLightMode,
  onToggleTheme,
  isMobileMenuOpen,
  onToggleMobileMenu,
  onGoHome,
  currentView,
  onViewChange,
  isMobileCatalogOpen,
  onToggleMobileCatalog
}) => {
  const navItems = [
    { id: 'workbench', name: '互动实验台', icon: LayoutDashboard },
    { id: 'ai-lab', name: '生成动态课件', icon: Brain },
    { id: 'my-experiments', name: '备课课件库', icon: BookOpen },
    { id: 'about', name: '系统介绍', icon: HelpCircle }
  ] as const;

  const onToggleSidebarWrapper = () => {
    if (onToggleSidebar) onToggleSidebar();
  };

  return (
    <header className="sticky top-0 z-50 h-16 w-full border-b border-[var(--border-color)] bg-[var(--glass-bg)] backdrop-blur-md flex items-center justify-between px-6 transition duration-200">
      {/* Left: Logo & Mobile menu toggle */}
      <div className="flex items-center gap-4">
        <button 
          className="md:hidden flex items-center justify-center p-1.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          onClick={onToggleMobileMenu}
          aria-label="Toggle Menu"
        >
          {isMobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
        </button>

        {/* New: Catalog toggle for mobile when in workbench */}
        {currentView === 'workbench' && (
          <button 
            className="md:hidden flex items-center justify-center p-1.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-tertiary)] text-[var(--accent)] hover:text-[var(--text-primary)]"
            onClick={onToggleSidebarWrapper}
            aria-label="Toggle Catalog"
            title="展开实验目录"
          >
            <BookOpen size={18} />
          </button>
        )}
        
        {currentView === 'workbench' && onToggleMobileCatalog && (
          <button 
            className="md:hidden flex items-center justify-center p-1.5 rounded-lg border border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:text-white"
            onClick={onToggleMobileCatalog}
            aria-label="Toggle Catalog"
            title="实验目录"
          >
            <BookOpen size={18} className={isMobileCatalogOpen ? 'text-cyan-400' : ''} />
          </button>
        )}
        
        <div 
          onClick={() => onViewChange('landing')} 
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <div className="relative w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/10 group-hover:scale-105 transition duration-200">
            <Sparkles size={16} className="text-white fill-current animate-pulse" />
          </div>
          <div className="flex flex-col">
            <span className="text-base md:text-lg font-black bg-gradient-to-r from-[var(--text-primary)] via-slate-200 to-cyan-400 bg-clip-text text-transparent tracking-tight leading-none">
              智教智学
            </span>
            <span className="text-[9px] text-[var(--text-muted)] tracking-wider font-medium hidden sm:block mt-0.5">
              基于LLM深景互动教学系统
            </span>
          </div>
        </div>
      </div>

      {/* Middle Context Area (Only shows when in workbench mode) */}
      {currentView === 'workbench' && (
        <div className="hidden lg:flex items-center gap-4">
          {/* Subject Switcher */}
          <div className="flex p-0.5 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg">
            <button
              onClick={() => onSubjectChange('physics')}
              className={`px-3 py-1 text-xs font-bold rounded-md transition duration-200 ${
                currentSubject === 'physics'
                  ? 'bg-[var(--bg-secondary)] text-[var(--accent)] border border-[var(--border-color)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              物理
            </button>
            <button
              onClick={() => onSubjectChange('chemistry')}
              className={`px-3 py-1 text-xs font-bold rounded-md transition duration-200 ${
                currentSubject === 'chemistry'
                  ? 'bg-[var(--bg-secondary)] text-[var(--accent)] border border-[var(--border-color)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              化学
            </button>
          </div>

          {/* Grade Switcher */}
          <div className="flex p-0.5 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg">
            <button
              onClick={() => onGradeChange('junior')}
              className={`px-3 py-1 text-xs font-bold rounded-md transition duration-200 ${
                currentGrade === 'junior'
                  ? 'bg-[var(--bg-secondary)] text-[var(--accent)] border border-[var(--border-color)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {currentSubject === 'physics' ? '初中' : '初中化学'}
            </button>
            {currentSubject === 'physics' && (
              <button
                onClick={() => onGradeChange('senior')}
                className={`px-3 py-1 text-xs font-bold rounded-md transition duration-200 ${
                  currentGrade === 'senior'
                    ? 'bg-[var(--bg-secondary)] text-[var(--accent)] border border-[var(--border-color)]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                高中
              </button>
            )}
          </div>

          {/* Search bar inside header for workspace */}
          <div className="relative flex items-center">
            <Search size={13} className="absolute left-3.5 text-[var(--text-muted)] pointer-events-none" />
            <input
              type="text"
              placeholder="搜索实验..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9 pr-4 py-1.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-tertiary)] text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--accent)]/50 outline-none w-48 focus:w-60 transition-all duration-300"
            />
          </div>
        </div>
      )}

      {/* Right side navigation links and actions */}
      <div className="flex items-center gap-6">
        {/* Desktop Nav Items */}
        <nav className="hidden md:flex items-center gap-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition duration-200 ${
                  isActive ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeNavBg"
                    className="absolute inset-0 bg-[var(--accent-glow)] border border-[var(--border-color)] rounded-lg -z-10"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <Icon size={13} className={isActive ? 'text-[var(--accent)]' : 'text-[var(--text-secondary)]'} />
                {item.name}
              </button>
            );
          })}
        </nav>

        <div className="h-4 w-[1px] bg-[var(--border-color)] hidden md:block" />

        {/* Global actions */}
        <div className="flex items-center gap-3.5">
          {/* Quick Launch Workbench CTA when not in workspace */}
          {currentView !== 'workbench' && (
            <button
              onClick={() => onViewChange('workbench')}
              className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg bg-gradient-to-tr from-[var(--accent-glow)] to-purple-500/10 border border-[var(--border-color)] hover:border-[var(--accent)] text-[var(--accent)] hover:text-[var(--text-primary)] shadow-lg shadow-cyan-500/2 active:scale-95 transition duration-200"
            >
              <Sparkles size={12} className="text-[var(--accent)] animate-bounce" style={{ animationDuration: '3s' }} />
              进入实验台
            </button>
          )}
        </div>
      </div>

      {/* Mobile Drawer menu (controlled overlay) */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={onToggleMobileMenu}
              className="fixed inset-0 top-16 bg-black z-40 md:hidden"
            />
            {/* Drawer */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.2 }}
              className="fixed top-16 bottom-0 left-0 w-64 bg-[var(--bg-secondary)] border-r border-[var(--border-color)] p-4 z-50 md:hidden flex flex-col justify-between"
            >
              <div className="space-y-6">
                {/* Subject & Grade for Mobile if in workbench */}
                {currentView === 'workbench' && (
                  <div className="space-y-3.5 pb-4 border-b border-[var(--border-color)]">
                    <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase">实验台配置</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => onSubjectChange('physics')}
                        className={`flex-1 py-1.5 text-xs font-bold rounded-lg border text-center transition ${
                          currentSubject === 'physics' ? 'bg-[var(--bg-tertiary)] border-[var(--accent)]/30 text-[var(--accent)]' : 'bg-transparent border-[var(--border-color)] text-[var(--text-secondary)]'
                        }`}
                      >
                        物理
                      </button>
                      <button
                        onClick={() => onSubjectChange('chemistry')}
                        className={`flex-1 py-1.5 text-xs font-bold rounded-lg border text-center transition ${
                          currentSubject === 'chemistry' ? 'bg-[var(--bg-tertiary)] border-[var(--accent)]/30 text-[var(--accent)]' : 'bg-transparent border-[var(--border-color)] text-[var(--text-secondary)]'
                        }`}
                      >
                        化学
                      </button>
                    </div>
                  </div>
                )}

                {/* Nav list */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase px-2 mb-2 block">导航菜单</span>
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentView === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          onViewChange(item.id);
                          onToggleMobileMenu();
                        }}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition ${
                          isActive ? 'bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]/50'
                        }`}
                      >
                        <Icon size={14} className={isActive ? 'text-[var(--accent)]' : 'text-[var(--text-secondary)]'} />
                        {item.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Bottom launch button in drawer */}
              {currentView !== 'workbench' && (
                <button
                  onClick={() => {
                    onViewChange('workbench');
                    onToggleMobileMenu();
                  }}
                  className="w-full py-2.5 rounded-lg bg-gradient-to-tr from-[var(--accent-glow)] to-purple-500/10 border border-[var(--border-color)] text-[var(--accent)] font-bold text-xs"
                >
                  启动实验台
                </button>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
};
