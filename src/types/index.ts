export type JLPTLevel = 'N5' | 'N4' | 'N3' | 'N2' | 'N1' | 'N5_N4' | 'N5_N2' | 'N5_N1' | 'ALL';

export type PartOfSpeech =
  | '動詞'
  | 'い形容詞'
  | 'な形容詞'
  | '名詞'
  | '副詞'
  | '助詞'
  | '連體詞'
  | '感動詞'
  | '連接詞'
  | '句型片語'
  | '其他';

export interface VocabWord {
  id: string;
  word: string;             // 漢字或原字 (如: 食べる)
  reading: string;          // 平假名 (如: たべる)
  romaji: string;           // 羅馬拼音 (如: taberu)
  partOfSpeech: PartOfSpeech; // 詞性
  meaning: string;          // 繁體中文釋義 (如: 吃、食用)
  level: 'N5' | 'N4' | 'N3' | 'N2' | 'N1';      // JLPT 等級
  example: string;          // 日文例句
  exampleReading?: string;  // 例句假名
  exampleMeaning: string;   // 例句繁體中文翻譯
  isCustomized?: boolean;   // 是否由使用者手動自訂修改過
}

export interface CustomWordOverride {
  meaning?: string;
  example?: string;
  exampleMeaning?: string;
  updatedAt?: string;
}

export type MasteryState = 'new' | 'learning' | 'review' | 'mastered';

export interface WordSRSData {
  wordId: string;
  reps: number;             // 連續答對次數
  interval: number;         // 下次複習間隔 (天數, 0 表示當天)
  easeFactor: number;       // 難度係數 (預設 2.5)
  lastReviewDate: string | null; // YYYY-MM-DD
  nextReviewDate: string | null; // YYYY-MM-DD
  wrongCount: number;       // 累計答錯次數
  correctCount: number;     // 累計答對次數
  isTrouble?: boolean;      // 目前是否處於不熟/待特訓狀態 (答錯進入，特訓答對後移除)
  state: MasteryState;      // 狀態
}

export interface UserStats {
  totalLearned: number;
  totalMastered: number;
  todayReviewedCount: number;
  streakDays: number;
  lastActiveDate: string;
  accuracyRate: number;
}

export type AppView = 'study' | 'review' | 'quiz' | 'reading' | 'phrases' | 'dictionary' | 'stats';

export type RatingGrade = 'again' | 'hard' | 'good' | 'easy';

// 閱讀測驗題型結構
export interface ReadingQuestion {
  id: string;
  question: string;         // 日文題目
  questionZh: string;       // 中文題目翻譯
  options: string[];        // 4 個選項 (日文)
  optionsZh?: string[];     // 選項中文翻譯
  correctAnswer: number;    // 正確選項 index (0 ~ 3)
  explanationZh: string;    // 詳細解析說明
}

export interface ReadingArticle {
  id: string;
  level: 'N5' | 'N4' | 'N3' | 'N2' | 'N1';
  dayIndex: number;         // 第幾天 / 第幾篇 (如 Day 1)
  title: string;            // 日文標題
  titleZh: string;          // 中文標題
  category: string;         // 分類 (生活短文、時事新聞、公告指示等)
  content: string;          // 日文原文段落
  contentZh: string;        // 繁體中文全篇翻譯
  keyVocab: { word: string; reading: string; meaning: string }[]; // 重點單字註解
  questions: ReadingQuestion[]; // 閱讀測驗題目 (3 題)
}
