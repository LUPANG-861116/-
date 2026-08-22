/**
 * Web Speech API 日語真人發音工具
 */

let japaneseVoice: SpeechSynthesisVoice | null = null;

const initVoices = () => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

  const updateVoice = () => {
    const voices = window.speechSynthesis.getVoices();
    // 優先挑選日語語音 (ja-JP 或 ja_JP)
    japaneseVoice =
      voices.find(v => v.lang === 'ja-JP' || v.lang === 'ja_JP' || v.lang.startsWith('ja')) ||
      null;
  };

  updateVoice();
  if (window.speechSynthesis.onvoiceschanged !== undefined) {
    window.speechSynthesis.onvoiceschanged = updateVoice;
  }
};

if (typeof window !== 'undefined') {
  initVoices();
}

export const speakJapanese = (text: string, rate: number = 1.0): Promise<void> => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      console.warn('Speech synthesis not supported on this device/browser');
      resolve();
      return;
    }

    try {
      window.speechSynthesis.cancel(); // 停止先前的朗讀

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ja-JP';
      utterance.rate = rate;
      utterance.pitch = 1.0;

      if (japaneseVoice) {
        utterance.voice = japaneseVoice;
      }

      utterance.onend = () => resolve();
      utterance.onerror = (e) => {
        if (e.error !== 'interrupted' && e.error !== 'canceled') {
          console.warn('Speech error', e);
        }
        resolve();
      };

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


