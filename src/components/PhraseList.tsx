import React, { useState, useMemo } from 'react';
import { allPhrases, type JapanesePhrase } from '../data/phrasesData';
import { speakJapanese } from '../utils/speech';
import { MessageSquare, Volume2, Search, X, Sparkles } from 'lucide-react';

export const PhraseList: React.FC = () => {
  const [selectedLevel, setSelectedLevel] = useState<'ALL' | 'N5' | 'N4' | 'N3' | 'N2' | 'N1'>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [activePhrase, setActivePhrase] = useState<JapanesePhrase | null>(null);

  const categories = [
    'ALL',
    '請求與指示',
    '許可與禁止',
    '願望與打算',
    '經驗與狀態',
    '日常必備寒暄',
    '中高級文法',
    '商務與邏輯'
  ];

  const filteredPhrases = useMemo(() => {
    return allPhrases.filter(p => {
      if (selectedLevel !== 'ALL' && p.level !== selectedLevel) return false;
      if (selectedCategory !== 'ALL' && p.category !== selectedCategory) return false;

      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        return (
          p.phrase.toLowerCase().includes(term) ||
          p.reading.toLowerCase().includes(term) ||
          p.meaning.toLowerCase().includes(term) ||
          p.example.toLowerCase().includes(term)
        );
      }
      return true;
    });
  }, [selectedLevel, selectedCategory, searchTerm]);

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-5 animate-fadeIn">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 rounded-3xl p-6 text-white shadow-xl shadow-orange-500/20 space-y-2">
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold">
            <MessageSquare className="w-3.5 h-3.5" />
            <span>JLPT N5 ~ N1 核心常用片語與文法句型</span>
          </div>
          <div className="text-xs font-semibold text-amber-200">
            日常會話 • 高級商務邏輯
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-black">實戰必考日語句型庫</h2>
          <p className="text-xs text-white/90 mt-1">
            全面涵蓋 N5~N1 請求、許可、打算、條件、書面邏輯等核心文法接續，附真人語音與例句！
          </p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="搜尋片語、句型、讀音或中文意思..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-xs"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Level & Category Filters */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Level Filter */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            {(['ALL', 'N5', 'N4', 'N3', 'N2', 'N1'] as const).map(lvl => (
              <button
                key={lvl}
                onClick={() => setSelectedLevel(lvl)}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  selectedLevel === lvl
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                {lvl === 'ALL' ? '全部' : lvl}
              </button>
            ))}
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border-none rounded-xl font-bold text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-amber-500 cursor-pointer"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>
                {cat === 'ALL' ? '所有分類' : cat}
              </option>
            ))}
          </select>

          <span className="ml-auto text-xs text-slate-400 font-medium">
            共 {filteredPhrases.length} 個句型
          </span>
        </div>
      </div>

      {/* Phrases Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {filteredPhrases.map(phrase => (
          <div
            key={phrase.id}
            onClick={() => setActivePhrase(phrase)}
            className="group bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-4 shadow-xs hover:shadow-md hover:border-amber-400 transition-all cursor-pointer flex flex-col justify-between gap-3"
          >
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-bold text-[11px] rounded-md">
                    {phrase.level}
                  </span>
                  <span className="text-[11px] font-bold text-slate-400">
                    {phrase.category}
                  </span>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    speakJapanese(phrase.example);
                  }}
                  className="text-slate-400 hover:text-amber-500 p-1.5 rounded-xl transition-colors cursor-pointer"
                  title="朗讀例句"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>

              <h3 className="text-xl font-black text-slate-900 dark:text-white group-hover:text-amber-600 transition-colors">
                {phrase.phrase}
              </h3>
              <p className="text-sm font-bold text-amber-600 dark:text-amber-400">
                {phrase.meaning}
              </p>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl space-y-1 border border-slate-100 dark:border-slate-800 text-xs">
              <div className="text-slate-800 dark:text-slate-200 font-medium">
                {phrase.example}
              </div>
              <div className="text-slate-400 text-[11px]">
                {phrase.exampleMeaning}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Phrase Detail Modal */}
      {activePhrase && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setActivePhrase(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-4 animate-scaleUp"
          >
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 text-xs font-bold rounded-md">
                    {activePhrase.level}
                  </span>
                  <span className="text-xs text-slate-400 font-bold">
                    {activePhrase.category}
                  </span>
                </div>
                <h3 className="text-3xl font-black text-slate-900 dark:text-white pt-1">
                  {activePhrase.phrase}
                </h3>
                <div className="text-sm font-bold text-amber-600">
                  {activePhrase.meaning}
                </div>
              </div>

              <button
                onClick={() => setActivePhrase(null)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Explanation */}
            <div className="p-3.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 rounded-2xl space-y-1 text-xs">
              <span className="font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                文法接續與用法要點：
              </span>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                {activePhrase.explanation}
              </p>
            </div>

            {/* Example with Audio */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 rounded-2xl space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                <span>實用例句</span>
                <button
                  onClick={() => speakJapanese(activePhrase.example)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-white dark:bg-slate-800 text-amber-600 rounded-lg shadow-xs hover:bg-amber-50 cursor-pointer"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>朗讀</span>
                </button>
              </div>
              <p className="text-base text-slate-800 dark:text-slate-100 font-medium">
                {activePhrase.example}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {activePhrase.exampleMeaning}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
