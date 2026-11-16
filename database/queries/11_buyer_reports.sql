-- ===================================================================
-- AgriConnect — Phase 13: DBMS Queries & Reports
-- Script 11: Buyer Procurement & Demand Fulfillment Reports
-- Database: MySQL 8.0+
-- Purpose: Dedicated demand-side reports providing registered commercial buyers
--          with procurement analytics, fulfillment ratios, and payment records.
-- ===================================================================

USE agriconnect_db;

-- ===================================================================
-- 1. BUYER OVERALL PROCUREMENT & SPENDING SUMMARY
-- Aggregates procurement volume, fulfillment completion, and spending.
-- ===================================================================
SELECT
    b.user_id AS buyer_id,
    b.full_name AS buyer_name,
    bp.business_name,
    bp.business_type,
    COUNT(o.order_id) AS total_orders_placed,
    SUM(CASE WHEN o.order_status = 'DELIVERED' THEN 1 ELSE 0 END) AS delivered_orders,
    SUM(CASE WHEN o.order_status = 'CONFIRMED' THEN 1 ELSE 0 END) AS confirmed_orders,
    SUM(CASE WHEN o.order_status = 'PENDING' THEN 1 ELSE 0 END) AS pending_orders,
    COALESCE(SUM(o.quantity), 0) AS total_procured_quantity_kg,
    COALESCE(SUM(o.total_amount), 0) AS total_procurement_expenditure,
    ROUND(AVG(o.agreed_price_per_kg), 2) AS avg_price_paid_per_kg
FROM users b
INNER JOIN buyer_profiles bp ON b.user_id = bp.buyer_id
LEFT JOIN orders o ON b.user_id = o.buyer_id
WHERE b.role = 'BUYER'
GROUP BY b.user_id, b.full_name, bp.business_name, bp.business_type
ORDER BY total_procurement_expenditure DESC;


-- ===================================================================
-- 2. CROP-WISE PROCUREMENT BREAKDOWN PER BUYER
-- Analyzes which commodities are procured by individual buyers.
-- ===================================================================
SELECT
    b.user_id AS buyer_id,
    b.full_name AS buyer_name,
    bp.business_name,
    c.crop_name,
    c.category AS crop_category,
    COUNT(o.order_id) AS purchase_orders_count,
    SUM(o.quantity) AS total_kg_purchased,
    SUM(o.total_amount) AS total_expenditure,
    ROUND(AVG(o.agreed_price_per_kg), 2) AS avg_purchase_price_per_kg
FROM users b
INNER JOIN buyer_profiles bp ON b.user_id = bp.buyer_id
INNER JOIN orders o ON b.user_id = o.buyer_id
INNER JOIN harvests h ON o.harvest_id = h.harvest_id
INNER JOIN crops c ON h.crop_id = c.crop_id
WHERE b.role = 'BUYER'
GROUP BY b.user_id, b.full_name, bp.business_name, c.crop_id, c.crop_name, c.category
ORDER BY b.full_name ASC, total_expenditure DESC;


-- ===================================================================
-- 3. BUYER PAYMENT & OUTSTANDING BALANCE SUMMARY
-- Evaluates cash outflows versus pending clearing amounts per buyer.
-- ===================================================================
SELECT
    b.user_id AS buyer_id,
    b.full_name AS buyer_name,
    bp.business_name,
    COUNT(DISTINCT o.order_id) AS total_orders,
    SUM(o.total_amount) AS total_contracted_obligation,
    COALESCE(SUM(CASE WHEN p.payment_status IN ('COMPLETED', 'PAID') THEN p.amount ELSE 0 END), 0) AS settled_payments,
    COALESCE(SUM(CASE WHEN p.payment_status = 'PENDING' THEN p.amount ELSE 0 END), 0) AS pending_clearing_payments,
    SUM(o.total_amount) - COALESCE(SUM(CASE WHEN p.payment_status IN ('COMPLETED', 'PAID') THEN p.amount ELSE 0 END), 0) AS outstanding_balance
FROM users b
INNER JOIN buyer_profiles bp ON b.user_id = bp.buyer_id
INNER JOIN orders o ON b.user_id = o.buyer_id
LEFT JOIN payments p ON o.order_id = p.order_id
WHERE b.role = 'BUYER'
GROUP BY b.user_id, b.full_name, bp.business_name
ORDER BY total_contracted_obligation DESC;


-- ===================================================================
-- 4. BUYER DEMAND REQUIREMENTS VERSUS ACTUAL PURCHASES
-- Compares procurement intent (buyer_requirements) against executed orders.
-- ===================================================================
SELECT
    b.user_id AS buyer_id,
    b.full_name AS buyer_name,
    c.crop_name,
    -- Demanded via Requirements
    COALESCE(SUM(DISTINCT br.required_quantity), 0) AS demanded_quantity_kg,
    ROUND(AVG(br.max_price_per_kg), 2) AS max_budget_price_per_kg,
    -- Procured via Orders
    COALESCE(SUM(o.quantity), 0) AS purchased_quantity_kg,
    ROUND(AVG(o.agreed_price_per_kg), 2) AS realized_purchase_price_per_kg,
    -- Fulfillment Gap
    COALESCE(SUM(DISTINCT br.required_quantity), 0) - COALESCE(SUM(o.quantity), 0) AS unmet_demand_gap_kg
FROM users b
INNER JOIN buyer_profiles bp ON b.user_id = bp.buyer_id
LEFT JOIN buyer_requirements br ON b.user_id = br.buyer_id
LEFT JOIN crops c ON br.crop_id = c.crop_id
LEFT JOIN orders o ON b.user_id = o.buyer_id AND o.harvest_id IN (SELECT harvest_id FROM harvests WHERE crop_id = c.crop_id)
WHERE b.role = 'BUYER' AND br.requirement_id IS NOT NULL
GROUP BY b.user_id, b.full_name, c.crop_id, c.crop_name
ORDER BY unmet_demand_gap_kg DESC;


-- ===================================================================
-- 5. ACTIVE PENDING PROCUREMENT ORDERS REQUIRING DISPATCH
-- Surfaces orders that have been placed but are awaiting confirmation/dispatch.
-- ===================================================================
SELECT
    o.order_id,
    b.full_name AS buyer_name,
    f.full_name AS farmer_name,
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
INNER JOIN crops c ON h.crop_id = c.crop_id
WHERE o.order_status IN ('PENDING', 'ACCEPTED')
ORDER BY o.order_date ASC;
