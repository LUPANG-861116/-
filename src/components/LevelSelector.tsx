import React from 'react';
import type { JLPTLevel } from '../types';
import { allN5Words, allN4Words, allN3Words, allN2Words, allN1Words, n5n4Words, n5n2Words, n5n1Words } from '../data';
import { getExamScheduleInfo } from '../utils/scheduler';
import { Play, RefreshCw, Calendar, Target, Zap, BookOpen, Sparkles, Star, MessageSquare } from 'lucide-react';

interface LevelSelectorProps {
  onStartStudy: (level: JLPTLevel, mode: 'all' | 'due' | 'hard' | 'scheduled') => void;
  onGoToReading?: () => void;
  onGoToPhrases?: () => void;
  onStartUnfamiliarStudy?: () => void;
  dueCount: number;
  hardCount: number;
  unfamiliarCount: number;
  n5MasteredCount: number;
  n4MasteredCount: number;
  n3MasteredCount: number;
  n2MasteredCount: number;
  n1MasteredCount?: number;
  n5n4UnlearnedCount: number;
  n5n4MasteredCount: number;
}

export const LevelSelector: React.FC<LevelSelectorProps> = ({
  onStartStudy,
  onGoToReading,
  onGoToPhrases,
  onStartUnfamiliarStudy,
  dueCount,
  unfamiliarCount,
  n5MasteredCount,
  n4MasteredCount,
  n3MasteredCount,
  n2MasteredCount,
  n1MasteredCount = 0,
  n5n4UnlearnedCount,
  n5n4MasteredCount
}) => {
  // Focus schedule strictly on N5 + N4 (1,386 words) as requested
  const scheduleInfo = getExamScheduleInfo(
    n5n4Words.length,
    n5n4UnlearnedCount,
    n5n4MasteredCount
  );

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5 animate-fadeIn">
      {/* EXAM COUNTDOWN & SMART SCHEDULE BANNER (FOCUSED ON N5 + N4) */}
      <div className="bg-gradient-to-br from-rose-500 via-rose-600 to-amber-500 rounded-3xl p-6 text-white shadow-xl shadow-rose-500/20 relative overflow-hidden space-y-4">
        {/* Top Badges */}
        <div className="flex items-center justify-between gap-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold">
            <Target className="w-3.5 h-3.5" />
            <span>2026 年底 JLPT 目標衝刺 (N5+N4)</span>
          </div>

          <div className="inline-flex items-center gap-1 text-amber-200 text-xs font-semibold">
            <Calendar className="w-3.5 h-3.5" />
            <span>考前一週完成目標</span>
          </div>
        </div>

        {/* Big Countdown & Quota Stats */}
        <div className="grid grid-cols-3 gap-2 bg-black/15 backdrop-blur-md rounded-2xl p-3 text-center">
          <div className="space-y-0.5">
            <span className="text-[11px] text-white/80 block">考前倒數</span>
            <span className="text-2xl sm:text-3xl font-black text-amber-300">
              {scheduleInfo.daysLeft}
            </span>
            <span className="text-[10px] text-white/70 block">天</span>
          </div>

          <div className="space-y-0.5">
            <span className="text-[11px] text-white/80 block">今日建議背</span>
            <span className="text-2xl sm:text-3xl font-black text-white">
              {scheduleInfo.dailyQuota}
            </span>
            <span className="text-[10px] text-white/70 block">字 / 次</span>
          </div>

          <div className="space-y-0.5">
            <span className="text-[11px] text-white/80 block">剩餘待背</span>
            <span className="text-2xl sm:text-3xl font-black text-rose-200">
              {scheduleInfo.unlearnedWords}
            </span>
            <span className="text-[10px] text-white/70 block">字 (N5+N4)</span>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
          <button
            onClick={() => onStartStudy('N5_N4', 'scheduled')}
            className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3.5 bg-white text-rose-600 font-extrabold rounded-2xl shadow-md hover:bg-rose-50 active:scale-95 transition-all text-sm cursor-pointer"
          >
            <Zap className="w-4 h-4 fill-current" />
            <span>開始背今日建議量 ({scheduleInfo.dailyQuota} 字)</span>
          </button>

          {dueCount > 0 && (
            <button
              onClick={() => onStartStudy('N5_N4', 'due')}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-3.5 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white font-bold rounded-2xl transition-all text-xs cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>今日待複習 ({dueCount})</span>
            </button>
          )}
        </div>

        {/* Decorative circle */}
        <div className="absolute -right-8 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-xl pointer-events-none" />
      </div>

      {/* SMART LEARNING MECHANISM EXPLANATION CARD */}
      <div className="bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-2 text-xs">
        <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 text-xs">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>系統智慧學習與特訓機制說明</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-600 dark:text-slate-400">
          <div className="p-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700/60 space-y-1">
            <div className="font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
              <span>🎧 答對 2 次進入「聽力盲測模式」</span>
            </div>
            <p className="leading-relaxed">
              單字前兩次以漢字讀音熟悉；當連續答對 2 次後，系統會隱藏文字並自動播放真人發音，考驗聽力耳感，點卡片即可對答案！
            </p>
          </div>

          <div className="p-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700/60 space-y-1">
            <div className="font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1">
              <span>⭐ 特訓專區「答對即畢業」機制</span>
            </div>
            <p className="leading-relaxed">
              遇到不會（答錯）會自動編入特訓專區；在特訓中答對（按會）即自動畢業移除；未來若在任何複習中再答錯，會再次自動編入！
            </p>
          </div>
        </div>
      </div>

      {/* SPECIAL ZONE: 不熟與星號收藏單字特訓專區 */}
      {unfamiliarCount > 0 && (
        <div
          onClick={onStartUnfamiliarStudy}
          className="bg-gradient-to-r from-amber-500 to-rose-500 rounded-2xl p-4 text-white shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-between gap-3 active:scale-[0.99]"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-amber-200">
              <Star className="w-5 h-5 fill-current" />
            </div>
            <div>
              <div className="font-bold text-sm flex items-center gap-1.5">
                <span>⭐ 不熟與星號收藏單字特訓專區</span>
                <span className="px-2 py-0.2 bg-white text-rose-600 rounded-full text-[10px] font-black">
                  {unfamiliarCount} 字
                </span>
              </div>
              <div className="text-xs text-amber-100">包含曾答錯的弱點單字與手動星號收藏生詞</div>
            </div>
          </div>
          <span className="px-3 py-1.5 bg-white text-rose-600 text-xs font-bold rounded-xl whitespace-nowrap">
            立即特訓
          </span>
        </div>
      )}

      {/* QUICK ENTRANCE: 閱讀測驗 & 常用片語 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {onGoToReading && (
          <div
            onClick={onGoToReading}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-3.5 text-white shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center justify-between gap-3 active:scale-[0.99]"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-xs">📖 分級長篇閱讀測驗</div>
                <div className="text-[10px] text-blue-100">N5~N1 每日精選篇章與題目</div>
              </div>
            </div>
            <Play className="w-3.5 h-3.5 fill-current opacity-80" />
          </div>
        )}

        {onGoToPhrases && (
          <div
            onClick={onGoToPhrases}
            className="bg-gradient-to-r from-orange-500 to-amber-600 rounded-2xl p-3.5 text-white shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center justify-between gap-3 active:scale-[0.99]"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-xs">💬 常用片語與句型</div>
                <div className="text-[10px] text-amber-100">N5~N1 核心文法與生活片語</div>
              </div>
            </div>
            <Play className="w-3.5 h-3.5 fill-current opacity-80" />
          </div>
        )}
      </div>

      {/* PRIMARY FOCUS: N5 & N4 CARDS */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-bold text-slate-500 px-1">
          <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400">
            <Sparkles className="w-3.5 h-3.5" />
            <span>目前主力考試核心單字 (N5 + N4 共 {n5n4Words.length} 字)</span>
          </span>
          <span>點擊自主單元練習</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* N5 Card */}
          <div
            onClick={() => onStartStudy('N5', 'all')}
            className="group relative bg-white dark:bg-slate-800/90 border-2 border-emerald-200/80 dark:border-emerald-900/60 rounded-2xl p-4 shadow-xs hover:shadow-md hover:border-emerald-500 cursor-pointer transition-all active:scale-[0.98]"
          >
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black text-base">
                N5
              </div>
              <span className="text-[11px] font-bold px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 rounded-full">
                必考基礎
              </span>
            </div>

            <div className="mt-3 space-y-0.5">
              <h3 className="font-bold text-base text-slate-800 dark:text-slate-100 group-hover:text-emerald-600 transition-colors">
                JLPT N5 完整單字庫
              </h3>
              <p className="text-xs text-slate-500">
                日常生活、基礎動詞與形容詞（共 {allN5Words.length} 字）
              </p>
            </div>

            <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs font-medium">
              <span className="text-slate-500">已掌握 {n5MasteredCount}/{allN5Words.length} 字</span>
              <span className="inline-flex items-center gap-1 text-emerald-600 font-bold group-hover:translate-x-0.5 transition-transform">
                開始 <Play className="w-3 h-3 fill-current" />
              </span>
            </div>
          </div>

          {/* N4 Card */}
          <div
            onClick={() => onStartStudy('N4', 'all')}
            className="group relative bg-white dark:bg-slate-800/90 border-2 border-blue-200/80 dark:border-blue-900/60 rounded-2xl p-4 shadow-xs hover:shadow-md hover:border-blue-500 cursor-pointer transition-all active:scale-[0.98]"
          >
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-black text-base">
                N4
              </div>
              <span className="text-[11px] font-bold px-2 py-0.5 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 rounded-full">
                進階衝刺
              </span>
            </div>

            <div className="mt-3 space-y-0.5">
              <h3 className="font-bold text-base text-slate-800 dark:text-slate-100 group-hover:text-blue-600 transition-colors">
                JLPT N4 完整單字庫
              </h3>
              <p className="text-xs text-slate-500">
                進階活用、日常會話單字（共 {allN4Words.length} 字）
              </p>
            </div>

            <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs font-medium">
              <span className="text-slate-500">已掌握 {n4MasteredCount}/{allN4Words.length} 字</span>
              <span className="inline-flex items-center gap-1 text-blue-600 font-bold group-hover:translate-x-0.5 transition-transform">
                開始 <Play className="w-3 h-3 fill-current" />
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* THREE SEPARATE COMPREHENSIVE RANDOM PRACTICE BLOCKS (Requested by User) */}
      <div className="space-y-2.5">
        <div className="text-xs font-bold text-slate-500 px-1 flex items-center justify-between">
          <span>綜合隨機自主練習專區（分 3 大區塊）</span>
          <span className="text-[10px] text-slate-400">隨機跨級別題庫混背</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {/* Block 1: N5 ~ N4 (1,386 字) */}
          <button
            onClick={() => onStartStudy('N5_N4', 'all')}
            className="flex flex-col justify-between p-3.5 bg-gradient-to-br from-rose-50 to-amber-50 dark:from-rose-950/30 dark:to-amber-950/30 hover:from-rose-100 hover:to-amber-100 border-2 border-rose-300 dark:border-rose-800 rounded-2xl text-left transition-all active:scale-[0.98] cursor-pointer shadow-xs"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 bg-rose-500 text-white rounded-md text-[10px] font-bold">
                  主力目標
                </span>
                <Play className="w-3.5 h-3.5 text-rose-500 fill-current" />
              </div>
              <div className="font-bold text-sm text-slate-900 dark:text-slate-100 mt-2">
                N5 ~ N4 綜合隨機
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                共 {n5n4Words.length} 字 • 短期日檢衝刺
              </div>
            </div>
          </button>

          {/* Block 2: N5 ~ N2 (5,438 字) */}
          <button
            onClick={() => onStartStudy('N5_N2', 'all')}
            className="flex flex-col justify-between p-3.5 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 hover:from-indigo-100 hover:to-purple-100 border border-indigo-200 dark:border-indigo-800 rounded-2xl text-left transition-all active:scale-[0.98] cursor-pointer shadow-xs"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 bg-indigo-500 text-white rounded-md text-[10px] font-bold">
                  中高級
                </span>
                <Play className="w-3.5 h-3.5 text-indigo-500 fill-current" />
              </div>
              <div className="font-bold text-sm text-slate-900 dark:text-slate-100 mt-2">
                N5 ~ N2 綜合隨機
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                共 {n5n2Words.length} 字 • 實戰日常全覆蓋
              </div>
            </div>
          </button>

          {/* Block 3: N5 ~ N1 (5,516 字) */}
          <button
            onClick={() => onStartStudy('N5_N1', 'all')}
            className="flex flex-col justify-between p-3.5 bg-gradient-to-br from-purple-50 to-fuchsia-50 dark:from-purple-950/30 dark:to-fuchsia-950/30 hover:from-purple-100 hover:to-fuchsia-100 border border-purple-200 dark:border-purple-800 rounded-2xl text-left transition-all active:scale-[0.98] cursor-pointer shadow-xs"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 bg-purple-600 text-white rounded-md text-[10px] font-bold">
                  大滿貫
                </span>
                <Play className="w-3.5 h-3.5 text-purple-600 fill-current" />
              </div>
              <div className="font-bold text-sm text-slate-900 dark:text-slate-100 mt-2">
                N5 ~ N1 全量隨機
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                共 {n5n1Words.length} 字 • 全級別大滿貫
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* FUTURE ADVANCED LEVELS: N3, N2 & N1 (N1 INDEPENDENT CARD) */}
      <div className="space-y-2 pt-2 border-t border-slate-200/80 dark:border-slate-800">
        <div className="text-xs font-semibold text-slate-400 px-1">
          中高級獨立進階單字庫（考完 N4 後可隨時挑戰）
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {/* N3 Card */}
          <div
            onClick={() => onStartStudy('N3', 'all')}
            className="p-3.5 bg-white dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-2xl cursor-pointer hover:border-purple-400 transition-all flex flex-col justify-between"
          >
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 font-bold text-xs rounded-md">
                  N3
                </span>
                <Play className="w-3.5 h-3.5 text-purple-500" />
              </div>
              <div className="font-bold text-sm text-slate-800 dark:text-slate-200">
                JLPT N3 單字庫
              </div>
              <p className="text-[10px] text-slate-500">共 {allN3Words.length} 字 (掌握 {n3MasteredCount})</p>
            </div>
          </div>

          {/* N2 Card */}
          <div
            onClick={() => onStartStudy('N2', 'all')}
            className="p-3.5 bg-white dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-2xl cursor-pointer hover:border-rose-400 transition-all flex flex-col justify-between"
          >
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 font-bold text-xs rounded-md">
                  N2
                </span>
                <Play className="w-3.5 h-3.5 text-rose-500" />
              </div>
              <div className="font-bold text-sm text-slate-800 dark:text-slate-200">
                JLPT N2 單字庫
              </div>
              <p className="text-[10px] text-slate-500">共 {allN2Words.length} 字 (掌握 {n2MasteredCount})</p>
            </div>
          </div>

          {/* N1 Card (Independent Block Requested by User) */}
          <div
            onClick={() => onStartStudy('N1', 'all')}
            className="p-3.5 bg-gradient-to-br from-slate-900 to-indigo-950 text-white border border-indigo-700/60 rounded-2xl cursor-pointer hover:border-indigo-400 shadow-md transition-all flex flex-col justify-between"
          >
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 bg-indigo-500 text-white font-bold text-xs rounded-md shadow-xs">
                  N1 最高級
                </span>
                <Play className="w-3.5 h-3.5 text-indigo-300 fill-current" />
              </div>
              <div className="font-bold text-sm text-white">
                JLPT N1 單字庫
              </div>
              <p className="text-[10px] text-indigo-200">共 {allN1Words.length} 字 (掌握 {n1MasteredCount})</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
