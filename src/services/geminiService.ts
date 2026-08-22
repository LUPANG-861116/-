import type { JLPTLevel, ReadingArticle } from '../types';

const API_KEY_STORAGE = 'nihongo_gemini_api_key';
const DAILY_CACHE_PREFIX = 'nihongo_daily_reading_ai_';
const ARCHIVE_STORAGE_KEY = 'nihongo_reading_archive_v1';

export const getStoredApiKey = (): string => {
  return localStorage.getItem(API_KEY_STORAGE) || '';
};

export const saveStoredApiKey = (key: string): void => {
  localStorage.setItem(API_KEY_STORAGE, key.trim());
};

export const removeStoredApiKey = (): void => {
  localStorage.removeItem(API_KEY_STORAGE);
};

export const getTodayDateKey = (): string => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * 取得今日已快取的 AI 生成篇章
 */
export const getCachedDailyArticles = (level: JLPTLevel): ReadingArticle[] | null => {
  const todayKey = getTodayDateKey();
  const key = `${DAILY_CACHE_PREFIX}${level}_${todayKey}`;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : null;
  } catch {
    return null;
  }
};

/**
 * 儲存今日生成的篇章至當日快取（不自動存入歷史庫，僅完成測驗者才歸檔）
 */
export const saveDailyArticlesToCache = (level: JLPTLevel, articles: ReadingArticle[]): void => {
  const todayKey = getTodayDateKey();
  const key = `${DAILY_CACHE_PREFIX}${level}_${todayKey}`;
  try {
    localStorage.setItem(key, JSON.stringify(articles));
  } catch (e) {
    console.error('Failed to cache daily articles', e);
  }
};

/**
 * 僅在使用者「完成測驗」時，將該篇章永久存入已完成歷史存檔庫
 */
export const archiveCompletedArticle = (article: ReadingArticle): void => {
  try {
    const rawArchive = localStorage.getItem(ARCHIVE_STORAGE_KEY);
    let archive: ReadingArticle[] = rawArchive ? JSON.parse(rawArchive) : [];
    
    // 避免重複加入
    if (!archive.some(a => a.id === article.id)) {
      archive.unshift(article);
    }

    // 保留最多最近 300 篇已完成存檔
    if (archive.length > 300) {
      archive = archive.slice(0, 300);
    }
    localStorage.setItem(ARCHIVE_STORAGE_KEY, JSON.stringify(archive));
  } catch (e) {
    console.error('Failed to archive completed article', e);
  }
};

/**
 * 取得已完成測驗的歷史篇章庫
 */
export const getArchivedArticles = (level?: JLPTLevel): ReadingArticle[] => {
  try {
    const rawArchive = localStorage.getItem(ARCHIVE_STORAGE_KEY);
    if (!rawArchive) return [];
    const all: ReadingArticle[] = JSON.parse(rawArchive);
    if (!level || level === 'ALL') return all;
    return all.filter(a => a.level === level);
  } catch {
    return [];
  }
};

/**
 * 連網呼叫 Google Gemini API 即時生成全新 3 篇日檢閱讀測驗
 */
