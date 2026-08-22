const fs = require('fs');
const path = require('path');

// Romaji mapping
function toRomaji(kana) {
  const map = {
    'あ': 'a', 'い': 'i', 'う': 'u', 'え': 'e', 'お': 'o',
    'か': 'ka', 'き': 'ki', 'く': 'ku', 'け': 'ke', 'こ': 'ko',
    'さ': 'sa', 'し': 'shi', 'す': 'su', 'せ': 'se', 'そ': 'so',
    'た': 'ta', 'ち': 'chi', 'つ': 'tsu', 'て': 'te', 'と': 'to',
    'な': 'na', 'に': 'ni', 'ぬ': 'nu', 'ね': 'ne', 'の': 'no',
    'は': 'ha', 'ひ': 'hi', 'ふ': 'fu', 'へ': 'he', 'ほ': 'ho',
    'ま': 'ma', 'み': 'mi', 'む': 'mu', 'め': 'me', 'も': 'mo',
    'や': 'ya', 'ゆ': 'yu', 'よ': 'yo',
    'ら': 'ra', 'り': 'ri', 'る': 'ru', 'れ': 're', 'ろ': 'ro',
    'わ': 'wa', 'を': 'wo', 'ん': 'n',
    'が': 'ga', 'ぎ': 'gi', 'ぐ': 'gu', 'げ': 'ge', 'ご': 'go',
    'ざ': 'za', 'じ': 'ji', 'ず': 'zu', 'ぜ': 'ze', 'ぞ': 'zo',
    'だ': 'da', 'ぢ': 'ji', 'づ': 'dzu', 'で': 'de', 'ど': 'do',
    'ば': 'ba', 'び': 'bi', 'ぶ': 'bu', 'べ': 'be', 'ぼ': 'bo',
    'ぱ': 'pa', 'ぴ': 'pi', 'ぷ': 'pu', 'ぺ': 'pe', 'ぽ': 'po',
    'きゃ': 'kya', 'きゅ': 'kyu', 'きょ': 'kyo',
    'しゃ': 'sha', 'しゅ': 'shu', 'しょ': 'sho',
    'ちゃ': 'cha', 'ちゅ': 'chu', 'ちょ': 'cho',
    'にゃ': 'nya', 'にゅ': 'nyu', 'にょ': 'nyo',
    'ひゃ': 'hya', 'ひゅ': 'hyu', 'ひょ': 'hyo',
    'みゃ': 'mya', 'みゅ': 'myu', 'みょ': 'myo',
    'りゃ': 'rya', 'りゅ': 'ryu', 'りょ': 'ryo',
    'ぎゃ': 'gya', 'ぎゅ': 'gyu', 'ぎょ': 'gyo',
    'じゃ': 'ja', 'じゅ': 'ju', 'じょ': 'jo',
    'びゃ': 'bya', 'びゅ': 'byu', 'びょ': 'byo',
    'ぴゃ': 'pya', 'ぴゅ': 'pyu', 'ぴょ': 'pyo'
  };

  let res = '';
  let i = 0;
  while (i < kana.length) {
    if (kana[i] === 'っ' || kana[i] === 'ッ') {
      if (i + 1 < kana.length) {
        const nextTwo = kana.slice(i + 1, i + 3);
        const nextOne = kana.slice(i + 1, i + 2);
        const rom = map[nextTwo] || map[nextOne] || '';
        res += rom.charAt(0) || '';
      }
      i++;
      continue;
    }
    const two = kana.slice(i, i + 2);
    if (map[two]) {
      res += map[two];
      i += 2;
      continue;
    }
    const one = kana.slice(i, i + 1);
    if (map[one]) {
      res += map[one];
    } else {
      res += one;
    }
    i++;
  }
  return res;
}

// Guess POS
function guessPOS(word, reading, engMeaning) {
  const m = engMeaning.toLowerCase();
  if (m.startsWith('to ') || word.endsWith('する') || reading.endsWith('する') || ['う','く','ぐ','す','つ','ぬ','ぶ','む','る'].includes(reading.slice(-1))) {
    if (m.startsWith('to ') || word.endsWith('する') || reading.endsWith('する')) {
      return '動詞';
    }
  }
  if (word.endsWith('い') && reading.endsWith('い') && word.length >= 2) {
    return 'い形容詞';
  }
  if (word.endsWith('な') || ['的','風','様'].some(s => word.endsWith(s))) {
    return 'な形容詞';
  }
  if (['いつも','かなり','とても','少し','ほとんど','どんどん','たぶん','もっと','すっかり','すっと','ちょうど'].includes(word)) {
    return '副詞';
  }
  if (['そして','しかし','だが','また','あるいは','したがって','そのため'].includes(word)) {
    return '連接詞';
  }
  return '名詞';
}

