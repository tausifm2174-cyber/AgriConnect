-- ===================================================================
-- AgriConnect — Phase 13: DBMS Queries & Reports
-- Script 06: Order Management Lifecycle Reports
-- Database: MySQL 8.0+
-- Purpose: Provides analytical reports across the commercial transaction
--          lifecycle: status volume, counterparty analysis, cancellations, and trends.
-- ===================================================================

USE agriconnect_db;

-- ===================================================================
-- 1. ORDER DISTRIBUTION BY LIFECYCLE STATUS
-- Breakdown of all marketplace contracts by current lifecycle stage.
-- ===================================================================
SELECT
    o.order_status,
    COUNT(o.order_id) AS total_orders,
    ROUND(COUNT(o.order_id) * 100.0 / (SELECT COUNT(*) FROM orders), 2) AS pct_of_total_orders,
    SUM(o.quantity) AS total_contracted_quantity_kg,
    SUM(o.total_amount) AS total_contract_value,
    ROUND(AVG(o.total_amount), 2) AS avg_contract_amount
FROM orders o
GROUP BY o.order_status
ORDER BY total_orders DESC;


-- ===================================================================
-- 2. ORDER DISTRIBUTION BY CROP
-- Commercial volume, turnover, and average price per crop type.
-- ===================================================================
SELECT
    c.crop_id,
    c.crop_name,
    c.category,
    COUNT(o.order_id) AS total_orders,
    SUM(o.quantity) AS total_kg_demanded,
    SUM(o.total_amount) AS total_gross_value,
    ROUND(AVG(o.agreed_price_per_kg), 2) AS avg_contract_price_per_kg
FROM orders o
INNER JOIN harvests h ON o.harvest_id = h.harvest_id
INNER JOIN crops c ON h.crop_id = c.crop_id
GROUP BY c.crop_id, c.crop_name, c.category
ORDER BY total_gross_value DESC;


-- ===================================================================
-- 3. ORDERS BY FARMER (SUPPLY-SIDE PERFORMANCE)
-- Evaluates fulfillment success, revenue generation, and order volumes.
-- ===================================================================
SELECT
    f.user_id AS farmer_id,
    f.full_name AS farmer_name,
    COUNT(o.order_id) AS total_orders_received,
    SUM(CASE WHEN o.order_status = 'DELIVERED' THEN 1 ELSE 0 END) AS completed_orders,
    SUM(CASE WHEN o.order_status = 'PENDING' THEN 1 ELSE 0 END) AS pending_orders,
    SUM(CASE WHEN o.order_status = 'CANCELLED' THEN 1 ELSE 0 END) AS cancelled_orders,
    SUM(o.quantity) AS total_kg_sold,
    SUM(o.total_amount) AS gross_sales_value
FROM orders o
INNER JOIN harvests h ON o.harvest_id = h.harvest_id
INNER JOIN users f ON h.farmer_id = f.user_id
GROUP BY f.user_id, f.full_name
ORDER BY gross_sales_value DESC;


-- ===================================================================
-- 4. ORDERS BY BUYER (PROCUREMENT DEMAND)
-- Identifies procurement volume, expenditure, and fulfillment rates per buyer.
-- ===================================================================
SELECT
    b.user_id AS buyer_id,
    b.full_name AS buyer_name,
    bp.business_name,
    COUNT(o.order_id) AS total_orders_placed,
    SUM(CASE WHEN o.order_status = 'DELIVERED' THEN 1 ELSE 0 END) AS fulfilled_orders,
    SUM(o.quantity) AS total_kg_procured,
    SUM(o.total_amount) AS total_procurement_expenditure,
    ROUND(AVG(o.total_amount), 2) AS avg_order_size
FROM orders o
INNER JOIN users b ON o.buyer_id = b.user_id
LEFT JOIN buyer_profiles bp ON b.user_id = bp.buyer_id
GROUP BY b.user_id, b.full_name, bp.business_name
ORDER BY total_procurement_expenditure DESC;


-- ===================================================================
-- 5. COMPLETED AND DELIVERED ORDER VALUE
-- Focuses strictly on revenue from fully satisfied contracts.
-- ===================================================================
SELECT
    COUNT(o.order_id) AS delivered_orders_count,
    SUM(o.quantity) AS total_delivered_volume_kg,
    SUM(o.total_amount) AS total_delivered_value,
    ROUND(AVG(o.total_amount), 2) AS avg_delivered_order_value,
    ROUND(AVG(o.agreed_price_per_kg), 2) AS avg_realized_price_per_kg
FROM orders o
WHERE o.order_status = 'DELIVERED';


-- ===================================================================
-- 6. CANCELLED AND REJECTED ORDERS AUDIT LOG
-- Analyzes transaction attrition, cancellations, and stated reasons.
-- ===================================================================
SELECT
    o.order_id,
    o.order_status,
    b.full_name AS buyer_name,
    f.full_name AS farmer_name,
    c.crop_name,
    o.quantity,
    o.total_amount,
    COALESCE(o.cancellation_reason, o.remarks, 'No reason specified') AS rejection_or_cancellation_reason,
    o.order_date
FROM orders o
INNER JOIN users b ON o.buyer_id = b.user_id
INNER JOIN harvests h ON o.harvest_id = h.harvest_id
INNER JOIN users f ON h.farmer_id = f.user_id
INNER JOIN crops c ON h.crop_id = c.crop_id
WHERE o.order_status IN ('CANCELLED', 'REJECTED')
ORDER BY o.order_date DESC;


-- ===================================================================
-- 7. TOP-SELLING CROPS (BY VOLUME AND REVENUE)
-- Ranks produce by delivered commercial volume and market value.
-- ===================================================================
SELECT
    c.crop_name,
    c.category,
    SUM(o.quantity) AS total_quantity_transacted_kg,
    SUM(o.total_amount) AS total_turnover,
    COUNT(DISTINCT o.order_id) AS order_transactions,
    COUNT(DISTINCT o.buyer_id) AS unique_purchasers
FROM orders o
INNER JOIN harvests h ON o.harvest_id = h.harvest_id
INNER JOIN crops c ON h.crop_id = c.crop_id
GROUP BY c.crop_id, c.crop_name, c.category
ORDER BY total_quantity_transacted_kg DESC;


-- ===================================================================
-- 8. MONTHLY ORDER FINANCIAL SUMMARY (TIME-SERIES)
-- Groups order volume, revenue, and average size across calendar months.
-- ===================================================================
SELECT
    DATE_FORMAT(o.order_date, '%Y-%m') AS order_month,
    COUNT(o.order_id) AS orders_placed,
    SUM(CASE WHEN o.order_status = 'DELIVERED' THEN 1 ELSE 0 END) AS orders_delivered,
    SUM(o.quantity) AS total_volume_kg,
    SUM(o.total_amount) AS gross_monthly_revenue,
    ROUND(AVG(o.total_amount), 2) AS avg_monthly_order_value
FROM orders o
GROUP BY DATE_FORMAT(o.order_date, '%Y-%m')
ORDER BY order_month ASC;
