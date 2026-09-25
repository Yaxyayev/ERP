import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatNumber(num) {
  if (num === null || num === undefined) return '0';
  return Number(num).toLocaleString('ru-RU');
}

export function formatCurrency(num, currency = 'сум') {
  return `${formatNumber(num)} ${currency}`;
}

export function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(date);
}

// Форматирование чисел с пробелами-разделителями тысяч (для инпутов)
export function formatThousands(val) {
  if (val === null || val === undefined || val === '') return '';
  const clean = val.toString().replace(/\s/g, '');
  if (isNaN(clean) && !clean.endsWith('.')) return val;
  const parts = clean.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return parts.join('.');
}

export function parseThousands(val) {
  if (!val) return '';
  return val.toString().replace(/\s/g, '').replace(',', '.');
}

// Автоформатирование автомобильных госномеров Узбекистана
// 2 образца: 00 A 123 AA (физ. лица) или 00 123 AAA (юр. лица / автопарк)
const CYRILLIC_TO_LATIN_MAP = {
  'А': 'A', 'а': 'A', 'В': 'B', 'в': 'B', 'Е': 'E', 'е': 'E',
  'К': 'K', 'к': 'K', 'М': 'M', 'м': 'M', 'Н': 'H', 'н': 'H',
  'О': 'O', 'о': 'O', 'Р': 'P', 'р': 'P', 'С': 'C', 'с': 'C',
  'Т': 'T', 'т': 'T', 'У': 'Y', 'у': 'Y', 'Х': 'X', 'х': 'X'
};

export function normalizePlateChars(str) {
  if (!str) return '';
  let res = '';
  for (const ch of str) {
    if (CYRILLIC_TO_LATIN_MAP[ch]) {
      res += CYRILLIC_TO_LATIN_MAP[ch];
    } else if (/[a-zA-Z0-9]/.test(ch)) {
      res += ch.toUpperCase();
    }
  }
  return res;
}

export function formatPlateNumber(val, prevVal = '') {
  if (!val) return '';

  // Плавный бэкспейс: если пользователь удалил завершающий пробел, удаляем и предшествующий символ
  if (prevVal && val.length < prevVal.length) {
    if (prevVal.endsWith(' ') && !val.endsWith(' ') && prevVal.slice(0, -1) === val) {
      val = val.slice(0, -1);
    }
  }

  const raw = normalizePlateChars(val);
  if (!raw) return '';

  // Первые 2 символа строго цифры (код региона 01-99)
  let region = '';
  let idx = 0;
  while (idx < raw.length && region.length < 2) {
    if (/\d/.test(raw[idx])) {
      region += raw[idx];
    }
    idx++;
  }

  if (idx >= raw.length && region.length <= 2) {
    return region;
  }

  const remaining = raw.slice(idx);
  if (!remaining) return region;

  const firstChar = remaining[0];

  if (/[A-Z]/.test(firstChar)) {
    // Образец 1: 00 A 123 AA (1 буква, 3 цифры, 2 буквы)
    const letter1 = firstChar;
    const remAfterLetter1 = remaining.slice(1);

    let digits = '';
    let remIdx = 0;
    while (remIdx < remAfterLetter1.length && digits.length < 3) {
      if (/\d/.test(remAfterLetter1[remIdx])) {
        digits += remAfterLetter1[remIdx];
      } else {
        break;
      }
      remIdx++;
    }

    const remAfterDigits = remAfterLetter1.slice(remIdx);
    let letters2 = '';
    let remIdx2 = 0;
    while (remIdx2 < remAfterDigits.length && letters2.length < 2) {
      if (/[A-Z]/.test(remAfterDigits[remIdx2])) {
        letters2 += remAfterDigits[remIdx2];
      }
      remIdx2++;
    }

    let res = region + ' ' + letter1;
    if (digits) {
      res += ' ' + digits;
    }
    if (letters2) {
      res += ' ' + letters2;
    }
    return res;
  } else {
    // Образец 2: 00 123 AAA (3 цифры, 3 буквы)
    let digits = '';
    let remIdx = 0;
    while (remIdx < remaining.length && digits.length < 3) {
      if (/\d/.test(remaining[remIdx])) {
        digits += remaining[remIdx];
      } else {
        break;
      }
      remIdx++;
    }

    const remAfterDigits = remaining.slice(remIdx);
    let letters = '';
    let remIdx2 = 0;
    while (remIdx2 < remAfterDigits.length && letters.length < 3) {
      if (/[A-Z]/.test(remAfterDigits[remIdx2])) {
        letters += remAfterDigits[remIdx2];
      }
      remIdx2++;
    }

    let res = region;
    if (digits) {
      res += ' ' + digits;
    }
    if (letters) {
      res += ' ' + letters;
    }
    return res;
  }
}

export function formatPhoneNumber(val, prevVal = '') {
  if (!val) return '';

  // Плавный бэкспейс: если пользователь удалил завершающий пробел, удаляем и предшествующий символ
  if (prevVal && val.length < prevVal.length) {
    if (prevVal.endsWith(' ') && !val.endsWith(' ') && prevVal.slice(0, -1) === val) {
      val = val.slice(0, -1);
    }
  }

  // Если очистили всё или стёрли до префикса
  if (val === '+' || val === '+9' || val === '+99' || val === '+998' || val === '+998 ') {
    if (prevVal && prevVal.length > val.length) {
      return '';
    }
    return '+998 ';
  }

  const rawDigits = val.replace(/\D/g, '');
  if (!rawDigits) {
    return val.includes('+') ? '+998 ' : '';
  }

  let digits = rawDigits;
  // Если строка уже начинается с 998, отрезаем код страны
  if (digits.startsWith('998')) {
    digits = digits.slice(3);
  }

  // Максимум 9 цифр после +998 (2 код + 3 номер + 4 номер = 9 цифр)
  digits = digits.slice(0, 9);

  if (digits.length === 0) {
    return '+998 ';
  }

  // Образец: +998 00 123 4567
  let res = '+998 ' + digits.slice(0, 2);
  if (digits.length > 2) {
    res += ' ' + digits.slice(2, 5);
  }
  if (digits.length > 5) {
    res += ' ' + digits.slice(5, 9);
  }

  return res;
}

