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
    { id: 'workbench', name: '实验库', icon: LayoutDashboard },
    { id: 'ai-lab', name: 'AI生成实验', icon: Brain },
    { id: 'my-experiments', name: '我的实验', icon: BookOpen },
    { id: 'about', name: '关于我们', icon: HelpCircle }
  ] as const;

  return (
    <header className="sticky top-0 z-50 h-16 w-full border-b border-white/[0.06] bg-zinc-950/70 backdrop-blur-md flex items-center justify-between px-6 transition duration-200">
      {/* Left: Logo & Mobile menu toggle */}
      <div className="flex items-center gap-4">
        <button 
          className="md:hidden flex items-center justify-center p-1.5 rounded-lg border border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:text-white"
          onClick={onToggleMobileMenu}
          aria-label="Toggle Menu"
        >
          {isMobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
        
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
          className="flex items-center gap-2 cursor-pointer group"
        >
          <div className="relative w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/10 group-hover:scale-105 transition duration-200">
            <Sparkles size={16} className="text-white fill-current animate-pulse" />
          </div>
          <span className="text-lg font-black bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent tracking-tight">
            LabAI
          </span>
        </div>
      </div>

      {/* Middle Context Area (Only shows when in workbench mode) */}
      {currentView === 'workbench' && (
        <div className="hidden lg:flex items-center gap-4">
          {/* Subject Switcher */}
          <div className="flex p-0.5 bg-zinc-900/80 border border-zinc-850 rounded-lg">
            <button
              onClick={() => onSubjectChange('physics')}
              className={`px-3 py-1 text-xs font-bold rounded-md transition duration-200 ${
                currentSubject === 'physics'
                  ? 'bg-zinc-800 text-cyan-400 border border-zinc-700/50'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              物理
            </button>
            <button
              onClick={() => onSubjectChange('chemistry')}
              className={`px-3 py-1 text-xs font-bold rounded-md transition duration-200 ${
                currentSubject === 'chemistry'
                  ? 'bg-zinc-800 text-cyan-400 border border-zinc-700/50'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              化学
            </button>
          </div>

          {/* Grade Switcher */}
          <div className="flex p-0.5 bg-zinc-900/80 border border-zinc-850 rounded-lg">
            <button
              onClick={() => onGradeChange('junior')}
              className={`px-3 py-1 text-xs font-bold rounded-md transition duration-200 ${
                currentGrade === 'junior'
                  ? 'bg-zinc-800 text-cyan-400 border border-zinc-700/50'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {currentSubject === 'physics' ? '初中' : '初中化学'}
            </button>
            {currentSubject === 'physics' && (
              <button
                onClick={() => onGradeChange('senior')}
                className={`px-3 py-1 text-xs font-bold rounded-md transition duration-200 ${
                  currentGrade === 'senior'
                    ? 'bg-zinc-800 text-cyan-400 border border-zinc-700/50'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                高中
              </button>
            )}
          </div>

          {/* Search bar inside header for workspace */}
          <div className="relative flex items-center">
            <Search size={13} className="absolute left-3.5 text-zinc-500 pointer-events-none" />
            <input
              type="text"
              placeholder="搜索实验..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9 pr-4 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900/40 text-xs text-white placeholder-zinc-500 focus:border-cyan-500/50 outline-none w-48 focus:w-60 transition-all duration-300"
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
                  isActive ? 'text-white' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeNavBg"
                    className="absolute inset-0 bg-white/[0.04] border border-white/[0.05] rounded-lg -z-10"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <Icon size={13} className={isActive ? 'text-cyan-400' : 'text-zinc-400'} />
                {item.name}
              </button>
            );
          })}
        </nav>

        <div className="h-4 w-[1px] bg-zinc-800 hidden md:block" />

        {/* Global actions */}
        <div className="flex items-center gap-3.5">
          {/* Quick Launch Workbench CTA when not in workspace */}
          {currentView !== 'workbench' && (
            <button
              onClick={() => onViewChange('workbench')}
              className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg bg-gradient-to-tr from-cyan-400/20 to-purple-500/20 border border-cyan-500/30 hover:border-cyan-400 text-cyan-300 hover:text-white shadow-lg shadow-cyan-500/2 active:scale-95 transition duration-200"
            >
              <Sparkles size={12} className="text-cyan-400 animate-bounce" style={{ animationDuration: '3s' }} />
              进入实验台
            </button>
          )}

          {/* Theme Switcher (Dark aesthetic maintained) */}
          <button
            onClick={onToggleTheme}
            className="flex items-center justify-center w-8 h-8 rounded-lg border border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:text-white hover:border-zinc-700 transition"
            aria-label="Toggle Theme"
          >
            {isLightMode ? <Sun size={15} /> : <Moon size={15} />}
          </button>
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
              className="fixed top-16 bottom-0 left-0 w-64 bg-zinc-950 border-r border-zinc-850 p-4 z-50 md:hidden flex flex-col justify-between"
            >
              <div className="space-y-6">
                {/* Subject & Grade for Mobile if in workbench */}
                {currentView === 'workbench' && (
                  <div className="space-y-3.5 pb-4 border-b border-zinc-850">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase">实验台配置</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => onSubjectChange('physics')}
                        className={`flex-1 py-1.5 text-xs font-bold rounded-lg border text-center transition ${
                          currentSubject === 'physics' ? 'bg-zinc-800 border-cyan-500/30 text-cyan-400' : 'bg-transparent border-zinc-800 text-zinc-400'
                        }`}
                      >
                        物理
                      </button>
                      <button
                        onClick={() => onSubjectChange('chemistry')}
                        className={`flex-1 py-1.5 text-xs font-bold rounded-lg border text-center transition ${
                          currentSubject === 'chemistry' ? 'bg-zinc-800 border-cyan-500/30 text-cyan-400' : 'bg-transparent border-zinc-800 text-zinc-400'
                        }`}
                      >
                        化学
                      </button>
                    </div>
                  </div>
                )}

                {/* Nav list */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase px-2 mb-2 block">导航菜单</span>
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
                          isActive ? 'bg-zinc-900 border border-zinc-800 text-white font-bold' : 'text-zinc-400 hover:text-white hover:bg-zinc-900/30'
                        }`}
                      >
                        <Icon size={14} className={isActive ? 'text-cyan-400' : 'text-zinc-400'} />
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
                  className="w-full py-2.5 rounded-lg bg-gradient-to-tr from-cyan-400/20 to-purple-500/20 border border-cyan-500/30 text-cyan-300 font-bold text-xs"
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
