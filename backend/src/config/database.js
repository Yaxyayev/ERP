const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DATA_DIR = path.resolve(__dirname, '../../data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, 'erp_cement.sqlite');

// Инициализация соединения с базой данных
const db = new Database(DB_PATH, {
  verbose: process.env.NODE_ENV === 'development' ? console.log : null
});

// Настройка быстродействия и целостности
db.pragma('journal_mode = WAL');       // Write-Ahead Logging для конкурентного чтения и надежности
db.pragma('foreign_keys = ON');         // Включение контроля внешних ключей
db.pragma('synchronous = NORMAL');      // Баланс скорости и сохранности данных в режиме WAL

// Автоматическая инициализация схемы таблиц при старте
function initSchema() {
  const schemaPath = path.resolve(__dirname, '../db/schema.sql');
  if (fs.existsSync(schemaPath)) {
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    db.exec(schemaSql);
  }

  // Проверяем наличие пользователей, при отсутствии создаем учетную запись администратора
  try {
    const userCount = db.prepare('SELECT count(*) as count FROM users').get();
    if (userCount.count === 0) {
      const insertUser = db.prepare(`
        INSERT INTO users (username, password, full_name, role, role_title, phone, status)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      insertUser.run('admin', 'admin2026!', 'Главный Администратор', 'admin', 'Главный Администратор', '+998 90 000-00-00', 'active');

      // Начальная запись в журнал аудита
      db.prepare(`
        INSERT INTO audit_logs (username, action, entity, details, ip)
        VALUES (?, ?, ?, ?, ?)
      `).run('admin', 'SYSTEM_INIT', 'База данных', 'Инициализация чистой рабочей базы ERP Цемент. Учетная запись администратора активирована.', '127.0.0.1');

      console.log('Пользователь успешно инициализирован: admin / admin2026!');
    }
  } catch (err) {
    console.error('Ошибка инициализации пользователей:', err.message);
  }
}

initSchema();

module.exports = {
  db,
  DB_PATH,
  DATA_DIR
};
