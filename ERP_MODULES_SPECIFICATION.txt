# ERP «ЦЕМЕНТ» — ПОЛНАЯ МОДУЛЬНАЯ СПЕЦИФИКАЦИЯ И ПЛАН РАЗРАБОТКИ

Данный документ содержит исчерпывающее техническое руководство для поэтапного создания системы операционного и финансового учета «ERP Цемент» с нуля. Каждый модуль спроектирован как самостоятельная страница.

---

## 1. АРХИТЕКТУРНЫЙ ФУНДАМЕНТ И СТЕК ТЕХНОЛОГИЙ

### Backend:
- **Среда выполнения**: Node.js (v20+ / v22), Express.js.
- **База данных**: SQLite через библиотеку `better-sqlite3`.
- **Режимы БД**: 
  - `PRAGMA journal_mode = WAL;` (высокая скорость конкурентного чтения и записи)
  - `PRAGMA foreign_keys = ON;` (контроль ссылочной целостности)
  - `PRAGMA synchronous = NORMAL;`
- **Транзакционность**: Все критические операции (списание цемента, распределение долгов, закрытие сделок) выполняются строго внутри `db.transaction()`.

### Frontend:
- **Стек**: React 18, Vite, Tailwind CSS, Lucide React (иконки), Recharts (графики).
- **Дизайн-система**: Notion UI Design System:
  - Палитра: кремовый фон `#f7f6f3` (светлая) / `#202020` (темная), акцент Notion Purple `#5645d4`.
  - Пастельные статусные теги: `mint` (оплачено), `rose` (долг/дебиторка), `peach` (частично), `sky` (операции).
  - Модальные окна с мягким эффектом размытия `backdrop-blur-md` и плавным появлением.

### Сквозные стандарты масок ввода:
1. **Номер телефона**: `+998 00 123 4567`
   - Обязательный префикс `+998 `.
   - Автоматическая расстановка пробелов: 2 цифры кода, пробел, 3 цифры, пробел, 4 цифры (всего 9 цифр после +998).
   - Поддержка умной вставки (Paste) любых форматов с автоматической нормализацией.
   - Плавный Backspace через пробелы.
2. **Гос. номер автомобиля**: два официальных стандарта Узбекистана:
   - Образец 1: `00 123 AAA` (код региона 2 цифры, 3 цифры, 3 буквы).
   - Образец 2: `00 A 123 AA` (код региона 2 цифры, 1 буква, 3 цифры, 2 буквы).
   - Автоматический перевод кириллических букв в латиницу (А->A, В->B, С->C и т.д.).
3. **Денежные суммы и тоннаж**:
   - Визуальное форматирование с пробелами (например, `1 000 000` сум или `45.5` т).
   - Серверная утилита `cleanNumber(val)`, очищающая любые пробелы и разделители, предотвращая возникновение ошибок `NaN`.

---

## 2. ПОСЛЕДОВАТЕЛЬНОСТЬ РАЗРАБОТКИ С НУЛЯ

```text
Шаг 1: Справочники (Клиенты, Заводы) ──> Шаг 2: Автопарк и Транспорт
               │                                      │
               ▼                                      ▼
Шаг 3: Номенклатура и Склад ───────────> Шаг 4: Продажи и Отгрузки
               │                                      │
               ▼                                      ▼
Шаг 5: Финансы, Касса и Дебиторка ─────> Шаг 6: Аналитика и Дашборд
                                                      │
                                                      ▼
                                         Шаг 7: Пользователи, Аудит и БД
```

---

## 3. ДЕТАЛЬНОЕ ОПИСАНИЕ СТРАНИЦ И МОДУЛЕЙ

---

### СТРАНИЦА 1. СПРАВОЧНИКИ: КЛИЕНТЫ И ЗАВОДЫ (`/clients`, `/factories` или `/directories`)

#### 1. Назначение:
Реестр покупателей продукции (физлица, строительные компании, дилеры) и заводов-производителей цемента (Бекабадцемент, Кизилкумцемент, Алмалык и др.).

