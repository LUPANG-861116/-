import React, { useState, useEffect, useMemo } from 'react';
import type { VocabWord, JLPTLevel } from '../types';
import { n5n4Words, n5n2Words, n5n1Words, allN5Words, allN4Words, allN3Words, allN2Words, allN1Words } from '../data';
import { allGrammarQuizData } from '../data/quizGrammarData';
import { updateWordSRS } from '../utils/srsEngine';
import { speakJapanese } from '../utils/speech';
import confetti from 'canvas-confetti';
import {
  CheckCircle2,
  XCircle,
  Volume2,
  ArrowRight,
  RefreshCw,
  Clock,
  Award,
  Zap,
  Target,
  Flame,
  FileCheck,
  Sparkles,
  Layers,
  CheckSquare
} from 'lucide-react';

interface QuizViewProps {
  currentLevel: JLPTLevel;
  onRefreshStats: () => void;
}

export type QuizCategoryType = 'all' | 'reading' | 'meaning' | 'particle' | 'conjugation' | 'cloze';

interface Question {
  type: 'cloze' | 'reading' | 'meaning' | 'particle' | 'conjugation';
  word?: VocabWord;
  prompt: string;
  subPrompt?: string;
  options: { text: string; isCorrect: boolean; reading?: string }[];
  explanation: string;
  levelBadge?: string;
  categoryBadge?: string;
}

