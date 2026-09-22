const { db } = require('../config/database');

/**
 * Получение журнала аудита с фильтрацией, поиском и пагинацией
 */
function getAuditLogs(req, res) {
  try {
    const {
      limit = 100,
      offset = 0,
      action = '',
      username = '',
      search = '',
      startDate = '',
      endDate = ''
    } = req.query;

    const conditions = [];
    const params = [];

    if (action) {
      conditions.push('action = ?');
      params.push(action);
    }

    if (username) {
      conditions.push('username = ?');
      params.push(username);
    }

    if (search) {
      conditions.push('(username LIKE ? OR action LIKE ? OR entity LIKE ? OR details LIKE ? OR ip LIKE ?)');
      const term = `%${search}%`;
      params.push(term, term, term, term, term);
    }

    if (startDate) {
      conditions.push('created_at >= ?');
      params.push(startDate + ' 00:00:00');
    }

    if (endDate) {
      conditions.push('created_at <= ?');
      params.push(endDate + ' 23:59:59');
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Подсчет общего количества
    const totalCountQuery = `SELECT COUNT(*) as count FROM audit_logs ${whereClause}`;
    const totalResult = db.prepare(totalCountQuery).get(...params);
    const total = totalResult ? totalResult.count : 0;

    // Выборка записей с пагинацией
    const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 500);
    const parsedOffset = Math.max(parseInt(offset, 10) || 0, 0);

    const logsQuery = `
      SELECT id, user_id, username, action, entity, details, ip, created_at, created_at as timestamp
      FROM audit_logs
      ${whereClause}
      ORDER BY id DESC
      LIMIT ? OFFSET ?
    `;

    const logs = db.prepare(logsQuery).all(...params, parsedLimit, parsedOffset);

    // Сводные данные активности за сегодня и по категориям
    const todayStats = db.prepare(`
      SELECT 
        COUNT(*) as total_today,
        SUM(CASE WHEN action LIKE 'LOGIN%' THEN 1 ELSE 0 END) as logins_today,
        SUM(CASE WHEN action = 'LOGIN_FAILED' THEN 1 ELSE 0 END) as security_alerts,
        SUM(CASE WHEN action LIKE 'SALE%' OR action LIKE 'ARRIVAL%' THEN 1 ELSE 0 END) as operations_today
      FROM audit_logs
      WHERE date(created_at) = date('now', 'localtime')
    `).get();

    // Список доступных пользователей и уникальных действий для фильтра
    const uniqueActions = db.prepare('SELECT DISTINCT action FROM audit_logs ORDER BY action ASC').all().map(r => r.action);
    const uniqueUsers = db.prepare('SELECT DISTINCT username FROM audit_logs WHERE username IS NOT NULL ORDER BY username ASC').all().map(r => r.username);

    res.json({
      success: true,
      data: logs,
      total,
      limit: parsedLimit,
      offset: parsedOffset,
      stats: todayStats || { total_today: 0, logins_today: 0, security_alerts: 0, operations_today: 0 },
      filters: {
        actions: uniqueActions,
        users: uniqueUsers
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * Очистка старых логов (архивация/удаление старше N дней)
 */
function cleanupAuditLogs(req, res) {
  try {
    const days = parseInt(req.body.days, 10) || 90;
    const result = db.prepare(`
      DELETE FROM audit_logs 
      WHERE created_at < datetime('now', '-' || ? || ' days', 'localtime')
    `).run(days);

    res.json({
      success: true,
      message: `Удалено ${result.changes} старых записей журнала (старше ${days} дней)`
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

module.exports = {
  getAuditLogs,
  cleanupAuditLogs
};
