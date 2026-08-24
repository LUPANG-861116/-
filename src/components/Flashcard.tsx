import React, { useState, useEffect } from 'react';
import type { VocabWord, RatingGrade, WordSRSData } from '../types';
import { speakJapanese } from '../utils/speech';
import { predictNextInterval, isFavorite, toggleFavorite } from '../utils/srsEngine';
import { Volume2, VolumeX, Eye, Check, X, ArrowLeft, Clock, Calendar, Star, Headphones, Gauge } from 'lucide-react';

interface FlashcardProps {
  word: VocabWord;
  srsData: WordSRSData;
  currentIndex: number;
  totalCards: number;
  onRate: (grade: RatingGrade) => void;
  onBack: () => void;
}

export const Flashcard: React.FC<FlashcardProps> = ({
  word,
  srsData,
  currentIndex,
  totalCards,
  onRate,
  onBack
}) => {
  const [isRevealed, setIsRevealed] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [showProMode, setShowProMode] = useState(false);
  const [isStarred, setIsStarred] = useState(false);

  // 自動發音開關（預設為開啟 True，保存在 localStorage）
  const [autoPlayAudio, setAutoPlayAudio] = useState<boolean>(() => {
    return localStorage.getItem('nihongo_autoplay_audio') !== 'false';
  });

  // 自然人聲語速調整（預設 0.85x 最接近真人清晰發音）
  const [speechRate, setSpeechRate] = useState<number>(() => {
    const saved = localStorage.getItem('nihongo_speech_rate');
    return saved ? parseFloat(saved) : 0.85;
  });

  // 切換自動發音
  const toggleAutoPlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    setAutoPlayAudio(prev => {
      const next = !prev;
      localStorage.setItem('nihongo_autoplay_audio', String(next));
      return next;
    });
  };

  // 切換語速 (0.75x 慢速 -> 0.85x 自然真人 -> 1.0x 正常)
  const cycleSpeechRate = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSpeechRate(prev => {
      let next = 0.85;
      if (prev === 0.85) next = 0.75;
      else if (prev === 0.75) next = 1.0;
      else next = 0.85;
      localStorage.setItem('nihongo_speech_rate', String(next));
      return next;
    });
  };

  // 判定是否為純聽力模式（答對兩次以上）
  const isListeningMode = (srsData.reps || 0) >= 2;

  // 當單字切換時重設狀態，並在自動發音開啟時自動播放真人發音
  useEffect(() => {
    setIsRevealed(false);
    setIsStarred(isFavorite(word.id));

    if (autoPlayAudio || isListeningMode) {
      // 換卡時自動發音，使用自然語速
      const timer = setTimeout(() => {
        speakJapanese(word.reading, speechRate);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [word.id, autoPlayAudio, isListeningMode, speechRate]);

  // 收藏切換
  const handleToggleStar = (e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = toggleFavorite(word.id);
    setIsStarred(updated);
  };

  // 播放日語發音
  const handleSpeak = async (e?: React.MouseEvent, text?: string) => {
    if (e) e.stopPropagation();
    setIsPlayingAudio(true);
    await speakJapanese(text || word.reading, speechRate);
    setIsPlayingAudio(false);
  };

  // 預測各選項的下次出現間隔
  const againPrediction = predictNextInterval(srsData, 'again');
  const goodPrediction = predictNextInterval(srsData, 'good');
  const hardPrediction = predictNextInterval(srsData, 'hard');
  const easyPrediction = predictNextInterval(srsData, 'easy');

  // 鍵盤快捷鍵支援
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        setIsRevealed(prev => !prev);
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        handleSpeak();
      } else if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        setIsStarred(toggleFavorite(word.id));
      } else if (isRevealed) {
        if (e.key === '1') {
          e.preventDefault();
          onRate('again');
        } else if (e.key === '2') {
          e.preventDefault();
          onRate('good');
        } else if (e.key === '3') {
          e.preventDefault();
          onRate('easy');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRevealed, word]);

  // 詞性標籤顏色
  const getPosBadgeColor = (pos: string) => {
    switch (pos) {
      case '動詞':
        return 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800';
      case 'い形容詞':
      case 'な形容詞':
        return 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
      case '名詞':
        return 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      case '副詞':
        return 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800';
      default:
        return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    }
  };

  const progressPercent = Math.round(((currentIndex + 1) / totalCards) * 100);

  return (
    <div className="max-w-lg mx-auto px-4 py-4 sm:py-6 space-y-4">
      {/* Top Header Bar: Back, Level badge & Audio controls */}
      <div className="flex items-center justify-between text-xs text-slate-500 font-medium gap-2">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 p-1 rounded-lg transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>返回</span>
        </button>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Auto-Play Audio Toggle */}
          <button
            onClick={toggleAutoPlay}
            className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg border font-semibold text-[11px] transition-all cursor-pointer ${
              autoPlayAudio
                ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800/80 shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700'
            }`}
            title="點擊切換是否換卡自動發音"
          >
            {autoPlayAudio ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{autoPlayAudio ? '自動發音' : '手動發音'}</span>
          </button>

          {/* Speech Rate Selector */}
          <button
            onClick={cycleSpeechRate}
            className="inline-flex items-center gap-0.5 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-[11px] hover:border-slate-300 dark:hover:border-slate-600 transition-all cursor-pointer"
            title="點擊切換發音語速 (0.75x 慢速 / 0.85x 真人標準 / 1.0x 原速)"
          >
            <Gauge className="w-3 h-3 text-rose-500" />
            <span>{speechRate === 0.85 ? '0.85x 真人速' : speechRate === 0.75 ? '0.75x 慢速' : '1.0x 原速'}</span>
          </button>

          {/* Level Badge */}
          <span className="px-2 py-0.5 bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 font-bold rounded-md text-[11px]">
            {word.level}
          </span>
          <span className="text-[11px] text-slate-400">
            {currentIndex + 1}/{totalCards}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
        <div
          className="bg-gradient-to-r from-rose-500 to-amber-500 h-full rounded-full transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* MAIN FLASHCARD (Tap to reveal Chinese meaning & example translation) */}
      <div
        onClick={() => setIsRevealed(prev => !prev)}
        className={`group relative w-full bg-white dark:bg-slate-800 border-2 rounded-3xl p-6 sm:p-8 shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer select-none ${
          isRevealed
            ? 'border-rose-300 dark:border-rose-800/80 ring-4 ring-rose-500/10'
            : isListeningMode
            ? 'border-indigo-300 dark:border-indigo-800/80 bg-indigo-50/10'
            : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
        }`}
      >
        {/* Top Badges & Audio / Star Speaker */}
        <div className="flex items-center justify-between gap-2">
          {/* Part of Speech Badge */}
          <span
            className={`px-3 py-1 text-xs font-bold rounded-full border ${getPosBadgeColor(
              word.partOfSpeech
            )}`}
          >
            {word.partOfSpeech}
          </span>

          <div className="flex items-center gap-1.5">
            {/* Star Favorite Button */}
            <button
              onClick={handleToggleStar}
              className={`p-2 rounded-2xl transition-all cursor-pointer ${
                isStarred
                  ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/60 shadow-xs scale-105'
                  : 'text-slate-400 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
              title={isStarred ? '已加入星號收藏（點擊取消）' : '加入星號收藏 (快捷鍵 S)'}
            >
              <Star className={`w-5 h-5 ${isStarred ? 'fill-current' : ''}`} />
            </button>

            {/* Audio Pronunciation Button */}
            <button
              onClick={(e) => handleSpeak(e)}
              className={`p-2.5 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 hover:bg-rose-100 active:scale-90 transition-all cursor-pointer ${
                isPlayingAudio ? 'animate-pulse scale-105' : ''
              }`}
              title="播放日語發音 (快捷鍵 R)"
            >
              <Volume2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Word Display Section (Listening Challenge if reps >= 2 and unrevealed) */}
        {isListeningMode && !isRevealed ? (
          /* 純聽力盲測畫面 (答對兩次後自動觸發) */
          <div className="text-center py-6 sm:py-8 space-y-3 animate-fadeIn">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-inner">
              <Headphones className="w-8 h-8 animate-bounce" />
            </div>

            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-full text-xs font-black">
                <span>🎧 純聽力挑戰（已連續答對 {srsData.reps} 次）</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto pt-1 leading-relaxed">
                文字已暫時隱藏。請聆聽日語發音並回想漢字與意思，單點字卡即可翻開對答案！
              </p>
            </div>

            <button
              onClick={(e) => handleSpeak(e)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-sm cursor-pointer"
            >
              <Volume2 className="w-4 h-4" />
              <span>再次播放發音</span>
            </button>
          </div>
        ) : (
          /* 標準單字顯示畫面 (正面未熟 或 翻開後) */
          <div className="text-center py-6 sm:py-8 space-y-2">
            {/* Hiragana Reading & Romaji */}
            <div className="flex items-center justify-center gap-2 text-rose-500 dark:text-rose-400 font-semibold text-base sm:text-lg">
              <span>{word.reading}</span>
              <span className="text-xs text-slate-400 font-normal">({word.romaji})</span>
            </div>

            {/* Big Japanese Kanji / Word */}
            <h2 className="text-4xl sm:text-5xl font-black text-slate-800 dark:text-slate-100 tracking-wide font-sans py-1">
              {word.word}
            </h2>

            {/* SRS Mastery Tag */}
            <div className="pt-1 flex items-center justify-center gap-1.5 text-[11px] text-slate-400 font-medium">
              {srsData.reps > 0 ? (
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  已連續答對 {srsData.reps} 次 • 間隔 {srsData.interval}d
                </span>
              ) : srsData.wrongCount > 0 ? (
                <span className="text-rose-500 font-semibold flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  曾答錯 {srsData.wrongCount} 次 (今日加強中)
                </span>
              ) : (
                <span>全新單字</span>
              )}
            </div>
          </div>
        )}

        {/* Example Sentence Section */}
        <div className="mt-2 p-4 bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span>日文例句</span>
            <button
              onClick={(e) => handleSpeak(e, word.example)}
              className="text-slate-400 hover:text-rose-500 transition-colors p-1 cursor-pointer"
              title="朗讀例句"
            >
              <Volume2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Japanese Sentence */}
          <p className="text-base sm:text-lg text-slate-800 dark:text-slate-200 font-medium leading-relaxed">
            {isListeningMode && !isRevealed ? '（翻開後顯示例句內容）' : word.example}
          </p>

          {/* Example Chinese Translation (Revealed when card is clicked) */}
          {isRevealed && (
            <p className="text-sm text-slate-600 dark:text-slate-300 pt-1 border-t border-slate-200/60 dark:border-slate-700/60 animate-fadeIn font-normal">
              {word.exampleMeaning}
            </p>
          )}
        </div>

        {/* Word Chinese Meaning (Revealed when card is clicked) */}
        {isRevealed ? (
          <div className="mt-4 p-4 bg-gradient-to-r from-rose-50 to-amber-50 dark:from-rose-950/30 dark:to-amber-950/20 border border-rose-200/60 dark:border-rose-900/40 rounded-2xl text-center space-y-1 animate-fadeIn">
            <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
              中文釋義
            </span>
            <p className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-100">
              {word.meaning}
            </p>
          </div>
        ) : (
          /* Tap Hint Cue */
          <div className="mt-4 py-3 text-center text-xs font-medium text-slate-400 dark:text-slate-500 flex items-center justify-center gap-1.5 group-hover:text-rose-500 transition-colors">
            <Eye className="w-4 h-4" />
            <span>單點字卡 查看中文釋義與例句翻譯</span>
          </div>
        )}
      </div>

      {/* BOTTOM ACTION BUTTONS: 不會 ❌ vs 會 ✅ WITH COMPACT INTERVAL TAG */}
      <div className="pt-2 space-y-3">
        {!showProMode ? (
          /* Default Mode: Simple 2 Big Buttons with Concise Interval Badges */
          <div className="grid grid-cols-2 gap-3">
            {/* 不會 (Again) */}
            <button
              onClick={() => onRate('again')}
              className="flex items-center justify-between py-3.5 sm:py-4 px-4 sm:px-5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-300 border-2 border-rose-200 dark:border-rose-900 rounded-2xl font-bold shadow-xs active:scale-95 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-2 text-base sm:text-lg">
                <X className="w-5 h-5 stroke-[2.5]" />
                <span>不會</span>
              </div>
              <span className="px-2 py-0.5 bg-rose-200/80 dark:bg-rose-900/70 text-rose-800 dark:text-rose-200 rounded-lg text-xs font-mono font-bold">
                {againPrediction.tag}
              </span>
            </button>

            {/* 會 (Good) */}
            <button
              onClick={() => onRate('good')}
              className="flex items-center justify-between py-3.5 sm:py-4 px-4 sm:px-5 bg-emerald-500 hover:bg-emerald-600 text-white border-2 border-emerald-600 rounded-2xl font-bold shadow-md shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-2 text-base sm:text-lg">
                <Check className="w-5 h-5 stroke-[2.5]" />
                <span>會</span>
              </div>
              <span className="px-2 py-0.5 bg-emerald-700/80 text-white rounded-lg text-xs font-mono font-bold">
                {goodPrediction.tag}
              </span>
            </button>
          </div>
        ) : (
          /* Pro Mode: 4-tier SRS Ratings with Compact Tags */
          <div className="grid grid-cols-4 gap-2">
            <button
              onClick={() => onRate('again')}
              className="py-3 px-1.5 bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-bold rounded-xl text-xs sm:text-sm hover:bg-rose-200 active:scale-95 transition-all cursor-pointer text-center space-y-0.5"
            >
              <div>忘記</div>
              <span className="inline-block px-1.5 py-0.2 bg-rose-200 dark:bg-rose-900 text-rose-800 dark:text-rose-200 rounded text-[11px] font-mono font-bold">
                {againPrediction.tag}
              </span>
            </button>

            <button
              onClick={() => onRate('hard')}
              className="py-3 px-1.5 bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-bold rounded-xl text-xs sm:text-sm hover:bg-amber-200 active:scale-95 transition-all cursor-pointer text-center space-y-0.5"
            >
              <div>困難</div>
              <span className="inline-block px-1.5 py-0.2 bg-amber-200 dark:bg-amber-900 text-amber-800 dark:text-amber-200 rounded text-[11px] font-mono font-bold">
                {hardPrediction.tag}
              </span>
            </button>

            <button
              onClick={() => onRate('good')}
              className="py-3 px-1.5 bg-emerald-500 text-white font-bold rounded-xl text-xs sm:text-sm hover:bg-emerald-600 active:scale-95 transition-all shadow-xs cursor-pointer text-center space-y-0.5"
            >
              <div>熟悉</div>
              <span className="inline-block px-1.5 py-0.2 bg-emerald-700 text-white rounded text-[11px] font-mono font-bold">
                {goodPrediction.tag}
              </span>
            </button>

            <button
              onClick={() => onRate('easy')}
              className="py-3 px-1.5 bg-blue-500 text-white font-bold rounded-xl text-xs sm:text-sm hover:bg-blue-600 active:scale-95 transition-all shadow-xs cursor-pointer text-center space-y-0.5"
            >
              <div>超簡單</div>
              <span className="inline-block px-1.5 py-0.2 bg-blue-700 text-white rounded text-[11px] font-mono font-bold">
                {easyPrediction.tag}
              </span>
            </button>
          </div>
        )}

        {/* Toggle Pro / Simple mode & Keyboard tips */}
        <div className="flex items-center justify-between text-[11px] text-slate-400 px-1 pt-1">
          <span className="hidden sm:inline">
            快捷鍵: 空白鍵(翻牌) • 1(不會) • 2(會) • S(收藏) • R(發音)
          </span>
          <button
            onClick={() => setShowProMode(prev => !prev)}
            className="text-slate-500 hover:text-rose-500 underline ml-auto transition-colors cursor-pointer"
          >
            {showProMode ? '切換為簡易二選一模式' : '切換為 4 級專業評分模式'}
          </button>
        </div>
      </div>
    </div>
  );
};
