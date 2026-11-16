-- ===================================================================
-- AgriConnect — Phase 13: DBMS Queries & Reports
-- Script 12: Marketplace Executive Analytics & Platform Scorecard
-- Database: MySQL 8.0+
-- Purpose: Provides high-level business intelligence, operational KPIs,
--          conversion efficiencies, and market vitality metrics.
-- ===================================================================

USE agriconnect_db;

-- ===================================================================
-- 1. EXECUTIVE MARKETPLACE KPI SCORECARD
-- Single-row executive summary aggregating core ecosystem indicators.
-- ===================================================================
SELECT
    (SELECT COUNT(*) FROM users WHERE role = 'FARMER' AND status = 'ACTIVE') AS active_farmers,
    (SELECT COUNT(*) FROM users WHERE role = 'BUYER' AND status = 'ACTIVE') AS active_buyers,
    (SELECT COUNT(*) FROM crops) AS cataloged_crops,
    (SELECT COUNT(*) FROM harvests WHERE status = 'AVAILABLE') AS active_harvest_lots,
    (SELECT COALESCE(SUM(available_quantity), 0) FROM harvests WHERE status = 'AVAILABLE') AS available_supply_kg,
    (SELECT COUNT(*) FROM orders) AS total_orders_placed,
    (SELECT COUNT(*) FROM orders WHERE order_status = 'DELIVERED') AS total_delivered_orders,
    (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE payment_status IN ('COMPLETED', 'PAID')) AS gross_cleared_payouts,
    (SELECT COALESCE(SUM(quantity), 0) FROM orders WHERE order_status = 'DELIVERED') AS settled_produce_volume_kg,
    (SELECT COUNT(*) FROM price_history) AS price_points_tracked;


-- ===================================================================
-- 2. TOP CROPS RANKED BY SALES TURNOVER
-- Identifies primary revenue generating agricultural commodities.
-- ===================================================================
SELECT
    c.crop_id,
    c.crop_name,
    c.category,
    COUNT(DISTINCT o.order_id) AS orders_count,
    SUM(o.quantity) AS total_kg_sold,
    SUM(o.total_amount) AS total_turnover,
    ROUND(AVG(o.agreed_price_per_kg), 2) AS avg_realized_price_per_kg,
    ROUND(SUM(o.total_amount) * 100.0 / (SELECT SUM(total_amount) FROM orders), 2) AS revenue_share_pct
FROM orders o
INNER JOIN harvests h ON o.harvest_id = h.harvest_id
INNER JOIN crops c ON h.crop_id = c.crop_id
GROUP BY c.crop_id, c.crop_name, c.category
ORDER BY total_turnover DESC;


-- ===================================================================
-- 3. TOP CROPS RANKED BY BUYER DEMAND
-- Highlights unsatisfied buyer requirements and unmet marketplace appetite.
-- ===================================================================
SELECT
    c.crop_id,
    c.crop_name,
    c.category,
    COUNT(br.requirement_id) AS active_requirements_count,
    SUM(br.required_quantity) AS total_demanded_quantity_kg,
    ROUND(AVG(br.max_price_per_kg), 2) AS avg_willing_price_per_kg,
    (SELECT COALESCE(SUM(h.available_quantity), 0) FROM harvests h WHERE h.crop_id = c.crop_id AND h.status = 'AVAILABLE') AS available_stock_kg,
    SUM(br.required_quantity) - (SELECT COALESCE(SUM(h.available_quantity), 0) FROM harvests h WHERE h.crop_id = c.crop_id AND h.status = 'AVAILABLE') AS demand_supply_deficit_kg
FROM buyer_requirements br
INNER JOIN crops c ON br.crop_id = c.crop_id
WHERE br.status = 'OPEN'
GROUP BY c.crop_id, c.crop_name, c.category
ORDER BY total_demanded_quantity_kg DESC;


-- ===================================================================
-- 4. MOST ACTIVE PRODUCERS (FARMER LEADERBOARD)
-- Ranks farmers by contract fulfillment, volume, and customer reach.
-- ===================================================================
SELECT
    f.user_id AS farmer_id,
    f.full_name AS farmer_name,
    fp.farm_location,
    COUNT(o.order_id) AS total_orders_fulfilled,
    COUNT(DISTINCT o.buyer_id) AS unique_buyers_served,
    SUM(o.quantity) AS volume_sold_kg,
    SUM(o.total_amount) AS gross_sales_value,
    ROUND(AVG(o.agreed_price_per_kg), 2) AS avg_realized_price