#### 2. Схема базы данных (SQLite):
```sql
CREATE TABLE factories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  contact_person TEXT,
  phone TEXT,
  address TEXT,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE clients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  company_name TEXT,
  phone TEXT,
  balance REAL DEFAULT 0, -- Отрицательный баланс = долг клиента
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### 3. Серверные эндпоинты (REST API):
- `GET /api/directories/clients` — получение списка всех клиентов с текущими балансами.
- `POST /api/directories/clients` — создание клиента:
  - Принимает: `name`, `phone`, `company_name`, `initial_debt` (начальный долг), `notes`.
  - Если передан `initial_debt > 0`, сохраняет `balance = -initial_debt`.
- `PUT /api/directories/clients/:id` — редактирование контактов или корректировка баланса.
- `DELETE /api/directories/clients/:id` — удаление (с проверкой отсутствия привязанных продаж).
- `GET /api/directories/factories` / `POST` / `PUT` / `DELETE` — управление заводами.

#### 4. Элементы интерфейса:
- **Таблица клиентов**: Наименование, Компания, Телефон (`+998 00 123 4567`), Текущий баланс (красный цвет при долге), Примечание, Кнопки редактирования и удаления.
- **Модальное окно клиента**:
  - ФИО / Название (обязательно).
  - Телефон с маской `formatPhone` (`+998 `).
  - Компания / Заказчик.
  - Начальная задолженность (поле с разделением пробелами `formatSpaces`).
  - Примечание.

---

### СТРАНИЦА 2. АВТОПАРК И ЛОГИСТИКА (`/vehicles`)

#### 1. Назначение:
Учет цементовозов (бочек) и длинномеров (под мешки). Разделение на собственный автопарк предприятия и наемные привлеченные машины.

#### 2. Схема базы данных:
```sql
CREATE TABLE vehicles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  plate_number TEXT NOT NULL UNIQUE,
  model TEXT,                         -- HOWO, MAN, Shacman, KamAZ
  vehicle_type TEXT DEFAULT 'bulk',   -- 'bulk' (бочка-навал) или 'truck' (длинномер)
  capacity_tons REAL DEFAULT 30,      -- Грузоподъемность в тоннах
  is_company_owned INTEGER DEFAULT 1, -- 1 = собственная, 0 = наемная
  driver_name TEXT,
  driver_phone TEXT,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### 3. Серверные эндпоинты (REST API):
- `GET /api/directories/vehicles` — список машин с возможностью фильтрации по типу владения.
- `POST /api/directories/vehicles` — добавление транспорта с валидацией гос. номера по 2 стандартам.
- `PUT /api/directories/vehicles/:id` — обновление данных водителя и машины.
- `DELETE /api/directories/vehicles/:id` — удаление машины.

#### 4. Элементы интерфейса:
- **Метрики сверху**: Всего машин в парке, Собственные цементовозы, Наемный транспорт.
- **Таблица автопарка**: Гос. номер (моноширинный бейдж), Модель, Тип полуприцепа, Грузоподъемность (т), Водитель, Телефон (`+998 `), Принадлежность (пастельный тег).
- **Модальное окно машины**:
  - Гос. номер (с маской `formatPlate`: `00 123 AAA` или `00 A 123 AA`).
  - Модель и марка.
  - ФИО водителя.
  - Телефон водителя (с маской `formatPhone`).
  - Переключатель: «Собственная машина автопарка» / «Наемный транспорт».

---

### СТРАНИЦА 3. СКЛАД, НОМЕНКЛАТУРА И ПРИХОДЫ (`/warehouse`)

#### 1. Назначение:
Каталог продукции (навал М400, М500, мешки 50кг), контроль физических остатков в силосах, регистрация приходов цемента и учет биржевых талонов/квот.

#### 2. Схема базы данных:
```sql
CREATE TABLE products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  factory_id INTEGER,
  name TEXT NOT NULL,
  category TEXT DEFAULT 'cement',       -- 'cement', 'packaging', 'additives'
  cement_grade TEXT DEFAULT 'M500',     -- 'M400', 'M500', 'M600'
  packaging_type TEXT DEFAULT 'bulk',   -- 'bulk' (навал), 'bag' (мешки 50кг), 'bigbag' (биг-бэги)
  unit TEXT DEFAULT 'т',
  current_stock REAL DEFAULT 0 CHECK(current_stock >= 0), -- Защита от минуса
  min_stock_alert REAL DEFAULT 20,
  purchase_price REAL DEFAULT 0,
  selling_price REAL DEFAULT 0,
  FOREIGN KEY (factory_id) REFERENCES factories(id)
);

CREATE TABLE tickets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ticket_number TEXT NOT NULL UNIQUE,
  factory_id INTEGER NOT NULL,
  product_id INTEGER,
  total_tonnage REAL NOT NULL,
  remaining_tonnage REAL NOT NULL,
  price_per_ton REAL NOT NULL,
  total_amount REAL NOT NULL,
  purchase_date DATE NOT NULL,
  expiration_date DATE,
  status TEXT DEFAULT 'active',         -- 'active', 'exhausted', 'expired'
  FOREIGN KEY (factory_id) REFERENCES factories(id)
);

CREATE TABLE arrivals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date DATE NOT NULL,
  arrival_type TEXT NOT NULL,           -- 'to_warehouse' (на склад) или 'direct_client' (прямо клиенту)
  factory_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  vehicle_id INTEGER,
  vehicle_number TEXT,
  tonnage REAL NOT NULL,
  purchase_price REAL NOT NULL,
  total_amount REAL NOT NULL,
  ticket_id INTEGER,
  comment TEXT,
  FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE TABLE stock_movements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date DATETIME DEFAULT CURRENT_TIMESTAMP,
  product_id INTEGER NOT NULL,
  movement_type TEXT NOT NULL,          -- 'arrival', 'sale', 'adjustment'
  quantity REAL NOT NULL,
  stock_after REAL NOT NULL,
  reference_type TEXT,                  -- 'arrival', 'sale'
  reference_id INTEGER,
  comment TEXT,
  FOREIGN KEY (product_id) REFERENCES products(id)
);
```

