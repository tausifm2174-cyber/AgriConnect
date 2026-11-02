-- ===================================================================
-- AgriConnect — Phase 3: Authentication & User Management Schema Migration
-- Script 04: Add password_hash column to users table
-- Database: MySQL 8.0+
-- ===================================================================

USE agriconnect_db;

-- 1. Add password_hash column to users table if it does not already exist
SET @col_exists = (
    SELECT COUNT(*) 
    FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = 'agriconnect_db' 
      AND TABLE_NAME = 'users' 
      AND COLUMN_NAME = 'password_hash'
);

SET @sql = IF(@col_exists = 0, 
    'ALTER TABLE users ADD COLUMN password_hash VARCHAR(255) NULL AFTER phone', 
    'SELECT "Column password_hash already exists"'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2. Backfill existing sample users with BCrypt password hash for: Password@123
-- BCrypt cost factor 10
UPDATE users 
SET password_hash = '$2a$10$g8qtqtrj7Oj6UgyriXArT.pwPRWNEOOrP3yRxNxgxT6Rh9Drtc8eq' 
WHERE password_hash IS NULL OR password_hash = '';

-- 3. Enforce NOT NULL constraint
ALTER TABLE users 
    MODIFY COLUMN password_hash VARCHAR(255) NOT NULL;