// English to Traditional Chinese common terms mapping
const termDict = [
  [/to understand/gi, "理解、明白"],
  [/to explain/gi, "解釋、說明"],
  [/to investigate/gi, "調查、研究"],
  [/to improve/gi, "改善、進步"],
  [/to increase/gi, "增加、增多"],
  [/to decrease/gi, "減少、縮減"],
  [/to develop/gi, "開發、發展"],
  [/to protect/gi, "保護、維護"],
  [/to discover/gi, "發現、發覺"],
  [/to create/gi, "創造、建立"],
  [/to produce/gi, "生產、製造"],
  [/to compare/gi, "比較、對照"],
  [/to change/gi, "改變、變更"],
  [/to continue/gi, "持續、繼續"],
  [/to prepare/gi, "準備、籌備"],
  [/to experience/gi, "體驗、經歷"],
  [/to participate/gi, "參加、參與"],
  [/to communicate/gi, "溝通、交流"],
  [/to decide/gi, "決定、決策"],
  [/to remember/gi, "記住、回想"],
  [/to forget/gi, "忘記、遺忘"],
  [/to succeed/gi, "成功、達成"],
  [/to fail/gi, "失敗、不及格"],
  [/to encourage/gi, "鼓勵、激勵"],
  [/to express/gi, "表達、表現"],
  [/to solve/gi, "解決、解答"],
  [/to accept/gi, "接受、認同"],
  [/to refuse/gi, "拒絕、謝絕"],
  [/to permit/gi, "許可、准許"],
  [/to achieve/gi, "實現、達到"],
  [/to support/gi, "支持、支援"],
  [/to manage/gi, "管理、經營"],
  [/to arrange/gi, "安排、整理"],
  [/to connect/gi, "連接、聯繫"],
  [/to consider/gi, "考慮、深思"],
  [/to perform/gi, "演出、執行"],
  [/to choose/gi, "挑選、選擇"],
  [/to influence/gi, "影響、感染"],
  [/to prevent/gi, "預防、防止"],
  [/to save/gi, "儲存、拯救"],
  [/to spend/gi, "花費、度過"],
  [/to celebrate/gi, "慶祝、祝賀"],
  [/to provide/gi, "提供、供給"],
  [/to require/gi, "需要、要求"],
  [/to suggest/gi, "建議、提議"],
  [/to organize/gi, "組織、統整"],
  [/to realize/gi, "意識到、實現"],
  [/to confirm/gi, "確認、證實"],
  [/to discuss/gi, "討論、商量"],
  [/to publish/gi, "發表、出版"],
  [/society/gi, "社會"],
  [/environment/gi, "環境"],
  [/culture/gi, "文化"],
  [/tradition/gi, "傳統"],
  [/economy/gi, "經濟"],
  [/politics/gi, "政治"],
  [/science/gi, "科學"],
  [/technology/gi, "科技、技術"],
  [/education/gi, "教育"],
  [/nature/gi, "自然、大自然"],
  [/health/gi, "健康"],
  [/activity/gi, "活動"],
  [/relationship/gi, "關係、人際關係"],
  [/situation/gi, "情況、局勢"],
  [/condition/gi, "條件、狀態"],
  [/impression/gi, "印象、感想"],
  [/opinion/gi, "意見、觀點"],
  [/feeling/gi, "感覺、心情"],
  [/experience/gi, "經驗、體會"],
  [/opportunity/gi, "機會、良機"],
  [/possibility/gi, "可能性"],
  [/responsibility/gi, "責任、義務"],
  [/advantage/gi, "優點、長處"],
  [/disadvantage/gi, "缺點、劣勢"],
  [/method/gi, "方法、手段"],
  [/purpose/gi, "目的、宗旨"],
  [/reason/gi, "理由、原因"],
  [/result/gi, "結果、成效"],
  [/effect/gi, "效果、影響"],
  [/influence/gi, "影響力"],
  [/problem/gi, "問題、難題"],
  [/solution/gi, "解決方法"],
  [/discussion/gi, "討論、商議"],
  [/information/gi, "資訊、消息"],
  [/knowledge/gi, "知識、常識"],
  [/importance/gi, "重要性"],
  [/necessity/gi, "必要性"],
  [/convenience/gi, "便利性、方便"],
  [/difficulty/gi, "困難、困境"],
  [/convenient/gi, "便利的、方便的"],
  [/necessary/gi, "必要的、必需的"],
  [/important/gi, "重要的、關鍵的"],
  [/difficult/gi, "困難的、艱深的"],
  [/easy/gi, "容易的、簡便的"],
  [/possible/gi, "可能的"],
  [/impossible/gi, "不可能的"],
  [/natural/gi, "自然的、天然的"],
  [/active/gi, "積極的、活躍的"],
  [/positive/gi, "正面樂觀的、肯定的"],
  [/negative/gi, "消極負面的、否定的"],
  [/traditional/gi, "傳統的"],
  [/modern/gi, "現代的"],
  [/global/gi, "全球的、國際的"],
  [/local/gi, "當地的、地方的"],
  [/complex/gi, "複雜的"],
  [/simple/gi, "簡單明瞭的"],
  [/effective/gi, "有效的、有效果的"],
  [/efficient/gi, "有效率的"],
  [/valuable/gi, "有價值的、寶貴的"],
  [/creative/gi, "具創造力的、創新的"],
  [/unique/gi, "獨特的、唯一的"],
  [/general/gi, "一般的、普遍的"],
  [/special/gi, "特別的、專門的"],
  [/serious/gi, "嚴肅的、嚴重的"],
  [/comfortable/gi, "舒適自在的"],
  [/polite/gi, "客氣有禮的"],
  [/kind/gi, "和藹親切的"],
  [/strict/gi, "嚴格嚴厲的"],
  [/rich/gi, "豐富的、富裕的"],
  [/poor/gi, "貧乏的、貧窮的"],
  [/safe/gi, "安全可靠的"],
  [/dangerous/gi, "危險的"],
  [/quiet/gi, "安靜寧靜的"],
  [/famous/gi, "著名聞名的"]
];

