-- ===================================================================
-- AgriConnect — Phase 13: DBMS Queries & Reports
-- Script 11: Phase 13 Analytical Views and Reporting Schema
-- Database: MySQL 8.0+
-- ===================================================================

USE agriconnect_db;

-- 1. View: Verified Quality-Certified Harvests
-- Exposes quality-assessed and verified crops with farmer and grade details.
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

-- 2. View: Marketplace Order Summary
-- Exposes unified order transactions with buyer, farmer, and crop information.
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

-- 3. View: Unified Order Fulfillment Lifecycle (Order -> Delivery -> Payment)
-- Exposes end-to-end transaction state across fulfillment and financial settlement.
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

-- 4. View: Marketplace Price & Benchmark Analytics
-- Merges historical Mandi benchmarks with actual platform transaction sales.
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
