-- ===================================================================
-- AgriConnect — Phase 13: DBMS Queries & Reports
-- Script 03: Aggregate Functions, GROUP BY, and HAVING Queries
-- Database: MySQL 8.0+
-- Purpose: Demonstrates statistical aggregation (COUNT, SUM, AVG, MIN, MAX),
--          multi-dimensional grouping, and threshold filtering using HAVING.
-- ===================================================================

USE agriconnect_db;

-- ===================================================================
-- 1. MARKETPLACE-WIDE SCALAR AGGREGATE METRICS
-- ===================================================================

-- 1.1 Total User Counts Disaggregated by Role
SELECT
    COUNT(*) AS total_registered_users,
    SUM(CASE WHEN role = 'FARMER' THEN 1 ELSE 0 END) AS total_farmers,
    SUM(CASE WHEN role = 'BUYER' THEN 1 ELSE 0 END) AS total_buyers,
    SUM(CASE WHEN role = 'ADMIN' THEN 1 ELSE 0 END) AS total_admins,
    SUM(CASE WHEN status = 'ACTIVE' THEN 1 ELSE 0 END) AS total_active_users
FROM users;

-- 1.2 Harvest Inventory Volume and Asking Price Aggregates
SELECT
    COUNT(harvest_id) AS total_harvest_lots,
    SUM(available_quantity) AS total_available_quantity_kg,
    AVG(price_per_kg) AS avg_asking_price_per_kg,
    MIN(price_per_kg) AS min_asking_price_per_kg,
    MAX(price_per_kg) AS max_asking_price_per_kg
FROM harvests
WHERE status = 'AVAILABLE';

-- 1.3 Order Financial Aggregates
SELECT
    COUNT(order_id) AS total_orders_placed,
    SUM(quantity) AS total_ordered_quantity_kg,
    SUM(total_amount) AS gross_order_value,
    AVG(total_amount) AS average_order_value,
    AVG(agreed_price_per_kg) AS average_agreed_price_per_kg
FROM orders;

-- 1.4 Successful Payment Value (Completed / Settled)
-- Rules: Only COMPLETED and PAID statuses are counted as successful settlements.
SELECT
    COUNT(payment_id) AS successful_transactions_count,
    SUM(amount) AS total_successful_payment_value,
    AVG(amount) AS average_payment_amount,
    MIN(amount) AS smallest_settlement,
    MAX(amount) AS largest_settlement
FROM payments
WHERE payment_status IN ('COMPLETED', 'PAID');

-- 1.5 Quality Inspection Score Aggregates
SELECT
    COUNT(assessment_id) AS total_assessments,
    AVG(quality_score) AS platform_average_quality_score,
    MIN(quality_score) AS lowest_quality_score,
    MAX(quality_score) AS highest_quality_score,
    AVG(damage_percentage) AS platform_average_damage_pct
FROM quality_assessments
WHERE verification_status = 'VERIFIED';


-- ===================================================================
-- 2. GROUP BY MULTI-DIMENSIONAL REPORTING
-- ===================================================================

-- 2.1 Order Volume and Revenue by Crop
SELECT
    c.crop_id,
    c.crop_name,
    c.category AS crop_category,
    COUNT(o.order_id) AS order_count,
    SUM(o.quantity) AS total_quantity_ordered_kg,
    SUM(o.total_amount) AS total_gross_value,
    ROUND(AVG(o.agreed_price_per_kg), 2) AS avg_realized_price_per_kg
FROM orders o
INNER JOIN harvests h ON o.harvest_id = h.harvest_id
INNER JOIN crops c ON h.crop_id = c.crop_id
GROUP BY c.crop_id, c.crop_name, c.category
ORDER BY total_gross_value DESC;

-- 2.2 Sales Performance by Farmer
SELECT
    f.user_id AS farmer_id,
    f.full_name AS farmer_name,
    COUNT(o.order_id) AS total_orders_received,
    SUM(CASE WHEN o.order_status = 'DELIVERED' THEN 1 ELSE 0 END) AS delivered_orders_count,
    SUM(o.quantity) AS total_quantity_sold_kg,
    SUM(o.total_amount) AS total_sales_revenue,
    ROUND(AVG(o.agreed_price_per_kg), 2) AS average_selling_price_per_kg
FROM orders o
INNER JOIN harvests h ON o.harvest_id = h.harvest_id
INNER JOIN users f ON h.farmer_id = f.user_id
GROUP BY f.user_id, f.full_name
ORDER BY total_sales_revenue DESC;

