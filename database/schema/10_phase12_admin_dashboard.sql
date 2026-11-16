-- ===================================================================
-- AgriConnect — Phase 12: Admin Dashboard Schema Migration
-- Script 10: Optimize Indexes for Centralized Admin Dashboard & KPI Aggregations
-- Database: MySQL 8.0+
-- ===================================================================

USE agriconnect_db;

-- 1. Index on price_history(source_type) for rapid benchmark vs transaction filtering
SET @idx_exists = (
    SELECT COUNT(*)
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = 'agriconnect_db'
      AND TABLE_NAME = 'price_history'
      AND INDEX_NAME = 'idx_price_history_source'
);

SET @sql = IF(@idx_exists = 0,
    'CREATE INDEX idx_price_history_source ON price_history(source_type)',
    'SELECT "Index idx_price_history_source already exists"'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2. Index on harvests(status) for available vs sold inventory dashboard counters
SET @idx_exists = (
    SELECT COUNT(*)
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = 'agriconnect_db'
      AND TABLE_NAME = 'harvests'
      AND INDEX_NAME = 'idx_harvests_status_only'
);

SET @sql = IF(@idx_exists = 0,
    'CREATE INDEX idx_harvests_status_only ON harvests(status)',
    'SELECT "Index idx_harvests_status_only already exists"'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 3. Index on buyer_requirements(status) for open vs closed demand metrics
SET @idx_exists = (
    SELECT COUNT(*)
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = 'agriconnect_db'
      AND TABLE_NAME = 'buyer_requirements'
      AND INDEX_NAME = 'idx_buyer_req_status_only'
);

SET @sql = IF(@idx_exists = 0,
    'CREATE INDEX idx_buyer_req_status_only ON buyer_requirements(status)',
    'SELECT "Index idx_buyer_req_status_only already exists"'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
