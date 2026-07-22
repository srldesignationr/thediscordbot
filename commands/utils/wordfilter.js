const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../data/en-LDNOOBW.txt');
let badWordsSet = new Set();

try {
  const rawData = fs.readFileSync(filePath, 'utf8');
  
  // Split by newlines (\n or \r\n) and clean up whitespace
  const wordsArray = rawData
    .split(/\r?\n/)
    .map(word => word.trim().toLowerCase())
    .filter(word => word.length > 0); // Ignore empty lines

  badWordsSet = new Set(wordsArray);
  console.log(`Loaded ${badWordsSet.size} entries from en-LDNOOBW.txt`);
} catch (err) {
  console.error('Error loading en-LDNOOBW.txt:', err);
}

/**
 * Checks message content against the loaded Set
 */
function containsBannedWord(text) {
  if (!text || badWordsSet.size === 0) return false;

  // Basic leetspeak normalization
  const normalized = text
    .toLowerCase()
    .replace(/[@]/g, 'a')
    .replace(/[$]/g, 's')
    .replace(/[!1i]/g, 'i')
    .replace(/[0]/g, 'o');

  // Split sentence into words and clean punctuation attached to words
  const wordsInMessage = normalized
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '')
    .split(/\s+/);

  for (const word of wordsInMessage) {
    if (badWordsSet.has(word)) {
      return true;
    }
  }

  return false;
}

module.exports = { containsBannedWord };