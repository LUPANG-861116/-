/**
 * Web Speech API 日語真人發音工具 - 智能人聲選取、手機端自動解鎖與語速節奏校正模組
 */

let bestJapaneseVoice: SpeechSynthesisVoice | null = null;
let isAudioUnlocked = false;

// 優先挑選最高音質、最自然真人感的日語語音引擎
export const getBestJapaneseVoice = (): SpeechSynthesisVoice | null => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;

  const voices = window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return null;

  // 1. 優先篩選日語語音 (ja-JP, ja_JP, ja)
  const jaVoices = voices.filter(
    v => v.lang === 'ja-JP' || v.lang === 'ja_JP' || v.lang.toLowerCase().startsWith('ja')
  );

  if (jaVoices.length === 0) return null;

  // 2. 依自然度評分排隊 (Siri / Enhanced / Google / Microsoft Natural > Standard > Compact)
  const sorted = [...jaVoices].sort((a, b) => {
    const score = (voice: SpeechSynthesisVoice): number => {
      const name = voice.name.toLowerCase();
      let s = 0;
      if (name.includes('siri')) s += 100;
      if (name.includes('natural')) s += 90;
      if (name.includes('enhanced') || name.includes('premium')) s += 80;
      if (name.includes('google')) s += 70;
      if (name.includes('nanami') || name.includes('keita') || name.includes('ayumi')) s += 60;
      if (name.includes('kyoko') || name.includes('otoya') || name.includes('haruka')) s += 50;
      if (voice.localService) s += 10;
      if (name.includes('compact')) s -= 30;
      return s;
    };
    return score(b) - score(a);
  });

  return sorted[0] || null;
};

// 手機端 (iOS Safari / Android) 音訊通道自動解鎖機制
export const unlockSpeechAudio = () => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window) || isAudioUnlocked) return;
  try {
    window.speechSynthesis.resume();
    const silent = new SpeechSynthesisUtterance(' ');
    silent.volume = 0.01;
    silent.rate = 1.0;
    silent.lang = 'ja-JP';
    window.speechSynthesis.speak(silent);
    isAudioUnlocked = true;
  } catch (e) {
    console.warn('Audio unlock error:', e);
  }
};

const initVoices = () => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

  const update = () => {
    bestJapaneseVoice = getBestJapaneseVoice();
  };

  update();
  if (window.speechSynthesis.onvoiceschanged !== undefined) {
    window.speechSynthesis.onvoiceschanged = update;
  }

  // 註冊全域點擊/觸摸解鎖
  window.addEventListener('touchstart', unlockSpeechAudio, { once: true, passive: true });
  window.addEventListener('click', unlockSpeechAudio, { once: true, passive: true });
};

if (typeof window !== 'undefined') {
  initVoices();
}

/**
 * 清理日語發音字串，去除標點符號、括號與特殊記號，確保語音引擎不會讀出標點名稱
 */
export const cleanJapaneseSpeechText = (text: string): string => {
  if (!text) return '';
  return text
    .replace(/[～~〜]/g, '')
    .replace(/（[^）]*）/g, '')
    .replace(/\([^)]*\)/g, '')
    .replace(/\[[^\]]*\]/g, '')
    .replace(/[;；/／、，,]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

/**
 * 播放日語真人發音
 * @param text 要朗讀的日文文字或假名
 * @param rate 語速（預設 0.85，最接近真人清晰教學與日常的自然語速）
 * @param pitch 音調（預設 1.02，呈現更生動的日語共鳴）
 */
export const speakJapanese = (
  text: string,
  rate: number = 0.85,
  pitch: number = 1.02
): Promise<void> => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      console.warn('Speech synthesis not supported on this device/browser');
      resolve();
      return;
    }

    try {
      const cleanText = cleanJapaneseSpeechText(text);
      if (!cleanText) {
        resolve();
        return;
      }

      // 解除暫停狀態
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }

      // 取消前一個發音以避免堆疊延遲
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = 'ja-JP';
      utterance.rate = Math.max(0.65, Math.min(1.2, rate));
      utterance.pitch = pitch;
      utterance.volume = 1.0;

      const voice = bestJapaneseVoice || getBestJapaneseVoice();
      if (voice) {
        utterance.voice = voice;
      }

      utterance.onend = () => resolve();
      utterance.onerror = (e) => {
        if (e.error !== 'interrupted' && e.error !== 'canceled') {
          console.warn('Speech error', e);
        }
        resolve();
      };

      // 觸發發音
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.error('Speech synthesis execution error', err);
      resolve();
    }
  });
};

export const stopSpeech = (): void => {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch (e) {
      console.warn(e);
    }
  }
};

export const pauseSpeech = (): void => {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.pause();
    } catch (e) {
      console.warn(e);
    }
  }
};

export const resumeSpeech = (): void => {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.resume();
    } catch (e) {
      console.warn(e);
    }
  }
};
