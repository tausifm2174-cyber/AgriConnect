-- ===================================================================
-- AgriConnect — Phase 2: Relational Database Schema
-- Script 01: Table Definitions (Core Entities & Attributes)
-- Database: MySQL 8.0+
-- ===================================================================

USE agriconnect_db;

-- 1. Users Table (Central identity for Farmers, Buyers, and Admins)
CREATE TABLE IF NOT EXISTS users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    phone VARCHAR(15) NOT NULL UNIQUE,
    role ENUM('FARMER', 'BUYER', 'ADMIN') NOT NULL,
    status ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED') DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Farmer Profiles Table (Role-specific attributes for farmers)
CREATE TABLE IF NOT EXISTS farmer_profiles (
    farmer_id INT PRIMARY KEY,
    farm_location VARCHAR(150) NOT NULL,
    farm_size_acres DECIMAL(6, 2) NOT NULL,
    experience_years INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Buyer Profiles Table (Role-specific attributes for commercial buyers)
CREATE TABLE IF NOT EXISTS buyer_profiles (
    buyer_id INT PRIMARY KEY,
    business_name VARCHAR(120) NOT NULL,
    business_type ENUM('WHOLESALER', 'RETAILER', 'PROCESSOR', 'EXPORTER') NOT NULL,
    gstin VARCHAR(15) UNIQUE,
    business_address VARCHAR(200) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Crops Catalog Table (Standardized agricultural crop master)
CREATE TABLE IF NOT EXISTS crops (
    crop_id INT AUTO_INCREMENT PRIMARY KEY,
    crop_name VARCHAR(60) NOT NULL UNIQUE,
    category ENUM('CEREAL', 'PULSE', 'VEGETABLE', 'FRUIT', 'OILSEED', 'SPICE', 'CASH_CROP') NOT NULL,
    season ENUM('KHARIF', 'RABI', 'ZAID', 'ALL_SEASON') DEFAULT 'ALL_SEASON',
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Harvests Table (Farmer listed lots with quantity and pricing)
CREATE TABLE IF NOT EXISTS harvests (
    harvest_id INT AUTO_INCREMENT PRIMARY KEY,
    farmer_id INT NOT NULL,
    crop_id INT NOT NULL,
    initial_quantity DECIMAL(10, 2) NOT NULL,
    available_quantity DECIMAL(10, 2) NOT NULL,
    price_per_kg DECIMAL(8, 2) NOT NULL,
    harvest_date DATE NOT NULL,
    location VARCHAR(150) NOT NULL,
    status ENUM('AVAILABLE', 'PARTIALLY_SOLD', 'SOLD_OUT', 'CANCELLED') DEFAULT 'AVAILABLE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Quality Assessments Table (Quality grading and verification)
CREATE TABLE IF NOT EXISTS quality_assessments (
    assessment_id INT AUTO_INCREMENT PRIMARY KEY,
    harvest_id INT NOT NULL UNIQUE,
    admin_id INT NOT NULL,
    freshness INT NOT NULL,
    appearance INT NOT NULL,
    size INT NOT NULL,
    color INT NOT NULL,
    ripeness INT NOT NULL,
    damage_percentage DECIMAL(5, 2) NOT NULL,
    quality_score DECIMAL(5, 2) NOT NULL,
    quality_grade ENUM('A', 'B', 'C') NOT NULL,
    verification_status ENUM('PENDING', 'VERIFIED', 'REJECTED') DEFAULT 'PENDING',
    assessment_date DATE NOT NULL,
    inspector_notes VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Buyer Requirements Table (Buyer demand posts for matching)
CREATE TABLE IF NOT EXISTS buyer_requirements (
    requirement_id INT AUTO_INCREMENT PRIMARY KEY,
    buyer_id INT NOT NULL,
    crop_id INT NOT NULL,
    required_quantity DECIMAL(10, 2) NOT NULL,
    max_price_per_kg DECIMAL(8, 2) NOT NULL,
    min_quality_grade ENUM('A', 'B', 'C') NOT NULL,
    preferred_location VARCHAR(150),
    status ENUM('OPEN', 'FULFILLED', 'EXPIRED', 'CANCELLED') DEFAULT 'OPEN',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Orders Table (Contract between Buyer and Harvest lot)
CREATE TABLE IF NOT EXISTS orders (
    order_id INT AUTO_INCREMENT PRIMARY KEY,
    buyer_id INT NOT NULL,
    harvest_id INT NOT NULL,
    quantity DECIMAL(10, 2) NOT NULL,
    agreed_price_per_kg DECIMAL(8, 2) NOT NULL,
    total_amount DECIMAL(12, 2) NOT NULL,
    order_status ENUM('PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED') DEFAULT 'PENDING',
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Deliveries Table (1:1 logistics and delivery tracking for orders)
CREATE TABLE IF NOT EXISTS deliveries (
    delivery_id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL UNIQUE,
    delivery_status ENUM('PENDING', 'DISPATCHED', 'IN_TRANSIT', 'DELIVERED', 'FAILED') DEFAULT 'PENDING',
    tracking_number VARCHAR(50) UNIQUE,
    vehicle_number VARCHAR(20),
    delivery_address VARCHAR(255) NOT NULL,
    dispatched_at TIMESTAMP NULL DEFAULT NULL,
    delivered_at TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. Payments Table (1:N financial transactions per order)
CREATE TABLE IF NOT EXISTS payments (
    payment_id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    payment_method ENUM('BANK_TRANSFER', 'UPI', 'CASH', 'CHEQUE') NOT NULL,
    payment_status ENUM('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED') DEFAULT 'PENDING',
    transaction_reference VARCHAR(100) UNIQUE,
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. Price History Table (Market price index tracking over time)
CREATE TABLE IF NOT EXISTS price_history (
    price_id INT AUTO_INCREMENT PRIMARY KEY,
    crop_id INT NOT NULL,
    modal_price_per_kg DECIMAL(8, 2) NOT NULL,
    min_price_per_kg DECIMAL(8, 2) NOT NULL,
    max_price_per_kg DECIMAL(8, 2) NOT NULL,
    market_location VARCHAR(100) NOT NULL,
    recorded_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
