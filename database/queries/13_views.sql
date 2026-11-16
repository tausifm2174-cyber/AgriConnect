-- ===================================================================
-- AgriConnect — Phase 13: DBMS Queries & Reports
-- Script 13: SQL Views (Virtual Tables) Creation & Query Demonstration
-- Database: MySQL 8.0+
-- Purpose: Encapsulates complex multi-table joins into reusable, security-sanitized
--          virtual tables for reporting, dashboards, and analytical consumers.
-- ===================================================================

USE agriconnect_db;

-- ===================================================================
-- 1. VIEW DEFINITIONS
-- ===================================================================

-- 1.1 View: Verified Quality-Certified Harvests
-- Exposes active, quality-verified crops ready for buyer matchmaking.
-- Sanitized: Excludes sensitive contact or credential details.
CREATE OR REPLACE VIEW vw_verified_harvests AS
SELECT
    h.harvest_id,
    h.farmer_id,
    u.full_name AS farmer_name,
    h.crop_id,
    c.crop_name,
    c.category AS crop_category,
    h.available_quantity,
    h.price_per_kg,
    h.location,
    qa.quality_score,
    qa.quality_grade,
    qa.assessment_date,
    h.status AS harvest_status
FROM harvests h
INNER JOIN users u ON h.farmer_id = u.user_id
INNER JOIN crops c ON h.crop_id = c.crop_id
INNER JOIN quality_assessments qa ON h.harvest_id = qa.harvest_id
WHERE qa.verification_status = 'VERIFIED';


-- 1.2 View: Marketplace Order Summary
-- Unifies commercial contract details across buyers, farmers, and crops.
CREATE OR REPLACE VIEW vw_order_summary AS
SELECT
    o.order_id,
    o.buyer_id,
    b.full_name AS buyer_name,
    h.farmer_id,
    f.full_name AS farmer_name,
    h.crop_id,
    c.crop_name,
    o.quantity,
    o.agreed_price_per_kg,
    o.total_amount,
    o.order_status,
    o.order_date
FROM orders o
INNER JOIN users b ON o.buyer_id = b.user_id
INNER JOIN harvests h ON o.harvest_id = h.harvest_id
INNER JOIN users f ON h.farmer_id = f.user_id
INNER JOIN crops c ON h.crop_id = c.crop_id;


-- 1.3 View: Unified Order Fulfillment Lifecycle (Order -> Delivery -> Payment)
-- Denormalizes the end-to-end commercial transaction into a single operational view.
CREATE OR REPLACE VIEW vw_order_delivery_payment AS
SELECT
    o.order_id,
    o.order_status,
    o.order_date,
    o.total_amount,
    b.user_id AS buyer_id,
    b.full_name AS buyer_name,
    f.user_id AS farmer_id,
    f.full_name AS farmer_name,
    c.crop_id,
    c.crop_name,
    d.delivery_id,
    d.delivery_status,
    d.tracking_number,
    d.dispatched_at,
    d.delivered_at,
    p.payment_id,
    p.payment_status,
    p.payment_method,
    p.amount AS payment_amount,
    p.transaction_reference,
    p.payment_date
FROM orders o
INNER JOIN users b ON o.buyer_id = b.user_id
INNER JOIN harvests h ON o.harvest_id = h.harvest_id
INNER JOIN users f ON h.farmer_id = f.user_id
INNER JOIN crops c ON h.crop_id = c.crop_id
LEFT JOIN deliveries d ON o.order_id = d.order_id
LEFT JOIN payments p ON o.order_id = p.order_id;


-- 1.4 View: Marketplace Price & Benchmark Analytics
-- Merges historical APMC Mandi benchmarks with actual platform transaction sales.
CREATE OR REPLACE VIEW vw_marketplace_price_summary AS
SELECT
    ph.price_id,
    ph.crop_id,
    c.crop_name,
    c.category AS crop_category,
    ph.source_type,
    COALESCE(ph.unit_price, ph.modal_price_per_kg) AS effective_price,
    ph.quantity,
    ph.total_amount,
    ph.modal_price_per_kg,
    ph.min_price_per_kg,
    ph.max_price_per_kg,
    ph.market_location,
    ph.recorded_date,
    ph.order_id,
    f.full_name AS farmer_name,
    b.full_name AS buyer_name,
    ph.created_at
FROM price_history ph
INNER JOIN crops c ON ph.crop_id = c.crop_id
LEFT JOIN users f ON ph.farmer_id = f.user_id
LEFT JOIN users b ON ph.buyer_id = b.user_id;


-- ===================================================================
-- 2. QUERYING THE VIEWS (DEMONSTRATIONS)
-- ===================================================================

-- 2.1 Querying vw_verified_harvests: Finding Grade A Lots under ₹50.00/kg
SELECT
    harvest_id,
    farmer_name,
    crop_name,
    crop_category,
    available_quantity,
    price_per_kg,
    quality_score,
    quality_grade
FROM vw_verified_harvests
WHERE quality_grade = 'A' AND price_per_kg <= 50.00 AND available_quantity > 0
ORDER BY quality_score DESC;

-- 2.2 Querying vw_order_summary: High-Value Contracts Above ₹50,000
SELECT
    order_id,
    buyer_name,
    farmer_name,
    crop_name,
    quantity,
    total_amount,
    order_status
FROM vw_order_summary
WHERE total_amount >= 50000.00
ORDER BY total_amount DESC;

-- 2.3 Querying vw_order_delivery_payment: Auditing Delivered but Unpaid Contracts
SELECT
    order_id,
    buyer_name,
    farmer_name,
    crop_name,
    total_amount,
    delivery_status,
    delivered_at,
    COALESCE(payment_status, 'UNPAID') AS payment_status
FROM vw_order_delivery_payment
WHERE delivery_status = 'DELIVERED'
  AND (payment_status IS NULL OR payment_status != 'COMPLETED')
ORDER BY delivered_at ASC;

-- 2.4 Querying vw_marketplace_price_summary: Benchmarks vs Transactions for Cereals
SELECT
    crop_name,
    source_type,
    COUNT(*) AS records_count,
    ROUND(AVG(effective_price), 2) AS avg_price_per_kg,
    MIN(effective_price) AS floor_price,
    MAX(effective_price) AS ceiling_price
FROM vw_marketplace_price_summary
WHERE crop_category = 'CEREAL'
GROUP BY crop_name, source_type
ORDER BY crop_name ASC, source_type ASC;
