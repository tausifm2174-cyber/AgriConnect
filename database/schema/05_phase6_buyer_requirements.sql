-- ===================================================================
-- AgriConnect — Phase 6: Buyer Requirements Management Schema Migration
-- Script 05: Add required_by_date column to buyer_requirements table
-- Database: MySQL 8.0+
-- ===================================================================

USE agriconnect_db;

-- 1. Add required_by_date column to buyer_requirements table if it does not already exist
SET @col_exists = (
    SELECT COUNT(*) 
    FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = 'agriconnect_db' 
      AND TABLE_NAME = 'buyer_requirements' 
      AND COLUMN_NAME = 'required_by_date'
);

SET @sql = IF(@col_exists = 0, 
    'ALTER TABLE buyer_requirements ADD COLUMN required_by_date DATE NULL AFTER preferred_location', 
    'SELECT "Column required_by_date already exists"'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2. Backfill existing sample buyer requirements with realistic future target fulfillment dates
UPDATE buyer_requirements 
SET required_by_date = '2026-10-15'
WHERE requirement_id = 1 AND required_by_date IS NULL;

UPDATE buyer_requirements 
SET required_by_date = '2026-10-25'
WHERE requirement_id = 2 AND required_by_date IS NULL;

UPDATE buyer_requirements 
SET required_by_date = '2026-11-05'
WHERE requirement_id = 3 AND required_by_date IS NULL;

UPDATE buyer_requirements 
SET required_by_date = '2026-10-30'
WHERE requirement_id = 4 AND required_by_date IS NULL;
