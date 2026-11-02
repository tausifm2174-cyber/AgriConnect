-- ===================================================================
-- AgriConnect — Phase 8: Order Management Schema Migration
-- Script 06: Update orders table for Order Lifecycle & Matching Integration
-- Database: MySQL 8.0+
-- ===================================================================

USE agriconnect_db;

-- 1. Modify order_status ENUM to include Phase 8 lifecycle statuses ('ACCEPTED', 'REJECTED')
-- Preserves existing 'PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'
ALTER TABLE orders 
    MODIFY COLUMN order_status ENUM('PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED', 'CONFIRMED', 'SHIPPED', 'DELIVERED') DEFAULT 'PENDING';

-- 2. Add requirement_id column to orders table if it does not already exist
-- Links orders back to the Buyer Requirement that originated the purchase
SET @col_exists = (
    SELECT COUNT(*) 
    FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = 'agriconnect_db' 
      AND TABLE_NAME = 'orders' 
      AND COLUMN_NAME = 'requirement_id'
);

SET @sql = IF(@col_exists = 0, 
    'ALTER TABLE orders ADD COLUMN requirement_id INT NULL AFTER harvest_id', 
    'SELECT "Column requirement_id already exists"'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 3. Add remarks column to orders table if it does not already exist
SET @col_exists = (
    SELECT COUNT(*) 
    FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = 'agriconnect_db' 
      AND TABLE_NAME = 'orders' 
      AND COLUMN_NAME = 'remarks'
);

SET @sql = IF(@col_exists = 0, 
    'ALTER TABLE orders ADD COLUMN remarks VARCHAR(255) NULL AFTER total_amount', 
    'SELECT "Column remarks already exists"'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 4. Add cancellation_reason column to orders table if it does not already exist
SET @col_exists = (
    SELECT COUNT(*) 
    FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = 'agriconnect_db' 
      AND TABLE_NAME = 'orders' 
      AND COLUMN_NAME = 'cancellation_reason'
);

SET @sql = IF(@col_exists = 0, 
    'ALTER TABLE orders ADD COLUMN cancellation_reason VARCHAR(255) NULL AFTER remarks', 
    'SELECT "Column cancellation_reason already exists"'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 5. Add foreign key from orders.requirement_id to buyer_requirements.requirement_id if not present
SET @fk_exists = (
    SELECT COUNT(*) 
    FROM information_schema.TABLE_CONSTRAINTS 
    WHERE CONSTRAINT_SCHEMA = 'agriconnect_db' 
      AND TABLE_NAME = 'orders' 
      AND CONSTRAINT_NAME = 'fk_orders_requirement'
);

SET @sql = IF(@fk_exists = 0,
    'ALTER TABLE orders ADD CONSTRAINT fk_orders_requirement FOREIGN KEY (requirement_id) REFERENCES buyer_requirements(requirement_id) ON DELETE SET NULL ON UPDATE CASCADE',
    'SELECT "Constraint fk_orders_requirement already exists"'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 6. Add performance index on order_status for admin monitoring and lifecycle queries
SET @idx_exists = (
    SELECT COUNT(*) 
    FROM information_schema.STATISTICS 
    WHERE TABLE_SCHEMA = 'agriconnect_db' 
      AND TABLE_NAME = 'orders' 
      AND INDEX_NAME = 'idx_orders_status'
);

SET @sql = IF(@idx_exists = 0,
    'CREATE INDEX idx_orders_status ON orders(order_status)',
    'SELECT "Index idx_orders_status already exists"'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
