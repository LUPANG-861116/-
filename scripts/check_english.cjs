const fs = require('fs');
const path = require('path');

const n5Path = 'C:\\Users\\as861\\OneDrive\\桌面\\JLPT資料庫\\src\\data\\n5.json';
const n4Path = 'C:\\Users\\as861\\OneDrive\\桌面\\JLPT資料庫\\src\\data\\n4.json';

const n5 = JSON.parse(fs.readFileSync(n5Path, 'utf8'));
const n4 = JSON.parse(fs.readFileSync(n4Path, 'utf8'));

// Check how many have English
const isEnglish = (str) => /[a-zA-Z]/.test(str);

const n5Eng = n5.filter(w => isEnglish(w.meaning));
const n4Eng = n4.filter(w => isEnglish(w.meaning));

console.log(`N5 total: ${n5.length}, with English meaning: ${n5Eng.length}`);
console.log(`N4 total: ${n4.length}, with English meaning: ${n4Eng.length}`);
console.log('Sample N5 English:', n5Eng.slice(0, 10).map(w => `${w.word}: ${w.meaning}`));
console.log('Sample N4 English:', n4Eng.slice(0, 10).map(w => `${w.word}: ${w.meaning}`));
