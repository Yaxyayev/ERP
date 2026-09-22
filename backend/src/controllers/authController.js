// Контроллер аутентификации пользователей с сохранением в SQLite
const { db } = require('../config/database');
const { logAudit } = require('../services/auditService');

function login(req, res) {
  try {
    const { username, password } = req.body;
    const clientIp = req.ip || req.connection?.remoteAddress || '127.0.0.1';

    if (!username || !password) {
      return res.status(400).json({ success: false, error: 'Введите имя пользователя и пароль' });
    }

    const trimmedUser = username.trim();
    const user = db.prepare('SELECT * FROM users WHERE username = ? COLLATE NOCASE').get(trimmedUser);

    if (!user) {
      logAudit(null, trimmedUser, 'LOGIN_FAILED', 'Авторизация', 'Попытка входа с несуществующим логином', clientIp);
      return res.status(401).json({ success: false, error: 'Неверный логин или пароль' });
    }

    if (user.status === 'blocked') {
      logAudit(user.id, user.username, 'LOGIN_BLOCKED', 'Безопасность', 'Попытка входа заблокированного пользователя', clientIp);
      return res.status(403).json({ success: false, error: 'Учетная запись заблокирована администратором' });
    }

    if (user.password !== password) {
      logAudit(user.id, user.username, 'LOGIN_FAILED', 'Авторизация', 'Введен неверный пароль', clientIp);
      return res.status(401).json({ success: false, error: 'Неверный логин или пароль' });
    }

    // Обновляем время последнего входа
    db.prepare("UPDATE users SET last_login = datetime('now', 'localtime') WHERE id = ?").run(user.id);

    // Запись успешного входа в аудит
    logAudit(user.id, user.username, 'LOGIN_SUCCESS', 'Авторизация', `Успешный вход в систему [Роль: ${user.role}]`, clientIp);

    const token = `token_${user.id}_${Date.now()}`;
    const userData = {
      id: user.id,
      username: user.username,
      fullName: user.full_name,
      role: user.role,
      roleTitle: user.role_title || (user.role === 'admin' ? 'Главный Администратор' : 'Сотрудник'),
      phone: user.phone,
      status: user.status
    };

    res.json({
      success: true,
      message: 'Успешная авторизация',
      user: userData,
      token
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

function getMe(req, res) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ success: false, error: 'Не авторизован' });
    }

    // Извлекаем id из токена (формат: token_{id}_{timestamp})
    let userId = 1;
    const match = authHeader.match(/token_(\d+)_/);
    if (match) {
      userId = parseInt(match[1]);
    }

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'Пользователь не найден' });
    }

    const userData = {
      id: user.id,
      username: user.username,
      fullName: user.full_name,
      role: user.role,
      roleTitle: user.role_title,
      phone: user.phone,
      status: user.status
    };

    res.json({ success: true, user: userData });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

module.exports = {
  login,
  getMe
};
