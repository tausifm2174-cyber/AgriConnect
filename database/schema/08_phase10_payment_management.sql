-- ===================================================================
-- AgriConnect — Phase 10: Payment Management Schema Migration
-- Script 08: Update payments table for Payment Processing, Status Tracking & Settlements
-- Database: MySQL 8.0+
-- ===================================================================

USE agriconnect_db;

-- 1. Modify payment_status ENUM to include complete Phase 10 lifecycle statuses:
-- 'PENDING', 'PROCESSING', 'COMPLETED', 'PAID', 'FAILED', 'CANCELLED', 'REFUNDED'
ALTER TABLE payments 
    MODIFY COLUMN payment_status ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'PAID', 'FAILED', 'CANCELLED', 'REFUNDED') DEFAULT 'PENDING';

-- 2. Add remarks column to payments table if it does not already exist
SET @col_exists = (
    SELECT COUNT(*) 
    FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = 'agriconnect_db' 
      AND TABLE_NAME = 'payments' 
      AND COLUMN_NAME = 'remarks'
);

SET @sql = IF(@col_exists = 0, 
    'ALTER TABLE payments ADD COLUMN remarks VARCHAR(255) NULL AFTER transaction_reference', 
    'SELECT "Column remarks already exists"'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 3. Add created_at column to payments table if it does not already exist
SET @col_exists = (
    SELECT COUNT(*) 
    FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = 'agriconnect_db' 
      AND TABLE_NAME = 'payments' 
      AND COLUMN_NAME = 'created_at'
);

SET @sql = IF(@col_exists = 0, 
    'ALTER TABLE payments ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP AFTER payment_date', 
    'SELECT "Column created_at already exists"'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 4. Add updated_at column to payments table if it does not already exist
SET @col_exists = (
    SELECT COUNT(*) 
    FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = 'agriconnect_db' 
      AND TABLE_NAME = 'payments' 
      AND COLUMN_NAME = 'updated_at'
);

SET @sql = IF(@col_exists = 0, 
    'ALTER TABLE payments ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at', 
    'SELECT "Column updated_at already exists"'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 5. Add composite index on payments(order_id, payment_status) if not present
SET @idx_exists = (
    SELECT COUNT(*) 
    FROM information_schema.STATISTICS 
    WHERE TABLE_SCHEMA = 'agriconnect_db' 
      AND TABLE_NAME = 'payments' 
      AND INDEX_NAME = 'idx_payments_order_status'
);

SET @sql = IF(@idx_exists = 0,
    'CREATE INDEX idx_payments_order_status ON payments(order_id, payment_status)',
    'SELECT "Index idx_payments_order_status already exists"'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 6. Add composite index on payments(payment_status, payment_date) if not present
SET @idx_exists = (
    SELECT COUNT(*) 
    FROM information_schema.STATISTICS 
    WHERE TABLE_SCHEMA = 'agriconnect_db' 
      AND TABLE_NAME = 'payments' 
      AND INDEX_NAME = 'idx_payments_status_date'
);

SET @sql = IF(@idx_exists = 0,
    'CREATE INDEX idx_payments_status_date ON payments(payment_status, payment_date)',
    'SELECT "Index idx_payments_status_date already exists"'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
