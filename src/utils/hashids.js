const ALPHABET = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

function getShuffledAlphabet(salt) {
  let alphabetArr = ALPHABET.split('');
  
  let seed = 0;
  for (let i = 0; i < salt.length; i++) {
    seed = (seed << 5) - seed + salt.charCodeAt(i);
    seed |= 0;
  }
  
  function random() {
    seed = (seed * 1664525 + 1013904223) | 0;
    return (seed >>> 0) / 4294967296;
  }
  
  for (let i = alphabetArr.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    const temp = alphabetArr[i];
    alphabetArr[i] = alphabetArr[j];
    alphabetArr[j] = temp;
  }
  
  return alphabetArr.join('');
}

const alphabets = {
  books: getShuffledAlphabet('smart_digital_library_books_salt_2026'),
  orders: getShuffledAlphabet('smart_digital_library_orders_salt_2026'),
  articles: getShuffledAlphabet('smart_digital_library_articles_salt_2026')
};

function encode(num, type) {
  if (num === undefined || num === null) return '';
  const parsed = parseInt(num);
  if (isNaN(parsed) || parsed < 0) return '';
  
  const shuffled = alphabets[type] || ALPHABET;
  let n = parsed;
  let result = '';
  const base = shuffled.length;
  
  do {
    result = shuffled[n % base] + result;
    n = Math.floor(n / base);
  } while (n > 0);
  
  return result;
}

function decode(str, type) {
  if (typeof str !== 'string' || !str) return NaN;
  
  if (/^\d+$/.test(str)) {
    return parseInt(str);
  }
  
  const shuffled = alphabets[type] || ALPHABET;
  const base = shuffled.length;
  let num = 0;
  
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    const index = shuffled.indexOf(char);
    if (index === -1) return NaN;
    num = num * base + index;
  }
  
  return num;
}

// Sách (Books)
export const encodeBookId = (id) => encode(id, 'books');
export const decodeBookId = (hash) => decode(hash, 'books');

// Đơn hàng (Orders)
export const encodeOrderId = (id) => encode(id, 'orders');
export const decodeOrderId = (hash) => decode(hash, 'orders');

// Bài viết (Articles)
export const encodeArticleId = (id) => encode(id, 'articles');
export const decodeArticleId = (hash) => decode(hash, 'articles');
