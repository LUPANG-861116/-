import React, { useState, useEffect } from 'react';
import type { UserStats } from '../types';
import { allN5Words, allN4Words, allN3Words, allN2Words, allN1Words, allWords } from '../data';
import { getAllSRSData, exportDataJSON, importDataJSON, resetAllUserData } from '../utils/srsEngine';
import { getStoredApiKey } from '../services/geminiService';
import { speakJapanese } from '../utils/speech';
import {
  Flame,
  Award,
  CheckCircle2,
  AlertCircle,
  Download,
  Upload,
  RotateCcw,
  BarChart3,
  Volume2,
  BookOpen,
  FileCheck,
  Bot
} from 'lucide-react';

const READING_PROGRESS_KEY = 'nihongo_reading_progress_v1';

interface DashboardProps {
  stats: UserStats;
  onRefresh: () => void;
  onStartHardWords: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  stats,
  onRefresh,
  onStartHardWords
}) => {
  const [importStatus, setImportStatus] = useState<string>('');
  const [completedReadingIds, setCompletedReadingIds] = useState<string[]>([]);
  const srsData = getAllSRSData();
  const apiKey = getStoredApiKey();

  // Load reading progress
  useEffect(() => {
    try {
      const raw = localStorage.getItem(READING_PROGRESS_KEY);
      if (raw) {
        setCompletedReadingIds(JSON.parse(raw));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  // 1. Single Words Mastery by Level (N5 ~ N1)
  const n5Mastered = allN5Words.filter(w => srsData[w.id]?.state === 'mastered').length;
  const n5Percent = Math.round((n5Mastered / allN5Words.length) * 100);

  const n4Mastered = allN4Words.filter(w => srsData[w.id]?.state === 'mastered').length;
  const n4Percent = Math.round((n4Mastered / allN4Words.length) * 100);

  const n3Mastered = allN3Words.filter(w => srsData[w.id]?.state === 'mastered').length;
  const n3Percent = Math.round((n3Mastered / allN3Words.length) * 100);

  const n2Mastered = allN2Words.filter(w => srsData[w.id]?.state === 'mastered').length;
  const n2Percent = Math.round((n2Mastered / allN2Words.length) * 100);

  const n1Mastered = allN1Words.filter(w => srsData[w.id]?.state === 'mastered').length;
  const n1Percent = Math.round((n1Mastered / allN1Words.length) * 100);

  const totalWords = allWords.length;
  const totalMastered = stats.totalMastered;
  const totalMasteredPercent = Math.round((totalMastered / totalWords) * 100);

  // 2. Quiz Question Bank Stats & Level Coverage
  const testedWords = allWords.filter(w => {
    const item = srsData[w.id];
    return item && (item.correctCount > 0 || item.wrongCount > 0 || item.reps > 0);
  });
  const totalTestedCount = testedWords.length;
  const overallQuizCoveragePercent = Math.round((totalTestedCount / totalWords) * 100);

  const n5Tested = allN5Words.filter(w => (srsData[w.id]?.correctCount || 0) > 0 || (srsData[w.id]?.wrongCount || 0) > 0).length;
  const n5TestedPercent = Math.round((n5Tested / allN5Words.length) * 100);

  const n4Tested = allN4Words.filter(w => (srsData[w.id]?.correctCount || 0) > 0 || (srsData[w.id]?.wrongCount || 0) > 0).length;
  const n4TestedPercent = Math.round((n4Tested / allN4Words.length) * 100);

  const n3Tested = allN3Words.filter(w => (srsData[w.id]?.correctCount || 0) > 0 || (srsData[w.id]?.wrongCount || 0) > 0).length;
  const n3TestedPercent = Math.round((n3Tested / allN3Words.length) * 100);

  const n2Tested = allN2Words.filter(w => (srsData[w.id]?.correctCount || 0) > 0 || (srsData[w.id]?.wrongCount || 0) > 0).length;
  const n2TestedPercent = Math.round((n2Tested / allN2Words.length) * 100);

  const n1Tested = allN1Words.filter(w => (srsData[w.id]?.correctCount || 0) > 0 || (srsData[w.id]?.wrongCount || 0) > 0).length;
  const n1TestedPercent = Math.round((n1Tested / allN1Words.length) * 100);

  // Total answer attempts
  let totalAttempts = 0;
  Object.values(srsData).forEach(item => {
    totalAttempts += (item.correctCount || 0) + (item.wrongCount || 0);
  });

  // 3. Reading Comprehension Stats (AI Live Daily Engine)
  const completedArticlesCount = completedReadingIds.length;
  const completedQuestionsCount = completedArticlesCount * 3;

  const n5Completed = completedReadingIds.filter(id => id.includes('n5') || id.includes('N5')).length;
  const n4Completed = completedReadingIds.filter(id => id.includes('n4') || id.includes('N4')).length;
  const n3Completed = completedReadingIds.filter(id => id.includes('n3') || id.includes('N3')).length;
  const n2Completed = completedReadingIds.filter(id => id.includes('n2') || id.includes('N2')).length;
  const n1Completed = completedReadingIds.filter(id => id.includes('n1') || id.includes('N1')).length;

  // Top mistake words
  const hardWords = allWords
    .filter(w => (srsData[w.id]?.wrongCount || 0) > 0)
    .sort((a, b) => (srsData[b.id]?.wrongCount || 0) - (srsData[a.id]?.wrongCount || 0))
    .slice(0, 8);

  const handleExport = () => {
    const json = exportDataJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nihongo-srs-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = importDataJSON(content);
      if (success) {
        setImportStatus('✅ 備份資料匯入成功！');
        onRefresh();
      } else {
        setImportStatus('❌ 匯入失敗，請確認檔案格式正確。');
      }
      setTimeout(() => setImportStatus(''), 4000);
    };
    reader.readAsText(file);
  };

  const handleReset = () => {
    if (window.confirm('確定要清除所有測試進度、收藏星星與紀錄，重設為全新的出廠版本嗎？此操作無法撤銷。')) {
      resetAllUserData();
      localStorage.removeItem(READING_PROGRESS_KEY);
      setCompletedReadingIds([]);
      onRefresh();
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6 animate-fadeIn">
      {/* 1. TOP SUMMARY CARDS (Streak, Mastered, Reading Passed, Accuracy) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Streak */}
        <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-3xl p-4 text-white shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between opacity-90">
            <span className="text-xs font-semibold">連續打卡</span>
            <Flame className="w-5 h-5 text-amber-200" />
          </div>
          <div className="mt-3">
            <span className="text-3xl font-black">{stats.streakDays}</span>
            <span className="text-xs font-medium ml-1">天</span>
          </div>
        </div>

        {/* Mastered Words */}
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl p-4 text-white shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between opacity-90">
            <span className="text-xs font-semibold">已掌握單字</span>
            <Award className="w-5 h-5 text-emerald-200" />
          </div>
          <div className="mt-3">
            <span className="text-3xl font-black">{stats.totalMastered}</span>
            <span className="text-xs font-medium ml-1">字</span>
          </div>
        </div>

        {/* Reading Articles Completed */}
        <div className="bg-gradient-to-br from-rose-500 to-pink-600 rounded-3xl p-4 text-white shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between opacity-90">
            <span className="text-xs font-semibold">閱讀通關篇章</span>
            <BookOpen className="w-5 h-5 text-rose-200" />
          </div>
          <div className="mt-3 flex items-baseline gap-1">
            <span className="text-3xl font-black">{completedArticlesCount}</span>
            <span className="text-xs opacity-90 font-medium">篇</span>
          </div>
        </div>

        {/* Overall Accuracy Rate */}
        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl p-4 text-white shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between opacity-90">
            <span className="text-xs font-semibold">整體正確率</span>
            <CheckCircle2 className="w-5 h-5 text-blue-200" />
          </div>
          <div className="mt-3">
            <span className="text-3xl font-black">{stats.accuracyRate}</span>
            <span className="text-xs font-medium ml-1">%</span>
          </div>
        </div>
      </div>

      {/* 2. READING COMPREHENSION & AI LIVE DAILY PROGRESS */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 shadow-xs space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-rose-500" />
            <span>AI 連網每日閱讀通關進度</span>
          </h3>
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-bold">
            <Bot className="w-3.5 h-3.5" />
            <span>{apiKey ? 'AI 連網更新中' : '待設定 API Key'}</span>
          </div>
        </div>

        {/* Reading Summary Card */}
        <div className="p-4 bg-gradient-to-r from-rose-50 to-pink-50 dark:from-rose-950/30 dark:to-pink-950/20 rounded-2xl border border-rose-100 dark:border-rose-900/30 flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-xs font-bold text-slate-700 dark:text-slate-200">
              累計已攻克篇章與測驗
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              每日 00:00 自動連網由 Google Gemini AI 生成 3 篇全新短文
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-black text-rose-600 dark:text-rose-400">
              {completedArticlesCount} <span className="text-xs font-normal">篇</span>
            </div>
            <div className="text-[11px] text-slate-400 font-medium">
              共攻克 {completedQuestionsCount} 題測驗
            </div>
          </div>
        </div>

        {/* Reading Breakdown by Level */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-1">
          {/* N5 Reading */}
          <div className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-2xl text-center space-y-1 border border-slate-100 dark:border-slate-700/60">
            <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
              JLPT N5
            </div>
            <div className="text-lg font-black text-slate-800 dark:text-slate-100">
              {n5Completed} <span className="text-[10px] font-normal text-slate-400">篇</span>
            </div>
          </div>

          {/* N4 Reading */}
          <div className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-2xl text-center space-y-1 border border-slate-100 dark:border-slate-700/60">
            <div className="text-[11px] font-bold text-blue-600 dark:text-blue-400">
              JLPT N4
            </div>
            <div className="text-lg font-black text-slate-800 dark:text-slate-100">
              {n4Completed} <span className="text-[10px] font-normal text-slate-400">篇</span>
            </div>
          </div>

          {/* N3 Reading */}
          <div className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-2xl text-center space-y-1 border border-slate-100 dark:border-slate-700/60">
            <div className="text-[11px] font-bold text-purple-600 dark:text-purple-400">
              JLPT N3
            </div>
            <div className="text-lg font-black text-slate-800 dark:text-slate-100">
              {n3Completed} <span className="text-[10px] font-normal text-slate-400">篇</span>
            </div>
          </div>

          {/* N2 Reading */}
          <div className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-2xl text-center space-y-1 border border-slate-100 dark:border-slate-700/60">
            <div className="text-[11px] font-bold text-amber-600 dark:text-amber-400">
              JLPT N2
            </div>
            <div className="text-lg font-black text-slate-800 dark:text-slate-100">
              {n2Completed} <span className="text-[10px] font-normal text-slate-400">篇</span>
            </div>
          </div>

          {/* N1 Reading */}
          <div className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-2xl text-center space-y-1 border border-slate-100 dark:border-slate-700/60 col-span-2 sm:col-span-1">
            <div className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
              JLPT N1
            </div>
            <div className="text-lg font-black text-slate-800 dark:text-slate-100">
              {n1Completed} <span className="text-[10px] font-normal text-slate-400">篇</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. QUIZ QUESTION BANK COVERAGE & ATTEMPTS */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 shadow-xs space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-emerald-500" />
            <span>測驗題庫實戰覆蓋率 ({totalTestedCount}/{totalWords} 字 • {overallQuizCoveragePercent}%)</span>
          </h3>
          <span className="text-xs font-bold px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-xl">
            累計作答 {totalAttempts} 次
          </span>
        </div>

        {/* Quiz Overall Big Bar */}
        <div className="space-y-1.5 p-3.5 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-2xl border border-emerald-100 dark:border-emerald-900/30">
          <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-200">
            <span>全題庫單字測驗實戰覆蓋度</span>
            <span className="text-emerald-600 dark:text-emerald-400">{overallQuizCoveragePercent}% ({totalTestedCount}/{totalWords} 字)</span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${overallQuizCoveragePercent}%` }}
            />
          </div>
        </div>

        {/* Quiz Level Coverage Progress Bars */}
        <div className="space-y-3">
          {/* N5 Quiz Coverage */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-slate-700 dark:text-slate-300">N5 題庫測驗率</span>
              <span className="text-emerald-600 dark:text-emerald-400">{n5TestedPercent}% ({n5Tested}/{allN5Words.length} 字)</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
              <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${n5TestedPercent}%` }} />
            </div>
          </div>

          {/* N4 Quiz Coverage */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-blue-600 dark:text-blue-400">N4 題庫測驗率</span>
              <span className="text-blue-600 dark:text-blue-400">{n4TestedPercent}% ({n4Tested}/{allN4Words.length} 字)</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
              <div className="bg-blue-500 h-full rounded-full transition-all duration-500" style={{ width: `${n4TestedPercent}%` }} />
            </div>
          </div>

          {/* N3 Quiz Coverage */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-purple-600 dark:text-purple-400">N3 題庫測驗率</span>
              <span className="text-purple-600 dark:text-purple-400">{n3TestedPercent}% ({n3Tested}/{allN3Words.length} 字)</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
              <div className="bg-purple-500 h-full rounded-full transition-all duration-500" style={{ width: `${n3TestedPercent}%` }} />
            </div>
          </div>

          {/* N2 Quiz Coverage */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-amber-600 dark:text-amber-400">N2 題庫測驗率</span>
              <span className="text-amber-600 dark:text-amber-400">{n2TestedPercent}% ({n2Tested}/{allN2Words.length} 字)</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
              <div className="bg-amber-500 h-full rounded-full transition-all duration-500" style={{ width: `${n2TestedPercent}%` }} />
            </div>
          </div>

          {/* N1 Quiz Coverage */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-indigo-600 dark:text-indigo-400">N1 題庫測驗率</span>
              <span className="text-indigo-600 dark:text-indigo-400">{n1TestedPercent}% ({n1Tested}/{allN1Words.length} 字)</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
              <div className="bg-indigo-600 h-full rounded-full transition-all duration-500" style={{ width: `${n1TestedPercent}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* 4. VOCABULARY SRS MASTERY PROGRESS BARS (N5, N4, N3, N2, N1) */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 shadow-xs space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-500" />
            <span>單字熟練掌握度進度 ({totalMastered}/{totalWords} 字 • {totalMasteredPercent}%)</span>
          </h3>
          <span className="text-xs font-bold px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-xl">
            SRS 間隔重複系統
          </span>
        </div>

        {/* N5 Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 font-bold rounded-md text-xs">
                JLPT N5
              </span>
              <span className="text-slate-700 dark:text-slate-300 font-medium">初級基礎單字</span>
            </div>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">
              {n5Percent}% ({n5Mastered}/{allN5Words.length} 字)
            </span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden flex">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${n5Percent}%` }}
            />
          </div>
        </div>

        {/* N4 Progress */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-bold rounded-md text-xs">
                JLPT N4
              </span>
              <span className="text-slate-700 dark:text-slate-300 font-medium">進階提升單字</span>
            </div>
            <span className="font-bold text-blue-600 dark:text-blue-400">
              {n4Percent}% ({n4Mastered}/{allN4Words.length} 字)
            </span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden flex">
            <div
              className="bg-blue-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${n4Percent}%` }}
            />
          </div>
        </div>

        {/* N3 Progress */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 font-bold rounded-md text-xs">
                JLPT N3
              </span>
              <span className="text-slate-700 dark:text-slate-300 font-medium">中級核心單字</span>
            </div>
            <span className="font-bold text-purple-600 dark:text-purple-400">
              {n3Percent}% ({n3Mastered}/{allN3Words.length} 字)
            </span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden flex">
            <div
              className="bg-purple-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${n3Percent}%` }}
            />
          </div>
        </div>

        {/* N2 Progress */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 font-bold rounded-md text-xs">
                JLPT N2
              </span>
              <span className="text-slate-700 dark:text-slate-300 font-medium">中高級進階單字</span>
            </div>
            <span className="font-bold text-amber-600 dark:text-amber-400">
              {n2Percent}% ({n2Mastered}/{allN2Words.length} 字)
            </span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden flex">
            <div
              className="bg-amber-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${n2Percent}%` }}
            />
          </div>
        </div>

        {/* N1 Progress */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-bold rounded-md text-xs">
                JLPT N1
              </span>
              <span className="text-slate-700 dark:text-slate-300 font-medium">最高級高級單字</span>
            </div>
            <span className="font-bold text-indigo-600 dark:text-indigo-400">
              {n1Percent}% ({n1Mastered}/{allN1Words.length} 字)
            </span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden flex">
            <div
              className="bg-indigo-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${n1Percent}%` }}
            />
          </div>
        </div>
      </div>

      {/* 5. MISTAKES & HARD WORDS LEADERBOARD */}
      {hardWords.length > 0 && (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-rose-500" />
              <span>弱點錯題排行榜</span>
            </h3>
            <button
              onClick={onStartHardWords}
              className="text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 dark:bg-rose-950/60 px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
            >
              特訓這些單字
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {hardWords.map(w => {
              const wrongCount = srsData[w.id]?.wrongCount || 0;
              return (
                <div
                  key={w.id}
                  className="flex items-center justify-between p-3 bg-rose-50/40 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 rounded-2xl"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800 dark:text-slate-100">{w.word}</span>
                      <span className="text-xs text-rose-500">{w.reading}</span>
                    </div>
                    <p className="text-xs text-slate-500 truncate">{w.meaning}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => speakJapanese(w.reading)}
                      className="text-slate-400 hover:text-rose-500 p-1 cursor-pointer"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-xs font-bold px-2 py-0.5 bg-rose-100 dark:bg-rose-950 text-rose-600 rounded-full">
                      錯 {wrongCount} 次
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 6. BACKUP & RESTORE SETTINGS */}
      <div className="bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 space-y-4">
        <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">
          資料備份與進度管理
        </h3>

        {importStatus && (
          <div className="p-3 bg-white dark:bg-slate-800 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            {importStatus}
          </div>
        )}

        <div className="flex flex-wrap gap-2.5">
          {/* Export */}
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 shadow-2xs transition-all active:scale-95 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>匯出備份 (JSON)</span>
          </button>

          {/* Import */}
          <label className="flex items-center gap-1.5 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 shadow-2xs transition-all active:scale-95 cursor-pointer">
            <Upload className="w-4 h-4" />
            <span>匯入備份</span>
            <input type="file" accept=".json" onChange={handleImport} className="hidden" />
          </label>

          {/* Reset */}
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-4 py-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl text-xs font-bold transition-all ml-auto cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>重設進度</span>
          </button>
        </div>
      </div>
    </div>
  );
};
