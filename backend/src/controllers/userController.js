const { db } = require('../config/database');
const { logAudit } = require('../services/auditService');

function getUsers(req, res) {
  try {
    const users = db.prepare(`
      SELECT id, username, full_name, role, role_title, phone, status, last_login, created_at
      FROM users
      ORDER BY id ASC
    `).all();

    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

function createUser(req, res) {
  try {
    const { username, password, full_name, role, role_title, phone } = req.body;
    const clientIp = req.ip || req.connection?.remoteAddress || '127.0.0.1';

    if (!username || !password || !full_name) {
      return res.status(400).json({ success: false, error: 'Заполните обязательные поля: логин, пароль, ФИО' });
    }

    const trimmedUser = username.trim().toLowerCase();
    const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(trimmedUser);
    if (existing) {
      return res.status(400).json({ success: false, error: 'Пользователь с таким логином уже существует' });
    }

    const assignedRole = role || 'operator';
    const assignedTitle = role_title || (
      assignedRole === 'admin' ? 'Администратор' :
      assignedRole === 'operator' ? 'Оператор склада' :
      assignedRole === 'accountant' ? 'Бухгалтер' : 'Наблюдатель'
    );

    const result = db.prepare(`
      INSERT INTO users (username, password, full_name, role, role_title, phone, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 'active', datetime('now', 'localtime'))
    `).run(trimmedUser, password, full_name.trim(), assignedRole, assignedTitle, phone || '');

    logAudit(
      null,
      'admin',
      'USER_CREATE',
      `Пользователь @${trimmedUser}`,
      `Создан новый пользователь: ${full_name} [Роль: ${assignedRole}]`,
      clientIp
    );

    res.status(201).json({
      success: true,
      message: 'Пользователь успешно создан',
      data: { id: result.lastInsertRowid, username: trimmedUser, full_name, role: assignedRole }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

function updateUser(req, res) {
  try {
    const { id } = req.params;
    const { full_name, role, role_title, phone, status, password } = req.body;
    const clientIp = req.ip || req.connection?.remoteAddress || '127.0.0.1';

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'Пользователь не найден' });
    }

    // Запрет блокировки главного админа
    if (user.username === 'admin' && status === 'blocked') {
      return res.status(400).json({ success: false, error: 'Нельзя заблокировать главного администратора' });
    }

    let query = `
      UPDATE users
      SET full_name = ?, role = ?, role_title = ?, phone = ?, status = ?
    `;
    const params = [
      full_name || user.full_name,
      role || user.role,
      role_title || user.role_title,
      phone !== undefined ? phone : user.phone,
      status || user.status
    ];

    if (password && password.trim().length > 0) {
      query += `, password = ?`;
      params.push(password.trim());
    }

    query += ` WHERE id = ?`;
    params.push(id);

    db.prepare(query).run(...params);

    logAudit(
      null,
      'admin',
      'USER_UPDATE',
      `Пользователь @${user.username}`,
      `Обновлены данные пользователя: статус [${status || user.status}], роль [${role || user.role}]`,
      clientIp
    );

    res.json({ success: true, message: 'Данные пользователя обновлены' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

function deleteUser(req, res) {
  try {
    const { id } = req.params;
    const clientIp = req.ip || req.connection?.remoteAddress || '127.0.0.1';

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'Пользователь не найден' });
    }

    if (user.username === 'admin' || user.id === 1) {
      return res.status(400).json({ success: false, error: 'Главного администратора нельзя удалить' });
    }

    db.prepare('DELETE FROM users WHERE id = ?').run(id);

    logAudit(
      null,
      'admin',
      'USER_DELETE',
      `Пользователь @${user.username}`,
      `Удалена учетная запись: ${user.full_name}`,
      clientIp
    );

    res.json({ success: true, message: 'Пользователь удален' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

module.exports = {
  getUsers,
  createUser,
  updateUser,
  deleteUser
};
