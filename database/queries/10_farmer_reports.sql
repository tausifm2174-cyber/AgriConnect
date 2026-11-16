-- ===================================================================
-- AgriConnect — Phase 13: DBMS Queries & Reports
-- Script 10: Farmer Operational & Financial Performance Reports
-- Database: MySQL 8.0+
-- Purpose: Dedicated supply-side reports providing individual farmers with
--          visibility into order fulfillment, crop yield, quality, and payouts.
-- ===================================================================

USE agriconnect_db;

-- ===================================================================
-- 1. FARMER OVERALL COMMERCIAL SALES SUMMARY
-- Aggregates overall fulfillment and financial velocity per farmer.
-- ===================================================================
SELECT
    f.user_id AS farmer_id,
    f.full_name AS farmer_name,
    fp.farm_location,
    fp.farm_size_acres,
    COUNT(DISTINCT o.order_id) AS total_orders_received,
    SUM(CASE WHEN o.order_status = 'DELIVERED' THEN 1 ELSE 0 END) AS delivered_orders,
    SUM(CASE WHEN o.order_status = 'CONFIRMED' THEN 1 ELSE 0 END) AS confirmed_active_orders,
    SUM(CASE WHEN o.order_status = 'PENDING' THEN 1 ELSE 0 END) AS pending_orders,
    COALESCE(SUM(o.quantity), 0) AS total_quantity_contracted_kg,
    COALESCE(SUM(o.total_amount), 0) AS gross_sales_value,
    ROUND(AVG(o.agreed_price_per_kg), 2) AS average_selling_price_per_kg
FROM users f
INNER JOIN farmer_profiles fp ON f.user_id = fp.farmer_id
LEFT JOIN harvests h ON f.user_id = h.farmer_id
LEFT JOIN orders o ON h.harvest_id = o.harvest_id
WHERE f.role = 'FARMER'
GROUP BY f.user_id, f.full_name, fp.farm_location, fp.farm_size_acres
ORDER BY gross_sales_value DESC;


-- ===================================================================
-- 2. FARMER CROP PORTFOLIO PERFORMANCE
-- Detailed crop-by-crop yield, inventory availability, and sales per farmer.
-- ===================================================================
SELECT
    f.user_id AS farmer_id,
    f.full_name AS farmer_name,
    c.crop_name,
    c.category AS crop_category,
    COUNT(DISTINCT h.harvest_id) AS harvest_lots_listed,
    SUM(h.initial_quantity) AS total_harvested_yield_kg,
    SUM(h.available_quantity) AS current_unsold_stock_kg,
    ROUND(AVG(h.price_per_kg), 2) AS avg_asking_price_per_kg,
    COALESCE(SUM(o.quantity), 0) AS total_sold_quantity_kg,
    COALESCE(SUM(o.total_amount), 0) AS total_crop_sales_revenue
FROM users f
INNER JOIN harvests h ON f.user_id = h.farmer_id
INNER JOIN crops c ON h.crop_id = c.crop_id
LEFT JOIN orders o ON h.harvest_id = o.harvest_id
WHERE f.role = 'FARMER'
GROUP BY f.user_id, f.full_name, c.crop_id, c.crop_name, c.category
ORDER BY f.full_name ASC, total_crop_sales_revenue DESC;


-- ===================================================================
-- 3. FARMER QUALITY TRACK RECORD
-- Evaluates harvest inspection compliance and grade distribution.
-- ===================================================================
SELECT
    f.user_id AS farmer_id,
    f.full_name AS farmer_name,
    COUNT(qa.assessment_id) AS total_inspected_lots,
    SUM(CASE WHEN qa.verification_status = 'VERIFIED' THEN 1 ELSE 0 END) AS verified_lots,
    SUM(CASE WHEN qa.verification_status = 'REJECTED' THEN 1 ELSE 0 END) AS rejected_lots,
    SUM(CASE WHEN qa.quality_grade = 'A' AND qa.verification_status = 'VERIFIED' THEN 1 ELSE 0 END) AS grade_a_count,
    SUM(CASE WHEN qa.quality_grade = 'B' AND qa.verification_status = 'VERIFIED' THEN 1 ELSE 0 END) AS grade_b_count,
    SUM(CASE WHEN qa.quality_grade = 'C' AND qa.verification_status = 'VERIFIED' THEN 1 ELSE 0 END) AS grade_c_count,
    ROUND(AVG(CASE WHEN qa.verification_status = 'VERIFIED' THEN qa.quality_score END), 2) AS avg_verified_quality_score,
    ROUND(AVG(qa.damage_percentage), 2) AS avg_damage_percentage
FROM users f
INNER JOIN harvests h ON f.user_id = h.farmer_id
LEFT JOIN quality_assessments qa ON h.harvest_id = qa.harvest_id
WHERE f.role = 'FARMER'
GROUP BY f.user_id, f.full_name
ORDER BY avg_verified_quality_score DESC;


-- ===================================================================
-- 4. FARMER HISTORICAL TRANSACTION SETTLEMENTS
-- Ledger of completed and pending financial payouts realized by each farmer.
-- ===================================================================
SELECT
    f.user_id AS farmer_id,
    f.full_name AS farmer_name,
    o.order_id,
    c.crop_name,
    o.quantity,
    o.agreed_price_per_kg,
    o.total_amount,
    b.full_name AS buyer_name,
    p.payment_id,
    COALESCE(p.payment_status, 'UNPAID') AS payout_status,
    p.amount AS payout_amount,
    p.payment_date
FROM users f
INNER JOIN harvests h ON f.user_id = h.farmer_id
INNER JOIN crops c ON h.crop_id = c.crop_id
INNER JOIN orders o ON h.harvest_id = o.harvest_id
INNER JOIN users b ON o.buyer_id = b.user_id
LEFT JOIN payments p ON o.order_id = p.order_id
WHERE f.role = 'FARMER'
ORDER BY f.user_id ASC, o.order_date DESC;


-- ===================================================================
-- 5. TOP-PERFORMING CROPS FOR A SPECIFIC FARMER (EXAMPLE: FARMER ID = 3)
-- Demonstrates parameterized analysis for a single farmer's dashboard.
-- ===================================================================
SELECT
    c.crop_name,
    COUNT(DISTINCT o.order_id) AS orders_count,
    SUM(o.quantity) AS total_kg_sold,
    SUM(o.total_amount) AS revenue_generated,
    ROUND(AVG(o.agreed_price_per_kg), 2) AS avg_realized_price
FROM orders o
INNER JOIN harvests h ON o.harvest_id = h.harvest_id
INNER JOIN crops c ON h.crop_id = c.crop_id
WHERE h.farmer_id = 3
GROUP BY c.crop_id, c.crop_name
ORDER BY revenue_generated DESC;
