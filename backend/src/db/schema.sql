-- ERP «Цемент»: Основная схема реляционной базы данных SQLite

-- 1. Справочник заводов-производителей
CREATE TABLE IF NOT EXISTS factories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    contact_person TEXT,
    phone TEXT,
    address TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Справочник клиентов (контрагентов)
CREATE TABLE IF NOT EXISTS clients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT,
    company_name TEXT,
    balance REAL DEFAULT 0, -- Финансовое сальдо: отрицательное = задолженность клиента (долг)
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. Справочник автотранспорта (машины компании и наёмные)
CREATE TABLE IF NOT EXISTS vehicles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    plate_number TEXT NOT NULL UNIQUE,
    model TEXT,
    client_id INTEGER REFERENCES clients(id) ON DELETE SET NULL,
    is_company_owned INTEGER NOT NULL DEFAULT 1, -- 1: собственная машина, 0: наёмная
    driver_name TEXT,
    driver_phone TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 4. Каталог номенклатуры (цемент разных марок, мешки/россыпь, тара, химические добавки)
CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT NOT NULL CHECK(category IN ('cement', 'packaging', 'additive', 'other')),
    cement_grade TEXT, -- M400, M500, etc.
    packaging_type TEXT CHECK(packaging_type IN ('bulk', 'bag', 'none')), -- bulk: россыпь/навал, bag: мешок
    unit TEXT NOT NULL DEFAULT 'т', -- 'т' (тонны), 'шт', 'кг'
    current_stock REAL NOT NULL DEFAULT 0 CHECK(current_stock >= 0), -- защита целостности: остаток не может быть меньше 0
    min_stock_alert REAL DEFAULT 0,
    purchase_price REAL DEFAULT 0, -- Себестоимость закупки (за ед.)
    selling_price REAL DEFAULT 0,  -- Базовая цена продажи (за ед.)
    factory_id INTEGER REFERENCES factories(id) ON DELETE SET NULL,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 5. Заводские тикеты (квоты / предоплаченные талоны на заводе)
CREATE TABLE IF NOT EXISTS tickets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticket_number TEXT NOT NULL UNIQUE,
    factory_id INTEGER NOT NULL REFERENCES factories(id) ON DELETE RESTRICT,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    initial_tonnage REAL NOT NULL,
    remaining_tonnage REAL NOT NULL CHECK(remaining_tonnage >= 0), -- защита: квота не может уйти в минус
    price_per_ton REAL NOT NULL,
    total_amount REAL NOT NULL,
    remaining_amount REAL NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'completed', 'returned')),
    comment TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 6. Оприходование (Приход цемента и материалов)
CREATE TABLE IF NOT EXISTS arrivals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    factory_id INTEGER NOT NULL REFERENCES factories(id) ON DELETE RESTRICT,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    packaging_type TEXT CHECK(packaging_type IN ('bulk', 'bag', 'none')),
    tonnage REAL NOT NULL,
    price_per_ton REAL NOT NULL,
    total_amount REAL NOT NULL,
    vehicle_number TEXT,
    destination TEXT NOT NULL CHECK(destination IN ('direct', 'warehouse', 'ticket')),
    ticket_number TEXT,
    comment TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 7. Продажи и отгрузки цемента / оказание логистических услуг
CREATE TABLE IF NOT EXISTS sales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sale_number TEXT NOT NULL UNIQUE,
    date TEXT NOT NULL,
    client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
    sale_type TEXT NOT NULL CHECK(sale_type IN ('cement', 'service_only')), -- цемент (с логистикой или без) или только логистика
    factory_id INTEGER REFERENCES factories(id) ON DELETE SET NULL,
    product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
    packaging_type TEXT CHECK(packaging_type IN ('bulk', 'bag', 'none')),
    tonnage REAL NOT NULL DEFAULT 0,
    price_per_ton REAL NOT NULL DEFAULT 0,
    cement_amount REAL NOT NULL DEFAULT 0,
    delivery_type TEXT NOT NULL DEFAULT 'pickup' CHECK(delivery_type IN ('pickup', 'delivery')),
    vehicle_id INTEGER REFERENCES vehicles(id) ON DELETE SET NULL,
    vehicle_number TEXT,
    is_company_vehicle INTEGER DEFAULT 1, -- 1: своя машина, 0: наёмная
    logistics_rate_per_ton REAL DEFAULT 0,
    logistics_amount REAL DEFAULT 0,
    total_amount REAL NOT NULL, -- cement_amount + logistics_amount
    warehouse_source TEXT CHECK(warehouse_source IN ('direct', 'warehouse', 'ticket')),
    ticket_id INTEGER REFERENCES tickets(id) ON DELETE SET NULL,
    payment_status TEXT NOT NULL CHECK(payment_status IN ('paid', 'debt', 'partial')),
    paid_amount REAL NOT NULL DEFAULT 0,
    debt_amount REAL NOT NULL DEFAULT 0,
    comment TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 8. Журнал движения остатков на складе (складской аудит)
