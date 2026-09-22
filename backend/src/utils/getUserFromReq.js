const { db } = require('../config/database');

/**
 * Извлечение информации о текущем пользователе из заголовка Authorization
 */
function getUserFromReq(req) {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader) {
      const match = authHeader.match(/token_(\d+)_/);
      if (match) {
        const userId = parseInt(match[1], 10);
        const user = db.prepare('SELECT id, username, full_name, role FROM users WHERE id = ?').get(userId);
        if (user) {
          return user;
        }
      }
    }
    
    // Fallback на x-user или системного пользователя
    const usernameHeader = req.headers['x-user'];
    if (usernameHeader) {
      const user = db.prepare('SELECT id, username, full_name, role FROM users WHERE username = ?').get(usernameHeader);
      if (user) return user;
    }
  } catch (e) {
    // ignore
  }

  return { id: null, username: 'operator', full_name: 'Оператор системы', role: 'operator' };
}

module.exports = { getUserFromReq };
