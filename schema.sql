-- MySQL initialization schema

CREATE DATABASE IF NOT EXISTS print3d_calc;
USE print3d_calc;

-- Tabela de usuários para autenticação
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de pastas de projeto
CREATE TABLE IF NOT EXISTS project_folders (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'aguardando',
    discount DECIMAL(12,4) DEFAULT 0.0000,
    shipping_cost DECIMAL(12,4) DEFAULT 0.0000,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de impressoras
CREATE TABLE IF NOT EXISTS printers (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    acquisition_cost DECIMAL(12,4) DEFAULT 0.0000,
    lifespan_hours DECIMAL(12,4) DEFAULT 0.0000,
    power_consumption DECIMAL(12,4) DEFAULT 0.0000,
    maintenance_cost_per_hour DECIMAL(12,4) DEFAULT 0.0000,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de materiais
CREATE TABLE IF NOT EXISTS materials (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    type VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    color VARCHAR(7) DEFAULT '#000000',
    spool_price DECIMAL(12,4) DEFAULT 0.0000,
    spool_weight DECIMAL(12,4) DEFAULT 0.0000,
    current_stock DECIMAL(12,4) DEFAULT 0.0000,
    manufacturer VARCHAR(255) DEFAULT NULL,
    print_temp INT DEFAULT NULL,
    bed_temp INT DEFAULT NULL,
    diameter DECIMAL(6,3) DEFAULT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Configurações globais por usuário
CREATE TABLE IF NOT EXISTS global_settings (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) UNIQUE NOT NULL,
    electricity_cost DECIMAL(12,4) DEFAULT 0.0000,
    currency_symbol VARCHAR(10) DEFAULT 'R$',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de projetos/cálculos
CREATE TABLE IF NOT EXISTS projects (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    date TIMESTAMP NULL DEFAULT NULL,
    printer_id VARCHAR(36),
    material_id VARCHAR(36),
    print_time_hours DECIMAL(12,4) DEFAULT 0.0000,
    print_time_minutes DECIMAL(12,4) DEFAULT 0.0000,
    model_weight DECIMAL(12,4) DEFAULT 0.0000,
    failure_rate DECIMAL(12,4) DEFAULT 0.0000,
    labor_time_hours DECIMAL(12,4) DEFAULT 0.0000,
    labor_time_minutes DECIMAL(12,4) DEFAULT 0.0000,
    labor_hourly_rate DECIMAL(12,4) DEFAULT 0.0000,
    markup DECIMAL(12,4) DEFAULT 0.0000,
    result JSON NOT NULL,
    folder_id VARCHAR(36),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (folder_id) REFERENCES project_folders(id) ON DELETE SET NULL,
    FOREIGN KEY (printer_id) REFERENCES printers(id) ON DELETE SET NULL,
    FOREIGN KEY (material_id) REFERENCES materials(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
