import React, { useState } from 'react';
import {
  BookOpen, Search, Shield, ShoppingBag, 
  Truck, DollarSign, Database, ChevronDown, ChevronRight, 
  Download, Layers, Warehouse, Info, Sparkles
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';

export default function KnowledgeBasePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [openSections, setOpenSections] = useState({
    'start-1': true,
    'start-2': true,
    'sales-1': true
  });

  const toggleSection = (id) => {
    setOpenSections(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const categories = [
    { id: 'all', label: 'Все разделы', icon: BookOpen },
    { id: 'start', label: '1. Быстрый старт', icon: Sparkles },
    { id: 'warehouse', label: '2. Склад и Силосы', icon: Warehouse },
    { id: 'tickets', label: '3. Тикеты и Заводы', icon: Layers },
    { id: 'sales', label: '4. Продажи и ТТН', icon: ShoppingBag },
    { id: 'logistics', label: '5. Транспорт', icon: Truck },
    { id: 'finance', label: '6. Касса и Долги', icon: DollarSign },
    { id: 'admin', label: '7. Права и Аудит', icon: Shield },
    { id: 'backup', label: '8. Бэкапы', icon: Database },
  ];

  const guideArticles = [
    {
      id: 'start-1',
      category: 'start',
      title: 'Обзор архитектуры системы «ERP Цемент»',
      description: 'Назначение платформы, распределение обязанностей и ключевые роли пользователей.',
      content: (
        <div className="space-y-3 text-xs text-steel leading-relaxed">
          <p className="text-charcoal dark:text-foreground">
            Платформа <strong>«ERP Цемент»</strong> синхронизирует фактические остатки на складе, прямые заводские квоты (тикеты), весовой контроль цементовозов и кассовые операции в режиме реального времени.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 my-2">
            <div className="p-3 rounded-lg bg-tint-lavender border border-hairline">
              <span className="font-bold text-primary block text-xs">Администратор</span>
              <p className="text-[11px] text-steel mt-1">Полный доступ к системе, журнал аудита всех действий, управление учетными записями персонала, выгрузка бэкапов.</p>
            </div>
            <div className="p-3 rounded-lg bg-tint-sky border border-hairline">
              <span className="font-bold text-sky-600 dark:text-sky-300 block text-xs">Оператор склада</span>
              <p className="text-[11px] text-steel mt-1">Оформление сделок отгрузки, выписка товарно-транспортных накладных (ТТН), оприходование партий в силосы.</p>
            </div>
            <div className="p-3 rounded-lg bg-tint-mint border border-hairline">
              <span className="font-bold text-emerald-600 dark:text-emerald-300 block text-xs">Бухгалтер</span>
              <p className="text-[11px] text-steel mt-1">Приходные и расходные кассовые ордера, погашение дебиторской задолженности, учет валютных операций (UZS/USD).</p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'start-2',
      category: 'start',
      title: 'Горячие клавиши и навигация по интерфейсу',
      description: 'Быстрые действия и рекомендации по эффективному использованию приложения.',
      content: (
        <div className="space-y-2 text-xs text-steel">
          <p className="text-charcoal dark:text-foreground">Интерфейс адаптирован для быстрого ввода информации оператором весовой:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>⌘K или Ctrl+K</strong>: Открытие командной строки глобального поиска по контрагентам, автопарку и накладным.</li>
            <li><strong>⌘B или Ctrl+B</strong>: Свернуть или развернуть боковое меню для увеличения ширины рабочих таблиц.</li>
            <li><strong>Кнопка печати</strong>: Формирует чистый бланк ТТН или отчета без фоновых панелей и графиков.</li>
            <li><strong>Карточки со статистикой</strong>: Клик по карточке открывает развернутое окно с полным реестром операций.</li>
          </ul>
        </div>
      )
    },
    {
      id: 'warehouse-1',
      category: 'warehouse',
      title: 'Складской учет цемента и мониторинг силосов',
      description: 'Правила оприходования, неснижаемый остаток и программная защита от отрицательного баланса.',
      content: (
        <div className="space-y-3 text-xs text-steel leading-relaxed">
          <p className="text-charcoal dark:text-foreground">
            В разделе <strong>«Склад»</strong> в режиме реального времени отображаются остатки всех позиций: насыпной цемент (М400, М500, Сульфатостойкий), тарированный цемент в мешках по 50 кг и химические добавки.
          </p>
          <div className="p-3 rounded-lg bg-tint-peach border border-hairline text-charcoal dark:text-foreground text-xs leading-relaxed">
            <strong className="text-[#dd5b00]">⚠️ Защита от дефицита:</strong> Система программно запрещает отгрузку со склада, если запрашиваемый тоннаж превышает фактический остаток в силосе. В таком случае система уведомит оператора точным сообщением с указанием доступного объема.
          </div>
          <p>
            При достижении неснижаемого остатка карточка силоса подсвечивается янтарным индикатором, сигнализируя о необходимости заказа новой партии с завода.
          </p>
        </div>
      )
    },
    {
      id: 'tickets-1',
      category: 'tickets',
      title: 'Заводские квоты (Тикеты) и брокерский счет',
      description: 'Биржевые закупки, прямая отгрузка клиенту с завода и возврат неизрасходованных средств.',
      content: (
        <div className="space-y-3 text-xs text-steel leading-relaxed">
          <p className="text-charcoal dark:text-foreground">
            <strong>Тикет</strong> — предоплаченный объем цемента на заводе-производителе (Кизилкумцемент, Бекабадцемент, Алмалык).
          </p>
          <div className="space-y-1.5">
            <div className="p-2.5 rounded-lg bg-surface border border-hairline">
              <span className="font-semibold text-charcoal dark:text-foreground">1. Оформление прихода по тикету:</span>
              <p className="mt-0.5">В форме оприходования выберите «Назначение: Заводской тикет (квота)» и укажите биржевой номер.</p>
            </div>
            <div className="p-2.5 rounded-lg bg-surface border border-hairline">
              <span className="font-semibold text-charcoal dark:text-foreground">2. Отгрузка с завода напрямую:</span>
              <p className="mt-0.5">При создании сделки выберите источник «Заводской тикет». Тоннаж спишется с остатка квоты, не затрагивая физический склад.</p>
            </div>
            <div className="p-2.5 rounded-lg bg-surface border border-hairline">
              <span className="font-semibold text-charcoal dark:text-foreground">3. Возврат остатка:</span>
              <p className="mt-0.5">При закрытии квоты оператор нажимает «Возврат остатка». Неиспользованная сумма автоматически возвращается на брокерский счет и учитывается в кассе.</p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'sales-1',
      category: 'sales',
      title: 'Оформление продажи, выборка и печать ТТН',
      description: 'Пошаговый процесс создания сделки, расчет тарифов на доставку и проведение оплаты.',
      content: (
        <div className="space-y-3 text-xs text-steel leading-relaxed">
          <p className="text-charcoal dark:text-foreground">Для проведения сделки нажмите кнопку <strong>«+ Оформить сделку»</strong>:</p>
          <div className="space-y-1.5">
            <div className="p-2.5 rounded-lg bg-surface border border-hairline">
              <span className="font-semibold text-charcoal dark:text-foreground">Шаг 1: Контрагент и номенклатура</span>
              <p className="mt-0.5">Выберите покупателя из справочника, марку цемента, тип тары и объем партии в тоннах.</p>
            </div>
            <div className="p-2.5 rounded-lg bg-surface border border-hairline">
              <span className="font-semibold text-charcoal dark:text-foreground">Шаг 2: Доставка и логистика</span>
              <p className="mt-0.5">Выберите «Самовывоз» или «Доставка автопарком». При доставке транспортом компании укажите тариф за тонну — система рассчитает транспортные услуги автоматически.</p>
            </div>
            <div className="p-2.5 rounded-lg bg-surface border border-hairline">
              <span className="font-semibold text-charcoal dark:text-foreground">Шаг 3: Оплата и статус</span>
              <p className="mt-0.5">Укажите внесенную клиентом сумму. При неполной оплате остаток автоматически зафиксируется в дебиторской задолженности контрагента.</p>
            </div>
          </div>
          <p className="text-charcoal dark:text-foreground">Сразу после сохранения открывается официальная форма товарно-транспортной накладной (ТТН), готовая к печати.</p>
        </div>
      )
    },
    {
      id: 'logistics-1',
      category: 'logistics',
      title: 'Учет автопарка и весовой контроль',
      description: 'Собственный и привлеченный транспорт, весовые талоны и учет рейсов цементовозов.',
      content: (
        <div className="space-y-2 text-xs text-steel leading-relaxed">
          <p className="text-charcoal dark:text-foreground">
            Справочник автотранспорта разделяет тягачи на <strong>Собственный автопарк</strong> и <strong>Наемный / Транспорт покупателя</strong>.
          </p>
          <p>
            При взвешивании на автомобильных весах данные брутто/тары/нетто связываются со сделкой. В карточке автомобиля всегда доступна история рейсов, суммарный пробег и финансовая выработка по водителю.
          </p>
        </div>
      )
    },
    {
      id: 'finance-1',
      category: 'finance',
      title: 'Касса, валютные расчеты и управление долгами',
      description: 'Учет кассовых ордеров (UZS/USD), дебиторка клиентов и погашение долгов.',
      content: (
        <div className="space-y-2 text-xs text-steel leading-relaxed">
          <p className="text-charcoal dark:text-foreground">Раздел <strong>«Финансы»</strong> объединяет финансовые потоки компании:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Кассовые ордера:</strong> Приход (оплата за цемент, логистика) и расход (ГСМ, запчасти, питание водителей, зарплата).</li>
            <li><strong>Мультивалютность:</strong> Поддержка взаиморасчетов в USD с автоматической фиксацией курса конвертации.</li>
            <li><strong>Погашение долгов:</strong> Кнопка «Погасить долг» списывает задолженность с баланса клиента и формирует кассовый приход.</li>
          </ul>
        </div>
      )
    },
    {
      id: 'admin-1',
      category: 'admin',
      title: 'Управление пользователями и журнал аудита',
      description: 'Создание учетных записей персонала, назначение ролей и мониторинг действий.',
      content: (
        <div className="space-y-2 text-xs text-steel leading-relaxed">
          <p className="text-charcoal dark:text-foreground">
            Раздел <strong>«Пользователи и Аудит»</strong> доступен только администратору:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Создание сотрудников:</strong> Назначение логина, пароля и одной из 4 ролей доступа.</li>
            <li><strong>Журнал аудита:</strong> Автоматическая фиксация каждого входа, создания сделки, изменения цен и удаления записей с указанием точного времени, пользователя и IP-адреса.</li>
            <li><strong>Экспорт:</strong> Возможность скачать журнал безопасности в файл CSV.</li>
          </ul>
        </div>
      )
    },
    {
      id: 'backup-1',
      category: 'backup',
      title: 'Резервное копирование и сохранность базы данных',
      description: 'Снимки SQLite в режиме WAL, выгрузка бэкапов и регламент обслуживания.',
      content: (
        <div className="space-y-3 text-xs text-steel leading-relaxed">
          <p className="text-charcoal dark:text-foreground">
            База данных SQLite функционирует в режиме <strong>Write-Ahead Logging (WAL)</strong>, гарантируя целостность транзакций даже при внезапных сбоях электропитания.
          </p>
          <div className="p-3 rounded-lg bg-surface border border-hairline text-charcoal dark:text-foreground">
            <span className="font-semibold block mb-1">Создание резервной копии:</span>
            Нажмите кнопку «Бэкап базы (.sqlite)» в верхней панели. Браузер выгрузит полный дамп с меткой даты (например, <code>erp_cement_backup_2026-09-22.sqlite</code>).
          </div>
          <p>
            Рекомендуется выполнять резервную копию базы данных в конце каждого рабочего дня или перед обновлением серверных компонентов.
          </p>
        </div>
      )
    }
  ];

  const filteredArticles = guideArticles.filter(art => {
    const matchesCategory = activeCategory === 'all' || art.category === activeCategory;
    const matchesSearch = !searchQuery.trim() || 
      art.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      art.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-charcoal dark:text-foreground flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            База знаний и инструкция
          </h1>
          <p className="text-xs text-steel mt-0.5">
            Руководство пользователя по управлению складом, квотами, логистикой и кассой
          </p>
        </div>

        <a
          href="/api/backup"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-hairline bg-surface hover:bg-surface/80 text-charcoal dark:text-foreground text-xs font-medium transition-colors shadow-xs"
        >
          <Download className="w-3.5 h-3.5 text-primary" />
          Скачать бэкап базы
        </a>
      </div>

      {/* Search Input */}
      <Card className="border-hairline rounded-lg shadow-notion-card">
        <CardContent className="p-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-steel" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск по инструкции (например: тикет, ТТН, силос, бэкап, касса, пароль)..."
              className="flex h-8 w-full rounded-md border border-hairline bg-surface px-3 text-xs text-charcoal dark:text-foreground placeholder:text-steel pl-9 focus-visible:outline-none focus:border-primary"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-steel hover:text-foreground bg-surface border border-hairline px-1.5 py-0.5 rounded-md"
              >
                Очистить
              </button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Category Pills (Notion Pill-tabs) */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`pill-tab ${isActive ? 'active' : ''}`}
            >
              <Icon className="w-3.5 h-3.5 inline mr-1.5" />
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Guide Content Accordion */}
      <div className="space-y-3">
        {filteredArticles.length === 0 ? (
          <Card className="border-hairline rounded-lg shadow-notion-card p-8 text-center text-steel">
            <Info className="w-6 h-6 mx-auto mb-2 text-steel" />
            <p className="text-xs font-medium text-charcoal dark:text-foreground">Ничего не найдено по запросу «{searchQuery}»</p>
            <p className="text-[11px] text-steel mt-0.5">Попробуйте изменить формулировку или выбрать категорию «Все разделы»</p>
          </Card>
        ) : (
          filteredArticles.map((art) => {
            const isOpen = openSections[art.id];
            return (
              <Card
                key={art.id}
                className="border-hairline rounded-lg shadow-notion-card overflow-hidden"
              >
                <button
                  onClick={() => toggleSection(art.id)}
                  className="w-full flex items-start justify-between p-4 text-left hover:bg-surface/60 transition-colors"
                >
                  <div className="pr-4">
                    <h3 className="text-sm font-semibold text-charcoal dark:text-foreground flex items-center gap-2">
                      {art.title}
                    </h3>
                    <p className="text-xs text-steel mt-0.5">
                      {art.description}
                    </p>
                  </div>
                  <div className="p-1 rounded-md text-steel shrink-0 mt-0.5">
                    {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </div>
                </button>

                {isOpen && (
                  <div className="px-4 pb-4 pt-3 border-t border-hairline bg-surface/30">
                    {art.content}
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