CREATE TABLE IF NOT EXISTS stock_movements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    movement_type TEXT NOT NULL CHECK(movement_type IN ('in', 'out', 'adjustment', 'return')),
    quantity REAL NOT NULL,
    unit_price REAL,
    total_price REAL,
    reference_type TEXT CHECK(reference_type IN ('arrival', 'sale', 'ticket_usage', 'ticket_return', 'manual')),
    reference_id INTEGER,
    vehicle_number TEXT,
    comment TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 9. Денежные движения (Касса, банк, брокерский счет)
CREATE TABLE IF NOT EXISTS cash_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    transaction_type TEXT NOT NULL CHECK(transaction_type IN ('income', 'expense')),
    category TEXT NOT NULL, -- Доходы: 'cement_sale', 'logistics_service', 'debt_repayment', 'other'
                            -- Расходы: 'factory_payment', 'broker_deposit', 'gas', 'spare_parts', 'salary', 'lunch', 'other'
    client_id INTEGER REFERENCES clients(id) ON DELETE SET NULL,
    factory_id INTEGER REFERENCES factories(id) ON DELETE SET NULL,
    vehicle_id INTEGER REFERENCES vehicles(id) ON DELETE SET NULL,
    vehicle_number TEXT,
    currency TEXT NOT NULL DEFAULT 'UZS' CHECK(currency IN ('UZS', 'USD')),
    exchange_rate REAL DEFAULT 1.0,
    amount_original REAL NOT NULL,
    amount_uzs REAL NOT NULL,
    payment_method TEXT NOT NULL CHECK(payment_method IN ('cash', 'transfer', 'card')),
    sale_id INTEGER REFERENCES sales(id) ON DELETE SET NULL,
    is_broker_account INTEGER DEFAULT 0, -- 1: операция по брокерскому счету
    comment TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 10. Журнал операций брокерского счета
CREATE TABLE IF NOT EXISTS broker_account_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('deposit', 'ticket_allocation', 'ticket_return')),
    amount REAL NOT NULL,
    ticket_id INTEGER REFERENCES tickets(id) ON DELETE SET NULL,
    comment TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Индексы для ускорения выборок и отчетов
CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(date);
CREATE INDEX IF NOT EXISTS idx_sales_client ON sales(client_id);
CREATE INDEX IF NOT EXISTS idx_sales_number ON sales(sale_number);
CREATE INDEX IF NOT EXISTS idx_cash_date ON cash_transactions(date);
CREATE INDEX IF NOT EXISTS idx_cash_category ON cash_transactions(category);
CREATE INDEX IF NOT EXISTS idx_cash_client ON cash_transactions(client_id);
CREATE INDEX IF NOT EXISTS idx_stock_prod ON stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_date ON stock_movements(date);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_number ON tickets(ticket_number);
CREATE INDEX IF NOT EXISTS idx_arrivals_date ON arrivals(date);

-- 11. Пользователи системы и разграничение прав доступа
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'operator' CHECK(role IN ('admin', 'operator', 'accountant', 'viewer')),
    role_title TEXT,
    phone TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'blocked')),
    last_login DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 12. Журнал аудита действий пользователей (Activity & Security Log)
CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    username TEXT,
    action TEXT NOT NULL,
    entity TEXT,
    details TEXT,
    ip TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_date ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(username);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action);
