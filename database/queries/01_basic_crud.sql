-- ===================================================================
-- AgriConnect — Phase 13: DBMS Queries & Reports
-- Script 01: Basic SQL CRUD Operations
-- Database: MySQL 8.0+
-- Purpose: Demonstrates fundamental SQL Data Manipulation Language (DML)
--          operations: SELECT, INSERT, UPDATE, DELETE with filtering.
-- ===================================================================

USE agriconnect_db;

-- ===================================================================
-- 1. SELECT OPERATIONS (DATA RETRIEVAL & FILTERING)
-- ===================================================================

-- 1.1 Simple Retrieval with Exact Equality Filtering
-- Retrieve active farmers in the system
SELECT user_id, full_name, email, phone, role, status, created_at
FROM users
WHERE role = 'FARMER' AND status = 'ACTIVE'
ORDER BY full_name ASC;

-- 1.2 Text Search using LIKE Wildcards
-- Find crops containing 'Rice' or 'Wheat' in their name
SELECT crop_id, crop_name, category, description
FROM crops
WHERE crop_name LIKE '%Rice%' OR crop_name LIKE '%Wheat%'
ORDER BY crop_id ASC;

-- 1.3 Range Filtering with BETWEEN
-- Harvests with price between ₹20.00 and ₹50.00 per kg
SELECT harvest_id, farmer_id, crop_id, available_quantity, price_per_kg, location, harvest_date, status
FROM harvests
WHERE price_per_kg BETWEEN 20.00 AND 50.00
ORDER BY price_per_kg ASC;

-- 1.4 Set Membership Filtering using IN
-- Orders in pending or confirmed lifecycle stages
SELECT order_id, buyer_id, harvest_id, quantity, agreed_price_per_kg, total_amount, order_status, order_date
FROM orders
WHERE order_status IN ('PENDING', 'ACCEPTED', 'CONFIRMED')
ORDER BY order_date DESC;

-- 1.5 Nullability Checks using IS NULL and IS NOT NULL
-- Buyer requirements where preferred location is specified vs not specified
SELECT requirement_id, buyer_id, crop_id, required_quantity, max_price_per_kg, preferred_location, status
FROM buyer_requirements
WHERE preferred_location IS NOT NULL
ORDER BY required_by_date ASC;

-- Deliveries where delivery tracking number has not yet been assigned
SELECT delivery_id, order_id, delivery_status, tracking_number, estimated_delivery_date
FROM deliveries
WHERE tracking_number IS NULL OR tracking_number = '';

-- 1.6 Pagination and Ordering using ORDER BY and LIMIT
-- Top 5 highest-volume available harvests
SELECT harvest_id, crop_id, available_quantity, price_per_kg, location, status
FROM harvests
WHERE status = 'AVAILABLE'
ORDER BY available_quantity DESC
LIMIT 5 OFFSET 0;


-- ===================================================================
-- 2. INSERT OPERATIONS (DATA CREATION)
-- ===================================================================
-- NOTE: Uses dedicated demonstration values with safe identifiers.

-- 2.1 Inserting a New Master Crop Entry
INSERT INTO crops (crop_name, category, description)
VALUES ('Soybean (JS 335)', 'OILSEED', 'High oil and protein content certified variety for agricultural markets');

-- 2.2 Inserting a Safe Demonstration Buyer Requirement
-- Using an existing active buyer (e.g., user_id = 4) and the newly created crop
INSERT INTO buyer_requirements (
    buyer_id, crop_id, required_quantity, max_price_per_kg,
    min_quality_grade, preferred_location, required_by_date, status
)
SELECT
    u.user_id,
    c.crop_id,
    1500.00,
    45.00,
    'B',
    'Indore, Madhya Pradesh',
    DATE_ADD(CURDATE(), INTERVAL 20 DAY),
    'OPEN'
FROM users u
CROSS JOIN crops c
WHERE u.role = 'BUYER' AND u.status = 'ACTIVE' AND c.crop_name = 'Soybean (JS 335)'
LIMIT 1;


-- ===================================================================
-- 3. UPDATE OPERATIONS (DATA MODIFICATION)
-- ===================================================================
-- NOTE: Always use targeted WHERE clauses with Primary Keys or Unique Keys.

-- 3.1 Updating Harvest Asking Price idempotently
UPDATE harvests
SET price_per_kg = 26.00
WHERE harvest_id = 1 AND status = 'AVAILABLE';

-- 3.2 Updating Demonstration Crop Description
UPDATE crops
SET description = 'Certified high-yielding soybean lot, suitable for edible oil processing and industrial food production'
WHERE crop_name = 'Soybean (JS 335)';


-- ===================================================================
-- 4. DELETE OPERATIONS (SAFE DEMONSTRATION RECORD CLEANUP)
-- ===================================================================
-- CAUTION: Delete is demonstrated only on newly created demonstration records.
-- Production and historical transactional tables (orders, deliveries, payments) must never be purged.

-- 4.1 Delete the demonstration buyer requirement
DELETE FROM buyer_requirements
WHERE crop_id IN (SELECT crop_id FROM crops WHERE crop_name = 'Soybean (JS 335)');

-- 4.2 Delete the demonstration master crop
DELETE FROM crops
WHERE crop_name = 'Soybean (JS 335)';