#### 3. Серверные эндпоинты (REST API):
- `GET /api/directories/products` — список позиций номенклатуры с текущими остатками и ценами.
- `POST /api/warehouse/arrivals` — оприходование новой партии цемента:
  - Выполняется строго в транзакции:
    1. Увеличивает `current_stock` в таблице `products`.
    2. Создает запись в `arrivals`.
    3. Создает проводку в `stock_movements`.
    4. Если привязан биржевой талон (`ticket_id`), уменьшает `remaining_tonnage` в `tickets`.
- `GET /api/warehouse/tickets` / `POST` — управление квотами заводов.
- `GET /api/warehouse/movements` — журнал всех списаний и поступлений.

#### 4. Элементы интерфейса:
- **Индикаторы силосов**: шкалы заполненности складов цемента в тоннах с предупреждением при остатке ниже порога `min_stock_alert`.
- **Вкладка «Складские остатки»**: каталог цемента, закупочная и продажная цена, кнопка редактирования.
- **Вкладка «Журнал приходов»**: история поступлений партий цемента.
- **Вкладка «Биржевые квоты (тикеты)»**: мониторинг выкупленных объемов на заводах.
- **Модальное окно оприходования**: дата, завод, марка цемента, тоннаж, цена закупки, машина, тикет.

---

### СТРАНИЦА 4. ПРОДАЖИ, ОТГРУЗКИ И ЛОГИСТИКА (`/sales`)

#### 1. Назначение:
Рабочее место для оформления продажи цемента. Автоматический расчет логистики (самовывоз или доставка автопарком), проверка физического наличия на складе, списание остатка, фиксация оплаты или дебиторской задолженности.

#### 2. Схема базы данных:
```sql
CREATE TABLE sales (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sale_number TEXT NOT NULL UNIQUE,      -- Формат: SL-YYMMDD-XXXX
  date DATE NOT NULL,
  client_id INTEGER NOT NULL,
  sale_type TEXT DEFAULT 'cement',       -- 'cement' (цемент) или 'service_only' (доставка)
  factory_id INTEGER,
  product_id INTEGER,
  packaging_type TEXT,
  tonnage REAL NOT NULL,
  price_per_ton REAL NOT NULL,
  cement_amount REAL NOT NULL,
  delivery_type TEXT DEFAULT 'pickup',   -- 'pickup' (самовывоз) или 'delivery' (автопарк)
  vehicle_id INTEGER,
  vehicle_number TEXT,
  is_company_vehicle INTEGER DEFAULT 1,
  logistics_rate_per_ton REAL DEFAULT 0,
  logistics_amount REAL DEFAULT 0,
  total_amount REAL NOT NULL,            -- cement_amount + logistics_amount
  warehouse_source TEXT DEFAULT 'warehouse', -- 'warehouse', 'ticket', 'direct'
  ticket_id INTEGER,
  payment_status TEXT NOT NULL,          -- 'paid' (оплачено), 'debt' (в долг), 'partial' (частично)
  paid_amount REAL DEFAULT 0,
  debt_amount REAL DEFAULT 0,
  comment TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);
```

