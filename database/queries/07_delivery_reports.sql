-- ===================================================================
-- AgriConnect — Phase 13: DBMS Queries & Reports
-- Script 07: Logistical Delivery and Fulfillment Reports
-- Database: MySQL 8.0+
-- Purpose: Evaluates transportation transit times, status distributions,
--          delivery success rates, and counterparty performance.
-- ===================================================================

USE agriconnect_db;

-- ===================================================================
-- 1. DELIVERIES DISTRIBUTION BY STATUS
-- Logistical status breakdown across all dispatched shipments.
-- ===================================================================
SELECT
    d.delivery_status,
    COUNT(d.delivery_id) AS total_shipments,
    ROUND(COUNT(d.delivery_id) * 100.0 / (SELECT COUNT(*) FROM deliveries), 2) AS status_percentage
FROM deliveries d
GROUP BY d.delivery_status
ORDER BY total_shipments DESC;


-- ===================================================================
-- 2. FULLY DELIVERED SHIPMENTS LOG
-- Detailed manifest of successfully completed shipments.
-- ===================================================================
SELECT
    d.delivery_id,
    d.tracking_number,
    d.vehicle_number,
    o.order_id,
    c.crop_name,
    o.quantity AS delivered_quantity_kg,
    b.full_name AS recipient_buyer,
    d.delivery_address,
    d.dispatched_at,
    d.delivered_at,
    TIMESTAMPDIFF(HOUR, d.dispatched_at, d.delivered_at) AS transit_duration_hours
FROM deliveries d
INNER JOIN orders o ON d.order_id = o.order_id
INNER JOIN users b ON o.buyer_id = b.user_id
INNER JOIN harvests h ON o.harvest_id = h.harvest_id
INNER JOIN crops c ON h.crop_id = c.crop_id
WHERE d.delivery_status = 'DELIVERED'
ORDER BY d.delivered_at DESC;


-- ===================================================================
-- 3. PENDING AND ACTIVE IN-TRANSIT DELIVERIES
-- Shipments currently active in transit or queued for dispatch.
-- ===================================================================
SELECT
    d.delivery_id,
    d.tracking_number,
    d.vehicle_number,
    d.delivery_status,
    o.order_id,
    f.full_name AS origin_farmer,
    b.full_name AS destination_buyer,
    c.crop_name,
    o.quantity,
    d.delivery_address,
    d.dispatched_at,
    d.estimated_delivery_date
FROM deliveries d
INNER JOIN orders o ON d.order_id = o.order_id
INNER JOIN users b ON o.buyer_id = b.user_id
INNER JOIN harvests h ON o.harvest_id = h.harvest_id
INNER JOIN users f ON h.farmer_id = f.user_id
INNER JOIN crops c ON h.crop_id = c.crop_id
WHERE d.delivery_status IN ('PENDING', 'DISPATCHED', 'IN_TRANSIT', 'SHIPPED')
ORDER BY d.dispatched_at ASC;


-- ===================================================================
-- 4. FAILED AND CANCELLED SHIPMENTS LOG
-- Audit trail of failed logistics operations.
-- ===================================================================
SELECT
    d.delivery_id,
    d.tracking_number,
    d.delivery_status,
    o.order_id,
    b.full_name AS buyer_name,
    d.delivery_address,
    COALESCE(d.remarks, 'No remarks provided') AS failure_reason,
    d.updated_at
FROM deliveries d
INNER JOIN orders o ON d.order_id = o.order_id
INNER JOIN users b ON o.buyer_id = b.user_id
WHERE d.delivery_status IN ('FAILED', 'CANCELLED')
ORDER BY d.updated_at DESC;


