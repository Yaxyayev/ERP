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

module.exports = {
  downloadBackup
};