#### 3. Серверная транзакция (`POST /api/sales`):
1. **Валидация чисел**: использование `cleanNumber` для всех сумм и тоннажа.
2. **Контроль остатка**: если `product.current_stock < requested_tonnage`, транзакция прерывается с ошибкой: *«Недостаточно товара на складе!»*.
3. **Списание**: `UPDATE products SET current_stock = current_stock - ? WHERE id = ?`.
4. **Аудит движения**: запись в `stock_movements`.
5. **Финансовый контур**:
   - При `payment_status = 'debt'`: `debt_amount = total_amount`, `paid_amount = 0`. Списание с баланса клиента: `UPDATE clients SET balance = balance - total_amount`.
   - При `payment_status = 'partial'`: `debt_amount = total_amount - paid_amount`. Баланс клиента уменьшается на сумму долга. Внесенная сумма `paid_amount` отправляется в `cash_transactions` (приход).
   - При `payment_status = 'paid'`: вся сумма фиксируется в `cash_transactions` как доход кассы.

#### 4. Элементы интерфейса:
- **Кнопка «+ Оформить отгрузку»**:
  - Выбор контрагента из базы.
  - Выбор марки цемента (с подсказкой: *«Доступно на складе: 52.0 т»*).
  - Ввод объема (т) и цены за тонну (автоподстановка из прайс-листа).
  - Переключатель логистики:
    - **Самовывоз**: ввод номера машины покупателя (маска `formatPlate`).
    - **Доставка автопарком**: выбор машины, ввод тарифа за тонну (автоматический расчет стоимости рейса).
  - Блок оплаты: выбор статуса (`Оплачено полностью`, `В долг 100%`, `Частичная оплата`), ввод суммы, внесенной сейчас.
- **Таблица отгрузок**: номер сделки, дата, клиент, тоннаж, стоимость товара, доставка, общая сумма, бейдж статуса оплаты (`mint` / `rose` / `peach`), кнопка печати ТТН.

---

### СТРАНИЦА 5. ФИНАНСЫ, КАССА И ДОЛГИ КЛИЕНТОВ (`/finance`)

#### 1. Назначение:
Раздельный учет наличных и безналичных денежных средств, контроль дебиторской задолженности покупателей и ведение депозита брокерского счета биржи.

#### 2. Схема базы данных:
```sql
CREATE TABLE cash_transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date DATE NOT NULL,
  transaction_type TEXT NOT NULL,       -- 'income' (приход) или 'expense' (расход)
  category TEXT NOT NULL,               -- 'cement_sale', 'debt_repayment', 'gas', 'salary', 'factory_payment', 'broker_deposit'
  client_id INTEGER,
  factory_id INTEGER,
  vehicle_id INTEGER,
  vehicle_number TEXT,
  currency TEXT DEFAULT 'UZS',
  exchange_rate REAL DEFAULT 1.0,
  amount_original REAL NOT NULL,
  amount_uzs REAL NOT NULL,
  payment_method TEXT DEFAULT 'cash',   -- 'cash', 'transfer', 'card'
  sale_id INTEGER,
  is_broker_account INTEGER DEFAULT 0,
  comment TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE broker_account_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date DATE NOT NULL,
  type TEXT NOT NULL,                   -- 'deposit', 'ticket_allocation', 'ticket_return'
  ticket_id INTEGER,
  amount REAL NOT NULL,
  comment TEXT
);
```

#### 3. Серверные эндпоинты (REST API):
- `GET /api/finance/transactions` — реестр операций кассы + расчет итогов (`totalIncome`, `totalExpense`, `netCash`).
- `POST /api/finance/transactions` — регистрация прихода или расхода.
- `GET /api/finance/debts` — список всех клиентов с долгами (`balance < 0`), вычисление общего долга и количества неоплаченных сделок.
- `POST /api/finance/debts/repay` — **Погашение долга клиентом**:
  1. Увеличение баланса: `UPDATE clients SET balance = balance + repaySum`.
  2. Запись в кассу: `INSERT INTO cash_transactions ... category = 'debt_repayment'`.
  3. **FIFO погашение сделок**: автоматический поиск открытых продаж клиента со статусом `debt` / `partial` (от старых к новым) и закрытие их долга.
- `POST /api/finance/debts/adjust` — ручная корректировка/начисление долга клиенту.
- `GET /api/finance/broker` — история и текущий баланс брокерского счета биржи.

#### 4. Элементы интерфейса:
- **Вкладка 1: «Кассовые операции»**:
  - Карточки: Поступления, Списания, Чистый кассовый остаток.
  - Таблица операций с цветовой индикацией (+ зеленый, - красный).
  - Модальные окна «Новый приход» и «Новый расход» (цемент / логистика: топливо, запчасти, зарплата, обеды).