-- ===================================================================
-- 5. AVERAGE DELIVERY TRANSIT COMPLETION TIME
-- Measures platform logistical turnaround using TIMESTAMPDIFF.
-- ===================================================================
SELECT
    COUNT(d.delivery_id) AS delivered_shipments_sampled,
    ROUND(AVG(TIMESTAMPDIFF(HOUR, d.dispatched_at, d.delivered_at)), 2) AS avg_transit_hours,
    ROUND(AVG(TIMESTAMPDIFF(HOUR, d.dispatched_at, d.delivered_at)) / 24.0, 2) AS avg_transit_days,
    MIN(TIMESTAMPDIFF(HOUR, d.dispatched_at, d.delivered_at)) AS fastest_transit_hours,
    MAX(TIMESTAMPDIFF(HOUR, d.dispatched_at, d.delivered_at)) AS slowest_transit_hours
FROM deliveries d
WHERE d.delivery_status = 'DELIVERED'
  AND d.dispatched_at IS NOT NULL
  AND d.delivered_at IS NOT NULL;


-- ===================================================================
-- 6. DELIVERY PERFORMANCE BY FARMER (ORIGIN DISPATCH RATE)
-- Evaluates origin compliance and fulfillment rates.
-- ===================================================================
SELECT
    f.user_id AS farmer_id,
    f.full_name AS farmer_name,
    COUNT(d.delivery_id) AS total_shipments_dispatched,
    SUM(CASE WHEN d.delivery_status = 'DELIVERED' THEN 1 ELSE 0 END) AS successful_deliveries,
    SUM(CASE WHEN d.delivery_status IN ('DISPATCHED', 'IN_TRANSIT', 'SHIPPED') THEN 1 ELSE 0 END) AS active_in_transit,
    SUM(CASE WHEN d.delivery_status IN ('FAILED', 'CANCELLED') THEN 1 ELSE 0 END) AS failed_deliveries,
    ROUND(AVG(TIMESTAMPDIFF(HOUR, d.dispatched_at, d.delivered_at)), 1) AS avg_transit_hours_to_destination
FROM deliveries d
INNER JOIN orders o ON d.order_id = o.order_id
INNER JOIN harvests h ON o.harvest_id = h.harvest_id
INNER JOIN users f ON h.farmer_id = f.user_id
GROUP BY f.user_id, f.full_name
ORDER BY successful_deliveries DESC;


-- ===================================================================
-- 7. DELIVERY PERFORMANCE BY BUYER (DESTINATION RECEIPT)
-- Evaluates destination receipt efficiency and fulfillment volume.
-- ===================================================================
SELECT
    b.user_id AS buyer_id,
    b.full_name AS buyer_name,
    bp.business_name,
    COUNT(d.delivery_id) AS total_deliveries_routed,
    SUM(CASE WHEN d.delivery_status = 'DELIVERED' THEN 1 ELSE 0 END) AS successfully_received,
    SUM(o.quantity) AS total_received_quantity_kg
FROM deliveries d
INNER JOIN orders o ON d.order_id = o.order_id
INNER JOIN users b ON o.buyer_id = b.user_id
LEFT JOIN buyer_profiles bp ON b.user_id = bp.buyer_id
GROUP BY b.user_id, b.full_name, bp.business_name
ORDER BY successfully_received DESC;


-- ===================================================================
-- 8. ORDER-TO-DELIVERY STATUS LIFECYCLE COMPARISON
-- Contrasts the commercial contract status with physical logistics state.
-- Demonstrates clear decoupling between commercial state and freight state.
-- ===================================================================
SELECT
    o.order_id,
    o.order_status AS commercial_order_status,
    COALESCE(d.delivery_status, 'UNSCHEDULED') AS physical_delivery_status,
    c.crop_name,
    o.quantity,
    o.total_amount,
    b.full_name AS buyer_name,
    f.full_name AS farmer_name,
    d.tracking_number
FROM orders o
INNER JOIN harvests h ON o.harvest_id = h.harvest_id
INNER JOIN crops c ON h.crop_id = c.crop_id
INNER JOIN users b ON o.buyer_id = b.user_id
INNER JOIN users f ON h.farmer_id = f.user_id
LEFT JOIN deliveries d ON o.order_id = d.order_id
ORDER BY o.order_id ASC;
