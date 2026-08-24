/**
 * 日語真人發音工具 - 雙引擎高保真架構（/api/tts 專屬音訊串流 + Web Speech API 離線備援）
 */

let currentAudio: HTMLAudioElement | null = null;
let isAudioUnlocked = false;

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
 * Web Speech API 離線備援播放
 */
export const speakWithWebSpeech = (
  text: string,
  rate: number = 0.85,
  pitch: number = 1.02
): Promise<void> => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      resolve();
      return;
    }

    try {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }

      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ja-JP';
      utterance.rate = Math.max(0.65, Math.min(1.2, rate));
      utterance.pitch = pitch;
      utterance.volume = 1.0;

      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Web Speech error:', e);
      resolve();
    }
  });
};

/**
 * 解鎖手機端音訊通道 (iOS Safari / Android Chrome)
 */
export const unlockSpeechAudio = () => {
  if (isAudioUnlocked) return;
  isAudioUnlocked = true;

  try {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.resume();
    }
  } catch (e) {}
};

if (typeof window !== 'undefined') {
  window.addEventListener('touchstart', unlockSpeechAudio, { once: true, passive: true });
  window.addEventListener('click', unlockSpeechAudio, { once: true, passive: true });
}

/**
 * 播放日語真人發音
 * 優先使用伺服器高音質真人母語 MP3 音訊，若離線或受阻則自動降級至 Web Speech API
 * @param text 要朗讀的日文文字或假名
 * @param rate 語速（預設 0.85，最接近真人清晰教學與日常的自然語速）
 * @param pitch 音調（預設 1.02）
 */
export const speakJapanese = (
  text: string,
  rate: number = 0.85,
  pitch: number = 1.02
): Promise<void> => {
  return new Promise((resolve) => {
    const cleanText = cleanJapaneseSpeechText(text);
    if (!cleanText) {
      resolve();
      return;
    }

    unlockSpeechAudio();

    // 停止正在播放的舊音訊
    if (currentAudio) {
      try {
        currentAudio.pause();
        currentAudio.currentTime = 0;
      } catch (e) {}
      currentAudio = null;
    }

    // 1. 優先使用伺服器端音訊代理 (/api/tts?text=...)
    try {
      const audioUrl = `/api/tts?text=${encodeURIComponent(cleanText)}`;
      const audio = new Audio(audioUrl);
      
      audio.playbackRate = Math.max(0.7, Math.min(1.2, rate));
      currentAudio = audio;

      audio.onended = () => {
        if (currentAudio === audio) currentAudio = null;
        resolve();
      };

      audio.onerror = () => {
        if (currentAudio === audio) currentAudio = null;
        // 降級使用 Web Speech API
        speakWithWebSpeech(cleanText, rate, pitch).then(resolve);
      };

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // 若播放受瀏覽器阻擋，立即降級至 Web Speech API
          if (currentAudio === audio) currentAudio = null;
          speakWithWebSpeech(cleanText, rate, pitch).then(resolve);
        });
      }
    } catch (err) {
      speakWithWebSpeech(cleanText, rate, pitch).then(resolve);
    }
  });
};

export const stopSpeech = (): void => {
  if (currentAudio) {
    try {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    } catch (e) {}
    currentAudio = null;
  }

  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch (e) {}
  }
};

export const pauseSpeech = (): void => {
  if (currentAudio) {
    try {
      currentAudio.pause();
    } catch (e) {}
  }
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.pause();
    } catch (e) {}
  }
};

export const resumeSpeech = (): void => {
  if (currentAudio) {
    try {
      currentAudio.play().catch(() => {});
    } catch (e) {}
  }
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.resume();
    } catch (e) {}
  }
};