-- 2.3 Buyer Demand by Crop
SELECT
    c.crop_id,
    c.crop_name,
    COUNT(br.requirement_id) AS total_requirements_posted,
    SUM(br.required_quantity) AS total_demanded_quantity_kg,
    ROUND(AVG(br.max_price_per_kg), 2) AS avg_max_willing_price_per_kg
FROM buyer_requirements br
INNER JOIN crops c ON br.crop_id = c.crop_id
WHERE br.status = 'OPEN'
GROUP BY c.crop_id, c.crop_name
ORDER BY total_demanded_quantity_kg DESC;

-- 2.4 Quality Grade Distribution by Crop
SELECT
    c.crop_name,
    COUNT(qa.assessment_id) AS total_verified_assessments,
    SUM(CASE WHEN qa.quality_grade = 'A' THEN 1 ELSE 0 END) AS grade_a_count,
    SUM(CASE WHEN qa.quality_grade = 'B' THEN 1 ELSE 0 END) AS grade_b_count,
    SUM(CASE WHEN qa.quality_grade = 'C' THEN 1 ELSE 0 END) AS grade_c_count,
    ROUND(AVG(qa.quality_score), 2) AS avg_quality_score,
    ROUND(AVG(qa.damage_percentage), 2) AS avg_damage_percentage
FROM quality_assessments qa
INNER JOIN harvests h ON qa.harvest_id = h.harvest_id
INNER JOIN crops c ON h.crop_id = c.crop_id
WHERE qa.verification_status = 'VERIFIED'
GROUP BY c.crop_id, c.crop_name
ORDER BY avg_quality_score DESC;

-- 2.5 Financial Settlement by Payment Method
SELECT
    payment_method,
    COUNT(payment_id) AS total_payments,
    SUM(CASE WHEN payment_status IN ('COMPLETED', 'PAID') THEN amount ELSE 0 END) AS settled_volume,
    SUM(CASE WHEN payment_status = 'PENDING' THEN amount ELSE 0 END) AS pending_volume,
    ROUND(AVG(amount), 2) AS average_transaction_amount
FROM payments
GROUP BY payment_method
ORDER BY settled_volume DESC;

-- 2.6 Logistical Distribution by Delivery Status
SELECT
    delivery_status,
    COUNT(delivery_id) AS delivery_count,
    ROUND(COUNT(delivery_id) * 100.0 / (SELECT COUNT(*) FROM deliveries), 2) AS status_percentage
FROM deliveries
GROUP BY delivery_status
ORDER BY delivery_count DESC;


-- ===================================================================
-- 3. HAVING CLAUSE AGGREGATE FILTERING
-- ===================================================================

-- 3.1 Crops with Total Order Demand Exceeding 500 kg
SELECT
    c.crop_name,
    COUNT(o.order_id) AS total_orders,
    SUM(o.quantity) AS total_kg_sold,
    SUM(o.total_amount) AS total_revenue
FROM orders o
INNER JOIN harvests h ON o.harvest_id = h.harvest_id
INNER JOIN crops c ON h.crop_id = c.crop_id
GROUP BY c.crop_id, c.crop_name
HAVING SUM(o.quantity) >= 500.00
ORDER BY total_kg_sold DESC;

-- 3.2 High-Grossing Farmers (Total Realized Order Value Above ₹50,000)
SELECT
    f.user_id,
    f.full_name AS farmer_name,
    COUNT(o.order_id) AS completed_orders,
    SUM(o.total_amount) AS total_sales_volume
FROM orders o
INNER JOIN harvests h ON o.harvest_id = h.harvest_id
INNER JOIN users f ON h.farmer_id = f.user_id
GROUP BY f.user_id, f.full_name
HAVING SUM(o.total_amount) >= 50000.00
ORDER BY total_sales_volume DESC;

-- 3.3 High-Value Crops (Average Asking Price Above ₹50.00 per kg)
SELECT
    c.crop_name,
    COUNT(h.harvest_id) AS active_harvest_lots,
    ROUND(AVG(h.price_per_kg), 2) AS avg_asking_price
FROM harvests h
INNER JOIN crops c ON h.crop_id = c.crop_id
GROUP BY c.crop_id, c.crop_name
HAVING AVG(h.price_per_kg) >= 50.00
ORDER BY avg_asking_price DESC;