export const generateDailyReadingWithGemini = async (
  level: JLPTLevel,
  apiKeyParam?: string
): Promise<ReadingArticle[]> => {
  const apiKey = apiKeyParam || getStoredApiKey();
  if (!apiKey) {
    throw new Error('未提供 Google Gemini API Key，請先輸入 API Key 以便每日連網出題。');
  }

  const actualLevel = level === 'ALL' ? 'N3' : level;
  const todayKey = getTodayDateKey();

  const levelInstructions: Record<string, string> = {
    N5: '適合 JLPT N5 初學者，語法限於「です/ます」、基礎助詞（は、が、を、に、で、へ、と）、簡單生活主題（家庭、日常生活、購物、學校、朋友聚會），漢字需少並簡單，長度約 150~220 字。',
    N4: '適合 JLPT N4 程度，包含授受動詞（あげる/もらう/くれる）、條件形（たら/ば/と）、命令禁止、經驗談、日常生活規則、郵件通知，長度約 250~350 字。',
    N3: '適合 JLPT N3 中級程度，涵蓋社會文化、生活觀察、工作職場、科技環保、書信公文，包含中級文法（わけ、はず、わりに、に違いない等），長度約 380~500 字。',
    N2: '適合 JLPT N2 中高級，涵蓋社論評論、現代科技、商業經濟、文化隨筆、社會問題等，論理清晰、句型豐富（にほかならない、をめぐって、ものがある等），長度約 500~650 字。',
    N1: '適合 JLPT N1 高級，涵蓋哲學思辨、生命倫理、認知科學、文藝批評、歷史與社會深度評論，用詞洗練典雅，包含高級文法與抽象思維，長度約 600~800 字。'
  };

  const instruction = levelInstructions[actualLevel] || levelInstructions.N3;

  const prompt = `你是一位資深的日本日本語能力試驗（JLPT）官方首席命題專家。
請為 JLPT 【${actualLevel}】 級別，生成【3 篇】全新且完全原創的日語閱讀測驗文章。

難度規範：
${instruction}

每篇文章必須嚴格遵循以下 JSON 結構規範，並回傳一個 JSON 陣列：
[
  {
    "id": "ai_${todayKey}_${actualLevel}_1",
    "level": "${actualLevel}",
    "dayIndex": 1,
    "title": "日文標題（如：日本の伝統建築と知恵）",
    "titleZh": "繁體中文標題翻譯（如：日本傳統建築與智慧）",
    "category": "文章分類（如：生活短文、公告指示、書信電郵、說明敘述、文化隨筆、評論見解）",
    "content": "日文原文全文（符合 ${actualLevel} 等級難度與長度）",
    "contentZh": "優質流暢的【繁體中文】全篇對照翻譯",
    "keyVocab": [
      { "word": "漢字或詞彙", "reading": "平假名讀音", "meaning": "繁體中文解釋" },
      { "word": "單字2", "reading": "讀音2", "meaning": "繁中解釋2" },
      { "word": "單字3", "reading": "讀音3", "meaning": "繁中解釋3" },
      { "word": "單字4", "reading": "讀音4", "meaning": "繁中解釋4" }
    ],
    "questions": [
      {
        "id": "q_${todayKey}_${actualLevel}_1_1",
        "question": "日文測驗題目 1",
        "questionZh": "繁體中文題目翻譯 1",
        "options": ["選項1（日文）", "選項2（日文）", "選項3（日文）", "選項4（日文）"],
        "correctAnswer": 0,
        "explanationZh": "詳細的繁體中文解題分析說明，指出文章哪一句話是依據。"
      },
      {
        "id": "q_${todayKey}_${actualLevel}_1_2",
        "question": "日文測驗題目 2",
        "questionZh": "繁體中文題目翻譯 2",
        "options": ["選項1", "選項2", "選項3", "選項4"],
        "correctAnswer": 1,
        "explanationZh": "繁體中文解題解析。"
      },
      {
        "id": "q_${todayKey}_${actualLevel}_1_3",
        "question": "日文測驗題目 3",
        "questionZh": "繁體中文題目翻譯 3",
        "options": ["選項1", "選項2", "選項3", "選項4"],
        "correctAnswer": 2,
        "explanationZh": "繁體中文解題解析。"
      }
    ]
  },
  ...（共 3 篇，id 分別為 ai_${todayKey}_${actualLevel}_1, ai_${todayKey}_${actualLevel}_2, ai_${todayKey}_${actualLevel}_3）
]

嚴格要求：
1. 必須生成 3 篇短文，每篇均有 3 題選擇題（每題 4 個選項，correctAnswer 為 0~3 之整數）。
2. 中文內容（titleZh, contentZh, meaning, questionZh, explanationZh）必須一律使用【繁體中文（台灣標準習慣）】。
3. 嚴格只回傳乾淨的 JSON 陣列，不要加入任何其他額外文字或 markdown 程式碼區塊外說明。`;

  const requestBody = {
    contents: [
      {
        parts: [{ text: prompt }]
      }
    ],
    generationConfig: {
      temperature: 0.7,
      topP: 0.95,
      responseMimeType: 'application/json'
    }
  };

  // 優先使用極速響應的 gemini-3.5-flash-lite 與 gemini-3.5-flash (約 3~6 秒完成 3 篇)
  const candidateModels = [
    'gemini-3.5-flash-lite',
    'gemini-3.5-flash',
    'gemini-3.6-flash',
    'gemini-3.1-flash-lite',
    'gemini-flash-latest'
  ];
  let rawText = '';
  let lastErrMsg = '';

  for (const modelName of candidateModels) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (response.ok) {
        const data = await response.json();
        rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        if (rawText) break;
      } else {
        const errText = await response.text();
        try {
          const errJson = JSON.parse(errText);
          lastErrMsg = errJson.error?.message || `HTTP ${response.status}`;
        } catch {
          lastErrMsg = `HTTP ${response.status}`;
        }
      }
    } catch (e: any) {
      lastErrMsg = e.message || '網路連線異常';
    }
  }

  if (!rawText) {
    throw new Error(`Google AI 連網生成失敗：${lastErrMsg}`);
  }

  // Parse JSON
  let cleaned = rawText.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\n?/, '').replace(/\n?```$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\n?/, '').replace(/\n?```$/, '');
  }

  const articles: ReadingArticle[] = JSON.parse(cleaned);

  if (!Array.isArray(articles) || articles.length === 0) {
    throw new Error('生成的文章格式不正確，請再試一次。');
  }

  // 補齊可能缺失的欄位
  const validatedArticles: ReadingArticle[] = articles.map((art, idx) => ({
    id: art.id || `ai_${todayKey}_${actualLevel}_${idx + 1}`,
    level: actualLevel as any,
    dayIndex: idx + 1,
    title: art.title || `JLPT ${actualLevel} 每日閱讀 ${idx + 1}`,
    titleZh: art.titleZh || `JLPT ${actualLevel} 每日閱讀 ${idx + 1}`,
    category: art.category || '生活短文',
    content: art.content || '',
    contentZh: art.contentZh || '',
    keyVocab: Array.isArray(art.keyVocab) ? art.keyVocab : [],
    questions: Array.isArray(art.questions)
      ? art.questions.map((q, qIdx) => ({
          id: q.id || `q_${todayKey}_${actualLevel}_${idx + 1}_${qIdx + 1}`,
          question: q.question || '',
          questionZh: q.questionZh || '',
          options: Array.isArray(q.options) ? q.options : ['1', '2', '3', '4'],
          correctAnswer: typeof q.correctAnswer === 'number' ? q.correctAnswer : 0,
          explanationZh: q.explanationZh || ''
        }))
      : []
  }));

  // 存入快取與歷史庫
  saveDailyArticlesToCache(actualLevel, validatedArticles);

  return validatedArticles;
};
