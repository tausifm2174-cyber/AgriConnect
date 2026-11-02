-- ===================================================================
-- AgriConnect — Phase 2: Relational Database Schema
-- Script: Academic DBMS Demonstration Queries
-- Covers: Basic CRUD, Joins, Aggregates, Grouping, Quality Filtering,
--         Price Analytics, and Quality-Aware Matching Simulation.
-- Database: MySQL 8.0+
-- ===================================================================

USE agriconnect_db;

-- ===================================================================
-- 1. BASIC CRUD OPERATIONS
-- ===================================================================

-- 1.1 SELECT: Retrieve all registered farmers and their contact details
SELECT user_id, full_name, email, phone, status
FROM users
WHERE role = 'FARMER';

-- 1.2 INSERT: Register a new crop into the master catalog
INSERT INTO crops (crop_name, category, season, description)
VALUES ('Mustard (Pusa Bold)', 'OILSEED', 'RABI', 'High-yielding bold grain mustard for edible oil extraction');

-- 1.3 UPDATE: Update available quantity and asking price of a harvest
UPDATE harvests
SET available_quantity = 550.00, price_per_kg = 26.00
WHERE harvest_id = 1;

-- 1.4 DELETE: Remove the test crop (only where no foreign key references exist)
DELETE FROM crops
WHERE crop_name = 'Mustard (Pusa Bold)';


-- ===================================================================
-- 2. JOINS (INNER JOIN & LEFT JOIN)
-- ===================================================================

-- 2.1 INNER JOIN: Get Harvests with Farmer Name, Crop Name, and Quality Grade
SELECT 
    h.harvest_id,
    u.full_name AS farmer_name,
    c.crop_name,
    h.available_quantity,
    h.price_per_kg,
    qa.quality_score,
    qa.quality_grade,
    qa.verification_status
FROM harvests h
INNER JOIN users u ON h.farmer_id = u.user_id
INNER JOIN crops c ON h.crop_id = c.crop_id
INNER JOIN quality_assessments qa ON h.harvest_id = qa.harvest_id;

-- 2.2 LEFT JOIN: List all Crops and count associated harvests (including crops with 0 harvests)
SELECT 
    c.crop_id,
    c.crop_name,
    c.category,
    COUNT(h.harvest_id) AS total_harvest_listings,
    COALESCE(SUM(h.available_quantity), 0.00) AS total_available_kg
FROM crops c
LEFT JOIN harvests h ON c.crop_id = h.crop_id
GROUP BY c.crop_id, c.crop_name, c.category
ORDER BY total_available_kg DESC;

-- 2.3 Comprehensive 5-Table INNER JOIN: Full Order Audit Report
SELECT 
    o.order_id,
    buyer.full_name AS buyer_name,
    bp.business_name,
    farmer.full_name AS farmer_name,
    c.crop_name,
    o.quantity AS ordered_kg,
    o.agreed_price_per_kg,
    o.total_amount,
    d.delivery_status,
    d.tracking_number,
    COALESCE(SUM(p.amount), 0.00) AS total_paid_amount
FROM orders o
INNER JOIN users buyer ON o.buyer_id = buyer.user_id
INNER JOIN buyer_profiles bp ON buyer.user_id = bp.buyer_id
INNER JOIN harvests h ON o.harvest_id = h.harvest_id
INNER JOIN users farmer ON h.farmer_id = farmer.user_id
INNER JOIN crops c ON h.crop_id = c.crop_id
LEFT JOIN deliveries d ON o.order_id = d.order_id
LEFT JOIN payments p ON o.order_id = p.order_id AND p.payment_status = 'COMPLETED'
GROUP BY o.order_id, buyer.full_name, bp.business_name, farmer.full_name, c.crop_name, o.quantity, o.agreed_price_per_kg, o.total_amount, d.delivery_status, d.tracking_number;


-- ===================================================================
-- 3. AGGREGATE FUNCTIONS (COUNT, SUM, AVG, MIN, MAX)
-- ===================================================================

-- 3.1 Financial Summary of Completed Orders
SELECT 
    COUNT(order_id) AS total_completed_orders,
    SUM(total_amount) AS gross_merchandise_value,
    AVG(total_amount) AS average_order_value,
    MIN(total_amount) AS smallest_order_value,
    MAX(total_amount) AS largest_order_value
FROM orders
WHERE order_status IN ('CONFIRMED', 'DELIVERED');


-- ===================================================================
-- 4. GROUP BY, HAVING & ORDER BY
-- ===================================================================

-- 4.1 Farmer Sales Volume by Crop with HAVING filter
SELECT 
    u.full_name AS farmer_name,
    c.crop_name,
    COUNT(h.harvest_id) AS total_batches,
    SUM(h.initial_quantity) AS total_harvested_kg,
    SUM(h.initial_quantity - h.available_quantity) AS total_sold_kg,
    ROUND(AVG(h.price_per_kg), 2) AS avg_asking_price
FROM harvests h
INNER JOIN users u ON h.farmer_id = u.user_id
INNER JOIN crops c ON h.crop_id = c.crop_id
GROUP BY u.full_name, c.crop_name
HAVING total_sold_kg > 0
ORDER BY total_sold_kg DESC;


-- ===================================================================
-- 5. QUALITY MANAGEMENT & FILTERING
-- ===================================================================

