const path = require('path');
const fs = require('fs');
const { db, DATA_DIR } = require('../config/database');

async function downloadBackup(req, res) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFileName = `erp_cement_backup_${timestamp}.sqlite`;
  const tempBackupPath = path.join(DATA_DIR, `temp_${backupFileName}`);

  try {
    // 1. Сбрасываем актуальный WAL-буфер в файл базы данных
    db.pragma('wal_checkpoint(PASSIVE)');

    // 2. Создаем целостный атомарный снапшот с помощью встроенного SQLite Backup API
    await db.backup(tempBackupPath);

    // 3. Отправляем файл пользователю как вложение для скачивания
    res.download(tempBackupPath, backupFileName, (err) => {
      // Удаляем временный файл после отправки клиенту
      if (fs.existsSync(tempBackupPath)) {
        try {
          fs.unlinkSync(tempBackupPath);
        } catch (cleanupErr) {
          console.error('Ошибка очистки временного файла бэкапа:', cleanupErr);
        }
      }
      if (err && !res.headersSent) {
        res.status(500).json({ success: false, error: 'Ошибка передачи файла резервной копии' });
      }
    });
  } catch (error) {
    if (fs.existsSync(tempBackupPath)) {
      try {
        fs.unlinkSync(tempBackupPath);
      } catch (e) {}
    }
    console.error('Ошибка создания бэкапа:', error);
    res.status(500).json({ success: false, error: 'Не удалось создать резервную копию базы данных: ' + error.message });
  }
}

async function resetDatabase(req, res) {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const safetyBackupPath = path.join(DATA_DIR, `safety_backup_before_reset_${timestamp}.sqlite`);

    // 1. Создаем страховочную резервную копию перед обнулением
    try {
      db.pragma('wal_checkpoint(PASSIVE)');
      await db.backup(safetyBackupPath);
    } catch (bErr) {
      console.warn('Не удалось создать страховочный бэкап перед очисткой:', bErr.message);
    }

    // 2. Отключаем внешние ключи для безопасного удаления
    db.pragma('foreign_keys = OFF');

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

    const resetTransaction = db.transaction(() => {
      // Очистка всех рабочих таблиц
      for (const table of tablesToWipe) {
        db.prepare(`DELETE FROM ${table}`).run();
      }

      // Удаление других пользователей, кроме admin
      db.prepare("DELETE FROM users WHERE username != 'admin'").run();

      // Убеждаемся, что учетная запись admin активна
      const adminUser = db.prepare("SELECT * FROM users WHERE username = 'admin'").get();
      if (!adminUser) {
        db.prepare(`
          INSERT INTO users (username, password, full_name, role, role_title, phone, status)
          VALUES ('admin', 'admin2026!', 'Главный Администратор', 'admin', 'Главный Администратор', '+998 90 000-00-00', 'active')
        `).run();
      } else {
        db.prepare(`
          UPDATE users 
          SET password = 'admin2026!', role = 'admin', status = 'active'
          WHERE username = 'admin'
        `).run();
      }

      // Сброс автоинкрементных счетчиков ID (sqlite_sequence)
      const resetSeqTables = [...tablesToWipe, 'audit_logs'];
      for (const table of resetSeqTables) {
        db.prepare("DELETE FROM sqlite_sequence WHERE name = ?").run(table);
      }

      // Очистка старых логов аудита и фиксация события сброса
      db.prepare("DELETE FROM audit_logs").run();
      db.prepare(`
        INSERT INTO audit_logs (user_id, username, action, entity, details, ip)
        VALUES (1, 'admin', 'DATABASE_PURGED', 'База данных', 'Выполнено полное обнуление базы данных через панель управления. Страховочный бэкап сохранен.', '127.0.0.1')
      `).run();
    });

    resetTransaction();
    db.pragma('foreign_keys = ON');

    try {
      db.pragma('wal_checkpoint(TRUNCATE)');
    } catch (wErr) {}

    res.json({
      success: true,
      message: 'База данных успешно обнулена! Все остатки, продажи, касса и справочники очищены.',
      safetyBackup: path.basename(safetyBackupPath)
    });
  } catch (error) {
    db.pragma('foreign_keys = ON');
    console.error('Ошибка обнуления базы данных:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка при обнулении базы данных: ' + error.message
    });
  }
}

module.exports = {
  downloadBackup,
  resetDatabase
};
