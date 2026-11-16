-- ===================================================================
-- AgriConnect — Phase 13: DBMS Queries & Reports
-- Script 02: Multi-Table Relational JOIN Queries
-- Database: MySQL 8.0+
-- Purpose: Demonstrates INNER JOIN, LEFT OUTER JOIN, and multi-way
--          relational joins traversing foreign key relationships.
-- ===================================================================

USE agriconnect_db;

-- ===================================================================
-- QUERY 1: Farmer Harvest Listing
-- Traverses: users -> farmer_profiles -> harvests -> crops
-- Shows: Farmer details, farm profile, crop catalog, harvest quantity, price, date, and status.
-- ===================================================================
SELECT
    u.user_id AS farmer_id,
    u.full_name AS farmer_name,
    u.phone AS contact_number,
    fp.farm_location,
    fp.farm_size_acres,
    c.crop_name,
    c.category AS crop_category,
    h.harvest_id,
    h.initial_quantity,
    h.available_quantity,
    h.price_per_kg,
    h.harvest_date,
    h.status AS harvest_status
FROM users u
INNER JOIN farmer_profiles fp ON u.user_id = fp.farmer_id
INNER JOIN harvests h ON u.user_id = h.farmer_id
INNER JOIN crops c ON h.crop_id = c.crop_id
WHERE u.status = 'ACTIVE'
ORDER BY h.harvest_date DESC, u.full_name ASC;


-- ===================================================================
-- QUERY 2: Quality-Certified Produce Listing
-- Traverses: harvests -> crops -> quality_assessments -> users (inspector & farmer)
-- Shows: Verified quality certification, inspector score, grade, and harvest availability.
-- ===================================================================
SELECT
    h.harvest_id,
    f.full_name AS farmer_name,
    c.crop_name,
    h.available_quantity,
    h.price_per_kg,
    qa.quality_score,
    qa.quality_grade,
    qa.verification_status,
    qa.damage_percentage,
    qa.assessment_date,
    insp.full_name AS assessed_by
FROM harvests h
INNER JOIN crops c ON h.crop_id = c.crop_id
INNER JOIN users f ON h.farmer_id = f.user_id
INNER JOIN quality_assessments qa ON h.harvest_id = qa.harvest_id
INNER JOIN users insp ON qa.admin_id = insp.user_id
WHERE qa.verification_status = 'VERIFIED'
ORDER BY qa.quality_score DESC, h.available_quantity DESC;


-- ===================================================================
-- QUERY 3: Buyer Orders and Counterparty Discovery
-- Traverses: orders -> users (buyer) -> harvests -> users (farmer) -> crops
-- Shows: Buyer orders, the corresponding farmer, crop, agreed pricing, and status.
-- ===================================================================
SELECT
    o.order_id,
    b.full_name AS buyer_name,
    bp.business_name,
    f.full_name AS farmer_name,
    c.crop_name,
    o.quantity,
    o.agreed_price_per_kg,
    o.total_amount,
    o.order_status,
    o.order_date
FROM orders o
INNER JOIN users b ON o.buyer_id = b.user_id
LEFT JOIN buyer_profiles bp ON b.user_id = bp.buyer_id
INNER JOIN harvests h ON o.harvest_id = h.harvest_id
INNER JOIN users f ON h.farmer_id = f.user_id
INNER JOIN crops c ON h.crop_id = c.crop_id
ORDER BY o.order_date DESC;


-- ===================================================================
-- QUERY 4: Order and Delivery Logistical Tracking
-- Traverses: orders -> deliveries
-- Demonstrates LEFT JOIN to capture all orders regardless of dispatch status.
-- ===================================================================
SELECT
    o.order_id,
    o.order_status,
    o.quantity AS order_quantity,
    o.total_amount,
    d.delivery_id,
    COALESCE(d.delivery_status, 'NOT_DISPATCHED') AS delivery_status,
    d.tracking_number,
    d.vehicle_number,
    d.delivery_address,
    d.estimated_delivery_date,
    d.dispatched_at,
    d.delivered_at,
    d.remarks AS delivery_remarks
FROM orders o
LEFT JOIN deliveries d ON o.order_id = d.order_id
ORDER BY o.order_id ASC;


-- ===================================================================
-- QUERY 5: Order and Financial Settlement Tracking
-- Traverses: orders -> payments
-- Captures financial payment method, settlement status, and references.
-- ===================================================================
SELECT
    o.order_id,
    o.order_status,
    o.total_amount AS order_amount,
    p.payment_id,
    p.amount AS amount_paid,
    COALESCE(p.payment_status, 'UNPAID') AS payment_status,
    p.payment_method,
    p.transaction_reference,
    p.payment_date
FROM orders o
LEFT JOIN payments p ON o.order_id = p.order_id
ORDER BY o.order_id ASC;


-- ===================================================================
-- QUERY 6: Complete End-to-End Transaction Lifecycle Report
-- Traverses across 8 tables:
-- users (farmer) -> crops -> harvests -> quality_assessments ->
-- users (buyer) -> orders -> deliveries -> payments
-- ===================================================================
SELECT
    o.order_id,
    o.order_date,
    o.order_status,
    -- Farmer & Harvest
    f.full_name AS farmer_name,
    c.crop_name,
    h.harvest_id,
    -- Quality Certification
    qa.quality_grade,
    qa.quality_score,
    qa.verification_status,
    -- Buyer & Transaction Terms
    b.full_name AS buyer_name,
    o.quantity AS ordered_quantity,
    o.agreed_price_per_kg,
    o.total_amount AS order_total,
    -- Delivery Logistics
    COALESCE(d.delivery_status, 'PENDING') AS delivery_status,
    d.tracking_number,
    d.delivered_at,
    -- Payment Settlement
    COALESCE(p.payment_status, 'PENDING') AS payment_status,
    p.payment_method,
    p.amount AS settled_amount
FROM orders o
INNER JOIN harvests h ON o.harvest_id = h.harvest_id
INNER JOIN users f ON h.farmer_id = f.user_id
INNER JOIN crops c ON h.crop_id = c.crop_id
INNER JOIN users b ON o.buyer_id = b.user_id
LEFT JOIN quality_assessments qa ON h.harvest_id = qa.harvest_id
LEFT JOIN deliveries d ON o.order_id = d.order_id
LEFT JOIN payments p ON o.order_id = p.order_id
ORDER BY o.order_id ASC;