FROM orders o
INNER JOIN harvests h ON o.harvest_id = h.harvest_id
INNER JOIN users f ON h.farmer_id = f.user_id
INNER JOIN farmer_profiles fp ON f.user_id = fp.farmer_id
GROUP BY f.user_id, f.full_name, fp.farm_location
ORDER BY gross_sales_value DESC;


-- ===================================================================
-- 5. MOST ACTIVE PURCHASERS (BUYER LEADERBOARD)
-- Ranks buyers by procurement volume, orders, and commercial reliability.
-- ===================================================================
SELECT
    b.user_id AS buyer_id,
    b.full_name AS buyer_name,
    bp.business_name,
    bp.business_type,
    COUNT(o.order_id) AS orders_placed,
    SUM(o.quantity) AS procured_kg,
    SUM(o.total_amount) AS total_spend,
    COUNT(DISTINCT h.farmer_id) AS farmers_partnered_with
FROM orders o
INNER JOIN users b ON o.buyer_id = b.user_id
INNER JOIN buyer_profiles bp ON b.user_id = bp.buyer_id
INNER JOIN harvests h ON o.harvest_id = h.harvest_id
GROUP BY b.user_id, b.full_name, bp.business_name, bp.business_type
ORDER BY total_spend DESC;


-- ===================================================================
-- 6. PLATFORM QUALITY GRADE SPECTRUM
-- Overall distribution of quality assurance certification on the platform.
-- ===================================================================
SELECT
    qa.quality_grade,
    COUNT(qa.assessment_id) AS lots_count,
    ROUND(COUNT(qa.assessment_id) * 100.0 / (SELECT COUNT(*) FROM quality_assessments WHERE verification_status = 'VERIFIED'), 2) AS grade_share_percentage,
    ROUND(AVG(qa.quality_score), 2) AS avg_score,
    ROUND(AVG(qa.damage_percentage), 2) AS avg_damage
FROM quality_assessments qa
WHERE qa.verification_status = 'VERIFIED'
GROUP BY qa.quality_grade
ORDER BY qa.quality_grade ASC;


-- ===================================================================
-- 7. PLATFORM OPERATIONAL FULFILLMENT RATIOS
-- Calculates delivery success percentage and payment clearance rate.
-- ===================================================================
SELECT
    -- Delivery Success Metrics
    (SELECT COUNT(*) FROM deliveries WHERE delivery_status = 'DELIVERED') AS total_delivered_shipments,
    (SELECT COUNT(*) FROM deliveries) AS total_dispatched_shipments,
    ROUND(
        (SELECT COUNT(*) FROM deliveries WHERE delivery_status = 'DELIVERED') * 100.0 /
        NULLIF((SELECT COUNT(*) FROM deliveries), 0), 2
    ) AS delivery_success_rate_pct,
    -- Payment Clearance Metrics
    (SELECT COUNT(*) FROM payments WHERE payment_status IN ('COMPLETED', 'PAID')) AS successful_settlements,
    (SELECT COUNT(*) FROM payments) AS total_payment_records,
    ROUND(
        (SELECT COUNT(*) FROM payments WHERE payment_status IN ('COMPLETED', 'PAID')) * 100.0 /
        NULLIF((SELECT COUNT(*) FROM payments), 0), 2
    ) AS payment_success_rate_pct,
    -- Commercial Order Realization Rate
    ROUND(
        (SELECT COUNT(*) FROM orders WHERE order_status = 'DELIVERED') * 100.0 /
        NULLIF((SELECT COUNT(*) FROM orders), 0), 2
    ) AS order_completion_rate_pct;


-- ===================================================================
-- 8. MANDI BENCHMARK VERSUS PLATFORM REALIZED PRICE SPREAD
-- Compares market transparency against APMC government mandi rates.
-- ===================================================================
SELECT
    c.crop_name,
    c.category,
    ROUND(AVG(CASE WHEN ph.source_type = 'MARKET_MANDI' THEN ph.modal_price_per_kg END), 2) AS avg_mandi_modal_price,
    ROUND(AVG(CASE WHEN ph.source_type = 'TRANSACTION_SALE' THEN ph.unit_price END), 2) AS avg_platform_sale_price,
    ROUND(
        AVG(CASE WHEN ph.source_type = 'TRANSACTION_SALE' THEN ph.unit_price END) -
        AVG(CASE WHEN ph.source_type = 'MARKET_MANDI' THEN ph.modal_price_per_kg END), 2
    ) AS direct_trade_premium_per_kg
FROM crops c
LEFT JOIN price_history ph ON c.crop_id = ph.crop_id
GROUP BY c.crop_id, c.crop_name, c.category
HAVING avg_mandi_modal_price IS NOT NULL OR avg_platform_sale_price IS NOT NULL
ORDER BY c.crop_name ASC;
