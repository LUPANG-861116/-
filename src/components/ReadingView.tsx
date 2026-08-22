import React, { useState, useEffect, useRef, useMemo } from 'react';
import type { JLPTLevel, ReadingArticle } from '../types';
import { allReadingArticles as defaultSeedArticles } from '../data/readingData';
import { speakJapanese, stopSpeech, pauseSpeech, resumeSpeech } from '../utils/speech';
import {
  getStoredApiKey,
  saveStoredApiKey,
  removeStoredApiKey,
  getCachedDailyArticles,
  getArchivedArticles,
  archiveCompletedArticle,
  generateDailyReadingWithGemini
} from '../services/geminiService';
import confetti from 'canvas-confetti';
import {
  Volume2,
  CheckCircle2,
  Sparkles,
  RotateCcw,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  HelpCircle,
  Eye,
  EyeOff,
  Check,
  X,
  ChevronRight,
  ArrowLeft,
  Calendar,
  Layers,
  Key,
  RefreshCw,
  ExternalLink,
  Bot,
  AlertCircle,
  BookOpen
} from 'lucide-react';

const PROGRESS_STORAGE_KEY = 'nihongo_reading_progress_v1';

interface ReadingViewProps {
  currentLevel: JLPTLevel;
}

export const ReadingView: React.FC<ReadingViewProps> = ({ currentLevel: initialLevel }) => {
  const [selectedLevel, setSelectedLevel] = useState<JLPTLevel>(initialLevel === 'ALL' ? 'N5' : initialLevel);
  const [viewMode, setViewMode] = useState<'daily' | 'archive'>('daily');
  const [selectedArticle, setSelectedArticle] = useState<ReadingArticle | null>(null);
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [userAnswers, setUserAnswers] = useState<Record<string, number>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showFullTranslation, setShowFullTranslation] = useState(false);

  // Gemini API Key State
  const [apiKey, setApiKey] = useState<string>(getStoredApiKey());
  const [tempApiKeyInput, setTempApiKeyInput] = useState<string>('');
  const [showApiKeyModal, setShowApiKeyModal] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [genError, setGenError] = useState<string>('');

  // Daily generated articles for current level
  const [dailyArticles, setDailyArticles] = useState<ReadingArticle[]>([]);
  const [archivedList, setArchivedList] = useState<ReadingArticle[]>([]);

  // Audio Player State
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [activeSpeed, setActiveSpeed] = useState<1.2 | 1.0 | 0.8>(1.0); // 1.2x 快速 vs 1.0x 日檢語速 vs 0.8x 慢速
  const [currentSentenceIdx, setCurrentSentenceIdx] = useState<number>(0);

  const isStopRequestedRef = useRef(false);
  const isPlayingRef = useRef(false);

  // Load progress
  useEffect(() => {
    try {
      const raw = localStorage.getItem(PROGRESS_STORAGE_KEY);
      if (raw) {
        setCompletedIds(JSON.parse(raw));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Today Date String (YYYY/MM/DD)
  const todayDateStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  // Load or fetch daily articles when level or apiKey changes
  useEffect(() => {
    const actualLevel = selectedLevel === 'ALL' ? 'N3' : selectedLevel;
    const cached = getCachedDailyArticles(actualLevel);

    if (cached && cached.length > 0) {
      setDailyArticles(cached);
      setGenError('');
    } else if (apiKey) {
      // Auto-trigger online generation if API Key exists and not yet generated today
      handleGenerateOnline(actualLevel, false);
    } else {
      // Fallback to default seed article
      const fallback = defaultSeedArticles.filter(a => a.level === actualLevel);
      setDailyArticles(fallback);
    }

    // Refresh archives for current level
    setArchivedList(getArchivedArticles(selectedLevel));
  }, [selectedLevel, apiKey]);

  // Handle Online Generation via Gemini API
  const handleGenerateOnline = async (levelToGen: JLPTLevel = selectedLevel, isManual: boolean = true) => {
    const actualLvl = levelToGen === 'ALL' ? 'N3' : levelToGen;
    const currentKey = apiKey || getStoredApiKey();

    if (!currentKey) {
      if (isManual) setShowApiKeyModal(true);
      return;
    }

    setIsGenerating(true);
    setGenError('');

    try {
      const result = await generateDailyReadingWithGemini(actualLvl, currentKey);
      setDailyArticles(result);
    } catch (err: any) {
      console.error(err);
      setGenError(err.message || '連網生成失敗，請檢查 API Key 或網路連線');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveApiKey = () => {
    if (!tempApiKeyInput.trim()) {
      removeStoredApiKey();
      setApiKey('');
    } else {
      saveStoredApiKey(tempApiKeyInput.trim());
      setApiKey(tempApiKeyInput.trim());
    }
    setShowApiKeyModal(false);
    setTempApiKeyInput('');
  };

  // Displayed articles depending on viewMode (daily vs completed archive)
  const displayedArticles = useMemo(() => {
    if (viewMode === 'archive') {
      return archivedList;
    }
    return dailyArticles.length > 0
      ? dailyArticles
      : defaultSeedArticles.filter(a => selectedLevel === 'ALL' || a.level === selectedLevel);
  }, [viewMode, dailyArticles, archivedList, selectedLevel]);

  const todayCompletedCount = useMemo(() => {
    return displayedArticles.filter(a => completedIds.includes(a.id)).length;
  }, [displayedArticles, completedIds]);

  // Parse current article into sentences for sentence-by-sentence audio
  const sentences = useMemo(() => {
    if (!selectedArticle) return [];
    const raw = selectedArticle.content
      .split(/(?<=[。！？\n])/)
      .map(s => s.trim())
      .filter(s => s.length > 0);
    return raw.length > 0 ? raw : [selectedArticle.content];
  }, [selectedArticle]);

  // Cleanup speech on unmount or article switch
  useEffect(() => {
    return () => {
      isStopRequestedRef.current = true;
      isPlayingRef.current = false;
      stopSpeech();
    };
  }, [selectedArticle]);

  // Calibrate speech rate by JLPT level
  const getEffectiveRate = (level: JLPTLevel | undefined, speed: 1.2 | 1.0 | 0.8): number => {
    if (level === 'N3') {
      if (speed === 1.0) return 1.05;
      if (speed === 0.8) return 0.85;
      if (speed === 1.2) return 1.25;
    }
    if (level === 'N2' || level === 'N1') {
      if (speed === 1.0) return 1.1; // N2/N1 官方真題聽力實戰語速
      if (speed === 0.8) return 0.9;
      if (speed === 1.2) return 1.3;
    }
    return speed;
  };

  // Play sequential sentences
  const playFromSentence = async (startIdx: number, speedRate: 1.2 | 1.0 | 0.8 = activeSpeed) => {
    isStopRequestedRef.current = false;
    isPlayingRef.current = true;
    setIsPlaying(true);
    setIsPaused(false);

    const actualRate = getEffectiveRate(selectedArticle?.level, speedRate);

    for (let i = startIdx; i < sentences.length; i++) {
      if (isStopRequestedRef.current) break;

      setCurrentSentenceIdx(i);
      await speakJapanese(sentences[i], actualRate);

      if (!isStopRequestedRef.current && i < sentences.length - 1) {
        await new Promise(r => setTimeout(r, speedRate === 0.8 ? 350 : 200));
      }
    }

    if (!isStopRequestedRef.current) {
      setIsPlaying(false);
      setIsPaused(false);
      isPlayingRef.current = false;
      setCurrentSentenceIdx(0);
    }
  };

  // Toggle Play / Pause
  const handleTogglePlay = () => {
    if (!isPlaying) {
      playFromSentence(currentSentenceIdx, activeSpeed);
    } else if (isPaused) {
      resumeSpeech();
      setIsPaused(false);
    } else {
      pauseSpeech();
      setIsPaused(true);
    }
  };

  // Rewind
  const handleRewind = () => {
    isStopRequestedRef.current = true;
    stopSpeech();
    const prevIdx = Math.max(0, currentSentenceIdx - 1);
    setCurrentSentenceIdx(prevIdx);
    setTimeout(() => {
      playFromSentence(prevIdx, activeSpeed);
    }, 50);
  };

  // Forward
  const handleForward = () => {
    isStopRequestedRef.current = true;
    stopSpeech();
    const nextIdx = Math.min(sentences.length - 1, currentSentenceIdx + 1);
    setCurrentSentenceIdx(nextIdx);
    setTimeout(() => {
      playFromSentence(nextIdx, activeSpeed);
    }, 50);
  };

  // Jump to specific sentence
  const handleSentenceClick = (idx: number) => {
    isStopRequestedRef.current = true;
    stopSpeech();
    setCurrentSentenceIdx(idx);
    setTimeout(() => {
      playFromSentence(idx, activeSpeed);
    }, 50);
  };

  // Change Speed
  const handleSpeedChange = (newSpeed: 1.2 | 1.0 | 0.8) => {
    setActiveSpeed(newSpeed);
    if (isPlaying) {
      isStopRequestedRef.current = true;
      stopSpeech();
      setTimeout(() => {
        playFromSentence(currentSentenceIdx, newSpeed);
      }, 50);
    }
  };

  // Stop completely
  const handleStop = () => {
    isStopRequestedRef.current = true;
    isPlayingRef.current = false;
    stopSpeech();
    setIsPlaying(false);
    setIsPaused(false);
  };

  // Open article
  const handleOpenArticle = (article: ReadingArticle) => {
    handleStop();
    setSelectedArticle(article);
    setCurrentSentenceIdx(0);
    setUserAnswers({});
    setIsSubmitted(false);
    setShowFullTranslation(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle answering
  const handleSelectOption = (questionId: string, optionIdx: number) => {
    if (isSubmitted) return;
    setUserAnswers(prev => ({ ...prev, [questionId]: optionIdx }));
  };

  // Submit test
  const handleSubmitAnswers = () => {
    if (!selectedArticle) return;
    setIsSubmitted(true);

    const allCorrect = selectedArticle.questions.every(
      q => userAnswers[q.id] === q.correctAnswer
    );

    if (allCorrect) {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 }
      });
    }

    // Save completed progress
    if (!completedIds.includes(selectedArticle.id)) {
      const updated = [...completedIds, selectedArticle.id];
      setCompletedIds(updated);
      localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(updated));
    }

    // Only archive if user completes the test
    archiveCompletedArticle(selectedArticle);
    setArchivedList(getArchivedArticles(selectedLevel));
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-4 sm:py-6 space-y-6">
      {/* 0. API KEY CONFIG MODAL */}
      {showApiKeyModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-700 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-rose-100 dark:bg-rose-950 text-rose-600 rounded-xl">
                  <Bot className="w-5 h-5" />
                </div>
                <h3 className="font-black text-lg text-slate-800 dark:text-slate-100">
                  設定 Google Gemini API Key
                </h3>
              </div>
              <button
                onClick={() => setShowApiKeyModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              啟用每日 AI 連網更新出題，系統將在每天 00:00 自動為你即時生成全新 3 篇專屬閱讀測驗。Google Gemini API 提供非常充裕的<strong>永久免費額度</strong>！
            </p>

            <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs space-y-1.5">
              <span className="font-bold text-slate-700 dark:text-slate-200">
                如何取得免費 API Key（約需 10 秒）：
              </span>
              <ol className="list-decimal list-inside text-slate-500 dark:text-slate-400 space-y-1 text-[11px]">
                <li>點擊下方連結前往 Google AI Studio。</li>
                <li>登入 Google 帳號後點選「Create API Key」。</li>
                <li>將產生的 Key 複製並貼在下方即可。</li>
              </ol>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 hover:underline pt-1"
              >
                <span>前往 Google AI Studio 免費領取</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Gemini API Key：
              </label>
              <input
                type="password"
                placeholder="貼上你的 AIzaSy... 金鑰"
                value={tempApiKeyInput}
                onChange={(e) => setTempApiKeyInput(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-rose-500 font-mono"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleSaveApiKey}
                className="flex-1 py-2.5 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
              >
                儲存金鑰並啟用
              </button>
              {apiKey && (
                <button
                  onClick={() => {
                    removeStoredApiKey();
                    setApiKey('');
                    setShowApiKeyModal(false);
                  }}
                  className="px-4 py-2.5 bg-slate-100 dark:bg-slate-700 text-rose-600 text-xs font-bold rounded-xl hover:bg-rose-50 transition-colors cursor-pointer"
                >
                  清除金鑰
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 1. ARTICLE DETAIL & QUIZ VIEW */}
      {selectedArticle ? (
        <div className="space-y-6 animate-fadeIn">
          {/* Back Bar */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => {
                handleStop();
                setSelectedArticle(null);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>返回閱讀列表</span>
            </button>

            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 font-extrabold text-xs rounded-lg">
                JLPT {selectedArticle.level}
              </span>
              <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium text-xs rounded-lg">
                {selectedArticle.category}
              </span>
            </div>
          </div>

          {/* Reading Card */}
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
            {/* Header & Title */}
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-100">
                {selectedArticle.title}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                {selectedArticle.titleZh}
              </p>
            </div>

            {/* AUDIO PLAYER & SPEED SWITCHER */}
            <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-5 shadow-lg space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                  <span className="font-bold">日語真人音頻導讀</span>
                  {isPlaying && (
                    <span className="px-2 py-0.5 bg-rose-500/30 text-rose-300 rounded-md text-[11px] font-mono">
                      第 {currentSentenceIdx + 1} / {sentences.length} 句
                    </span>
                  )}
                </div>

                {/* Speed Switcher (1.2x 快速 vs 1.0x 日檢語速 vs 0.8x 慢速) */}
                <div className="flex items-center bg-slate-800 p-1 rounded-xl gap-1">
                  <button
                    onClick={() => handleSpeedChange(1.2)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      activeSpeed === 1.2
                        ? 'bg-amber-500 text-white shadow-xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    1.2x 快速
                  </button>
                  <button
                    onClick={() => handleSpeedChange(1.0)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      activeSpeed === 1.0
                        ? 'bg-rose-500 text-white shadow-xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    1.0x 日檢語速
                  </button>
                  <button
                    onClick={() => handleSpeedChange(0.8)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      activeSpeed === 0.8
                        ? 'bg-indigo-500 text-white shadow-xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    0.8x 慢速
                  </button>
                </div>
              </div>

              {/* Sentence Progress Slider */}
              <div className="space-y-1">
                <input
                  type="range"
                  min="0"
                  max={Math.max(0, sentences.length - 1)}
                  value={currentSentenceIdx}
                  onChange={(e) => handleSentenceClick(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-rose-500"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>句 1</span>
                  <span>點擊下方日文句子亦可直接跳段聆聽</span>
                  <span>句 {sentences.length}</span>
                </div>
              </div>

              {/* Player Control Buttons */}
              <div className="flex items-center justify-center gap-3 pt-1">
                <button
                  onClick={handleRewind}
                  title="重聽上一句"
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1 text-xs"
                >
                  <SkipBack className="w-4 h-4" />
                  <span className="hidden sm:inline text-[11px]">-1句</span>
                </button>

                <button
                  onClick={handleTogglePlay}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-extrabold shadow-md active:scale-95 transition-all cursor-pointer flex items-center gap-2 text-sm"
                >
                  {isPlaying && !isPaused ? (
                    <>
                      <Pause className="w-4 h-4" />
                      <span>暫停</span>
                    </>
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                </button>

                <button
                  onClick={handleForward}
                  title="跳至下一句"
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1 text-xs"
                >
                  <span className="hidden sm:inline text-[11px]">+1句</span>
                  <SkipForward className="w-4 h-4" />
                </button>

                {isPlaying && (
                  <button
                    onClick={handleStop}
                    className="p-2 rounded-xl bg-slate-800/80 hover:bg-rose-950 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer text-xs"
                    title="停止播放"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Interactive Sentence-by-Sentence Article Content */}
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
                <span>日文原文（點擊句子可單句精聽）</span>
                <span className="text-[10px] text-rose-500 font-normal">
                  {isPlaying ? '▶ 正在跟隨音頻朗讀' : '💡 點選句子直接播放'}
                </span>
              </div>

              <div className="p-5 bg-slate-50 dark:bg-slate-900/50 rounded-2xl text-slate-800 dark:text-slate-100 text-base sm:text-lg leading-loose space-y-2 border border-slate-200/60 dark:border-slate-700/60 font-medium">
                {sentences.map((sent, idx) => {
                  const isCurrent = isPlaying && currentSentenceIdx === idx;
                  return (
                    <span
                      key={idx}
                      onClick={() => handleSentenceClick(idx)}
                      className={`inline cursor-pointer rounded-lg px-1.5 py-0.5 transition-all ${
                        isCurrent
                          ? 'bg-rose-500 text-white font-bold shadow-xs'
                          : 'hover:bg-rose-100 dark:hover:bg-rose-950/60'
                      }`}
                      title="點擊播放這句"
                    >
                      {sent}{' '}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Translation Toggle & Card */}
            <div className="space-y-3 pt-2">
              <button
                onClick={() => setShowFullTranslation(!showFullTranslation)}
                className="inline-flex items-center gap-2 text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
              >
                {showFullTranslation ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                <span>{showFullTranslation ? '隱藏繁體中文翻譯' : '查看完整繁體中文對照翻譯'}</span>
              </button>

              {showFullTranslation && (
                <div className="p-5 bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 rounded-2xl text-slate-700 dark:text-slate-300 text-sm sm:text-base leading-relaxed whitespace-pre-line animate-fadeIn">
                  {selectedArticle.contentZh}
                </div>
              )}
            </div>

            {/* Vocabulary Focus Bar */}
            <div className="p-4 bg-slate-100 dark:bg-slate-700/50 rounded-2xl space-y-3 text-xs">
              <div className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>本篇重點單字與片語</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedArticle.keyVocab.map((vocab, i) => (
                  <button
                    key={i}
                    onClick={() => speakJapanese(vocab.word)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-100 hover:border-rose-400 transition-all cursor-pointer text-xs"
                  >
                    <span className="font-bold">{vocab.word}</span>
                    <span className="text-slate-400">({vocab.reading})</span>
                    <span className="text-rose-600 dark:text-rose-400 font-medium">
                      : {vocab.meaning}
                    </span>
                    <Volume2 className="w-3 h-3 text-slate-400" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 3 COMPREHENSION QUESTIONS */}
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-4">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-rose-500" />
                <h3 className="text-lg font-black text-slate-800 dark:text-slate-100">
                  文章理解測驗 (共 3 題)
                </h3>
              </div>
              <span className="text-xs text-slate-400">
                答題完成後點擊提交即可檢視詳解並歸檔
              </span>
            </div>

            <div className="space-y-6">
              {selectedArticle.questions.map((q, qIndex) => {
                const selected = userAnswers[q.id];

                return (
                  <div key={q.id} className="space-y-3 p-4 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-[11px] font-bold flex items-center justify-center">
                          {qIndex + 1}
                        </span>
                        <h4 className="font-bold text-sm sm:text-base text-slate-800 dark:text-slate-100">
                          {q.question}
                        </h4>
                      </div>
                      <p className="text-xs text-slate-400 pl-7">
                        {q.questionZh}
                      </p>
                    </div>

                    {/* Options (4 choices) */}
                    <div className="grid grid-cols-1 gap-2 pl-2">
                      {q.options.map((opt, optIndex) => {
                        const isChosen = selected === optIndex;
                        const isCorrectOpt = optIndex === q.correctAnswer;

                        let btnStyle = 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-rose-300';

                        if (isSubmitted) {
                          if (isCorrectOpt) {
                            btnStyle = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-100 font-bold';
                          } else if (isChosen && !isCorrectOpt) {
                            btnStyle = 'border-rose-500 bg-rose-50 dark:bg-rose-950/60 text-rose-900 dark:text-rose-100 font-bold';
                          } else {
                            btnStyle = 'border-slate-200 dark:border-slate-700 opacity-50';
                          }
                        } else if (isChosen) {
                          btnStyle = 'border-rose-500 bg-rose-50 dark:bg-rose-950/60 text-rose-900 dark:text-rose-100 font-bold ring-2 ring-rose-400/20';
                        }

                        return (
                          <button
                            key={optIndex}
                            disabled={isSubmitted}
                            onClick={() => handleSelectOption(q.id, optIndex)}
                            className={`p-3 rounded-xl border text-left text-xs sm:text-sm transition-all flex items-center justify-between gap-2 cursor-pointer ${btnStyle}`}
                          >
                            <div className="flex items-center gap-2.5">
                              <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 flex items-center justify-center text-[10px] font-bold">
                                {optIndex + 1}
                              </span>
                              <span>{opt}</span>
                            </div>

                            {isSubmitted && (
                              <div>
                                {isCorrectOpt ? (
                                  <Check className="w-4 h-4 text-emerald-500" />
                                ) : isChosen ? (
                                  <X className="w-4 h-4 text-rose-500" />
                                ) : null}
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Question Explanation */}
                    {isSubmitted && (
                      <div className="mt-3 p-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs space-y-1 text-slate-600 dark:text-slate-300 animate-fadeIn">
                        <div className="font-bold text-rose-600 dark:text-rose-400">
                          💡 解題解析：
                        </div>
                        <p>{q.explanationZh}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Submit / Retest Buttons */}
            <div className="pt-2">
              {!isSubmitted ? (
                <button
                  onClick={handleSubmitAnswers}
                  disabled={Object.keys(userAnswers).length < selectedArticle.questions.length}
                  className={`w-full py-3.5 rounded-2xl font-extrabold text-sm shadow-md transition-all cursor-pointer ${
                    Object.keys(userAnswers).length === selectedArticle.questions.length
                      ? 'bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 text-white shadow-rose-500/20 active:scale-95'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  {Object.keys(userAnswers).length === selectedArticle.questions.length
                    ? '提交測驗並查看成績與解析'
                    : `請完成所有題目 (${Object.keys(userAnswers).length} / ${selectedArticle.questions.length})`}
                </button>
              ) : (
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setUserAnswers({});
                      setIsSubmitted(false);
                    }}
                    className="flex-1 py-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 font-bold rounded-2xl text-xs sm:text-sm text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                  >
                    重新作答本篇
                  </button>
                  <button
                    onClick={() => {
                      handleStop();
                      setSelectedArticle(null);
                    }}
                    className="flex-1 py-3 bg-rose-500 hover:bg-rose-600 font-bold rounded-2xl text-xs sm:text-sm text-white shadow-md transition-colors cursor-pointer"
                  >
                    完成，挑選下一篇
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* 2. ARTICLE LIST VIEW */
        <div className="space-y-5 animate-fadeIn">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-rose-500 to-pink-600 rounded-3xl p-6 sm:p-8 text-white shadow-lg space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur-xs rounded-full text-xs font-bold">
                <Bot className="w-3.5 h-3.5" />
                <span>AI 連網每日更新出題系統</span>
              </div>
              <button
                onClick={() => setShowApiKeyModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 hover:bg-white/30 text-white rounded-full text-xs font-bold transition-all cursor-pointer"
              >
                <Key className="w-3 h-3" />
                <span>{apiKey ? 'API Key 已配置' : '設定免費 API Key'}</span>
              </button>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black">
              每日連網閱讀與真題解析
            </h2>
            <p className="text-xs sm:text-sm text-rose-100 max-w-xl">
              每天由 Google Gemini AI 依照日檢各等級官方命題規範，連網即時生成全新 3 篇短文、繁中翻譯與 3 道測驗題！
            </p>
          </div>

          {/* Warning / Setup Notice if no API key is set */}
          {!apiKey && (
            <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-2xl flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-500" />
                <span>
                  尚未設定 Google Gemini API Key。設定後每日 0 點即可自動連網生成全新文章！
                </span>
              </div>
              <button
                onClick={() => setShowApiKeyModal(true)}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl transition-all shrink-0 cursor-pointer shadow-xs"
              >
                免費 10 秒取得
              </button>
            </div>
          )}

          {/* Generation Error Alert */}
          {genError && (
            <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-2xl flex items-center justify-between gap-3 text-xs text-rose-700 dark:text-rose-300">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{genError}</span>
              </div>
              <button
                onClick={() => handleGenerateOnline()}
                className="px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl shrink-0 cursor-pointer"
              >
                重試連網生成
              </button>
            </div>
          )}

          {/* Level Switcher Tabs */}
          <div className="flex gap-2 p-1.5 bg-slate-200/80 dark:bg-slate-800 rounded-2xl">
            {(['N5', 'N4', 'N3', 'N2', 'N1'] as JLPTLevel[]).map((lvl) => (
              <button
                key={lvl}
                onClick={() => setSelectedLevel(lvl)}
                className={`flex-1 py-2 rounded-xl font-black text-xs transition-all cursor-pointer ${
                  selectedLevel === lvl
                    ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>

          {/* Mode Switcher Tabs (今日 AI 每日篇章 vs 已完成測驗存檔庫) */}
          <div className="bg-white dark:bg-slate-800 p-2 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-wrap gap-2 text-xs font-bold">
            <button
              onClick={() => setViewMode('daily')}
              className={`flex-1 py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
                viewMode === 'daily'
                  ? 'bg-rose-500 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>📅 今日 AI 篇章（3 篇全新特訓）</span>
            </button>

            <button
              onClick={() => setViewMode('archive')}
              className={`flex-1 py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
                viewMode === 'archive'
                  ? 'bg-rose-500 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>📚 已完成測驗存檔庫 ({archivedList.length} 篇)</span>
            </button>
          </div>

          {/* Daily Status Banner & Re-generate button (Only in daily mode) */}
          {viewMode === 'daily' && (
            <div className="p-4 bg-gradient-to-r from-rose-50 to-pink-50 dark:from-rose-950/30 dark:to-pink-950/20 border border-rose-200 dark:border-rose-900/40 rounded-2xl flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 text-xs font-extrabold text-rose-800 dark:text-rose-300">
                  <Calendar className="w-4 h-4 text-rose-600" />
                  <span>今日日期：{todayDateStr} • {selectedLevel} 專屬特訓</span>
                </div>
                <p className="text-[11px] text-rose-700/80 dark:text-rose-400">
                  今日進度：{todayCompletedCount} / {displayedArticles.length} 篇完成（完成後將自動歸檔存入歷史庫）
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleGenerateOnline(selectedLevel, true)}
                  disabled={isGenerating}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-slate-800 hover:bg-rose-50 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 rounded-xl text-xs font-bold transition-all shadow-2xs active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
                  <span>{isGenerating ? 'AI 正在連網生成中...' : '重新連網出題 3 篇'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Article List Cards */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 px-1">
              <span>
                {viewMode === 'daily'
                  ? `今日 ${selectedLevel} AI 連網推薦篇章 (${displayedArticles.length} 篇)`
                  : `已攻克 ${selectedLevel} 測驗存檔 (${displayedArticles.length} 篇)`}
              </span>
              <span>點擊進入閱讀與測驗</span>
            </div>

            {/* Loading State Spinner */}
            {isGenerating && (
              <div className="p-8 bg-white dark:bg-slate-800 rounded-2xl border-2 border-rose-200 dark:border-rose-900 text-center space-y-3 animate-pulse">
                <div className="inline-block p-3 bg-rose-100 dark:bg-rose-950 text-rose-600 rounded-2xl">
                  <Bot className="w-8 h-8 animate-spin" />
                </div>
                <div className="font-bold text-sm text-slate-800 dark:text-slate-100">
                  Google Gemini AI 正在為您生成今日全新 3 篇 JLPT {selectedLevel} 閱讀篇章與測驗題...
                </div>
                <p className="text-xs text-slate-400">
                  請稍候約 3~5 秒，即將為您帶來專屬量身打造的最新閱讀素材！
                </p>
              </div>
            )}

            {/* Empty State for Archive */}
            {!isGenerating && viewMode === 'archive' && displayedArticles.length === 0 && (
              <div className="p-8 bg-white dark:bg-slate-800 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700 text-center space-y-2.5">
                <div className="p-3 inline-block bg-slate-100 dark:bg-slate-700/60 text-slate-400 rounded-2xl">
                  <BookOpen className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-sm text-slate-700 dark:text-slate-200">
                  尚無 {selectedLevel} 已完成的閱讀測驗存檔
                </h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                  當你完成今日 AI 推薦的閱讀測驗並點擊提交後，該篇文章就會自動永久保存在此；若當日未完成的篇章將不予保存。
                </p>
              </div>
            )}

            {!isGenerating && (
              <div className="grid grid-cols-1 gap-3">
                {displayedArticles.map((article, idx) => {
                  const isCompleted = completedIds.includes(article.id);

                  return (
                    <div
                      key={article.id || idx}
                      onClick={() => handleOpenArticle(article)}
                      className="p-5 bg-white dark:bg-slate-800 rounded-2xl border-2 border-slate-200 dark:border-slate-700 hover:border-rose-400 dark:hover:border-rose-500 transition-all cursor-pointer flex items-center justify-between gap-4 group shadow-xs hover:shadow-md"
                    >
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 font-extrabold text-[11px] rounded-md">
                            {article.level}
                          </span>
                          <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 text-[11px] rounded-md">
                            {article.category}
                          </span>
                          <span className="px-2 py-0.5 bg-rose-50 dark:bg-rose-950 text-rose-500 text-[10px] font-mono rounded-md">
                            篇 {idx + 1}
                          </span>
                          {isCompleted && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold rounded-md">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>已完成 (3/3 題)</span>
                            </span>
                          )}
                        </div>

                        <h3 className="font-bold text-base text-slate-800 dark:text-slate-100 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors truncate">
                          {article.title}
                        </h3>

                        <p className="text-xs text-slate-400 truncate">
                          {article.titleZh}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 text-slate-300 group-hover:text-rose-500 transition-colors">
                        <ChevronRight className="w-5 h-5" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
