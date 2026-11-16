-- ===================================================================
-- AgriConnect — Phase 13: DBMS Queries & Reports
-- Script 09: Price History and Market Intelligence Reports
-- Database: MySQL 8.0+
-- Purpose: Evaluates market intelligence, distinguishing external APMC
--          Mandi benchmarks from actual verified AgriConnect transaction sales.
-- ===================================================================

USE agriconnect_db;

-- ===================================================================
-- 1. MANDI BENCHMARK VERSUS PLATFORM TRANSACTION PRICE SUMMARY
-- Distinguishes external Mandi reference data from realized commercial sales.
-- ===================================================================
SELECT
    ph.source_type,
    COUNT(ph.price_id) AS total_price_records,
    ROUND(AVG(COALESCE(ph.unit_price, ph.modal_price_per_kg)), 2) AS avg_effective_price_per_kg,
    ROUND(MIN(COALESCE(ph.unit_price, ph.min_price_per_kg)), 2) AS min_price_observed,
    ROUND(MAX(COALESCE(ph.unit_price, ph.max_price_per_kg)), 2) AS max_price_observed,
    SUM(COALESCE(ph.quantity, 0)) AS total_recorded_volume_kg,
    SUM(COALESCE(ph.total_amount, 0)) AS total_financial_volume
FROM price_history ph
GROUP BY ph.source_type
ORDER BY ph.source_type ASC;


-- ===================================================================
-- 2. CROP-WISE PRICE COMPARISON (MANDI BENCHMARK VS PLATFORM REALIZED)
-- Side-by-side comparison of Mandi prevailing modal rates vs platform sales.
-- ===================================================================
SELECT
    c.crop_id,
    c.crop_name,
    c.category AS crop_category,
    -- Mandi Benchmark Metrics
    ROUND(AVG(CASE WHEN ph.source_type = 'MARKET_MANDI' THEN ph.modal_price_per_kg END), 2) AS avg_mandi_modal_price,
    ROUND(MIN(CASE WHEN ph.source_type = 'MARKET_MANDI' THEN ph.min_price_per_kg END), 2) AS min_mandi_benchmark,
    ROUND(MAX(CASE WHEN ph.source_type = 'MARKET_MANDI' THEN ph.max_price_per_kg END), 2) AS max_mandi_benchmark,
    -- Platform Commercial Sales Metrics
    ROUND(AVG(CASE WHEN ph.source_type = 'TRANSACTION_SALE' THEN ph.unit_price END), 2) AS avg_platform_sale_price,
    -- Realized Platform Premium / Discount vs Mandi Benchmark
    ROUND(
        AVG(CASE WHEN ph.source_type = 'TRANSACTION_SALE' THEN ph.unit_price END) -
        AVG(CASE WHEN ph.source_type = 'MARKET_MANDI' THEN ph.modal_price_per_kg END), 2
    ) AS platform_spread_vs_mandi
FROM crops c
LEFT JOIN price_history ph ON c.crop_id = ph.crop_id
GROUP BY c.crop_id, c.crop_name, c.category
ORDER BY c.crop_name ASC;


-- ===================================================================
-- 3. TRANSACTION VOLUME AND EXTREMES BY CROP (PLATFORM REALIZED SALES)
-- Analyzes commercial volume, highest price, and lowest price transacted.
-- ===================================================================
SELECT
    c.crop_name,
    COUNT(ph.price_id) AS transaction_sales_count,
    SUM(ph.quantity) AS total_commercial_kg_sold,
    SUM(ph.total_amount) AS total_commercial_revenue,
    MIN(ph.unit_price) AS lowest_realized_price_per_kg,
    MAX(ph.unit_price) AS highest_realized_price_per_kg,
    ROUND(AVG(ph.unit_price), 2) AS weighted_avg_realized_price
FROM price_history ph
INNER JOIN crops c ON ph.crop_id = c.crop_id
WHERE ph.source_type = 'TRANSACTION_SALE'
GROUP BY c.crop_id, c.crop_name
ORDER BY total_commercial_revenue DESC;


-- ===================================================================
-- 4. PRICE TREND BY DATE (TIME-SERIES)
-- Daily movement of agricultural commodity prices across dates.
-- ===================================================================
SELECT
    ph.recorded_date,
    c.crop_name,
    ph.source_type,
    ph.market_location,
    COALESCE(ph.unit_price, ph.modal_price_per_kg) AS effective_price_per_kg,
    ph.quantity AS transacted_quantity_kg
FROM price_history ph
INNER JOIN crops c ON ph.crop_id = c.crop_id
ORDER BY ph.recorded_date DESC, c.crop_name ASC;


-- ===================================================================
-- 5. TRANSACTION PRICE VERSUS QUALITY GRADE CORRELATION
-- Analyzes how certified inspection grades translate into realized prices.
-- ===================================================================
SELECT
    qa.quality_grade,
    COUNT(DISTINCT ph.price_id) AS transaction_records_count,
    ROUND(AVG(ph.unit_price), 2) AS avg_sale_price_per_kg,
    ROUND(MIN(ph.unit_price), 2) AS min_sale_price_per_kg,
    ROUND(MAX(ph.unit_price), 2) AS max_sale_price_per_kg,
    ROUND(AVG(qa.quality_score), 2) AS avg_inspected_quality_score
FROM price_history ph
INNER JOIN orders o ON ph.order_id = o.order_id
INNER JOIN harvests h ON o.harvest_id = h.harvest_id
INNER JOIN quality_assessments qa ON h.harvest_id = qa.harvest_id
WHERE ph.source_type = 'TRANSACTION_SALE'
  AND qa.verification_status = 'VERIFIED'
GROUP BY qa.quality_grade
ORDER BY qa.quality_grade ASC;


-- ===================================================================
-- 6. GEOGRAPHIC PRICE SPREAD BY MARKET LOCATION
-- Compares commodity valuations across regional trading hubs.
-- ===================================================================
SELECT
    ph.market_location,
    COUNT(ph.price_id) AS price_observations,
    COUNT(DISTINCT ph.crop_id) AS distinct_crops_tracked,
    ROUND(AVG(COALESCE(ph.unit_price, ph.modal_price_per_kg)), 2) AS avg_commodity_price,
    ROUND(MIN(COALESCE(ph.unit_price, ph.min_price_per_kg)), 2) AS floor_price_recorded,
    ROUND(MAX(COALESCE(ph.unit_price, ph.max_price_per_kg)), 2) AS ceiling_price_recorded
FROM price_history ph
GROUP BY ph.market_location
ORDER BY avg_commodity_price DESC;
