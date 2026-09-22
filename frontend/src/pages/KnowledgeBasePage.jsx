import React, { useState } from 'react';
import {
  BookOpen, Search, HelpCircle, Shield, ShoppingBag, 
  Truck, DollarSign, Database, FileText, CheckCircle2, 
  ChevronDown, ChevronRight, Download, Layers, AlertCircle,
  ExternalLink, Sparkles, Key, Warehouse, Info
} from 'lucide-react';

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
    { id: 'logistics', label: '5. Транспорт и Логистика', icon: Truck },
    { id: 'finance', label: '6. Финансы и Касса', icon: DollarSign },
    { id: 'admin', label: '7. Права и Аудит', icon: Shield },
    { id: 'backup', label: '8. Бэкапы и Данные', icon: Database },
  ];

  const guideArticles = [
    {
      id: 'start-1',
      category: 'start',
      title: 'Обзор системы «ERP Цемент» и основные концепции',
      description: 'Архитектурное назначение платформы, роли пользователей и принципы автоматизации.',
      content: (
        <div className="space-y-3 text-sm text-slate-600">
          <p>
            Система <strong>«ERP Цемент»</strong> разработана специально для оптовых предприятий, торгующих цементом и строительными смесями. Платформа полностью синхронизирует складские остатки, прямые заводские квоты (тикеты), учет транспорта и финансовую кассу.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-3">
            <div className="p-3 rounded-lg bg-purple-50 border border-purple-200">
              <span className="font-semibold text-purple-900 block text-xs">Администратор</span>
              <p className="text-xs text-purple-700 mt-1">Полный доступ ко всем модулям, управление пользователями, журнал аудита всех действий, создание бэкапов.</p>
            </div>
            <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
              <span className="font-semibold text-blue-900 block text-xs">Оператор склада</span>
              <p className="text-xs text-blue-700 mt-1">Оформление сделок продаж, выписка накладных и ТТН, оприходование цемента в силосы, контроль отгрузок.</p>
            </div>
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
              <span className="font-semibold text-emerald-900 block text-xs">Бухгалтер</span>
              <p className="text-xs text-emerald-700 mt-1">Кассовые ордера (приход/расход), сверка дебиторской задолженности, контроль брокерского счета заводов.</p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'start-2',
      category: 'start',
      title: 'Горячие клавиши и навигация',
      description: 'Быстрые действия и рекомендации для ускорения работы операторов.',
      content: (
        <div className="space-y-2 text-sm text-slate-600">
          <p>Для комфортной работы предусмотрено адаптивное боковое меню. Вы можете свернуть его нажатием на кнопку со стрелкой слева от шапки, чтобы освободить рабочее пространство для широких таблиц отчетов.</p>
          <ul className="list-disc pl-5 space-y-1 text-xs">
            <li><strong>Кнопки печати</strong> в таблицах и модалках формируют чистый бланк документа без фоновых графиков и панелей.</li>
            <li><strong>Экспорт в Excel/CSV</strong> доступен в один клик в разделах «Продажи», «Финансы» и «Аудит».</li>
            <li><strong>Карточки статистики</strong> открывают развернутые модальные окна при клике на иконку максимизации или саму карточку.</li>
          </ul>
        </div>
      )
    },
    {
      id: 'warehouse-1',
      category: 'warehouse',
      title: 'Складской учет цемента и мониторинг силосов',
      description: 'Правила оприходования, контроль неснижаемого остатка и защита от отрицательного баланса.',
      content: (
        <div className="space-y-3 text-sm text-slate-600">
          <p>
            В разделе <strong>«Склад»</strong> в режиме реального времени отображаются остатки всех позиций: насыпной цемент (марки М400, М500, Сульфатостойкий), тарированный цемент в мешках по 50 кг и строительные добавки.
          </p>
          <div className="p-3.5 bg-amber-50 rounded-lg border border-amber-200 text-amber-900 text-xs leading-relaxed">
            <strong>⚠️ Защита от пересортицы и дефицита:</strong> Система программно запрещает проведение отгрузки со склада, если запрашиваемое клиентом количество превышает текущий фактический остаток в силосе. В таком случае система уведомит оператора точным сообщением с указанием доступного объема.
          </div>
          <p className="text-xs">
            При достижении неснижаемого остатка (порог задается в свойствах товара) карточка силоса подсвечивается янтарным предупреждающим индикатором, сигнализируя о необходимости заказа новой партии.
          </p>
        </div>
      )
    },
    {
      id: 'tickets-1',
      category: 'tickets',
      title: 'Заводские квоты (Тикеты) и брокерский счет',
      description: 'Работа с биржевыми закупками, отгрузка клиентам прямо с завода и возврат средств.',
      content: (
        <div className="space-y-3 text-sm text-slate-600">
          <p>
            <strong>Тикет</strong> — это предоплаченный объем цемента на заводе-производителе (например, Кизилкумцемент, Бекабадцемент, Алмалык).
          </p>
          <ol className="list-decimal pl-5 space-y-1.5 text-xs">
            <li><strong>Оформление прихода по тикету:</strong> В форме оприходования выберите «Назначение: Заводской тикет (квота)» и введите биржевой номер тикета.</li>
            <li><strong>Отгрузка с завода напрямую:</strong> При оформлении продажи выберите источник «Заводской тикет». Тоннаж спишется с остатка квоты завода, не затрагивая физический склад.</li>
            <li><strong>Возврат неиспользованного остатка:</strong> Если квота закрывается, а остаток цемента не выбран, оператор может нажать «Возврат остатка». Неиспользованная сумма автоматически возвращается на брокерский счет и фиксируется в кассе.</li>
          </ol>
        </div>
      )
    },
    {
      id: 'sales-1',
      category: 'sales',
      title: 'Оформление продажи, выборки и генерация ТТН',
      description: 'Пошаговый процесс создания сделки отгрузки, расчет логистики и печать документов.',
      content: (
        <div className="space-y-3 text-sm text-slate-600">
          <p>Для создания отгрузки нажмите <strong>«+ Оформить сделку»</strong> на странице «Продажи и отгрузки»:</p>
          <div className="space-y-2 text-xs">
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-md">
              <span className="font-bold text-slate-800">Шаг 1: Клиент и товар</span>
              <p className="text-slate-600 mt-0.5">Выберите контрагента из справочника. Укажите марку цемента, тип тары и тоннаж.</p>
            </div>
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-md">
              <span className="font-bold text-slate-800">Шаг 2: Доставка и Логистика</span>
              <p className="text-slate-600 mt-0.5">Выберите тип: «Самовывоз» или «Доставка». Если доставка осуществляется транспортом предприятия, укажите тариф за тонну — система автоматически рассчитает общую сумму транспортных услуг.</p>
            </div>
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-md">
              <span className="font-bold text-slate-800">Шаг 3: Оплата и статус</span>
              <p className="text-slate-600 mt-0.5">Укажите фактически внесенную сумму (наличными, перечислением или картой). Если сумма меньше общего счета сделки, разница автоматически запишется в дебиторскую задолженность клиента.</p>
            </div>
          </div>
          <p className="text-xs">После сохранения система сформирует товарно-транспортную накладную (ТТН), доступную для мгновенной печати.</p>
        </div>
      )
    },
    {
      id: 'logistics-1',
      category: 'logistics',
      title: 'Учет автопарка и весовой контроль',
      description: 'Собственный и привлеченный транспорт, весовые талоны и история рейсов цементовозов.',
      content: (
        <div className="space-y-3 text-sm text-slate-600">
          <p>
            В модуле предусмотрен справочник автотранспорта с разделением на:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-xs">
            <li><strong>Собственный автопарк предприятия</strong> (цементовозы, полуприцепы-бочки, бортовые длинномеры).</li>
            <li><strong>Наемный и клиентский транспорт</strong>.</li>
          </ul>
          <p className="text-xs">
            При проведении взвешивания на автовесах (брутто / нетто / тара) данные вносятся в сделку. В отчете по автомобилю можно в любой момент увидеть пробег, суммарно перевезенный тоннаж и финансовую выручку по конкретному водителю.
          </p>
        </div>
      )
    },
    {
      id: 'finance-1',
      category: 'finance',
      title: 'Касса, валютные расчеты и управление задолженностью',
      description: 'Учет кассовых ордеров (UZS/USD), дебиторка клиентов и погашение долгов.',
      content: (
        <div className="space-y-3 text-sm text-slate-600">
          <p>Раздел <strong>«Финансы»</strong> отражает финансовое здоровье компании:</p>
          <ul className="list-disc pl-5 space-y-1 text-xs">
            <li><strong>Кассовая книга:</strong> Приходные и расходные ордера по категориям (оплата за цемент, логистика, газ/ГСМ, запчасти, питание, зарплата).</li>
            <li><strong>Мультивалютность:</strong> Поддержка операций в долларах США (USD) с фиксацией курса конвертации на момент сделки.</li>
            <li><strong>Дебиторская задолженность:</strong> Список клиентов с отрицательным балансом. При поступлении денег доступна функция «Погасить долг», которая списывает долг и формирует приходный ордер в кассу.</li>
          </ul>
        </div>
      )
    },
    {
      id: 'admin-1',
      category: 'admin',
      title: 'Управление пользователями и Журнал аудита действий',
      description: 'Как создавать учетные записи, назначать роли и отслеживать любые изменения персонала.',
      content: (
        <div className="space-y-3 text-sm text-slate-600">
          <p>
            Только пользователи с ролью <strong>Администратор</strong> имеют доступ к разделу «Пользователи и безопасность»:
          </p>
          <div className="space-y-2 text-xs">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="font-semibold text-slate-900">Создание нового сотрудника:</span>
              <p className="text-slate-600 mt-1">
                Нажмите «+ Добавить пользователя», введите ФИО, уникальный логин, пароль и выберите роль доступа (Оператор склада, Бухгалтер, Наблюдатель).
              </p>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="font-semibold text-slate-900">Журнал аудита (Activity Log):</span>
              <p className="text-slate-600 mt-1">
                Система фиксирует каждый вход в систему (успешный или с неверным паролем), создание и изменение сделок, приход товара, кассовые проводки с указанием точного времени, пользователя и IP-адреса. Любая попытка несанкционированного действия мгновенно регистрируется.
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'backup-1',
      category: 'backup',
      title: 'Резервное копирование и сохранность базы данных',
      description: 'Создание снимков SQLite, выгрузка бэкапов и регламент обслуживания.',
      content: (
        <div className="space-y-3 text-sm text-slate-600">
          <p>
            База данных работает на высокопроизводительном движке SQLite с включенным режимом <strong>WAL (Write-Ahead Logging)</strong>. Это обеспечивает атомарную сохранность транзакций даже при внезапном отключении электропитания.
          </p>
          <div className="p-3.5 bg-indigo-50 border border-indigo-200 rounded-lg text-indigo-950 text-xs">
            <span className="font-bold block mb-1">Как сделать резервную копию:</span>
            Нажмите кнопку «Скачать бэкап базы» в шапке сайта или перейдите по ссылке <code>/api/backup</code>. Браузер скачает текущую полную копию базы с датой в названии (например, <code>erp_cement_backup_2026-09-22.sqlite</code>).
          </div>
          <p className="text-xs text-slate-500">
            Рекомендуется выполнять выгрузку бэкапа в конце каждого рабочего дня или перед обновлением серверного программного обеспечения.
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
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 sm:p-8 text-white shadow-xl border border-slate-800">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            Официальное руководство пользователя
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            База знаний и инструкция «ERP Цемент»
          </h1>
          <p className="mt-2 text-sm sm:text-base text-slate-300 leading-relaxed">
            Подробное интерактивное руководство по всем технологическим и финансовым процессам: от приемки цемента в силосы до выписки ТТН и контроля дебиторки.
          </p>

          {/* Search bar inside hero */}
          <div className="mt-5 relative max-w-xl">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск по инструкции (например: тикет, ТТН, силос, бэкап, пароль)..."
              className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/10 text-white placeholder-slate-400 border border-white/20 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-slate-900/80 text-sm backdrop-blur-md transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white bg-white/10 px-2 py-1 rounded"
              >
                Очистить
              </button>
            )}
          </div>
        </div>

        {/* Decorative backdrop shapes */}
        <div className="absolute right-0 top-0 -mt-10 -mr-10 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/2 bottom-0 -mb-10 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                isActive
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                  : 'bg-white text-slate-600 hover:text-slate-900 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Guide Content Accordion */}
      <div className="space-y-4">
        {filteredArticles.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500">
            <Info className="w-8 h-8 mx-auto mb-2 text-slate-400" />
            <p className="font-medium text-slate-700">Ничего не найдено по запросу «{searchQuery}»</p>
            <p className="text-xs text-slate-400 mt-1">Попробуйте изменить формулировку или сбросить фильтры категорий</p>
          </div>
        ) : (
          filteredArticles.map((art) => {
            const isOpen = openSections[art.id];
            return (
              <div
                key={art.id}
                className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden transition"
              >
                <button
                  onClick={() => toggleSection(art.id)}
                  className="w-full flex items-start justify-between p-5 text-left hover:bg-slate-50/70 transition"
                >
                  <div className="pr-4">
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      {art.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      {art.description}
                    </p>
                  </div>
                  <div className="p-1 rounded-lg bg-slate-100 text-slate-500 mt-0.5 shrink-0">
                    {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </div>
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 pt-1 border-t border-slate-100 bg-slate-50/30">
                    {art.content}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Support & Warranty Card */}
      <div className="bg-gradient-to-br from-indigo-50 to-white rounded-xl border border-indigo-200/80 p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 text-sm">Коммерческая лицензия и техническая поддержка</h4>
            <p className="text-xs text-slate-600 mt-0.5">
              Система полностью подготовлена к развертыванию на собственных серверах предприятия (On-Premise / Cloud VPS).
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <a
            href="/api/backup"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-indigo-600" />
            Скачать бэкап базы
          </a>
        </div>
      </div>
    </div>
  );
}
