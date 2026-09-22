import React from 'react';
import { useAuth } from '../../context/AuthContext';

export function PrintHeader({ title, subtitle }) {
  const { user } = useAuth();
  const currentDate = new Date().toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="print-only mb-6 border-b-2 border-black pb-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold uppercase tracking-tight text-black">
            ERP «Цемент» — Производственно-логистический комплекс
          </h1>
          <p className="text-xs text-zinc-600">
            Официальный отчет системы оперативного и складского учета
          </p>
        </div>
        <div className="text-right text-xs text-zinc-600">
          <p>Дата печати: <strong>{currentDate}</strong></p>
          <p>Сформировал: <strong>{user?.fullName || 'Администратор'} ({user?.roleTitle || 'Админ'})</strong></p>
        </div>
      </div>

      <div className="mt-4 pt-2 border-t border-zinc-300 flex items-center justify-between">
        <h2 className="text-base font-bold text-black uppercase">{title}</h2>
        {subtitle && <p className="text-xs text-zinc-600">{subtitle}</p>}
      </div>
    </div>
  );
}

export function PrintFooter() {
  return (
    <div className="print-only mt-12 pt-6 border-t border-zinc-400 text-xs text-black">
      <div className="grid grid-cols-3 gap-6">
        <div>
          <p className="font-semibold mb-6">Руководитель предприятия:</p>
          <p className="border-b border-black w-48"></p>
          <p className="text-[10px] text-zinc-500 mt-1">подпись / расшифровка</p>
        </div>
        <div>
          <p className="font-semibold mb-6">Главный бухгалтер:</p>
          <p className="border-b border-black w-48"></p>
          <p className="text-[10px] text-zinc-500 mt-1">подпись / расшифровка</p>
        </div>
        <div>
          <p className="font-semibold mb-6">Ответственный оператор:</p>
          <p className="border-b border-black w-48"></p>
          <p className="text-[10px] text-zinc-500 mt-1">подпись / расшифровка</p>
        </div>
      </div>
    </div>
  );
}