function translateToZh(word, reading, rawMeaning, pos) {
  let text = rawMeaning;
  for (const [re, rep] of termDict) {
    text = text.replace(re, rep);
  }

  // Remove leftover english words, notations, and tags
  text = text
    .replace(/\(.*?\)/g, '')
    .replace(/\[.*?\]/g, '')
    .replace(/v\.i\.|v\.t\.|adj\.|noun|adv\./gi, '')
    .replace(/[a-zA-Z]/g, '')
    .replace(/[,;，、]+/g, '、')
    .replace(/^、|、$/g, '')
    .trim();

  if (!text || text.length === 0) {
    text = word;
  }

  // Build natural Japanese example sentence and Chinese translation
  let ex = '';
  let zh = '';
  if (pos === '動詞') {
    ex = `この件について、しっかり${word}ことが大切です。`;
    zh = `關於這件事，好好${text}是非常重要的。`;
  } else if (pos === 'い形容詞') {
    ex = `この問題は非常に${word}と考えられます。`;
    zh = `這個問題被認為非常${text}。`;
  } else if (pos === 'な形容詞') {
    ex = `社会にとって${word}な取り組みが行われています。`;
    zh = `正在進行對社會而言非常${text}的措施。`;
  } else if (pos === '副詞') {
    ex = `計画を${word}進めていく予定です。`;
    zh = `預計${text}推進各項計畫。`;
  } else {
    ex = `今回のテーマは「${word}」についてです。`;
    zh = `這次的主題是關於「${text}」。`;
  }

  return { m: text, ex, zh };
}

// Parse CSV and generate JSON
function parseCSV(content, level) {
  const lines = content.split('\n');
  const results = [];
  let index = 1;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const regex = /(?:,|\n|^)("(?:(?:"")*[^"]*)*"|[^",\n]*|(?:\n|$))/g;
    const matches = [];
    let match;
    while ((match = regex.exec(line)) !== null) {
      let val = match[1];
      if (val) {
        if (val.startsWith('"') && val.endsWith('"')) {
          val = val.slice(1, -1).replace(/""/g, '"');
        }
        matches.push(val.trim());
      }
    }

    if (matches.length >= 3) {
      const word = matches[0];
      const reading = matches[1];
      const engMeaning = matches[2];
      if (!word || !reading) continue;

      const pos = guessPOS(word, reading, engMeaning);
      const { m, ex, zh } = translateToZh(word, reading, engMeaning, pos);
      const romaji = toRomaji(reading);
      const id = `${level.toLowerCase()}_${String(index).padStart(4, '0')}`;
      index++;

      results.push({
        id,
        word,
        reading,
        romaji,
        partOfSpeech: pos,
        meaning: m,
        level,
        example: ex,
        exampleMeaning: zh
      });
    }
  }

  return results;
}

const n3CSV = fs.readFileSync('C:\\Users\\as861\\OneDrive\\桌面\\JLPT資料庫\\scripts\\raw_n3.csv', 'utf8');
const n2CSV = fs.readFileSync('C:\\Users\\as861\\OneDrive\\桌面\\JLPT資料庫\\scripts\\raw_n2.csv', 'utf8');

const n3Data = parseCSV(n3CSV, 'N3');
const n2Data = parseCSV(n2CSV, 'N2');

console.log(`N3 parsed: ${n3Data.length} words.`);
console.log(`N2 parsed: ${n2Data.length} words.`);

const targetDir = 'C:\\Users\\as861\\OneDrive\\桌面\\JLPT資料庫\\src\\data';
fs.writeFileSync(path.join(targetDir, 'n3.json'), JSON.stringify(n3Data, null, 2), 'utf8');
fs.writeFileSync(path.join(targetDir, 'n2.json'), JSON.stringify(n2Data, null, 2), 'utf8');

console.log('Saved n3.json and n2.json successfully!');
