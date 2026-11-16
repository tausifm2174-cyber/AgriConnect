-- ===================================================================
-- AgriConnect — Phase 9: Delivery Management Schema Migration
-- Script 07: Update deliveries table for Delivery Lifecycle & Order Fulfillment
-- Database: MySQL 8.0+
-- ===================================================================

USE agriconnect_db;

-- 1. Modify delivery_status ENUM to include complete Phase 9 lifecycle statuses
-- Ensures 'PENDING', 'DISPATCHED', 'IN_TRANSIT', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'FAILED'
ALTER TABLE deliveries 
    MODIFY COLUMN delivery_status ENUM('PENDING', 'DISPATCHED', 'IN_TRANSIT', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'FAILED') DEFAULT 'PENDING';

-- 2. Add remarks column to deliveries table if it does not already exist
SET @col_exists = (
    SELECT COUNT(*) 
    FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = 'agriconnect_db' 
      AND TABLE_NAME = 'deliveries' 
      AND COLUMN_NAME = 'remarks'
);

SET @sql = IF(@col_exists = 0, 
    'ALTER TABLE deliveries ADD COLUMN remarks VARCHAR(255) NULL AFTER delivery_address', 
    'SELECT "Column remarks already exists"'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 3. Add estimated_delivery_date column to deliveries table if it does not already exist
SET @col_exists = (
    SELECT COUNT(*) 
    FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = 'agriconnect_db' 
      AND TABLE_NAME = 'deliveries' 
      AND COLUMN_NAME = 'estimated_delivery_date'
);

SET @sql = IF(@col_exists = 0, 
    'ALTER TABLE deliveries ADD COLUMN estimated_delivery_date DATE NULL AFTER delivered_at', 
    'SELECT "Column estimated_delivery_date already exists"'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 4. Add updated_at column to deliveries table if it does not already exist
SET @col_exists = (
    SELECT COUNT(*) 
    FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = 'agriconnect_db' 
      AND TABLE_NAME = 'deliveries' 
      AND COLUMN_NAME = 'updated_at'
);

SET @sql = IF(@col_exists = 0, 
    'ALTER TABLE deliveries ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at', 
    'SELECT "Column updated_at already exists"'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 5. Add performance composite index on deliveries(order_id, delivery_status) if not present
SET @idx_exists = (
    SELECT COUNT(*) 
    FROM information_schema.STATISTICS 
    WHERE TABLE_SCHEMA = 'agriconnect_db' 
      AND TABLE_NAME = 'deliveries' 
      AND INDEX_NAME = 'idx_deliveries_order_status'
);

SET @sql = IF(@idx_exists = 0,
    'CREATE INDEX idx_deliveries_order_status ON deliveries(order_id, delivery_status)',
    'SELECT "Index idx_deliveries_order_status already exists"'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
