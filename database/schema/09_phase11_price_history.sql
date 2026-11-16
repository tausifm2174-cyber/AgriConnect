-- ===================================================================
-- AgriConnect — Phase 11: Price History & Analytics Schema Migration
-- Script 09: Extend price_history for Transaction Sales, Historical Analytics & Trends
-- Database: MySQL 8.0+
-- ===================================================================

USE agriconnect_db;

-- 1. Add source_type column to distinguish APMC/Mandi benchmark data from completed platform transactions
SET @col_exists = (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = 'agriconnect_db'
      AND TABLE_NAME = 'price_history'
      AND COLUMN_NAME = 'source_type'
);

SET @sql = IF(@col_exists = 0,
    'ALTER TABLE price_history ADD COLUMN source_type ENUM(\'MARKET_MANDI\', \'TRANSACTION_SALE\') DEFAULT \'TRANSACTION_SALE\' AFTER crop_id',
    'SELECT "Column source_type already exists"'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Mark pre-existing seed records (records 1 to 9) as MARKET_MANDI benchmark records
UPDATE price_history SET source_type = 'MARKET_MANDI' WHERE source_type IS NULL OR source_type = 'TRANSACTION_SALE';

-- 2. Add order_id column (linking commercial sales to purchase orders)
SET @col_exists = (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = 'agriconnect_db'
      AND TABLE_NAME = 'price_history'
      AND COLUMN_NAME = 'order_id'
);

SET @sql = IF(@col_exists = 0,
    'ALTER TABLE price_history ADD COLUMN order_id INT NULL AFTER source_type',
    'SELECT "Column order_id already exists"'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 3. Add farmer_id column (seller reference)
SET @col_exists = (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = 'agriconnect_db'
      AND TABLE_NAME = 'price_history'
      AND COLUMN_NAME = 'farmer_id'
);

SET @sql = IF(@col_exists = 0,
    'ALTER TABLE price_history ADD COLUMN farmer_id INT NULL AFTER order_id',
    'SELECT "Column farmer_id already exists"'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 4. Add buyer_id column (buyer reference)
SET @col_exists = (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = 'agriconnect_db'
      AND TABLE_NAME = 'price_history'
      AND COLUMN_NAME = 'buyer_id'
);

SET @sql = IF(@col_exists = 0,
    'ALTER TABLE price_history ADD COLUMN buyer_id INT NULL AFTER farmer_id',
    'SELECT "Column buyer_id already exists"'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 5. Add quantity column (volume sold in kg)
SET @col_exists = (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = 'agriconnect_db'
      AND TABLE_NAME = 'price_history'
      AND COLUMN_NAME = 'quantity'
);

SET @sql = IF(@col_exists = 0,
    'ALTER TABLE price_history ADD COLUMN quantity DECIMAL(10,2) NULL AFTER buyer_id',
    'SELECT "Column quantity already exists"'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 6. Add unit_price column (actual agreed price per kg)
SET @col_exists = (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = 'agriconnect_db'
      AND TABLE_NAME = 'price_history'
      AND COLUMN_NAME = 'unit_price'
);

SET @sql = IF(@col_exists = 0,
    'ALTER TABLE price_history ADD COLUMN unit_price DECIMAL(8,2) NULL AFTER quantity',
    'SELECT "Column unit_price already exists"'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 7. Add total_amount column (total gross value of sale)
SET @col_exists = (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = 'agriconnect_db'
      AND TABLE_NAME = 'price_history'
      AND COLUMN_NAME = 'total_amount'
);

SET @sql = IF(@col_exists = 0,
    'ALTER TABLE price_history ADD COLUMN total_amount DECIMAL(12,2) NULL AFTER unit_price',
    'SELECT "Column total_amount already exists"'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 8. Add Foreign Key constraints if not present
SET @fk_exists = (
    SELECT COUNT(*)
    FROM information_schema.TABLE_CONSTRAINTS
    WHERE TABLE_SCHEMA = 'agriconnect_db'
      AND TABLE_NAME = 'price_history'
      AND CONSTRAINT_NAME = 'fk_price_history_order'
);

SET @sql = IF(@fk_exists = 0,
    'ALTER TABLE price_history ADD CONSTRAINT fk_price_history_order FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE SET NULL ON UPDATE CASCADE',
    'SELECT "FK fk_price_history_order already exists"'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @fk_exists = (
    SELECT COUNT(*)
    FROM information_schema.TABLE_CONSTRAINTS
    WHERE TABLE_SCHEMA = 'agriconnect_db'
      AND TABLE_NAME = 'price_history'
      AND CONSTRAINT_NAME = 'fk_price_history_farmer'
);

SET @sql = IF(@fk_exists = 0,
    'ALTER TABLE price_history ADD CONSTRAINT fk_price_history_farmer FOREIGN KEY (farmer_id) REFERENCES users(user_id) ON DELETE SET NULL ON UPDATE CASCADE',
    'SELECT "FK fk_price_history_farmer already exists"'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @fk_exists = (
    SELECT COUNT(*)
    FROM information_schema.TABLE_CONSTRAINTS
    WHERE TABLE_SCHEMA = 'agriconnect_db'
      AND TABLE_NAME = 'price_history'
      AND CONSTRAINT_NAME = 'fk_price_history_buyer'
);

SET @sql = IF(@fk_exists = 0,
    'ALTER TABLE price_history ADD CONSTRAINT fk_price_history_buyer FOREIGN KEY (buyer_id) REFERENCES users(user_id) ON DELETE SET NULL ON UPDATE CASCADE',
    'SELECT "FK fk_price_history_buyer already exists"'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 9. Add UNIQUE constraint on order_id to prevent duplicate price records for the same transaction
SET @idx_exists = (
    SELECT COUNT(*)
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = 'agriconnect_db'
      AND TABLE_NAME = 'price_history'
      AND INDEX_NAME = 'idx_price_history_order_unique'
);

SET @sql = IF(@idx_exists = 0,
    'CREATE UNIQUE INDEX idx_price_history_order_unique ON price_history(order_id)',
    'SELECT "Index idx_price_history_order_unique already exists"'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 10. Add performance composite indexes for analytics & time-series retrieval
SET @idx_exists = (
    SELECT COUNT(*)
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = 'agriconnect_db'
      AND TABLE_NAME = 'price_history'
      AND INDEX_NAME = 'idx_price_history_crop_price'
);

SET @sql = IF(@idx_exists = 0,
    'CREATE INDEX idx_price_history_crop_price ON price_history(crop_id, unit_price)',
    'SELECT "Index idx_price_history_crop_price already exists"'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @idx_exists = (
    SELECT COUNT(*)
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = 'agriconnect_db'
      AND TABLE_NAME = 'price_history'
      AND INDEX_NAME = 'idx_price_history_farmer'
);

SET @sql = IF(@idx_exists = 0,
    'CREATE INDEX idx_price_history_farmer ON price_history(farmer_id)',
    'SELECT "Index idx_price_history_farmer already exists"'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @idx_exists = (
    SELECT COUNT(*)
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = 'agriconnect_db'
      AND TABLE_NAME = 'price_history'
      AND INDEX_NAME = 'idx_price_history_buyer'
);

SET @sql = IF(@idx_exists = 0,
    'CREATE INDEX idx_price_history_buyer ON price_history(buyer_id)',
    'SELECT "Index idx_price_history_buyer already exists"'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
