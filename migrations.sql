-- =============================================
-- ESTRUTURA DO BANCO DE DADOS (MIGRATIONS)
-- Sistema de Gerenciamento de Ordens de Serviço
-- Apenas estrutura das tabelas, sem dados
-- =============================================

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- CRIAÇÃO DAS TABELAS
-- =============================================

-- Tabela: technicians
CREATE TABLE IF NOT EXISTS technicians (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    cities TEXT[] NOT NULL DEFAULT ARRAY[]::text[],
    neighborhoods TEXT[] NOT NULL DEFAULT ARRAY[]::text[],
    is_active BOOLEAN NOT NULL DEFAULT true
);

-- Tabela: teams
CREATE TABLE IF NOT EXISTS teams (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    technician_ids TEXT[] NOT NULL,
    box_number TEXT NOT NULL,
    notes TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true
);

-- Tabela: cities
CREATE TABLE IF NOT EXISTS cities (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

-- Tabela: neighborhoods
CREATE TABLE IF NOT EXISTS neighborhoods (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    city_id VARCHAR(255) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
    FOREIGN KEY (city_id) REFERENCES cities(id) ON DELETE CASCADE
);

-- Tabela: service_types
CREATE TABLE IF NOT EXISTS service_types (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

-- Tabela: service_orders
CREATE TABLE IF NOT EXISTS service_orders (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Pendente',
    team_id VARCHAR(255),
    alert TEXT,
    scheduled_date TEXT,
    scheduled_time TEXT,
    customer_name TEXT,
    customer_phone TEXT,
    address TEXT,
    description TEXT,
    reminder_enabled BOOLEAN DEFAULT true,
    created_via_calendar BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL
);

-- Tabela: reports
CREATE TABLE IF NOT EXISTS reports (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    date TEXT NOT NULL,
    shift TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

-- =============================================
-- ÍNDICES PARA PERFORMANCE
-- =============================================

CREATE INDEX IF NOT EXISTS idx_service_orders_code ON service_orders(code);
CREATE INDEX IF NOT EXISTS idx_service_orders_team_id ON service_orders(team_id);
CREATE INDEX IF NOT EXISTS idx_service_orders_status ON service_orders(status);
CREATE INDEX IF NOT EXISTS idx_service_orders_scheduled_date ON service_orders(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_neighborhoods_city_id ON neighborhoods(city_id);
CREATE INDEX IF NOT EXISTS idx_teams_active ON teams(is_active);
CREATE INDEX IF NOT EXISTS idx_technicians_active ON technicians(is_active);
CREATE INDEX IF NOT EXISTS idx_cities_active ON cities(is_active);
CREATE INDEX IF NOT EXISTS idx_neighborhoods_active ON neighborhoods(is_active);
CREATE INDEX IF NOT EXISTS idx_service_types_active ON service_types(is_active);

-- =============================================
-- CONSTRAINTS ADICIONAIS
-- =============================================

-- Constraint para garantir status válidos
ALTER TABLE service_orders ADD CONSTRAINT check_valid_status 
CHECK (status IN ('Pendente', 'Concluído', 'Reagendado', 'Cancelado', 'Em Andamento'));

-- Constraint para garantir shift válidos
ALTER TABLE reports ADD CONSTRAINT check_valid_shift 
CHECK (shift IN ('Manhã', 'Tarde', 'Noite', 'Integral'));

-- =============================================
-- VERIFICAÇÃO DE ESTRUTURA
-- =============================================

-- Query para verificar se todas as tabelas foram criadas
SELECT table_name, column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_schema = 'public' 
ORDER BY table_name, ordinal_position;