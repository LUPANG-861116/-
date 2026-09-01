import type { WordSRSData, VocabWord, MasteryState, RatingGrade, UserStats, CustomWordOverride } from '../types';

const STORAGE_KEY = 'nihongo_srs_records_v2';
const STATS_KEY = 'nihongo_srs_user_stats_v2';

export const getTodayString = (): string => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const addDays = (dateStr: string, days: number): string => {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + days);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getAllSRSData = (): Record<string, WordSRSData> => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load SRS data from localStorage', e);
    return {};
  }
};

export const saveAllSRSData = (data: Record<string, WordSRSData>): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save SRS data to localStorage', e);
  }
};

export const getSRSDataForWord = (wordId: string): WordSRSData => {
  const all = getAllSRSData();
  if (all[wordId]) return all[wordId];

  return {
    wordId,
    reps: 0,
    interval: 0,
    easeFactor: 2.5,
    lastReviewDate: null,
    nextReviewDate: null,
    wrongCount: 0,
    correctCount: 0,
    state: 'new'
  };
};

/**
 * 處理單字複習反饋 (SM-2 演算法精簡版)
 * grade: 'again' (不會 / 忘記) | 'hard' (有點難) | 'good' (會 / 記住了) | 'easy' (太簡單)
 */
export const updateWordSRS = (wordId: string, grade: RatingGrade): WordSRSData => {
  const current = getSRSDataForWord(wordId);
  const today = getTodayString();

  let reps = current.reps;
  let interval = current.interval;
  let easeFactor = current.easeFactor;
  let wrongCount = current.wrongCount;
  let correctCount = current.correctCount;
  let state: MasteryState = current.state;

  let isTrouble = current.isTrouble || false;

  if (grade === 'again') {
    // 忘記 / 不會：重設間隔為 0 天，標記為不熟待特訓
    reps = 0;
    interval = 0;
    easeFactor = Math.max(1.3, easeFactor - 0.2);
    wrongCount += 1;
    isTrouble = true; // 進入特訓專區
    state = 'learning';
  } else if (grade === 'hard') {
    // 猶豫 / 有點難：間隔 1 天
    reps = Math.max(1, reps);
    interval = 1;
    easeFactor = Math.max(1.3, easeFactor - 0.15);
    correctCount += 1;
    isTrouble = true; // 仍然感覺困難，保留在特訓專區
    state = 'learning';
  } else if (grade === 'good') {
    // 會 / 正常：標準間隔遞增，從特訓專區畢業移除
    correctCount += 1;
    isTrouble = false; // 答對畢業，移出特訓專區
    if (reps === 0) {
      interval = 1;
      state = 'learning';
    } else if (reps === 1) {
      interval = 3;
      state = 'review';
    } else if (reps === 2) {
      interval = 7;
      state = 'review';
    } else {
      interval = Math.round(interval * easeFactor);
      state = reps >= 4 ? 'mastered' : 'review';
    }
    reps += 1;
  } else if (grade === 'easy') {
    // 超簡單：跳躍式拉長間隔，從特訓專區畢業移除
    correctCount += 1;
    isTrouble = false; // 答對畢業，移出特訓專區
    easeFactor = Math.min(3.0, easeFactor + 0.15);
    if (reps === 0) {
      interval = 4;
    } else {
      interval = Math.round(interval * easeFactor * 1.3) + 2;
    }
    reps += 2;
    state = reps >= 3 ? 'mastered' : 'review';
  }

  const nextReviewDate = interval === 0 ? today : addDays(today, interval);

  const updated: WordSRSData = {
    wordId,
    reps,
    interval,
    easeFactor,
    lastReviewDate: today,
    nextReviewDate,
    wrongCount,
    correctCount,
    isTrouble,
    state
  };

  const all = getAllSRSData();
  all[wordId] = updated;
  saveAllSRSData(all);

  updateDailyStats(grade !== 'again');

  return updated;
};

