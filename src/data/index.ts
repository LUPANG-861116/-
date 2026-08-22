import n5Data from './n5.json';
import n4Data from './n4.json';
import n3Data from './n3.json';
import n2Data from './n2.json';
import n1Data from './n1.json';
import { allPhrases } from './phrasesData';
import type { VocabWord } from '../types';

// 將常用片語與句型轉化為標準 VocabWord，無縫整合至單字庫
const phraseWords: VocabWord[] = allPhrases.map(p => ({
  id: p.id,
  word: p.phrase,
  reading: p.reading,
  romaji: p.reading,
  partOfSpeech: '句型片語',
  meaning: p.meaning,
  level: p.level,
  example: p.example,
  exampleMeaning: p.exampleMeaning
}));

const n5Phrases = phraseWords.filter(p => p.level === 'N5');
const n4Phrases = phraseWords.filter(p => p.level === 'N4');
const n3Phrases = phraseWords.filter(p => p.level === 'N3');
const n2Phrases = phraseWords.filter(p => p.level === 'N2');
const n1Phrases = phraseWords.filter(p => p.level === 'N1');

export const allN5Words: VocabWord[] = [
  ...(n5Data as VocabWord[]),
  ...n5Phrases
];

export const allN4Words: VocabWord[] = [
  ...(n4Data as VocabWord[]),
  ...n4Phrases
];

export const allN3Words: VocabWord[] = [
  ...(n3Data as VocabWord[]),
  ...n3Phrases
];

export const allN2Words: VocabWord[] = [
  ...(n2Data as VocabWord[]),
  ...n2Phrases
];

export const allN1Words: VocabWord[] = [
  ...(n1Data as VocabWord[]),
  ...n1Phrases
];

// 綜合練習分組 (按使用者需求分為 3 塊)
export const n5n4Words: VocabWord[] = [...allN5Words, ...allN4Words];
export const n5n2Words: VocabWord[] = [...allN5Words, ...allN4Words, ...allN3Words, ...allN2Words];
export const n5n1Words: VocabWord[] = [...allN5Words, ...allN4Words, ...allN3Words, ...allN2Words, ...allN1Words];

export const allWords: VocabWord[] = n5n1Words;

export const getWordById = (id: string): VocabWord | undefined => {
  return allWords.find(w => w.id === id);
};
