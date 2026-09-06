import { useState, useMemo } from 'react';
import type { VocabWord, JLPTLevel, AppView, RatingGrade } from './types';
import { allWords, n5n4Words, n5n2Words, n5n1Words, allN5Words, allN4Words, allN3Words, allN2Words, allN1Words } from './data';
import {
  getSRSDataForWord,
  updateWordSRS,
  getUserStats,
  getReviewQueue,
  getHardWords,
  getUnfamiliarWords,
  shuffleArray,
  getTodayString
} from './utils/srsEngine';
import { calculateDynamicBatchSize, getDaysUntilTarget } from './utils/scheduler';
import { Navbar } from './components/Navbar';
import { LevelSelector } from './components/LevelSelector';
import { Flashcard } from './components/Flashcard';
import { WordList } from './components/WordList';
import { Dashboard } from './components/Dashboard';
import { QuizView } from './components/QuizView';
import { ReadingView } from './components/ReadingView';
import { PhraseList } from './components/PhraseList';
import confetti from 'canvas-confetti';
import { Award, Zap, ArrowRight, RefreshCw } from 'lucide-react';

export function App() {
  const [currentView, setCurrentView] = useState<AppView>('study');
  const [currentLevel, setCurrentLevel] = useState<JLPTLevel>('N5');
  const [studyQueue, setStudyQueue] = useState<VocabWord[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isStudyFinished, setIsStudyFinished] = useState(false);
  const [lastStudyMode, setLastStudyMode] = useState<'all' | 'due' | 'hard' | 'scheduled' | 'unfamiliar'>('scheduled');
  const [refreshKey, setRefreshKey] = useState(0);

  // User Stats
  const stats = useMemo(() => getUserStats(), [refreshKey]);

  // Mastered counts per level
  const n5Mastered = useMemo(() => {
    return allN5Words.filter(w => getSRSDataForWord(w.id).state === 'mastered').length;
  }, [refreshKey]);

  const n4Mastered = useMemo(() => {
    return allN4Words.filter(w => getSRSDataForWord(w.id).state === 'mastered').length;
  }, [refreshKey]);

  const n3Mastered = useMemo(() => {
    return allN3Words.filter(w => getSRSDataForWord(w.id).state === 'mastered').length;
  }, [refreshKey]);

  const n2Mastered = useMemo(() => {
    return allN2Words.filter(w => getSRSDataForWord(w.id).state === 'mastered').length;
  }, [refreshKey]);

  const n1Mastered = useMemo(() => {
    return allN1Words.filter(w => getSRSDataForWord(w.id).state === 'mastered').length;
  }, [refreshKey]);

  // N5 + N4 Mastered Count (Core Exam Focus)
  const n5n4Mastered = n5Mastered + n4Mastered;

  // N5 + N4 尚未完全記熟的單字總量 (含待複習、學習中、全新單字)
  const n5n4Unmastered = useMemo(() => {
    return n5n4Words.filter(w => {
      const srs = getSRSDataForWord(w.id);
      return srs.state !== 'mastered';
    }).length;
  }, [refreshKey]);

  // Due review count (N5 + N4 + total)
  const dueCount = useMemo(() => {
    return getReviewQueue(allWords).length;
  }, [refreshKey]);

  // Hard words count
  const hardCount = useMemo(() => {
    return getHardWords(allWords).length;
  }, [refreshKey]);

  // Unfamiliar & Favorited Words count (for N5+N4)
  const unfamiliarWords = useMemo(() => {
    return getUnfamiliarWords(n5n4Words);
  }, [refreshKey]);

  // Start study session (全面隨機打亂順序，避免同字首聚集；待複習分段分批 15 字)
  const handleStartStudy = (level: JLPTLevel, mode: 'all' | 'due' | 'hard' | 'scheduled' | 'unfamiliar') => {
    setCurrentLevel(level);
    setLastStudyMode(mode);
    let pool: VocabWord[] = [];

    const basePool =
      level === 'N5_N4'
        ? n5n4Words
        : level === 'N5_N2'
        ? n5n2Words
        : level === 'N5_N1' || level === 'ALL'
        ? n5n1Words
        : level === 'N5'
        ? allN5Words
        : level === 'N4'
        ? allN4Words
        : level === 'N3'
        ? allN3Words
        : level === 'N2'
        ? allN2Words
        : allN1Words;

    if (mode === 'due') {
      // 待複習分段分批：每次 15 字，打亂字首順序，避免一次背太長負擔過重
      const dueList = shuffleArray(getReviewQueue(basePool));
      pool = dueList.slice(0, 15);
    } else if (mode === 'hard') {
      // 弱點錯題：每次 15 字，打亂順序
      const hardList = shuffleArray(getHardWords(basePool));
      pool = hardList.slice(0, 15);
    } else if (mode === 'unfamiliar') {
      // 不熟/星號特訓專區：每次 15 字，打亂順序
      const unfamiliarList = shuffleArray(getUnfamiliarWords(basePool));
      pool = unfamiliarList.slice(0, 15);
    } else if (mode === 'scheduled') {
      // 考前智慧排程：以「未完全記熟」的單字（包含待複習、學習中、全新單字）為計算依據
      const unmastered = basePool.filter(w => {
        const srs = getSRSDataForWord(w.id);
        return srs.state !== 'mastered';
      });

      const daysLeft = getDaysUntilTarget();
      const batchSize = calculateDynamicBatchSize(unmastered.length, daysLeft);

      if (unmastered.length > 0) {
        // 優先挑選：今日到期待複習單字 + 學習中/全新單字，全部洗牌隨機！
        const today = getTodayString();
        const dueWords = unmastered.filter(w => {
          const srs = getSRSDataForWord(w.id);
          return srs.nextReviewDate && srs.nextReviewDate <= today;
        });
        const otherUnmastered = unmastered.filter(w => !dueWords.some(d => d.id === w.id));

        // 混合洗牌打亂
        const combined = [...shuffleArray(dueWords), ...shuffleArray(otherUnmastered)];
        pool = combined.slice(0, batchSize);
      } else {
        // 若全部都精熟，取複習間隔最短的單字洗牌
        const sorted = [...basePool].sort((a, b) => (getSRSDataForWord(a.id).reps || 0) - (getSRSDataForWord(b.id).reps || 0));
        pool = shuffleArray(sorted.slice(0, batchSize * 2)).slice(0, batchSize);
      }
    } else {
      // 綜合自選單元練習（打亂順序，每次 15 字）
      const unmastered = basePool.filter(w => getSRSDataForWord(w.id).state !== 'mastered');
      const candidate = unmastered.length > 0 ? unmastered : basePool;
      pool = shuffleArray(candidate).slice(0, 15);
    }

    if (pool.length === 0) {
      pool = shuffleArray(basePool).slice(0, 15);
    }

    setStudyQueue(pool);
    setCurrentIndex(0);
    setIsStudyFinished(false);
    setCurrentView('study');
  };

  // Continue to the NEXT batch immediately!
  const handleContinueNextBatch = () => {
    handleStartStudy(currentLevel, lastStudyMode);
  };

  // Handle rating on a card (不會 vs 會)
  const handleRate = (grade: RatingGrade) => {
    if (studyQueue.length === 0) return;
    const currentWord = studyQueue[currentIndex];

    // Update SRS
    updateWordSRS(currentWord.id, grade);
    setRefreshKey(k => k + 1);

    // If 'again' (不會), add to the end of this session's study queue so user encounters it again!
    if (grade === 'again') {
      setStudyQueue(prev => [...prev, currentWord]);
    }

    // Move to next card
    if (currentIndex + 1 < studyQueue.length) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setIsStudyFinished(true);
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  };

  // Switch to review tab
  const handleGoToReview = () => {
    handleStartStudy('N5_N4', 'due');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 flex flex-col font-sans">
      {/* Top Navigation */}
      <Navbar
        currentView={currentView}
        setCurrentView={(view) => {
          if (view === 'review') {
            handleGoToReview();
          } else {
            setCurrentView(view);
          }
        }}
        currentLevel={currentLevel}
        setCurrentLevel={(lvl) => {
          setCurrentLevel(lvl);
          setStudyQueue([]);
          setCurrentIndex(0);
        }}
        dueCount={dueCount}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto pb-12">
        {/* VIEW 1: STUDY FLASHCARDS */}
        {currentView === 'study' && (
          <>
            {studyQueue.length === 0 ? (
              /* Level Selection & Countdown Screen */
              <LevelSelector
                onStartStudy={handleStartStudy}
                onGoToReading={() => setCurrentView('reading')}
                onGoToPhrases={() => setCurrentView('phrases')}
                onStartUnfamiliarStudy={() => handleStartStudy('N5_N4', 'unfamiliar')}
                dueCount={dueCount}
                hardCount={hardCount}
                unfamiliarCount={unfamiliarWords.length}
                n5MasteredCount={n5Mastered}
                n4MasteredCount={n4Mastered}
                n3MasteredCount={n3Mastered}
                n2MasteredCount={n2Mastered}
                n1MasteredCount={n1Mastered}
                n5n4UnmasteredCount={n5n4Unmastered}
                n5n4MasteredCount={n5n4Mastered}
              />
            ) : isStudyFinished ? (
              /* Session Completed Celebration Screen with Continue Next Batch Option */
              <div className="max-w-md mx-auto px-4 py-10 text-center space-y-6 animate-scaleUp">
                <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-rose-500 to-amber-500 flex items-center justify-center text-white text-3xl shadow-lg">
                  <Award className="w-10 h-10" />
                </div>

                <div className="space-y-2">
                  <h2 className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-slate-100">
                    {lastStudyMode === 'due' ? '🎉 太棒了！本組複習完成！' : '🎉 太棒了！本組單字學習完成！'}
                  </h2>
                  <p className="text-slate-500 text-sm">
                    {lastStudyMode === 'due'
                      ? `已完成這批 ${studyQueue.length} 個待複習單字。系統已自動更新間隔記憶排程！`
                      : `已完成這批 ${studyQueue.length} 個單字。系統已依據你的答題情況排入 SRS 間隔記憶排程！`}
                  </p>

                  {lastStudyMode === 'due' ? (
                    dueCount > 0 ? (
                      <div className="inline-block px-3 py-1.5 bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 font-bold text-xs rounded-xl">
                        今日尚有 {dueCount} 個單字待複習
                      </div>
                    ) : (
                      <div className="inline-block px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 font-bold text-xs rounded-xl">
                        🎉 今日所有待複習單字已全部清空完成！
                      </div>
                    )
                  ) : n5n4Unmastered > 0 ? (
                    <div className="inline-block px-3 py-1.5 bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 font-bold text-xs rounded-xl">
                      N5+N4 剩餘 {n5n4Unmastered} 個未熟單字待精熟
                    </div>
                  ) : (
                    <div className="inline-block px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 font-bold text-xs rounded-xl">
                      N5+N4 全部單字皆已達成精熟！
                    </div>
                  )}
                </div>

                <div className="pt-2 flex flex-col gap-3">
                  {/* Primary Next Batch Action */}
                  {lastStudyMode === 'due' && dueCount > 0 ? (
                    <button
                      onClick={handleContinueNextBatch}
                      className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white font-extrabold rounded-2xl shadow-lg shadow-amber-500/20 text-base active:scale-95 transition-all cursor-pointer"
                    >
                      <RefreshCw className="w-5 h-5" />
                      <span>🔥 繼續下一組複習 ({Math.min(15, dueCount)} 字)</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={() => handleStartStudy('N5_N4', 'scheduled')}
                      className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white font-extrabold rounded-2xl shadow-lg shadow-rose-500/20 text-base active:scale-95 transition-all cursor-pointer"
                    >
                      <Zap className="w-5 h-5 fill-current" />
                      <span>🔥 繼續背下一組單字 ({calculateDynamicBatchSize(n5n4Unmastered)} 字)</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}

                  <div className="flex gap-2.5">
                    <button
                      onClick={() => {
                        setStudyQueue([]);
                        setCurrentIndex(0);
                      }}
                      className="flex-1 py-3 px-4 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 font-bold rounded-2xl text-xs sm:text-sm transition-all cursor-pointer"
                    >
                      返回選單
                    </button>

                    {lastStudyMode !== 'due' && dueCount > 0 && (
                      <button
                        onClick={handleGoToReview}
                        className="flex-1 py-3 px-4 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-2xl text-xs sm:text-sm transition-all cursor-pointer shadow-xs"
                      >
                        今日複習 ({dueCount})
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              /* Active Flashcard Screen */
              <Flashcard
                word={studyQueue[currentIndex]}
                srsData={getSRSDataForWord(studyQueue[currentIndex].id)}
                currentIndex={currentIndex}
                totalCards={studyQueue.length}
                onRate={handleRate}
                onBack={() => setStudyQueue([])}
              />
            )}
          </>
        )}

        {/* VIEW 2: REVIEW (SRS Due Queue) */}
        {currentView === 'review' && (
          <div className="space-y-4">
            {studyQueue.length > 0 && !isStudyFinished ? (
              <Flashcard
                word={studyQueue[currentIndex]}
                srsData={getSRSDataForWord(studyQueue[currentIndex].id)}
                currentIndex={currentIndex}
                totalCards={studyQueue.length}
                onRate={handleRate}
                onBack={() => setCurrentView('study')}
              />
            ) : (
              <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
                  <Award className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                  今天沒有待複習的單字！
                </h3>
                <p className="text-xs text-slate-500">
                  你已經把今日需要複習的單字都完成了。可以前往「背單字」探索新字，或到「閱讀」或「句型片語」提升實力！
                </p>
                <button
                  onClick={() => setCurrentView('study')}
                  className="px-5 py-2.5 bg-rose-500 text-white font-bold rounded-2xl text-xs shadow-md cursor-pointer"
                >
                  開始背新單字
                </button>
              </div>
            )}
          </div>
        )}

        {/* VIEW 3: QUIZ VIEW */}
        {currentView === 'quiz' && (
          <QuizView
            currentLevel={currentLevel}
            onRefreshStats={() => setRefreshKey(k => k + 1)}
          />
        )}

        {/* VIEW 4: READING VIEW (分級閱讀測驗) */}
        {currentView === 'reading' && (
          <ReadingView currentLevel={currentLevel} />
        )}

        {/* VIEW 5: PHRASES VIEW (常用片語與句型) */}
        {currentView === 'phrases' && (
          <PhraseList />
        )}

        {/* VIEW 6: DICTIONARY / WORD LIST */}
        {currentView === 'dictionary' && <WordList initialLevel={currentLevel} />}

        {/* VIEW 7: STATS & DASHBOARD */}
        {currentView === 'stats' && (
          <Dashboard
            stats={stats}
            onRefresh={() => setRefreshKey(k => k + 1)}
            onStartHardWords={() => {
              handleStartStudy('N5_N4', 'hard');
              setCurrentView('study');
            }}
          />
        )}
      </main>
    </div>
  );
}

export default App;
