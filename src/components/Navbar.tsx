import React from 'react';
import type { JLPTLevel, AppView } from '../types';
import { BookOpen, RefreshCw, Layers, BarChart2, CheckCircle2, FileText } from 'lucide-react';

interface NavbarProps {
  currentView: AppView;
  setCurrentView: (view: AppView) => void;
  currentLevel: JLPTLevel;
  setCurrentLevel: (level: JLPTLevel) => void;
  dueCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  setCurrentView,
  currentLevel,
  setCurrentLevel,
  dueCount
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-xs">
      <div className="max-w-4xl mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-2">
        {/* App Title & Brand */}
        <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => setCurrentView('study')}>
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-sky-400 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 border border-white/40 overflow-hidden shrink-0">
            <img
              src="/shoebill_app_icon.png"
              alt="日語刷刷庫"
              className="w-full h-full object-cover scale-105"
            />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-base sm:text-lg font-black text-slate-800 dark:text-slate-100 leading-tight">
                日語刷刷庫
              </h1>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              JLPT 智能SRS & 閱讀測驗
            </p>
          </div>
        </div>

        {/* Level Quick Switcher (N5, N4, N3, N2, N1, ALL) */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
          {(['N5', 'N4', 'N3', 'N2', 'N1', 'ALL'] as JLPTLevel[]).map(lvl => (
            <button
              key={lvl}
              onClick={() => setCurrentLevel(lvl)}
              className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                currentLevel === lvl
                  ? 'bg-rose-500 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              {lvl === 'ALL' ? '全部' : lvl}
            </button>
          ))}
        </div>

        {/* View Navigation Tabs */}
        <nav className="flex items-center gap-1 sm:gap-1.5 w-full sm:w-auto justify-around sm:justify-end border-t sm:border-t-0 border-slate-100 dark:border-slate-800/80 pt-2 sm:pt-0 mt-1 sm:mt-0 overflow-x-auto">
          <button
            onClick={() => setCurrentView('study')}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition-all cursor-pointer whitespace-nowrap ${
              currentView === 'study'
                ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>背單字</span>
          </button>

          <button
            onClick={() => setCurrentView('review')}
            className={`relative flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition-all cursor-pointer whitespace-nowrap ${
              currentView === 'review'
                ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <RefreshCw className="w-4 h-4" />
            <span>今日複習</span>
            {dueCount > 0 && (
              <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-amber-500 rounded-full">
                {dueCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setCurrentView('quiz')}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition-all cursor-pointer whitespace-nowrap ${
              currentView === 'quiz'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>測驗題庫</span>
          </button>

          {/* 閱讀測驗 TAB */}
          <button
            onClick={() => setCurrentView('reading')}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition-all cursor-pointer whitespace-nowrap ${
              currentView === 'reading'
                ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>閱讀</span>
          </button>

          {/* 常用片語 TAB */}
          <button
            onClick={() => setCurrentView('phrases')}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition-all cursor-pointer whitespace-nowrap ${
              currentView === 'phrases'
                ? 'bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>句型片語</span>
          </button>

          <button
            onClick={() => setCurrentView('dictionary')}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition-all cursor-pointer whitespace-nowrap ${
              currentView === 'dictionary'
                ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>單字庫</span>
          </button>

          <button
            onClick={() => setCurrentView('stats')}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition-all cursor-pointer whitespace-nowrap ${
              currentView === 'stats'
                ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <BarChart2 className="w-4 h-4" />
            <span>統計</span>
          </button>
        </nav>
      </div>
    </header>
  );
};
