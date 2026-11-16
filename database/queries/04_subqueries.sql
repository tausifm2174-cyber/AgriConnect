-- ===================================================================
-- AgriConnect — Phase 13: DBMS Queries & Reports
-- Script 04: Advanced SQL Subqueries and Analytical Filtering
-- Database: MySQL 8.0+
-- Purpose: Demonstrates scalar subqueries, correlated subqueries,
--          membership subqueries (IN / EXISTS), and derived tables.
-- ===================================================================

USE agriconnect_db;

-- ===================================================================
-- QUERY 1: Farmers Selling Above Platform-Wide Average Selling Price
-- Concept: Scalar subquery in the HAVING clause comparing group aggregate
--          against overall platform average realized order price.
-- ===================================================================
SELECT
    f.user_id AS farmer_id,
    f.full_name AS farmer_name,
    COUNT(o.order_id) AS total_orders,
    ROUND(AVG(o.agreed_price_per_kg), 2) AS farmer_avg_selling_price,
    ROUND((SELECT AVG(agreed_price_per_kg) FROM orders), 2) AS platform_overall_avg_price
FROM orders o
INNER JOIN harvests h ON o.harvest_id = h.harvest_id
INNER JOIN users f ON h.farmer_id = f.user_id
GROUP BY f.user_id, f.full_name
HAVING AVG(o.agreed_price_per_kg) > (SELECT AVG(agreed_price_per_kg) FROM orders)
ORDER BY farmer_avg_selling_price DESC;


-- ===================================================================
-- QUERY 2: Harvests Priced Above Their Specific Crop's Average Price
-- Concept: Correlated Subquery where inner query calculates the average
--          asking price for the exact crop lot referenced in the outer row.
-- ===================================================================
SELECT
    h1.harvest_id,
    f.full_name AS farmer_name,
    c.crop_name,
    h1.available_quantity,
    h1.price_per_kg AS harvest_asking_price,
    (
        SELECT ROUND(AVG(h2.price_per_kg), 2)
        FROM harvests h2
        WHERE h2.crop_id = h1.crop_id
    ) AS crop_category_avg_price,
    ROUND(h1.price_per_kg - (
        SELECT AVG(h2.price_per_kg)
        FROM harvests h2
        WHERE h2.crop_id = h1.crop_id
    ), 2) AS premium_over_crop_avg
FROM harvests h1
INNER JOIN users f ON h1.farmer_id = f.user_id
INNER JOIN crops c ON h1.crop_id = c.crop_id
WHERE h1.price_per_kg > (
    SELECT AVG(h2.price_per_kg)
    FROM harvests h2
    WHERE h2.crop_id = h1.crop_id
)
ORDER BY premium_over_crop_avg DESC;


-- ===================================================================
-- QUERY 3: Buyers Who Have Actively Placed Orders
-- Concept: Membership subquery demonstrating both EXISTS and IN patterns.
-- ===================================================================
-- 3.1 Using Correlated EXISTS (Optimal execution using foreign key index)
SELECT
    u.user_id AS buyer_id,
    u.full_name AS buyer_name,
    u.email,
    u.phone,
    bp.business_name,
    bp.business_type
FROM users u
INNER JOIN buyer_profiles bp ON u.user_id = bp.buyer_id
WHERE u.role = 'BUYER'
  AND EXISTS (
      SELECT 1
      FROM orders o
      WHERE o.buyer_id = u.user_id
  )
ORDER BY u.full_name ASC;

-- 3.2 Using Set Membership IN
SELECT
    u.user_id AS buyer_id,
    u.full_name AS buyer_name,
    bp.business_name,
    (SELECT COUNT(*) FROM orders o WHERE o.buyer_id = u.user_id) AS total_orders_placed
FROM users u
LEFT JOIN buyer_profiles bp ON u.user_id = bp.buyer_id
WHERE u.user_id IN (SELECT DISTINCT buyer_id FROM orders)
ORDER BY total_orders_placed DESC;


-- ===================================================================
-- QUERY 4: Crops With Transaction Activity Above Overall Average Volume
-- Concept: Derived Table (Inline View) aggregate subquery.
-- ===================================================================
SELECT
    c.crop_id,
    c.crop_name,
    c.category,
    SUM(o.quantity) AS total_crop_volume_kg,
    SUM(o.total_amount) AS total_crop_revenue
FROM orders o
INNER JOIN harvests h ON o.harvest_id = h.harvest_id
INNER JOIN crops c ON h.crop_id = c.crop_id
GROUP BY c.crop_id, c.crop_name, c.category
HAVING SUM(o.quantity) > (
    -- Subquery calculating the average total volume per active transacted crop
    SELECT AVG(crop_total_vol)
    FROM (
        SELECT SUM(o2.quantity) AS crop_total_vol
        FROM orders o2
        INNER JOIN harvests h2 ON o2.harvest_id = h2.harvest_id
        GROUP BY h2.crop_id
    ) AS crop_volumes
)
ORDER BY total_crop_volume_kg DESC;


-- ===================================================================
-- QUERY 5: Highest-Priced Harvest Lot(s) For Each Crop
-- Concept: Correlated Subquery finding the maximum price per crop group,
--          returning the top asking lot along with the farmer and lot details.
-- ===================================================================
SELECT
    c.crop_name,
    h.harvest_id,
    f.full_name AS farmer_name,
    h.available_quantity,
    h.price_per_kg AS max_price_for_crop,
    h.location,
    h.harvest_date
FROM harvests h
INNER JOIN crops c ON h.crop_id = c.crop_id
INNER JOIN users f ON h.farmer_id = f.user_id
WHERE h.price_per_kg = (
    SELECT MAX(h_sub.price_per_kg)
    FROM harvests h_sub
    WHERE h_sub.crop_id = h.crop_id
)
ORDER BY h.price_per_kg DESC, c.crop_name ASC;
