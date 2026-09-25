import React, { useState } from 'react';
import { AlertTriangle, Trash2, Download, CheckCircle2, Loader2, X, RefreshCcw, ShieldCheck } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { api } from '../../api/client';

export function ResetDatabaseModal({ isOpen, onClose, onResetSuccess }) {
  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(false);
  const [backupLoading, setBackupLoading] = useState(false);
  const [backupSaved, setBackupSaved] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const isConfirmed = confirmText.trim().toUpperCase() === 'СБРОС';

  const handleDownloadBackup = async () => {
    try {
      setBackupLoading(true);
      const filename = await api.downloadBackup();
      setBackupSaved(filename);
      setTimeout(() => setBackupSaved(null), 8000);
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'Ошибка создания бэкапа' });
    } finally {
      setBackupLoading(false);
    }
  };

  const handleReset = async () => {
    if (!isConfirmed) return;
    try {
      setLoading(true);
      setFeedback(null);
      const res = await api.resetDatabase();
      setFeedback({
        type: 'success',
        text: res.message || 'База данных успешно обнулена! Перезагрузка страницы...'
      });
      setTimeout(() => {
        if (onResetSuccess) {
          onResetSuccess();
        } else {
          window.location.reload();
        }
      }, 1500);
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err.message || 'Не удалось обнулить базу данных'
      });
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return;
    setConfirmText('');
    setFeedback(null);
    setBackupSaved(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Полное обнуление и сброс базы данных"
      description="Удаление всех операционных данных и возврат системы к исходному чистому состоянию"
      maxWidth="max-w-xl"
    >
      <div className="space-y-4 pt-1">
        {/* Предупреждающий блок в стиле Notion (Rose) */}
        <div className="p-3.5 rounded-lg border border-red-200/60 dark:border-red-900/40 bg-red-50/60 dark:bg-red-950/20 text-xs space-y-2.5">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded bg-red-100 dark:bg-red-900/60 text-red-600 dark:text-red-400">
              <AlertTriangle className="h-4 w-4" />
            </span>
            <span className="font-semibold text-red-700 dark:text-red-300">
              Внимание: необратимое действие
            </span>
            <Badge variant="rose" className="ml-auto text-[10px]">
              Опасная операция
            </Badge>
          </div>

          <p className="text-red-900/80 dark:text-red-200/80 leading-relaxed">
            Это действие <strong>безвозвратно удалит</strong> все зарегистрированные данные в системе:
          </p>

          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px] text-red-900/70 dark:text-red-200/70">
            <li className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
              <span>Все продажи и отгрузки</span>
            </li>
            <li className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
              <span>Приходы цемента и квоты/тикеты</span>
            </li>
            <li className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
              <span>Складские остатки и движения</span>
            </li>
            <li className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
              <span>Кассовые операции и долги клиентов</span>
            </li>
            <li className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
              <span>Справочники заводов и клиентов</span>
            </li>
            <li className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
              <span>Автопарк (тягачи и цементовозы)</span>
            </li>
          </ul>
        </div>

        {/* Гарантия безопасности аккаунта админа */}
        <div className="p-3 rounded-lg border border-hairline bg-surface text-xs space-y-1.5">
          <div className="flex items-center gap-1.5 text-steel font-medium">
            <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span className="text-foreground font-semibold">Гарантия сохранения доступа</span>
          </div>
          <p className="text-steel text-[11px] leading-relaxed">
            Учетная запись Главного Администратора (<code className="font-mono bg-background px-1 py-0.5 rounded border border-hairline text-foreground">admin</code> / <code className="font-mono bg-background px-1 py-0.5 rounded border border-hairline text-foreground">admin2026!</code>) сохраняется. Счетчики ID сбрасываются на 1.
          </p>
        </div>

        {/* Скачивание бэкапа перед сбросом */}
        <div className="flex items-center justify-between p-3 rounded-lg border border-hairline bg-surface text-xs">
          <div>
            <div className="font-medium text-foreground">Резервная копия перед очисткой</div>
            <div className="text-[11px] text-steel">Рекомендуется сохранить копию на компьютер</div>
            {backupSaved && (
              <div className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-0.5">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Бэкап скачан: {backupSaved}</span>
              </div>
            )}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleDownloadBackup}
            disabled={backupLoading || loading}
            className="h-8 px-3 text-xs shrink-0"
          >
            {backupLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
            ) : (
              <Download className="h-3.5 w-3.5 mr-1.5" />
            )}
            Скачать бэкап
          </Button>
        </div>

        {/* Поле подтверждения */}
        <div className="space-y-1.5 pt-1">
          <label className="text-xs font-medium text-foreground block">
            Для подтверждения введите слово <span className="font-bold text-red-600 dark:text-red-400 font-mono">СБРОС</span>:
          </label>
          <Input
            type="text"
            placeholder="СБРОС"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            disabled={loading}
            className="font-mono uppercase tracking-wider text-center"
          />
        </div>

        {/* Уведомление об ошибке или успехе */}
        {feedback && (
          <div
            className={`p-3 rounded-md text-xs flex items-center gap-2 border ${
              feedback.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                : 'bg-red-50 dark:bg-red-950/30 border-red-300 dark:border-red-800 text-red-700 dark:text-red-300'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
            ) : (
              <AlertTriangle className="h-4 w-4 shrink-0 text-red-500" />
            )}
            <span>{feedback.text}</span>
          </div>
        )}

        {/* Кнопки действий */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-hairline">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleClose}
            disabled={loading}
            className="h-8 px-3 text-xs"
          >
            Отмена
          </Button>

          <Button
            type="button"
            size="sm"
            disabled={!isConfirmed || loading}
            onClick={handleReset}
            className={`h-8 px-4 text-xs font-semibold transition-all ${
              isConfirmed
                ? 'bg-red-600 hover:bg-red-700 text-white shadow-xs'
                : 'bg-muted text-muted-foreground cursor-not-allowed opacity-50'
            }`}
          >
            {loading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                <span>Очистка базы данных...</span>
              </>
            ) : (
              <>
                <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                <span>Обнулить все данные в БД</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