- **Вкладка 2: «Долги клиентов»**:
  - Сводка дебиторской задолженности.
  - Горизонтальный BarChart крупнейших должников.
  - Кнопка **«+ Зафиксировать долг»** для ручной проводки.
  - Таблица должников с кнопкой **«Погасить»** напротив каждого клиента.
- **Вкладка 3: «Брокерский счет биржи»**: история депозитов и распределения средств на закупку квот.

---

### СТРАНИЦА 6. АНАЛИТИКА И СВОДНЫЙ ДАШБОРД (`/dashboard`)

#### 1. Назначение:
Экран руководителя предприятия для стратегической оценки работы завода, автопарка и финансового состояния.

#### 2. Серверный агрегатор (`GET /api/reports/dashboard`):
- Сбор статистики за выбранный период (выручка, чистая прибыль, объем отгрузок в тоннах, себестоимость, маржинальность, долги).

#### 3. Элементы интерфейса:
- **Панель фильтра дат**: Быстрый выбор (Сегодня, Вчера, Неделя, Этот месяц, Весь период) + произвольный интервал.
- **Ключевые карточки KPI**:
  - «Общий оборот / Выручка» (сум).
  - «Чистая прибыль» (с расчетом маржинальности в %).
  - «Отгружено цемента» (тоннаж).
  - «Дебиторская задолженность» (сумма долгов и число компаний-должников).
- **Интерактивный граф производственного процесса (ProcessGraph)**:
  - 4 блока: *Закупка сырья/Биржа -> Склад и Силосы -> Логистика и Автопарк -> Продажи клиентам*.
  - Клик по любому блоку осуществляет быстрый переход на соответствующую страницу.
- **Графики динамики**:
  - Объем отгрузок по дням (AreaChart).
  - Распределение продаж по маркам цемента (PieChart).
  - Эффективность и пробег машин автопарка (BarChart).

---

### СТРАНИЦА 7. ПОЛЬЗОВАТЕЛИ, АУДИТ И УПРАВЛЕНИЕ БД (`/users-audit`)

#### 1. Назначение:
Безопасность системы, разграничение прав доступа, сквозной журнал действий и защита базы данных.

#### 2. Схема базы данных:
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL,               -- 'admin', 'operator', 'accountant', 'viewer'
  role_title TEXT,
  phone TEXT,
  status TEXT DEFAULT 'active',     -- 'active', 'blocked'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  username TEXT NOT NULL,
  action TEXT NOT NULL,             -- 'SALE_CREATE', 'STOCK_INCOME', 'DEBT_REPAY', 'DATABASE_PURGED'
  entity TEXT NOT NULL,
  details TEXT,
  ip TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### 3. Серверные эндпоинты (REST API):
- `POST /api/auth/login` — вход по логину и паролю.
- `GET /api/users` / `POST` / `PUT` / `DELETE` — управление учетными записями сотрудников.
- `GET /api/audit` — хронологическая лента аудита всех действий пользователей.
- `GET /api/backup` — мгновенное скачивание резервной копии базы данных `.sqlite`.
- `POST /api/system/reset-database` — полное обнуление базы данных с сохранением пользователя `admin` (`admin2026!`), сбросом счетчиков `sqlite_sequence` и автоматическим созданием страховочного бэкапа.

#### 4. Элементы интерфейса:
- **Вкладка «Сотрудники»**: список учетных записей, создание операторов и бухгалтеров с привязкой телефона `+998 `.
- **Вкладка «Журнал аудита»**: детальный протокол безопасности (кто, когда и с какого IP совершил операцию).
- **Вкладка «База данных и Сброс»**: статус SQLite (WAL mode, Foreign Keys ON), кнопка скачивания резервной копии и карточка быстрого сброса БД с подтверждением словом `СБРОС`.

---

## 4. ИНСТРУКЦИЯ ПО РАЗРАБОТКЕ

Для создания системы с нуля строго следуйте правилу:
1. Завершите Модуль 1 (Справочники) -> протестируйте создание завода и клиента.
2. Перейдите к Модулю 2 (Автопарк) -> протестируйте ввод гос. номеров.
3. Перейдите к Модулю 3 (Склад) -> проверьте оприходование и остатки.
4. Перейдите к Модулю 4 (Продажи) -> проверьте списание и расчет логистики.
5. Перейдите к Модулю 5 (Финансы) -> проверьте кассу и погашение долгов.
6. Перейдите к Модулю 6 (Дашборд) -> проверьте графики и агрегацию.
7. Перейдите к Модулю 7 (Безопасность) -> настройте роли и бэкапы.