export const updateDailyStats = (isCorrect: boolean): void => {
  try {
    const today = getTodayString();
    const raw = localStorage.getItem(STATS_KEY);
    let stats = raw ? JSON.parse(raw) : null;

    if (!stats || typeof stats !== 'object') {
      stats = {
        totalReviews: 0,
        correctReviews: 0,
        todayReviews: {},
        lastActiveDate: today,
        streakDays: 1
      };
    }

    // 計算打卡天數
    if (stats.lastActiveDate !== today) {
      const yesterday = addDays(today, -1);
      if (stats.lastActiveDate === yesterday) {
        stats.streakDays = (stats.streakDays || 1) + 1;
      } else {
        stats.streakDays = 1;
      }
      stats.lastActiveDate = today;
    }

    stats.totalReviews = (stats.totalReviews || 0) + 1;
    if (isCorrect) {
      stats.correctReviews = (stats.correctReviews || 0) + 1;
    }

    if (!stats.todayReviews) stats.todayReviews = {};
    stats.todayReviews[today] = (stats.todayReviews[today] || 0) + 1;

    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch (e) {
    console.error('Failed to update stats', e);
  }
};

export const getUserStats = (): UserStats => {
  const allSRS = getAllSRSData();
  const today = getTodayString();

  let totalLearned = 0;
  let totalMastered = 0;
  let totalCorrect = 0;
  let totalWrong = 0;

  Object.values(allSRS).forEach(data => {
    if (data.reps > 0 || data.lastReviewDate) {
      totalLearned += 1;
    }
    if (data.state === 'mastered') {
      totalMastered += 1;
    }
    totalCorrect += data.correctCount || 0;
    totalWrong += data.wrongCount || 0;
  });

  const totalAttempts = totalCorrect + totalWrong;
  const accuracyRate = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 100;

  let streakDays = 1;
  let todayReviewedCount = 0;

  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (raw) {
      const stats = JSON.parse(raw);
      streakDays = stats.streakDays || 1;
      todayReviewedCount = stats.todayReviews?.[today] || 0;
    }
  } catch (e) {}

  return {
    totalLearned,
    totalMastered,
    todayReviewedCount,
    streakDays,
    lastActiveDate: today,
    accuracyRate
  };
};

/**
 * 獲取待複習佇列
 */
export const getReviewQueue = (words: VocabWord[]): VocabWord[] => {
  const today = getTodayString();
  const allSRS = getAllSRSData();

  return words.filter(word => {
    const srs = allSRS[word.id];
    if (!srs || !srs.nextReviewDate) return false;
    return srs.nextReviewDate <= today;
  });
};

/**
 * 獲取錯題/需要加強的單字
 */
export const getHardWords = (words: VocabWord[]): VocabWord[] => {
  const allSRS = getAllSRSData();
  return words.filter(word => {
    const srs = allSRS[word.id];
    return srs && (srs.wrongCount > 0 || srs.easeFactor < 2.1);
  });
};

/**
 * 自訂單字釋義與例句覆寫 (Custom Word Overrides)
 */
const CUSTOM_OVERRIDES_KEY = 'nihongo_custom_word_overrides_v1';

export const getCustomWordOverrides = (): Record<string, CustomWordOverride> => {
  try {
    const raw = localStorage.getItem(CUSTOM_OVERRIDES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    console.error('Failed to load custom word overrides', e);
    return {};
  }
};

export const saveCustomWordOverride = (
  wordId: string,
  override: Partial<CustomWordOverride>
): void => {
  try {
    const all = getCustomWordOverrides();
    const existing = all[wordId] || {};
    all[wordId] = {
      ...existing,
      ...override,
      updatedAt: new Date().toISOString()
    };
    localStorage.setItem(CUSTOM_OVERRIDES_KEY, JSON.stringify(all));
  } catch (e) {
    console.error('Failed to save custom word override', e);
  }
};

export const removeCustomWordOverride = (wordId: string): void => {
  try {
    const all = getCustomWordOverrides();
    if (all[wordId]) {
      delete all[wordId];
      localStorage.setItem(CUSTOM_OVERRIDES_KEY, JSON.stringify(all));
    }
  } catch (e) {
    console.error('Failed to remove custom word override', e);
  }
};

export const getAppliedWord = <T extends VocabWord>(word: T): T => {
  if (!word) return word;
  const all = getCustomWordOverrides();
  const custom = all[word.id];
  if (!custom) return word;
  return {
    ...word,
    meaning: custom.meaning !== undefined && custom.meaning.trim() !== '' ? custom.meaning : word.meaning,
    example: custom.example !== undefined && custom.example.trim() !== '' ? custom.example : word.example,
    exampleMeaning: custom.exampleMeaning !== undefined && custom.exampleMeaning.trim() !== '' ? custom.exampleMeaning : word.exampleMeaning,
    isCustomized: true
  };
};

/**
 * 匯出備份資料 (包含 SRS 學習進度、統計數據、星號收藏、以及自訂單字釋義)
 */
export const exportDataJSON = (): string => {
  const srsData = getAllSRSData();
  const stats = localStorage.getItem(STATS_KEY);
  const favorites = getFavorites();
  const customOverrides = getCustomWordOverrides();
  return JSON.stringify({
    version: 2,
    exportedAt: new Date().toISOString(),
    srsData,
    stats: stats ? JSON.parse(stats) : null,
    favorites,
    customOverrides
  }, null, 2);
};

/**
 * 匯入還原資料
 */
export const importDataJSON = (jsonStr: string): boolean => {
  try {
    const parsed = JSON.parse(jsonStr);
    if (parsed.srsData) {
      saveAllSRSData(parsed.srsData);
    }
    if (parsed.stats) {
      localStorage.setItem(STATS_KEY, JSON.stringify(parsed.stats));
    }
    if (parsed.favorites && Array.isArray(parsed.favorites)) {
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(parsed.favorites));
    }
    if (parsed.customOverrides && typeof parsed.customOverrides === 'object') {
      localStorage.setItem(CUSTOM_OVERRIDES_KEY, JSON.stringify(parsed.customOverrides));
    }
    return true;
  } catch (e) {
    console.error('Import failed', e);
    return false;
  }
};