-- 5.1 Quality Grade Distribution & Average Inspection Scores
SELECT 
    qa.quality_grade,
    qa.verification_status,
    COUNT(qa.assessment_id) AS total_batches,
    ROUND(AVG(qa.quality_score), 2) AS avg_quality_score,
    ROUND(AVG(qa.freshness), 2) AS avg_freshness,
    ROUND(AVG(qa.damage_percentage), 2) AS avg_damage_percentage
FROM quality_assessments qa
GROUP BY qa.quality_grade, qa.verification_status
ORDER BY qa.quality_grade ASC;

-- 5.2 Filter Grade 'A' Verified Harvest Lots with minimal damage (<= 5%)
SELECT 
    h.harvest_id,
    c.crop_name,
    h.available_quantity,
    h.price_per_kg,
    qa.quality_grade,
    qa.quality_score,
    qa.damage_percentage,
    qa.inspector_notes
FROM harvests h
INNER JOIN crops c ON h.crop_id = c.crop_id
INNER JOIN quality_assessments qa ON h.harvest_id = qa.harvest_id
WHERE qa.verification_status = 'VERIFIED'
  AND qa.quality_grade = 'A'
  AND qa.damage_percentage <= 5.00
ORDER BY h.price_per_kg ASC;


-- ===================================================================
-- 6. CROP-WISE PRICE HISTORY & TREND ANALYTICS
-- ===================================================================

-- 6.1 Historical Price Statistics per Crop across Mandis
SELECT 
    c.crop_name,
    ph.market_location,
    COUNT(ph.price_id) AS recorded_days,
    MIN(ph.min_price_per_kg) AS absolute_minimum_price,
    MAX(ph.max_price_per_kg) AS peak_maximum_price,
    ROUND(AVG(ph.modal_price_per_kg), 2) AS average_modal_price
FROM price_history ph
INNER JOIN crops c ON ph.crop_id = c.crop_id
GROUP BY c.crop_name, ph.market_location
ORDER BY c.crop_name, average_modal_price DESC;


-- ===================================================================
-- 7. MARKETPLACE LOOKUP & QUALITY-AWARE MATCHING PREPARATION
-- ===================================================================

-- 7.1 Available Harvest Search: Available crop lots with verified quality
SELECT 
    h.harvest_id,
    c.crop_name,
    h.location AS farm_location,
    h.available_quantity,
    h.price_per_kg,
    qa.quality_grade,
    qa.quality_score
FROM harvests h
INNER JOIN crops c ON h.crop_id = c.crop_id
INNER JOIN quality_assessments qa ON h.harvest_id = qa.harvest_id
WHERE h.status = 'AVAILABLE'
  AND h.available_quantity > 0
  AND qa.verification_status = 'VERIFIED'
ORDER BY h.price_per_kg ASC;

-- 7.2 Open Buyer Requirements Lookup
SELECT 
    br.requirement_id,
    u.full_name AS buyer_name,
    bp.business_name,
    c.crop_name,
    br.required_quantity,
    br.max_price_per_kg,
    br.min_quality_grade,
    br.preferred_location
FROM buyer_requirements br
INNER JOIN users u ON br.buyer_id = u.user_id
INNER JOIN buyer_profiles bp ON u.user_id = bp.buyer_id
INNER JOIN crops c ON br.crop_id = c.crop_id
WHERE br.status = 'OPEN';

-- 7.3 Step 17 Simulation: Quality-Aware Matching Query
-- Scenario: Match Buyer Requirement #1:
-- Target: Crop = 'Tomato (Hybrid Red)', Quantity = 400 kg, Max Price = ₹27/kg, Min Grade = 'A'
SELECT 
    br.requirement_id,
    buyer.full_name AS buyer_name,
    c.crop_name,
    h.harvest_id,
    farmer.full_name AS farmer_name,
    h.location AS harvest_location,
    h.available_quantity,
    h.price_per_kg,
    qa.quality_grade,
    qa.quality_score,
    (h.price_per_kg * br.required_quantity) AS estimated_total_cost
FROM buyer_requirements br
INNER JOIN crops c ON br.crop_id = c.crop_id
INNER JOIN users buyer ON br.buyer_id = buyer.user_id
INNER JOIN harvests h ON h.crop_id = br.crop_id
INNER JOIN users farmer ON h.farmer_id = farmer.user_id
INNER JOIN quality_assessments qa ON h.harvest_id = qa.harvest_id
WHERE br.requirement_id = 1
  AND h.status = 'AVAILABLE'
  AND h.available_quantity >= br.required_quantity
  AND h.price_per_kg <= br.max_price_per_kg
  AND qa.verification_status = 'VERIFIED'
  AND (
      -- Grade matching hierarchy: If requirement is 'A', accept 'A'
      (br.min_quality_grade = 'A' AND qa.quality_grade = 'A')
      OR
      -- If requirement is 'B', accept 'A' or 'B'
      (br.min_quality_grade = 'B' AND qa.quality_grade IN ('A', 'B'))
      OR
      -- If requirement is 'C', accept 'A', 'B', or 'C'
      (br.min_quality_grade = 'C' AND qa.quality_grade IN ('A', 'B', 'C'))
  )
ORDER BY h.price_per_kg ASC, qa.quality_score DESC;