export const QuizView: React.FC<QuizViewProps> = ({ currentLevel, onRefreshStats }) => {
  const [selectedQuizLevel, setSelectedQuizLevel] = useState<JLPTLevel>(currentLevel === 'ALL' ? 'N5_N4' : currentLevel);
  const [selectedCategory, setSelectedCategory] = useState<QuizCategoryType>('all');
  const [questionCount, setQuestionCount] = useState<number>(20);
  const [isTimedMode, setIsTimedMode] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(20 * 60);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [isSettingUp, setIsSettingUp] = useState(true);

  // Filter pool based on selected quiz level
  const wordPool = useMemo(() => {
    if (selectedQuizLevel === 'N5_N4') return n5n4Words;
    if (selectedQuizLevel === 'N5_N2') return n5n2Words;
    if (selectedQuizLevel === 'N5_N1' || selectedQuizLevel === 'ALL') return n5n1Words;
    if (selectedQuizLevel === 'N5') return allN5Words;
    if (selectedQuizLevel === 'N4') return allN4Words;
    if (selectedQuizLevel === 'N3') return allN3Words;
    if (selectedQuizLevel === 'N2') return allN2Words;
    if (selectedQuizLevel === 'N1') return allN1Words;
    return n5n4Words;
  }, [selectedQuizLevel]);

  // Filter grammar pool based on level
  const grammarPool = useMemo(() => {
    if (selectedQuizLevel === 'N5_N4') {
      return allGrammarQuizData.filter(g => g.level === 'N5' || g.level === 'N4');
    }
    if (selectedQuizLevel === 'N5_N2') {
      return allGrammarQuizData.filter(g => ['N5', 'N4', 'N3', 'N2'].includes(g.level));
    }
    if (selectedQuizLevel === 'N5_N1' || selectedQuizLevel === 'ALL') {
      return allGrammarQuizData;
    }
    return allGrammarQuizData.filter(g => g.level === selectedQuizLevel);
  }, [selectedQuizLevel]);

  // Timer effect for Timed Mock Exam Mode
  useEffect(() => {
    if (!isTimedMode || isSettingUp || isFinished) return;

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsFinished(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isTimedMode, isSettingUp, isFinished]);

  // Generate dynamic questions based on selected category and level (WITHOUT giveaway hints)
  const startQuiz = (count: number = questionCount, timed: boolean = isTimedMode) => {
    setIsTimedMode(timed);
    const generated: Question[] = [];

    // Helper to generate a single question from word (No giveaways in subPrompt)
    const makeWordQuestion = (targetWord: VocabWord, specificType?: 'cloze' | 'reading' | 'meaning'): Question => {
      const types: ('cloze' | 'reading' | 'meaning')[] = ['cloze', 'reading', 'meaning'];
      const qType = specificType || types[Math.floor(Math.random() * types.length)];

      const validPool = wordPool.filter(
        w => w.id !== targetWord.id && w.meaning && w.meaning.trim() !== '、' && w.meaning.trim().length > 0
      );

      const wrongOptions = validPool
        .filter(w => w.partOfSpeech === targetWord.partOfSpeech)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);

      const fillers = validPool
        .filter(w => !wrongOptions.some(o => o.id === w.id))
        .sort(() => Math.random() - 0.5)
        .slice(0, 3 - wrongOptions.length);

      const allWrongs = [...wrongOptions, ...fillers];

      if (qType === 'cloze') {
        const blankSentence = targetWord.example.includes(targetWord.word)
          ? targetWord.example.replace(targetWord.word, '＿＿＿')
          : `＿＿＿（${targetWord.example}）`;

        const opts = [
          { text: targetWord.word, isCorrect: true, reading: targetWord.reading },
          ...allWrongs.map(w => ({ text: w.word, isCorrect: false, reading: w.reading }))
        ]
          .filter((opt, i, self) => i === self.findIndex(t => t.text === opt.text))
          .sort(() => Math.random() - 0.5);

        return {
          type: 'cloze',
          word: targetWord,
          levelBadge: targetWord.level,
          categoryBadge: '文脈規定（語法克漏字）',
          prompt: blankSentence.includes('＿＿＿') ? blankSentence : `請選出最適當的日文單字：`,
          subPrompt: `請根據文意，在空欄 ＿＿＿ 處填入最適當的單字`,
          options: opts,
          explanation: `【正解】${targetWord.word}（${targetWord.reading}）：${targetWord.meaning}\n【原文】${targetWord.example}\n【翻譯】${targetWord.exampleMeaning}`
        };
      } else if (qType === 'reading') {
        const opts = [
          { text: targetWord.reading, isCorrect: true },
          ...allWrongs.map(w => ({ text: w.reading, isCorrect: false }))
        ]
          .filter((opt, i, self) => i === self.findIndex(t => t.text === opt.text))
          .sort(() => Math.random() - 0.5);

        return {
          type: 'reading',
          word: targetWord,
          levelBadge: targetWord.level,
          categoryBadge: '文字・語彙（漢字讀音）',
          prompt: `「${targetWord.word}」の正しい読み方はどれですか。`,
          subPrompt: `請選出漢字「${targetWord.word}」的正確平假名讀音`,
          options: opts,
          explanation: `【讀音】${targetWord.word} 讀作【${targetWord.reading}】（${targetWord.romaji}）\n【詞性】${targetWord.partOfSpeech}\n【釋義】${targetWord.meaning}`
        };
      } else {
        const cleanMeaning = (m: string) => m.replace(/^[、,\s]+|[、,\s]+$/g, '');
        const opts = [
          { text: cleanMeaning(targetWord.meaning), isCorrect: true },
          ...allWrongs.map(w => ({ text: cleanMeaning(w.meaning), isCorrect: false }))
        ]
          .filter((opt, i, self) => opt.text.length > 0 && i === self.findIndex(t => t.text === opt.text))
          .sort(() => Math.random() - 0.5);

        return {
          type: 'meaning',
          word: targetWord,
          levelBadge: targetWord.level,
          categoryBadge: '語彙・意味（單字字義）',
          prompt: `「${targetWord.word}」（${targetWord.reading}）の意味はどれですか。`,
          subPrompt: `請選出「${targetWord.word}」最符合的繁體中文含義`,
          options: opts,
          explanation: `【釋義】${targetWord.word}（${targetWord.reading}）＝【${targetWord.meaning}】\n【例句】${targetWord.example}（${targetWord.exampleMeaning}）`
        };
      }
    };

    // Helper for grammar items (No giveaways in subPrompt)
    const makeGrammarQuestion = (gItem: typeof allGrammarQuizData[0]): Question => {
      const opts = gItem.options.map((optText, idx) => ({
        text: optText,
        isCorrect: idx === gItem.correctAnswer
      })).sort(() => Math.random() - 0.5);

      return {
        type: gItem.type,
        levelBadge: gItem.level,
        categoryBadge: gItem.type === 'particle' ? '助詞選択（文法助詞填空）' : '活用・形態（詞性動詞變形）',
        prompt: gItem.prompt,
        subPrompt: gItem.type === 'particle' ? '請選出最適當的格助詞填入括號（　）中' : '請選出最適當的活用形態填入括號（　）中',
        options: opts,
        explanation: `【題目翻譯】${gItem.promptZh}\n【文法考點】${gItem.categoryName}\n【解題說明】${gItem.explanationZh}`
      };
    };

    if (selectedCategory === 'particle') {
      const pPool = grammarPool.filter(g => g.type === 'particle');
      const pool = pPool.length > 0 ? pPool : allGrammarQuizData.filter(g => g.type === 'particle');
      const shuffled = [...pool].sort(() => Math.random() - 0.5);
      const total = Math.min(count, shuffled.length);
      for (let i = 0; i < total; i++) {
        generated.push(makeGrammarQuestion(shuffled[i]));
      }
    } else if (selectedCategory === 'conjugation') {
      const cPool = grammarPool.filter(g => g.type === 'conjugation');
      const pool = cPool.length > 0 ? cPool : allGrammarQuizData.filter(g => g.type === 'conjugation');
      const shuffled = [...pool].sort(() => Math.random() - 0.5);
      const total = Math.min(count, shuffled.length);
      for (let i = 0; i < total; i++) {
        generated.push(makeGrammarQuestion(shuffled[i]));
      }
    } else if (selectedCategory === 'reading') {
      const shuffled = [...wordPool].sort(() => Math.random() - 0.5).slice(0, count);
      shuffled.forEach(w => generated.push(makeWordQuestion(w, 'reading')));
    } else if (selectedCategory === 'meaning') {
      const shuffled = [...wordPool].sort(() => Math.random() - 0.5).slice(0, count);
      shuffled.forEach(w => generated.push(makeWordQuestion(w, 'meaning')));
    } else if (selectedCategory === 'cloze') {
      const shuffled = [...wordPool].sort(() => Math.random() - 0.5).slice(0, count);
      shuffled.forEach(w => generated.push(makeWordQuestion(w, 'cloze')));
    } else {
      // 'all': Mix of reading, meaning, cloze, particles, and conjugations
      const shuffledWords = [...wordPool].sort(() => Math.random() - 0.5);
      const shuffledGrammar = [...grammarPool].sort(() => Math.random() - 0.5);

      const grammarCount = Math.min(Math.floor(count * 0.35), shuffledGrammar.length);
      const wordCount = count - grammarCount;

      for (let i = 0; i < grammarCount; i++) {
        generated.push(makeGrammarQuestion(shuffledGrammar[i]));
      }
      for (let i = 0; i < wordCount && i < shuffledWords.length; i++) {
        generated.push(makeWordQuestion(shuffledWords[i]));
      }
      generated.sort(() => Math.random() - 0.5);
    }

    setQuestions(generated);
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setScore(0);
    setIsFinished(false);
    setIsSettingUp(false);
    setTimeRemaining(Math.round(count * 45));
  };

  // Step 1: Select option (does NOT confirm immediately)
  const handleSelectOption = (idx: number) => {
    if (isAnswered) return;
    setSelectedOption(idx);
  };

  // Step 2: Final confirmation button click
  const handleConfirmAnswer = () => {
    if (selectedOption === null || isAnswered) return;
    setIsAnswered(true);

    const currentQ = questions[currentIndex];
    const isCorrect = currentQ.options[selectedOption].isCorrect;

    if (currentQ.word) {
      if (isCorrect) {
        setScore(prev => prev + 1);
        updateWordSRS(currentQ.word.id, 'good');
      } else {
        updateWordSRS(currentQ.word.id, 'again');
      }
    } else {
      if (isCorrect) {
        setScore(prev => prev + 1);
      }
    }
    onRefreshStats();
  };

  const handleNext = () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex(prev => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      setIsFinished(true);
      confetti({
        particleCount: 90,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  };

  // Speaks ONLY the question text (does NOT give away the hidden answer)
  const handleSpeakQuestion = () => {
    if (!questions[currentIndex]) return;
    const currentQ = questions[currentIndex];
    // Clean prompt to read sentence or target word without spoiling answer
    const textToSpeak = currentQ.prompt
      .replace(/＿＿＿|（　）|\(　\)/g, '、')
      .replace(/の正しい読み方はどれですか。|の意味はどれですか。/g, '')
      .replace(/[「」]/g, '');
    speakJapanese(textToSpeak || currentQ.prompt);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // 1. SETUP SCREEN (Level, Category, Question Count & Mock Exam Mode Selector)
  if (isSettingUp) {
    return (
      <div className="max-w-lg mx-auto px-4 py-8 space-y-5 animate-fadeIn">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-white text-2xl shadow-lg">
            <FileCheck className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100">
            日檢全真題型測驗題庫
          </h2>
          <p className="text-xs text-slate-500">
            依據 JLPT 官方考試模式規劃：漢字讀音、單字字義、文法助詞、詞性活用變形、語境克漏字！
          </p>
        </div>

        {/* 1. Category Filter Selector */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-400 block uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-emerald-500" />
              <span>測驗題型分類</span>
            </label>
            <span className="text-[10px] text-emerald-600 font-bold">日檢五大題型</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
            {[
              { id: 'all', label: '綜合混合全真題', icon: Sparkles, desc: '讀音/字義/助詞/活用' },
              { id: 'reading', label: '🔤 漢字讀音', icon: FileCheck, desc: '文字・語彙 讀音選擇' },
              { id: 'meaning', label: '📖 單字字義', icon: Target, desc: '語彙・意味 中文理解' },
              { id: 'particle', label: '🧩 文法助詞填空', icon: Zap, desc: 'に/で/を/が/へ/と' },
              { id: 'conjugation', label: '🔄 詞性與動詞活用', icon: RefreshCw, desc: '現在/過去/可能/受身' },
              { id: 'cloze', label: '📝 語境克漏字', icon: Flame, desc: '文脈規定 句意填空' }
            ].map(cat => {
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id as QuizCategoryType)}
                  className={`p-2.5 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/40 shadow-xs'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div className="font-bold text-xs text-slate-800 dark:text-slate-200">
                    {cat.label}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {cat.desc}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Quiz Level Scope Selector */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-5 shadow-sm space-y-3">
          <label className="text-xs font-bold text-slate-400 block uppercase tracking-wider">
            測驗範圍 ({wordPool.length} 字可測)
          </label>

          <div className="flex flex-wrap gap-1.5 text-xs">
            {[
              { id: 'N5_N4', label: '🎯 N5~N4 主力衝刺' },
              { id: 'N5_N2', label: '🚀 N5~N2 綜合' },
              { id: 'N5_N1', label: '👑 N5~N1 大滿貫' },
              { id: 'N5', label: 'N5' },
              { id: 'N4', label: 'N4' },
              { id: 'N3', label: 'N3' },
              { id: 'N2', label: 'N2' },
              { id: 'N1', label: 'N1' }
            ].map(lvl => (
              <button
                key={lvl.id}
                onClick={() => setSelectedQuizLevel(lvl.id as JLPTLevel)}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                  selectedQuizLevel === lvl.id
                    ? 'bg-emerald-500 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                {lvl.label}
              </button>
            ))}
          </div>
        </div>

        {/* 3. Question Count Selector */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 shadow-sm space-y-4">
          <label className="text-xs font-bold text-slate-400 block uppercase tracking-wider">
            選擇本次測驗題數
          </label>

          <div className="grid grid-cols-2 gap-3">
            {[
              { count: 10, label: '快速測驗', sub: '約 2~3 分鐘 (通勤首選)', icon: Zap },
              { count: 20, label: '標準單元', sub: '約 5 分鐘 (推薦日常)', icon: Target, isRec: true },
              { count: 35, label: '深度衝刺', sub: '約 10 分鐘 (深度強化)', icon: Flame },
              { count: 50, label: '全真模擬考', sub: '約 15~20 分鐘 (考前檢驗)', icon: Award }
            ].map(item => {
              const Icon = item.icon;
              const isSelected = questionCount === item.count;

              return (
                <button
                  key={item.count}
                  onClick={() => {
                    setQuestionCount(item.count);
                    if (item.count === 50) setIsTimedMode(true);
                  }}
                  className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between gap-1 relative ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/40 shadow-xs'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  {item.isRec && (
                    <span className="absolute -top-2 right-3 px-2 py-0.5 bg-rose-500 text-white rounded-full text-[10px] font-black">
                      推薦
                    </span>
                  )}
                  <div className="flex items-center gap-2">
                    <Icon className={`w-4 h-4 ${isSelected ? 'text-emerald-600' : 'text-slate-400'}`} />
                    <span className="font-bold text-sm text-slate-800 dark:text-slate-100">
                      {item.count} 題
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {item.label}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {item.sub}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Timed Mode Toggle */}
          <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-500" />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                開啟考前倒數計時模式
              </span>
            </div>
            <input
              type="checkbox"
              checked={isTimedMode}
              onChange={(e) => setIsTimedMode(e.target.checked)}
              className="w-4 h-4 text-emerald-600 rounded cursor-pointer"
            />
          </div>
        </div>

        {/* Start Button */}
        <button
          onClick={() => startQuiz(questionCount, isTimedMode)}
          className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-extrabold rounded-2xl shadow-lg shadow-emerald-500/20 text-base active:scale-95 transition-all cursor-pointer"
        >
          開始測驗 ({questionCount} 題{isTimedMode ? ' • 計時模式' : ''})
        </button>
      </div>
    );
  }

  // 2. QUIZ FINISHED SCREEN
  if (isFinished) {
    const accuracy = Math.round((score / questions.length) * 100);
    const isPassed = accuracy >= 60;

    return (
      <div className="max-w-md mx-auto px-4 py-10 text-center space-y-6 animate-scaleUp">
        <div className={`w-20 h-20 mx-auto rounded-3xl flex items-center justify-center text-white text-3xl font-black shadow-lg ${
          isPassed ? 'bg-gradient-to-tr from-emerald-400 to-teal-600' : 'bg-gradient-to-tr from-amber-500 to-rose-500'
        }`}>
          {isPassed ? '🏆' : '💪'}
        </div>

        <div className="space-y-2">
          <div className="inline-block px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-xs font-bold text-slate-600 dark:text-slate-300">
            {isPassed ? '合格！成績優異' : '未達標準，請再接再厲'}
          </div>
          <h2 className="text-3xl font-black text-slate-800 dark:text-slate-100">
            本次成績：{score} / {questions.length}
          </h2>
          <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
            答對率 {accuracy}%
          </p>
          <p className="text-xs text-slate-400">
            答對與答錯的單字均已自動記錄至 SRS 間隔重複複習系統中！
          </p>
        </div>

        <div className="pt-2 flex flex-col gap-2.5">
          <button
            onClick={() => startQuiz(questionCount, isTimedMode)}
            className="w-full inline-flex items-center justify-center gap-2 py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-2xl shadow-md active:scale-95 transition-all cursor-pointer text-sm"
          >
            <RefreshCw className="w-4 h-4" />
            <span>換一組題目再測驗一次 ({questionCount} 題)</span>
          </button>

          <button
            onClick={() => setIsSettingUp(true)}
            className="w-full py-3 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 font-bold rounded-2xl text-xs sm:text-sm transition-all cursor-pointer"
          >
            返回測驗設定 (修改題型、題數或模式)
          </button>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentIndex];

  // 3. ACTIVE QUIZ QUESTION SCREEN
  return (
    <div className="max-w-lg mx-auto px-4 py-4 sm:py-6 space-y-4">
      {/* Quiz Header: Level badge, Timer & Progress */}
      <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
        <div className="flex items-center gap-1.5">
          {currentQ.levelBadge && (
            <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-md font-bold">
              {currentQ.levelBadge}
            </span>
          )}
          <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-md text-slate-600 dark:text-slate-300 font-medium">
            {currentQ.categoryBadge || '日檢題目'}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {isTimedMode && (
            <div className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full font-mono font-bold text-xs ${
              timeRemaining < 60 ? 'bg-rose-100 text-rose-600 animate-pulse' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200'
            }`}>
              <Clock className="w-3.5 h-3.5" />
              <span>{formatTime(timeRemaining)}</span>
            </div>
          )}

          <span>
            {currentIndex + 1} / {questions.length}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
        <div
          className="bg-emerald-500 h-full rounded-full transition-all duration-300"
          style={{ width: `${Math.round(((currentIndex + 1) / questions.length) * 100)}%` }}
        />
      </div>

      {/* Question Card */}
      <div className="bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              {currentQ.categoryBadge || '測驗題目'}
            </span>
            <button
              onClick={handleSpeakQuestion}
              title="朗讀題目"
              className="text-slate-400 hover:text-emerald-500 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              <Volume2 className="w-4 h-4" />
            </button>
          </div>

          <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white leading-relaxed">
            {currentQ.prompt}
          </h3>

          {currentQ.subPrompt && (
            <p className="text-xs text-slate-400 dark:text-slate-500">
              {currentQ.subPrompt}
            </p>
          )}
        </div>

        {/* Options (4-choice with 2-step selection) */}
        <div className="grid grid-cols-1 gap-2.5 pt-2">
          {currentQ.options.map((option, idx) => {
            let optionStyles = 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 hover:border-emerald-300 dark:hover:border-emerald-700';

            if (isAnswered) {
              if (option.isCorrect) {
                optionStyles = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 font-bold';
              } else if (selectedOption === idx) {
                optionStyles = 'border-rose-500 bg-rose-50 dark:bg-rose-950/60 text-rose-900 dark:text-rose-200 font-bold';
              } else {
                optionStyles = 'border-slate-200 dark:border-slate-700 opacity-50';
              }
            } else {
              // Pre-answer selection highlight
              if (selectedOption === idx) {
                optionStyles = 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-200 font-bold ring-2 ring-emerald-400/30';
              }
            }

            return (
              <button
                key={idx}
                disabled={isAnswered}
                onClick={() => handleSelectOption(idx)}
                className={`w-full p-4 rounded-2xl border-2 text-left transition-all flex items-center justify-between gap-2 cursor-pointer ${optionStyles}`}
              >
                <div className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                    selectedOption === idx && !isAnswered
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300'
                  }`}>
                    {idx + 1}
                  </span>
                  <span className="text-base font-semibold">
                    {option.text}
                  </span>
                </div>

                {isAnswered ? (
                  <div>
                    {option.isCorrect ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    ) : selectedOption === idx ? (
                      <XCircle className="w-5 h-5 text-rose-500" />
                    ) : null}
                  </div>
                ) : selectedOption === idx ? (
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                ) : null}
              </button>
            );
          })}
        </div>

        {/* STEP 2: CONFIRMATION BUTTON (Appears when an option is selected but not yet answered) */}
        {!isAnswered && selectedOption !== null && (
          <div className="pt-2 animate-fadeIn">
            <button
              onClick={handleConfirmAnswer}
              className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-extrabold rounded-2xl shadow-lg shadow-emerald-500/20 text-base active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <CheckSquare className="w-5 h-5" />
              <span>確定送出答案</span>
            </button>
          </div>
        )}

        {/* Explanation Banner (Appears AFTER final confirmation) */}
        {isAnswered && (
          <div className="pt-2 animate-fadeIn space-y-3">
            <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-1.5 text-xs">
              <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>解題詳解與考點分析：</span>
              </div>
              <p className="text-slate-600 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                {currentQ.explanation}
              </p>
            </div>

            <button
              onClick={handleNext}
              className="w-full inline-flex items-center justify-center gap-2 py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-2xl shadow-md transition-all active:scale-95 cursor-pointer text-sm"
            >
              <span>{currentIndex + 1 < questions.length ? '下一題' : '查看測驗結果'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
