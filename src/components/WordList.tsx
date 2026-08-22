import React, { useState, useMemo } from 'react';
import type { VocabWord, JLPTLevel } from '../types';
import { allWords } from '../data';
import { getAllSRSData } from '../utils/srsEngine';
import { speakJapanese } from '../utils/speech';
import { Search, Volume2, BookOpen, X } from 'lucide-react';

interface WordListProps {
  initialLevel?: JLPTLevel;
}

export const WordList: React.FC<WordListProps> = ({ initialLevel = 'ALL' }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<JLPTLevel>(initialLevel);
  const [selectedPOS, setSelectedPOS] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [activeWord, setActiveWord] = useState<VocabWord | null>(null);

  const srsDataMap = useMemo(() => getAllSRSData(), []);

  // Filter words
  const filteredWords = useMemo(() => {
    return allWords.filter(word => {
      // Level filter
      if (selectedLevel !== 'ALL' && word.level !== selectedLevel) return false;

      // POS filter
      if (selectedPOS !== 'ALL' && word.partOfSpeech !== selectedPOS) return false;

      // Status filter
      const srs = srsDataMap[word.id];
      if (selectedStatus === 'mastered' && (!srs || srs.state !== 'mastered')) return false;
      if (selectedStatus === 'learning' && (!srs || srs.state !== 'learning')) return false;
      if (selectedStatus === 'wrong' && (!srs || srs.wrongCount === 0)) return false;
      if (selectedStatus === 'new' && srs && srs.reps > 0) return false;

      // Search term
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        return (
          word.word.toLowerCase().includes(term) ||
          word.reading.toLowerCase().includes(term) ||
          word.romaji.toLowerCase().includes(term) ||
          word.meaning.toLowerCase().includes(term)
        );
      }

      return true;
    });
  }, [selectedLevel, selectedPOS, selectedStatus, searchTerm, srsDataMap]);

  // Unique parts of speech for filter dropdown
  const allPOS = ['ALL', '動詞', 'い形容詞', 'な形容詞', '名詞', '副詞', '句型片語', '連接詞'];

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
      {/* Search Bar & Stats */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-rose-500" />
            <span>單字庫字典</span>
          </h2>
          <span className="text-xs text-slate-500 font-medium">
            共找到 {filteredWords.length} 個單字
          </span>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="搜尋日文、假名、羅馬音或中文意思..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 shadow-xs"
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

        {/* Filter Pills */}
        <div className="flex flex-wrap gap-2 text-xs">
          {/* Level Filter */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            {(['ALL', 'N5', 'N4', 'N3', 'N2', 'N1'] as JLPTLevel[]).map(lvl => (
              <button
                key={lvl}
                onClick={() => setSelectedLevel(lvl)}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                  selectedLevel === lvl
                    ? 'bg-rose-500 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                {lvl === 'ALL' ? '全部' : lvl}
              </button>
            ))}
          </div>

          {/* POS Filter */}
          <select
            value={selectedPOS}
            onChange={(e) => setSelectedPOS(e.target.value)}
            className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border-none rounded-xl font-medium text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-rose-500 cursor-pointer"
          >
            {allPOS.map(pos => (
              <option key={pos} value={pos}>
                {pos === 'ALL' ? '所有詞性' : pos}
              </option>
            ))}
          </select>

          {/* Mastery Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border-none rounded-xl font-medium text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-rose-500 cursor-pointer"
          >
            <option value="ALL">全部狀態</option>
            <option value="mastered">已掌握 (🟢)</option>
            <option value="learning">學習中 (🟡)</option>
            <option value="wrong">有答錯過 (🔴)</option>
            <option value="new">尚未學習 (⚪)</option>
          </select>
        </div>
      </div>

      {/* Words List View */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
        {filteredWords.map((word) => {
          const srs = srsDataMap[word.id];
          const isMastered = srs?.state === 'mastered';
          const isWrong = (srs?.wrongCount || 0) > 0;

          return (
            <div
              key={word.id}
              onClick={() => setActiveWord(word)}
              className="group bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-3.5 shadow-xs hover:shadow-md hover:border-rose-300 dark:hover:border-rose-700 transition-all cursor-pointer flex items-center justify-between gap-3"
            >
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-base text-slate-800 dark:text-slate-100">
                    {word.word}
                  </span>
                  <span className="text-xs text-rose-500 dark:text-rose-400 font-medium">
                    {word.reading}
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-md">
                    {word.partOfSpeech}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 truncate">
                  {word.meaning}
                </p>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    speakJapanese(word.reading);
                  }}
                  className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-xl transition-colors cursor-pointer"
                  title="朗讀"
                >
                  <Volume2 className="w-4 h-4" />
                </button>

                {/* Status Indicator */}
                {isMastered ? (
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" title="已掌握" />
                ) : isWrong ? (
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" title="曾答錯" />
                ) : srs && srs.reps > 0 ? (
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" title="學習中" />
                ) : (
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-600" title="未背過" />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredWords.length === 0 && (
        <div className="text-center py-12 text-slate-400 text-sm">
          沒有找到符合條件的單字，請嘗試更改搜尋關鍵字或篩選條件。
        </div>
      )}

      {/* Word Detail Modal */}
      {activeWord && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setActiveWord(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-4 animate-scaleUp"
          >
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 text-xs font-bold rounded-md">
                    {activeWord.level}
                  </span>
                  <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-md">
                    {activeWord.partOfSpeech}
                  </span>
                </div>
                <div className="text-rose-500 font-semibold text-sm pt-1">
                  {activeWord.reading} ({activeWord.romaji})
                </div>
                <h3 className="text-3xl font-black text-slate-900 dark:text-white">
                  {activeWord.word}
                </h3>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => speakJapanese(activeWord.reading)}
                  className="p-2.5 bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400 rounded-2xl hover:bg-rose-100 transition-colors cursor-pointer"
                >
                  <Volume2 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setActiveWord(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-xl cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Meaning */}
            <div className="p-3.5 bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 rounded-2xl">
              <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 uppercase">
                中文釋義
              </span>
              <p className="text-lg font-bold text-slate-800 dark:text-slate-100">
                {activeWord.meaning}
              </p>
            </div>

            {/* Example */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 rounded-2xl space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                <span>日文例句</span>
                <button
                  onClick={() => speakJapanese(activeWord.example)}
                  className="text-slate-400 hover:text-rose-500 cursor-pointer"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-base text-slate-800 dark:text-slate-200 font-medium">
                {activeWord.example}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200/50 dark:border-slate-700/50">
                {activeWord.exampleMeaning}
              </p>
            </div>

            {/* SRS Info */}
            {srsDataMap[activeWord.id] && (
              <div className="text-xs text-slate-500 flex items-center justify-between px-1">
                <span>連續答對: {srsDataMap[activeWord.id].reps} 次</span>
                <span>下次複習: {srsDataMap[activeWord.id].nextReviewDate || '今日'}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
