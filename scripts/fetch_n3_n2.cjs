const https = require('https');
const fs = require('fs');
const path = require('path');

function fetch(url, dest) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        fs.writeFileSync(dest, data, 'utf8');
        console.log(`Saved ${dest} with length: ${data.length}, lines: ${data.split('\n').length}`);
        resolve();
      });
    }).on('error', reject);
  });
}

async function run() {
  const destDir = 'C:\\Users\\as861\\OneDrive\\桌面\\JLPT資料庫\\scripts';
  await fetch('https://raw.githubusercontent.com/jamsinclair/open-anki-jlpt-decks/main/src/n3.csv', path.join(destDir, 'raw_n3.csv'));
  await fetch('https://raw.githubusercontent.com/jamsinclair/open-anki-jlpt-decks/main/src/n2.csv', path.join(destDir, 'raw_n2.csv'));
}
run();
