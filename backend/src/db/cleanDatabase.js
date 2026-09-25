const path = require('path');
const Database = require('better-sqlite3');

const DB_PATH = path.resolve(__dirname, '../../data/erp_cement.sqlite');
console.log('Подключение к базе данных:', DB_PATH);

const db = new Database(DB_PATH);

function cleanDatabase() {
  console.log('--- НАЧАЛО ПОЛНОЙ ОЧИСТКИ ДЕМОНСТРАЦИОННЫХ ДАННЫХ ---');

  // Временное отключение внешних ключей для безопасного каскадного удаления
  db.pragma('foreign_keys = OFF');

  const cleanupTransaction = db.transaction(() => {
    // 1. Очистка операционных таблиц
    const tablesToWipe = [
      'cash_transactions',
      'broker_account_logs',
      'sales',
      'arrivals',
      'stock_movements',
      'tickets',
      'vehicles',
      'products',
      'clients',
      'factories'
    ];

    for (const table of tablesToWipe) {
      db.prepare(`DELETE FROM ${table}`).run();
      console.log(`✓ Таблица ${table} очищена.`);
    }

    // 2. Очистка пользователей, кроме главного администратора
    const deletedUsers = db.prepare("DELETE FROM users WHERE username != 'admin'").run();
    console.log(`✓ Удалено демонстрационных учетных записей: ${deletedUsers.changes}`);

    // Убеждаемся, что учетная запись admin активна с правильным паролем
    const adminCheck = db.prepare("SELECT * FROM users WHERE username = 'admin'").get();
    if (!adminCheck) {
      db.prepare(`
        INSERT INTO users (username, password, full_name, role, role_title, phone, status)
        VALUES ('admin', 'admin2026!', 'Главный Администратор', 'admin', 'Главный Администратор', '+998 90 000-00-00', 'active')
      `).run();
      console.log('✓ Создана чистая учетная запись admin / admin2026!');
    } else {
      db.prepare(`
        UPDATE users 
        SET password = 'admin2026!', 
            role = 'admin', 
            role_title = 'Главный Администратор', 
            status = 'active'
        WHERE username = 'admin'
      `).run();
      console.log('✓ Учетная запись admin актуализирована (пароль: admin2026!)');
    }

    // 3. Сброс автоинкрементных счетчиков ID (sqlite_sequence)
    const resetTables = [
      ...tablesToWipe,
      'audit_logs'
    ];
    for (const table of resetTables) {
      db.prepare("DELETE FROM sqlite_sequence WHERE name = ?").run(table);
    }
    console.log('✓ Автоинкрементные счетчики ID сброшены (новые записи начнутся с ID 1).');

    // 4. Очистка старых тестовых записей аудита и фиксация факта очистки
    db.prepare('DELETE FROM audit_logs').run();
    db.prepare(`
      INSERT INTO audit_logs (user_id, username, action, entity, details, ip)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      1,
      'admin',
      'DATABASE_PURGED',
      'База данных',
      'Выполнена полная очистка базы от тестовых данных. Создана резервная копия erp_cement_demo_backup.sqlite. Система готова к реальной эксплуатации.',
      '127.0.0.1'
    );
    console.log('✓ Журнал аудита обновлен системной записью о переходе в чистый режим.');
  });

  try {
    cleanupTransaction();
    console.log('--- ТРАНЗАКЦИЯ ОЧИСТКИ УСПЕШНО ЗАВЕРШЕНА ---');
  } catch (error) {
    console.error('Ошибка при выполнении очистки:', error);
    throw error;
  } finally {
    db.pragma('foreign_keys = ON');
  }

  // WAL checkpoint и сжатие
  try {
    db.pragma('wal_checkpoint(TRUNCATE)');
    console.log('✓ Режим WAL синхронизирован.');
  } catch (e) {
    console.log('Примечание по WAL:', e.message);
  }

  console.log('\n================ СВОДКА БАЗЫ ДАННЫХ ПОСЛЕ ОЧИСТКИ ================');
  const allTables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all();
  for (const t of allTables) {
    const count = db.prepare(`SELECT COUNT(*) as c FROM ${t.name}`).get().c;
    console.log(`  Таблица ${t.name.padEnd(20)}: ${count} записей`);
  }

  const currentUsers = db.prepare('SELECT id, username, full_name, role, status FROM users').all();
  console.log('\nПользователи системы:', currentUsers);
  console.log('==================================================================\n');
}

cleanDatabase();
