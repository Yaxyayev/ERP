const { db } = require('../config/database');

/**
 * Запись действия пользователя в журнал аудита
 * @param {number|null} userId - ID пользователя
 * @param {string} username - Имя пользователя
 * @param {string} action - Тип действия (LOGIN, SALE_CREATED, etc.)
 * @param {string} entity - Затронутая сущность (№ сделки, Клиент, Товар)
 * @param {string} details - Детальное текстовое описание
 * @param {string} ip - IP адрес клиента
 */
function logAudit(userId, username, action, entity = '', details = '', ip = '') {
  try {
    const stmt = db.prepare(`
      INSERT INTO audit_logs (user_id, username, action, entity, details, ip, created_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now', 'localtime'))
    `);
    stmt.run(userId || null, username || 'система', action, entity, details, ip);
  } catch (err) {
    console.error('Ошибка записи аудита:', err.message);
  }
}

module.exports = {
  logAudit
};
