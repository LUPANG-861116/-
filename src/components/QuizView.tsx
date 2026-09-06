import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  Zap,
  FileCheck,
  Sparkles,
  Layers,
  HelpCircle,
  Headphones,
  Play
} from 'lucide-react';

interface QuizViewProps {
  currentLevel: JLPTLevel;
  onRefreshStats: () => void;
}

export type MainQuizMode = 'interactive' | 'exam';
export type QuizCategoryType = 'all' | 'reading' | 'meaning' | 'particle' | 'conjugation' | 'cloze';

interface BaseQuestion {
  type: 'listen_abc' | 'zh_to_ja' | 'ja_to_zh' | 'cloze' | 'reading' | 'meaning' | 'particle' | 'conjugation';
  word?: VocabWord;
  prompt: string;
  subPrompt?: string;
  levelBadge?: string;
  categoryBadge?: string;
  explanation: string;
  // For listen_abc mode
  audioCandidates?: {
    letter: 'A' | 'B' | 'C';
    word: VocabWord;
    isCorrect: boolean;
  }[];
  options: {
    id: string | number;
    text: string;
    subText?: string;
    isCorrect: boolean;
    isUnsure?: boolean;
    word?: VocabWord;
  }[];
}

export const QuizView: React.FC<QuizViewProps> = ({ currentLevel, onRefreshStats }) => {
  // Main mode: 'interactive' (多感官互動速刷) vs 'exam' (日檢全真筆試模擬考)
  const [mainMode, setMainMode] = useState<MainQuizMode>('interactive');
  const [selectedQuizLevel, setSelectedQuizLevel] = useState<JLPTLevel>(currentLevel === 'ALL' ? 'N5_N4' : currentLevel);
  const [selectedCategory, setSelectedCategory] = useState<QuizCategoryType>('all');
  const [questionCount, setQuestionCount] = useState<number>(15);
  const [isTimedMode, setIsTimedMode] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(15 * 45);

  // Playing states
  const [questions, setQuestions] = useState<BaseQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [activePlayingLetter, setActivePlayingLetter] = useState<'A' | 'B' | 'C' | null>(null);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [isSettingUp, setIsSettingUp] = useState(true);

  // Auto-advance timer ref
  const autoNextTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // Clean timer on unmount
  useEffect(() => {
    return () => {
      if (autoNextTimeoutRef.current) clearTimeout(autoNextTimeoutRef.current);
    };
  }, []);

  // When moving to next question, auto speak if it's ja_to_zh in interactive mode
  useEffect(() => {
    if (isSettingUp || isFinished || questions.length === 0) return;
    const currentQ = questions[currentIndex];
    if (!currentQ) return;

    if (currentQ.type === 'ja_to_zh' && currentQ.word) {
      speakJapanese(currentQ.word.reading);
    }
  }, [currentIndex, isSettingUp, isFinished, questions]);

  // -------------------------------------------------------------
  // GENERATE INTERACTIVE QUESTIONS (WordUp / Duolingo Reference Style)
  // -------------------------------------------------------------
  const generateInteractiveQuestions = (count: number): BaseQuestion[] => {
    const list: BaseQuestion[] = [];
    const shuffledPool = [...wordPool].sort(() => Math.random() - 0.5);
    const total = Math.min(count, shuffledPool.length);

    // Question types to rotate: 'listen_abc', 'zh_to_ja', 'ja_to_zh'
    const interactiveTypes: ('listen_abc' | 'zh_to_ja' | 'ja_to_zh')[] = ['listen_abc', 'zh_to_ja', 'ja_to_zh'];

    for (let i = 0; i < total; i++) {
      const targetWord = shuffledPool[i];
      const qType = interactiveTypes[i % interactiveTypes.length];

      // Get 2 wrong distractors with clean meanings
      const validDistractors = wordPool
        .filter(w => w.id !== targetWord.id && w.meaning && w.meaning.trim() !== targetWord.meaning.trim())
        .sort(() => Math.random() - 0.5);
      const wrong1 = validDistractors[0] || shuffledPool[(i + 1) % shuffledPool.length];
      const wrong2 = validDistractors[1] || shuffledPool[(i + 2) % shuffledPool.length];

      const cleanMeaning = (m: string) => m.split(/[、，；;/（(]/)[0].trim() || m;

      if (qType === 'listen_abc') {
        // --- 1. 聽力辨音三選一 (🔊 A / 🔊 B / 🔊 C) ---
        const candidates = [targetWord, wrong1, wrong2].sort(() => Math.random() - 0.5);
        const letters: ('A' | 'B' | 'C')[] = ['A', 'B', 'C'];
        const audioCandidates = candidates.map((w, idx) => ({
          letter: letters[idx],
          word: w,
          isCorrect: w.id === targetWord.id
        }));

        const options = audioCandidates.map(c => ({
          id: c.letter,
          text: `選項 ${c.letter}`,
          subText: `點擊上方 [ 🔊 ${c.letter} ] 試聽發音`,
          isCorrect: c.isCorrect,
          word: c.word
        }));

        list.push({
          type: 'listen_abc',
          word: targetWord,
          levelBadge: targetWord.level,
          categoryBadge: '🎧 聽力辨音三選一',
          prompt: cleanMeaning(targetWord.meaning),
          subPrompt: '請點擊上方按鈕試聽 A、B、C 發音，選出對應的日語讀音',
          audioCandidates,
          options,
          explanation: `【正解】${targetWord.word}（${targetWord.reading}）＝ ${targetWord.meaning}\n【例句】${targetWord.example}（${targetWord.exampleMeaning}）`
        });
      } else if (qType === 'zh_to_ja') {
        // --- 2. 看中文選日文單字 (中翻日主動回想) ---
        const candidates = [targetWord, wrong1, wrong2].sort(() => Math.random() - 0.5);
        const options = candidates.map((w, idx) => ({
          id: `opt_${idx}`,
          text: w.word,
          subText: w.reading !== w.word ? w.reading : undefined,
          isCorrect: w.id === targetWord.id,
          word: w
        }));

        list.push({
          type: 'zh_to_ja',
          word: targetWord,
          levelBadge: targetWord.level,
          categoryBadge: '🈳 看中文選日文',
          prompt: cleanMeaning(targetWord.meaning),
          subPrompt: '請選出正確的日文單字',
          options,
          explanation: `【正解】${targetWord.word}（${targetWord.reading}）＝ ${targetWord.meaning}\n【例句】${targetWord.example}（${targetWord.exampleMeaning}）`
        });
      } else {
        // --- 3. 看日文選中文意思 (日翻中聽辨理解) ---
        const candidates = [targetWord, wrong1, wrong2].sort(() => Math.random() - 0.5);
        const options = candidates.map((w, idx) => ({
          id: `opt_${idx}`,
          text: cleanMeaning(w.meaning),
          isCorrect: w.id === targetWord.id,
          word: w
        }));

        list.push({
          type: 'ja_to_zh',
          word: targetWord,
          levelBadge: targetWord.level,
          categoryBadge: '📖 看日文選中文',
          prompt: targetWord.word,
          subPrompt: targetWord.reading !== targetWord.word ? `（${targetWord.reading}）` : '請選出正確的中文意思',
          options,
          explanation: `【正解】${targetWord.word}（${targetWord.reading}）＝ ${targetWord.meaning}\n【例句】${targetWord.example}（${targetWord.exampleMeaning}）`
        });
      }
    }

    return list;
  };

  // -------------------------------------------------------------
  // GENERATE STANDARD JLPT EXAM QUESTIONS
  // -------------------------------------------------------------
  const generateExamQuestions = (count: number): BaseQuestion[] => {
    const generated: BaseQuestion[] = [];

    const makeWordQuestion = (targetWord: VocabWord, specificType?: 'cloze' | 'reading' | 'meaning'): BaseQuestion => {
      const types: ('cloze' | 'reading' | 'meaning')[] = ['cloze', 'reading', 'meaning'];
      const qType = specificType || types[Math.floor(Math.random() * types.length)];

      const validPool = wordPool.filter(w => w.id !== targetWord.id && w.meaning && w.meaning.trim().length > 0);
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
          { id: 0, text: targetWord.word, isCorrect: true, word: targetWord },
          ...allWrongs.map((w, i) => ({ id: i + 1, text: w.word, isCorrect: false, word: w }))
        ].sort(() => Math.random() - 0.5);

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
          { id: 0, text: targetWord.reading, isCorrect: true, word: targetWord },
          ...allWrongs.map((w, i) => ({ id: i + 1, text: w.reading, isCorrect: false, word: w }))
        ].sort(() => Math.random() - 0.5);

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
          { id: 0, text: cleanMeaning(targetWord.meaning), isCorrect: true, word: targetWord },
          ...allWrongs.map((w, i) => ({ id: i + 1, text: cleanMeaning(w.meaning), isCorrect: false, word: w }))
        ].sort(() => Math.random() - 0.5);

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

    const makeGrammarQuestion = (gItem: typeof allGrammarQuizData[0]): BaseQuestion => {
      const opts = gItem.options.map((optText, idx) => ({
        id: idx,
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
      const pool = grammarPool.filter(g => g.type === 'particle');
      const total = Math.min(count, pool.length);
      const shuffled = [...pool].sort(() => Math.random() - 0.5).slice(0, total);
      shuffled.forEach(g => generated.push(makeGrammarQuestion(g)));
    } else if (selectedCategory === 'conjugation') {
      const pool = grammarPool.filter(g => g.type === 'conjugation');
      const total = Math.min(count, pool.length);
      const shuffled = [...pool].sort(() => Math.random() - 0.5).slice(0, total);
      shuffled.forEach(g => generated.push(makeGrammarQuestion(g)));
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

    return generated;
  };

  // -------------------------------------------------------------
  // START QUIZ
  // -------------------------------------------------------------
  const startQuiz = (count: number = questionCount, timed: boolean = isTimedMode) => {
    setIsTimedMode(timed);
    if (autoNextTimeoutRef.current) clearTimeout(autoNextTimeoutRef.current);

    const generated = mainMode === 'interactive'
      ? generateInteractiveQuestions(count)
      : generateExamQuestions(count);

    setQuestions(generated);
    setCurrentIndex(0);
    setSelectedOptionId(null);
    setIsAnswered(false);
    setActivePlayingLetter(null);
    setScore(0);
    setIsFinished(false);
    setIsSettingUp(false);
    setTimeRemaining(Math.round(count * 45));
  };

  // -------------------------------------------------------------
  // PLAY AUDIO FOR A/B/C CANDIDATE
  // -------------------------------------------------------------
  const handlePlayCandidateAudio = (letter: 'A' | 'B' | 'C', word: VocabWord) => {
    setActivePlayingLetter(letter);
    speakJapanese(word.reading);
    setTimeout(() => {
      setActivePlayingLetter(null);
    }, 1200);
  };

  // -------------------------------------------------------------
  // HANDLE SELECT OPTION OR "我不確定"
  // -------------------------------------------------------------
  const handleAnswer = (optionId: string | number | 'unsure') => {
    if (isAnswered) return;
    setIsAnswered(true);
    setSelectedOptionId(optionId);

    const currentQ = questions[currentIndex];
    const isUnsure = optionId === 'unsure';
    const chosenOption = currentQ.options.find(o => o.id === optionId);
    const isCorrect = !isUnsure && !!chosenOption?.isCorrect;

    // Instant audio feedback
    if (currentQ.word) {
      if (isCorrect) {
        speakJapanese(currentQ.word.reading);
      } else if (chosenOption?.word) {
        speakJapanese(chosenOption.word.reading);
      }
    }

    // Update Score & SRS
    if (isCorrect) {
      setScore(prev => prev + 1);
      if (currentQ.word) updateWordSRS(currentQ.word.id, 'good');
    } else {
      // Wrong or unsure: mark as 'again' to save in Weakness zone
      if (currentQ.word) updateWordSRS(currentQ.word.id, 'again');
    }
    onRefreshStats();
  };

  // -------------------------------------------------------------
  // NEXT QUESTION
  // -------------------------------------------------------------
  const handleNext = () => {
    if (autoNextTimeoutRef.current) clearTimeout(autoNextTimeoutRef.current);
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex(prev => prev + 1);
      setSelectedOptionId(null);
      setIsAnswered(false);
      setActivePlayingLetter(null);
    } else {
      setIsFinished(true);
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // =============================================================
  // 1. SETUP SCREEN
  // =============================================================
  if (isSettingUp) {
    return (
      <div className="max-w-lg mx-auto px-4 py-6 sm:py-8 space-y-5 animate-fadeIn">
        {/* Title Banner */}
        <div className="text-center space-y-1.5">
          <div className="w-14 h-14 mx-auto rounded-3xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-500 flex items-center justify-center text-white text-2xl shadow-lg shadow-teal-500/20">
            <Zap className="w-7 h-7 fill-current" />
          </div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100">
            JLPT 互動測驗題庫
          </h2>
          <p className="text-xs text-slate-500">
            多感官互動速刷 • 聽力試聽辨音 • 日檢全真筆試模擬考
          </p>
        </div>

        {/* 1. Mode Switcher (Interactive vs Mock Exam) */}
        <div className="bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl grid grid-cols-2 gap-1.5 text-xs font-bold shadow-inner">
          <button
            onClick={() => setMainMode('interactive')}
            className={`py-3 px-3 rounded-xl transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
              mainMode === 'interactive'
                ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-300 shadow-md font-black'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <div className="flex items-center gap-1.5 text-sm">
              <Headphones className="w-4 h-4" />
              <span>🎮 多感官互動速刷</span>
            </div>
            <span className="text-[10px] opacity-80">聽力辨音 • 看中選日 • 即時反饋</span>
          </button>

          <button
            onClick={() => setMainMode('exam')}
            className={`py-3 px-3 rounded-xl transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
              mainMode === 'exam'
                ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-300 shadow-md font-black'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <div className="flex items-center gap-1.5 text-sm">
              <FileCheck className="w-4 h-4" />
              <span>📝 全真筆試模擬考</span>
            </div>
            <span className="text-[10px] opacity-80">讀音 • 字義 • 文法助詞 • 克漏字</span>
          </button>
        </div>

        {/* Interactive Mode Features Highlights */}
        {mainMode === 'interactive' && (
          <div className="bg-gradient-to-r from-teal-500/10 via-cyan-500/10 to-emerald-500/10 border border-teal-200 dark:border-teal-900/60 rounded-2xl p-4 text-xs space-y-2 text-slate-700 dark:text-slate-300">
            <div className="font-bold text-teal-900 dark:text-teal-200 flex items-center gap-1.5 text-xs">
              <Sparkles className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <span>影片同款 3 大核心速刷題型：</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center pt-1">
              <div className="bg-white/80 dark:bg-slate-800/80 p-2 rounded-xl border border-teal-100 dark:border-teal-900">
                <div className="font-bold text-[11px] text-teal-700 dark:text-teal-300">🔊 聽力辨音</div>
                <div className="text-[9px] text-slate-500 mt-0.5">A/B/C 試聽選字</div>
              </div>
              <div className="bg-white/80 dark:bg-slate-800/80 p-2 rounded-xl border border-cyan-100 dark:border-cyan-900">
                <div className="font-bold text-[11px] text-cyan-700 dark:text-cyan-300">🈳 看中選日</div>
                <div className="text-[9px] text-slate-500 mt-0.5">中翻日反向回想</div>
              </div>
              <div className="bg-white/80 dark:bg-slate-800/80 p-2 rounded-xl border border-emerald-100 dark:border-emerald-900">
                <div className="font-bold text-[11px] text-emerald-700 dark:text-emerald-300">📖 看日選中</div>
                <div className="text-[9px] text-slate-500 mt-0.5">日翻中聽辨理解</div>
              </div>
            </div>
            <div className="text-[10px] text-slate-500 pt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-teal-500" />
              <span>附帶「我不確定」免猜機制，不會自動編入弱點特訓！</span>
            </div>
          </div>
        )}

        {/* 2. Level Scope Selector */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-5 shadow-xs space-y-3">
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
                    ? 'bg-teal-500 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                {lvl.label}
              </button>
            ))}
          </div>
        </div>

        {/* 3. Category Filter Selector (Only for Exam Mode) */}
        {mainMode === 'exam' && (
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-400 block uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-emerald-500" />
                <span>測驗題型分類</span>
              </label>
              <span className="text-[10px] text-emerald-600 font-bold">日檢五大題型</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              {[
                { id: 'all', label: '綜合混合全真題', desc: '讀音/字義/助詞/活用' },
                { id: 'reading', label: '🔤 漢字讀音', desc: '文字・語彙 讀音選擇' },
                { id: 'meaning', label: '📖 單字字義', desc: '語彙・意味 中文理解' },
                { id: 'particle', label: '🧩 文法助詞填空', desc: 'に/で/を/が/へ/と' },
                { id: 'conjugation', label: '🔄 詞性與動詞活用', desc: '現在/過去/可能/受身' },
                { id: 'cloze', label: '📝 語境克漏字', desc: '文脈規定 句意填空' }
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
        )}

        {/* 4. Question Count Selector */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-5 shadow-xs space-y-3">
          <label className="text-xs font-bold text-slate-400 block uppercase tracking-wider">
            選擇本次題數
          </label>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { count: 10, label: '10 題', sub: '極速刷' },
              { count: 15, label: '15 題', sub: '標準日常', isRec: true },
              { count: 25, label: '25 題', sub: '深度強化' },
              { count: 40, label: '40 題', sub: '考前衝刺' }
            ].map(item => {
              const isSelected = questionCount === item.count;
              return (
                <button
                  key={item.count}
                  onClick={() => setQuestionCount(item.count)}
                  className={`p-3 rounded-2xl border-2 text-center transition-all cursor-pointer flex flex-col justify-between items-center relative ${
                    isSelected
                      ? 'border-teal-500 bg-teal-50/60 dark:bg-teal-950/40 shadow-xs'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                  }`}
                >
                  {item.isRec && (
                    <span className="absolute -top-2 right-2 px-1.5 py-0.2 bg-rose-500 text-white rounded-full text-[9px] font-black">
                      推薦
                    </span>
                  )}
                  <div className="font-black text-sm text-slate-800 dark:text-slate-100">
                    {item.label}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {item.sub}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Timed Mode Toggle (Exam Mode) */}
          {mainMode === 'exam' && (
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
                className="w-4 h-4 text-teal-600 rounded cursor-pointer"
              />
            </div>
          )}
        </div>

        {/* Start Button */}
        <button
          onClick={() => startQuiz(questionCount, isTimedMode)}
          className="w-full py-4 bg-gradient-to-r from-teal-500 via-teal-600 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white font-extrabold rounded-2xl shadow-lg shadow-teal-500/25 text-base active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
        >
          <Play className="w-4 h-4 fill-current" />
          <span>開始{mainMode === 'interactive' ? '互動速刷' : '筆試測驗'} ({questionCount} 題)</span>
        </button>
      </div>
    );
  }

  // =============================================================
  // 2. QUIZ FINISHED SCREEN
  // =============================================================
  if (isFinished) {
    const accuracy = Math.round((score / questions.length) * 100);
    const isPassed = accuracy >= 60;

    return (
      <div className="max-w-md mx-auto px-4 py-10 text-center space-y-6 animate-scaleUp">
        <div className={`w-20 h-20 mx-auto rounded-3xl flex items-center justify-center text-white text-3xl font-black shadow-lg ${
          isPassed ? 'bg-gradient-to-tr from-teal-400 to-emerald-600' : 'bg-gradient-to-tr from-amber-500 to-rose-500'
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
          <p className="text-sm font-bold text-teal-600 dark:text-teal-400">
            答對率 {accuracy}%
          </p>
          <p className="text-xs text-slate-400">
            答對與不熟單字均已自動記錄至 SRS 間隔記憶與特訓專區中！
          </p>
        </div>

        <div className="pt-2 flex flex-col gap-2.5">
          <button
            onClick={() => startQuiz(questionCount, isTimedMode)}
            className="w-full inline-flex items-center justify-center gap-2 py-3.5 bg-teal-500 hover:bg-teal-600 text-white font-bold rounded-2xl shadow-md active:scale-95 transition-all cursor-pointer text-sm"
          >
            <RefreshCw className="w-4 h-4" />
            <span>換一組題目再刷一次 ({questionCount} 題)</span>
          </button>

          <button
            onClick={() => setIsSettingUp(true)}
            className="w-full py-3 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 font-bold rounded-2xl text-xs sm:text-sm transition-all cursor-pointer"
          >
            返回測驗設定
          </button>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentIndex];

  // =============================================================
  // 3. ACTIVE QUIZ PLAYING SCREEN
  // =============================================================
  return (
    <div className="max-w-lg mx-auto px-4 py-4 sm:py-6 space-y-4 animate-fadeIn">
      {/* Quiz Top Bar: Level, Mode, Progress */}
      <div className="flex items-center justify-between text-xs font-bold text-slate-500">
        <div className="flex items-center gap-1.5">
          {currentQ.levelBadge && (
            <span className="px-2 py-0.5 bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 rounded-md font-extrabold">
              {currentQ.levelBadge}
            </span>
          )}
          <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-md text-slate-600 dark:text-slate-300">
            {currentQ.categoryBadge || '測驗題目'}
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

          <span className="text-teal-600 dark:text-teal-400 font-black">
            {currentIndex + 1} <span className="text-slate-400 font-normal">/ {questions.length}</span>
          </span>
        </div>
      </div>

      {/* Thin Mint-Green Progress Bar (Video Reference Style) */}
      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
        <div
          className="bg-gradient-to-r from-teal-400 to-cyan-500 h-full rounded-full transition-all duration-300"
          style={{ width: `${Math.round(((currentIndex + 1) / questions.length) * 100)}%` }}
        />
      </div>

      {/* Main Question Card (Video Reference UI) */}
      <div className="bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-3xl p-6 shadow-sm space-y-5 text-center relative">
        {/* Main Prompt */}
        <div className="space-y-1.5 pt-2">
          {/* Audio button for ja_to_zh */}
          {currentQ.type === 'ja_to_zh' && currentQ.word && (
            <div className="flex items-center justify-center gap-2">
              <h3 className="text-3xl font-black text-teal-600 dark:text-teal-400 tracking-wide">
                {currentQ.prompt}
              </h3>
              <button
                onClick={() => speakJapanese(currentQ.word!.reading)}
                className="w-9 h-9 rounded-full bg-amber-100 hover:bg-amber-200 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-95"
                title="播放真人發音"
              >
                <Volume2 className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Normal prompt for other types */}
          {currentQ.type !== 'ja_to_zh' && (
            <h3 className="text-3xl font-black text-teal-600 dark:text-teal-400 tracking-wide">
              {currentQ.prompt}
            </h3>
          )}

          {/* SubPrompt or Answer reveal in listen_abc */}
          {isAnswered && currentQ.type === 'listen_abc' && currentQ.word ? (
            <div className="animate-fadeIn">
              <span className="text-base font-bold text-slate-800 dark:text-slate-100">
                {currentQ.word.word}
              </span>
              <span className="text-xs text-slate-500 ml-1.5 font-medium">
                （{currentQ.word.reading}）
              </span>
            </div>
          ) : currentQ.subPrompt ? (
            <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
              {currentQ.subPrompt}
            </p>
          ) : null}
        </div>

        {/* ------------------------------------------------------------- */}
        {/* SPECIAL TYPE: LISTEN A / B / C AUDIO BUTTONS (Video Highlight) */}
        {/* ------------------------------------------------------------- */}
        {currentQ.type === 'listen_abc' && currentQ.audioCandidates && (
          <div className="grid grid-cols-3 gap-3 pt-2 pb-1 max-w-xs mx-auto">
            {currentQ.audioCandidates.map((candidate) => {
              const isPlaying = activePlayingLetter === candidate.letter;

              return (
                <button
                  key={candidate.letter}
                  onClick={() => handlePlayCandidateAudio(candidate.letter, candidate.word)}
                  className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all cursor-pointer active:scale-95 ${
                    isPlaying
                      ? 'border-amber-400 bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 shadow-md scale-105'
                      : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 hover:border-teal-400 text-slate-700 dark:text-slate-200'
                  }`}
                >
                  <Volume2 className={`w-6 h-6 mb-1 ${isPlaying ? 'text-amber-600 animate-bounce' : 'text-teal-500'}`} />
                  <span className="font-black text-sm">{candidate.letter}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Options List */}
        <div className="space-y-2.5 pt-1">
          {currentQ.options.map((option) => {
            let style = 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-teal-400 text-slate-800 dark:text-slate-100';

            if (isAnswered) {
              if (option.isCorrect) {
                // Correct: vibrant cyan/teal green checkmark (Video match)
                style = 'border-teal-500 bg-teal-500 text-white font-black shadow-md shadow-teal-500/25 ring-2 ring-teal-400';
              } else if (selectedOptionId === option.id) {
                // Wrong chosen
                style = 'border-rose-500 bg-rose-500 text-white font-bold shadow-md shadow-rose-500/25';
              } else {
                style = 'border-slate-200 dark:border-slate-700 opacity-40';
              }
            }

            return (
              <button
                key={option.id}
                disabled={isAnswered}
                onClick={() => handleAnswer(option.id)}
                className={`w-full py-4 px-5 rounded-2xl border-2 font-bold text-base transition-all flex items-center justify-between cursor-pointer ${style}`}
              >
                <div className="flex items-center gap-2">
                  <span>{option.text}</span>
                  {option.subText && !isAnswered && (
                    <span className="text-xs opacity-75 font-normal">（{option.subText}）</span>
                  )}
                </div>

                {isAnswered && (
                  <div>
                    {option.isCorrect ? (
                      <CheckCircle2 className="w-5 h-5 text-white" />
                    ) : selectedOptionId === option.id ? (
                      <XCircle className="w-5 h-5 text-white" />
                    ) : null}
                  </div>
                )}
              </button>
            );
          })}

          {/* BOTTOM: 「我不確定」 BUTTON (Video Match) */}
          {!isAnswered && (
            <button
              onClick={() => handleAnswer('unsure')}
              className="w-full py-3.5 px-4 rounded-2xl border-2 border-amber-300 dark:border-amber-700/80 bg-amber-50/50 dark:bg-amber-950/30 hover:bg-amber-100 text-amber-800 dark:text-amber-200 text-sm font-bold transition-all cursor-pointer shadow-xs active:scale-98 flex items-center justify-center gap-1.5"
            >
              <HelpCircle className="w-4 h-4 text-amber-500" />
              <span>我不確定（直接看正解並加入特訓）</span>
            </button>
          )}
        </div>

        {/* Post-Answer Card & Next Button */}
        {isAnswered && (
          <div className="pt-2 space-y-3 animate-fadeIn text-left">
            <div className="p-4 bg-slate-50 dark:bg-slate-900/80 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-1.5 text-xs">
              <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-teal-500" />
                <span>解析與例句說明：</span>
              </div>
              <p className="text-slate-600 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                {currentQ.explanation}
              </p>
            </div>

            <button
              onClick={handleNext}
              className="w-full inline-flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white font-black rounded-2xl shadow-lg shadow-teal-500/25 transition-all active:scale-95 cursor-pointer text-sm"
            >
              <span>{currentIndex + 1 < questions.length ? '下一題' : '查看測驗成績'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
