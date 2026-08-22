// 考前智慧排程規劃模組 (JLPT 2026 倒數排程引擎)

// 2026 年下半年 JLPT 考試預計於 2026 年 12 月 6 日（第一個週日）
// 考前一週衝刺目標日：2026 年 11 月 29 日
export const TARGET_EXAM_DATE_STRING = '2026-11-29';

export interface ExamScheduleInfo {
  targetDate: string;
  daysLeft: number;
  totalWords: number;
  unlearnedWords: number;
  masteredWords: number;
  dailyQuota: number;        // 今日動態建議單次背誦量 (最低 10 字)
  suggestedPaceText: string;
}

/**
 * 計算距離 2026 年下半年 JLPT 考前一週的剩餘天數
 */
export const getDaysUntilTarget = (targetDateStr: string = TARGET_EXAM_DATE_STRING): number => {
  const target = new Date(targetDateStr + 'T00:00:00');
  const now = new Date();
  const diffTime = target.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(1, diffDays);
};

/**
 * 依據剩餘未學單字與剩餘天數，動態計算每次學習批次大小（最低 10 字）
 */
export const calculateDynamicBatchSize = (
  unlearnedCount: number,
  daysLeft: number = getDaysUntilTarget()
): number => {
  if (unlearnedCount <= 0) return 10;
  const calculated = Math.ceil(unlearnedCount / Math.max(1, daysLeft));
  return Math.max(10, calculated);
};

/**
 * 取得完整的排程進度分析數據
 */
export const getExamScheduleInfo = (
  totalWordsCount: number,
  unlearnedCount: number,
  masteredCount: number
): ExamScheduleInfo => {
  const daysLeft = getDaysUntilTarget();
  const dailyQuota = calculateDynamicBatchSize(unlearnedCount, daysLeft);

  let paceText = `距離 2026 下半年 JLPT 考前衝刺期剩餘 ${daysLeft} 天`;
  if (daysLeft <= 30) {
    paceText = `⚠️ 進入考前最後 ${daysLeft} 天衝刺階段！每次建議背 ${dailyQuota} 字`;
  }

  return {
    targetDate: TARGET_EXAM_DATE_STRING,
    daysLeft,
    totalWords: totalWordsCount,
    unlearnedWords: unlearnedCount,
    masteredWords: masteredCount,
    dailyQuota,
    suggestedPaceText: paceText
  };
};
