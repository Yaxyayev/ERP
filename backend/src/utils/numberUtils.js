function cleanNumber(val, defaultVal = 0) {
  if (val === undefined || val === null || val === '') return defaultVal;
  if (typeof val === 'number') return isNaN(val) ? defaultVal : val;
  const cleaned = String(val).replace(/\s+/g, '').replace(',', '.');
  const num = Number(cleaned);
  return isNaN(num) ? defaultVal : num;
}

module.exports = { cleanNumber };
