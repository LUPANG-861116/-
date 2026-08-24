/**
 * 日語真人發音工具 - 完美相容全平台（雙重保險：Web Speech API 即時朗讀 + 伺服器高音質音訊）
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
 * Web Speech API 核心播放器（完美修復 Chrome/Safari 語音阻擋與暫停問題）
 */
export const speakWithWebSpeech = (
  text: string,
  rate: number = 0.85,
  pitch: number = 1.0
): Promise<void> => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      resolve();
      return;
    }

    try {
      // 解決 Chrome/Safari 語音合成器常處於 paused 狀態的底層 bug
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ja-JP';
      utterance.rate = Math.max(0.65, Math.min(1.2, rate));
      utterance.pitch = pitch;
      utterance.volume = 1.0;

      // 嘗試挑選最佳日文聲音
      try {
        const voices = window.speechSynthesis.getVoices();
        if (voices && voices.length > 0) {
          const jaVoice = voices.find(
            v => v.lang === 'ja-JP' || v.lang === 'ja_JP' || v.lang.toLowerCase().startsWith('ja')
          );
          if (jaVoice) {
            utterance.voice = jaVoice;
          }
        }
      } catch (e) {}

      let resolved = false;
      const done = () => {
        if (!resolved) {
          resolved = true;
          resolve();
        }
      };

      utterance.onend = done;
      utterance.onerror = done;

      // 啟動發音
      window.speechSynthesis.speak(utterance);

      // 安全超時（避免某些裝置 onend 不觸發卡死）
      setTimeout(done, 3500);
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
      const silent = new SpeechSynthesisUtterance('');
      silent.volume = 0;
      window.speechSynthesis.speak(silent);
    }
  } catch (e) {}
};

if (typeof window !== 'undefined') {
  window.addEventListener('touchstart', unlockSpeechAudio, { once: true, passive: true });
  window.addEventListener('click', unlockSpeechAudio, { once: true, passive: true });
}

/**
 * 播放日語發音（雙軌保險機制）
 */
export const speakJapanese = (
  text: string,
  rate: number = 0.85,
  pitch: number = 1.0
): Promise<void> => {
  return new Promise((resolve) => {
    const cleanText = cleanJapaneseSpeechText(text);
    if (!cleanText) {
      resolve();
      return;
    }

    unlockSpeechAudio();

    // 停止正在播放的音訊
    if (currentAudio) {
      try {
        currentAudio.pause();
        currentAudio.currentTime = 0;
      } catch (e) {}
      currentAudio = null;
    }

    // 優先嘗試伺服器端音訊代理 (/api/tts)
    const audioUrl = `/api/tts?text=${encodeURIComponent(cleanText)}`;
    const audio = new Audio(audioUrl);
    audio.playbackRate = Math.max(0.7, Math.min(1.2, rate));

    let audioPlayed = false;

    audio.onplay = () => {
      audioPlayed = true;
      currentAudio = audio;
    };

    audio.onended = () => {
      currentAudio = null;
      resolve();
    };

    audio.onerror = () => {
      // 伺服器代理失敗時，無縫採用 Web Speech API 朗讀
      if (!audioPlayed) {
        speakWithWebSpeech(cleanText, rate, pitch).then(resolve);
      }
    };

    const p = audio.play();
    if (p !== undefined) {
      p.catch(() => {
        // 若受到瀏覽器 Autoplay 阻擋，立即使用 Web Speech API 朗讀
        if (!audioPlayed) {
          speakWithWebSpeech(cleanText, rate, pitch).then(resolve);
        }
      });
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
