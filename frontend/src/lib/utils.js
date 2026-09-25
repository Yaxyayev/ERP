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