/**
 * 徹底重設所有使用者資料 (包含 SRS 紀錄、統計、收藏星星、閱讀進度、自訂單字釋義)
 */
export const resetAllUserData = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STATS_KEY);
    localStorage.removeItem(FAVORITES_KEY);
    localStorage.removeItem(CUSTOM_OVERRIDES_KEY);
    localStorage.removeItem('nihongo_reading_progress_v1');
    localStorage.removeItem('nihongo_srs_records_v2');
    localStorage.removeItem('nihongo_srs_user_stats_v2');
    localStorage.removeItem('nihongo_favorites_v1');
  } catch (e) {
    console.error(e);
  }
};

/**
 * 預測不同反饋選項下的下次出現間隔（精簡格式：<1d, 1d, 3d, 7d, 14d...）
 */
export const predictNextInterval = (
  srsData: WordSRSData,
  grade: RatingGrade
): { days: number; tag: string } => {
  if (grade === 'again') {
    return { days: 0, tag: '<1d' };
  } else if (grade === 'hard') {
    return { days: 1, tag: '1d' };
  } else if (grade === 'good') {
    const reps = srsData.reps || 0;
    let nextDays = 1;
    if (reps === 0) nextDays = 1;
    else if (reps === 1) nextDays = 3;
    else if (reps === 2) nextDays = 7;
    else if (reps === 3) nextDays = 14;
    else nextDays = Math.round((srsData.interval || 14) * (srsData.easeFactor || 2.5));
    return { days: nextDays, tag: `${nextDays}d` };
  } else if (grade === 'easy') {
    const reps = srsData.reps || 0;
    let nextDays = 4;
    if (reps === 0) nextDays = 4;
    else if (reps === 1) nextDays = 7;
    else if (reps === 2) nextDays = 15;
    else {
      nextDays = Math.round(((srsData.interval || 2) * (srsData.easeFactor || 2.5) * 1.3) + 2);
    }
    return { days: nextDays, tag: `${nextDays}d` };
  }
  return { days: 1, tag: '1d' };
};

const FAVORITES_KEY = 'nihongo_favorites_v1';

export const getFavorites = (): string[] => {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error(e);
    return [];
  }
};

export const isFavorite = (wordId: string): boolean => {
  const favs = getFavorites();
  return favs.includes(wordId);
};

export const toggleFavorite = (wordId: string): boolean => {
  const favs = getFavorites();
  let updated: string[];
  let isFav = false;
  if (favs.includes(wordId)) {
    updated = favs.filter(id => id !== wordId);
    isFav = false;
  } else {
    updated = [...favs, wordId];
    isFav = true;
  }
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
  return isFav;
};

/**
 * 獲取所有「不熟單字」（包含手動收藏星號單字 + 目前待特訓單字）
 * 機制：答錯進入特訓專區；特訓答對後畢業移除；下次若再答錯則再次自動進入！
 */
export const getUnfamiliarWords = (words: VocabWord[]): VocabWord[] => {
  const favs = getFavorites();
  const allSRS = getAllSRSData();

  return words.filter(word => {
    // 1. 手動星號收藏一律列入
    if (favs.includes(word.id)) return true;
    const srs = allSRS[word.id];
    if (!srs) return false;
    // 2. 處於待特訓狀態 (答錯進入，特訓答對後畢業移出)
    return srs.isTrouble === true || (srs.wrongCount > 0 && srs.reps === 0);
  });
};



