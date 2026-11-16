-- ===================================================================
-- AgriConnect — Phase 13: DBMS Queries & Reports
-- Script 08: Payment and Financial Settlement Reports
-- Database: MySQL 8.0+
-- Purpose: Provides analytical financial reporting across payment instruments,
--          settlement states, monthly cash flow, and counterparty payouts.
-- ===================================================================

USE agriconnect_db;

-- ===================================================================
-- 1. PAYMENT STATUS DISTRIBUTION
-- Analyzes payment transaction volume across all settlement states.
-- ===================================================================
SELECT
    p.payment_status,
    COUNT(p.payment_id) AS total_payments,
    ROUND(COUNT(p.payment_id) * 100.0 / (SELECT COUNT(*) FROM payments), 2) AS status_percentage,
    SUM(p.amount) AS total_status_volume,
    ROUND(AVG(p.amount), 2) AS avg_status_amount
FROM payments p
GROUP BY p.payment_status
ORDER BY total_status_volume DESC;


-- ===================================================================
-- 2. PAYMENT METHOD DISTRIBUTION
-- Breakdown of financial volume transacted per payment channel.
-- ===================================================================
SELECT
    p.payment_method,
    COUNT(p.payment_id) AS transaction_count,
    ROUND(COUNT(p.payment_id) * 100.0 / (SELECT COUNT(*) FROM payments), 2) AS method_percentage,
    SUM(p.amount) AS total_volume_transacted,
    ROUND(AVG(p.amount), 2) AS avg_transaction_size
FROM payments p
GROUP BY p.payment_method
ORDER BY total_volume_transacted DESC;


-- ===================================================================
-- 3. TOTAL SUCCESSFUL SETTLED PAYMENTS SUMMARY
-- Strict Rule: Only COMPLETED and PAID statuses are counted as successful settlements.
-- ===================================================================
SELECT
    COUNT(p.payment_id) AS successful_settlements_count,
    SUM(p.amount) AS total_successful_settled_value,
    ROUND(AVG(p.amount), 2) AS average_settlement_value,
    MIN(p.amount) AS minimum_settled_payment,
    MAX(p.amount) AS maximum_settled_payment
FROM payments p
WHERE p.payment_status IN ('COMPLETED', 'PAID');


-- ===================================================================
-- 4. SETTLED FINANCIAL VALUE BY METHOD
-- Disaggregates successful settlements by payment rails (Bank, UPI, etc.).
-- ===================================================================
SELECT
    p.payment_method,
    COUNT(p.payment_id) AS completed_payments,
    SUM(p.amount) AS settled_revenue,
    ROUND(AVG(p.amount), 2) AS avg_settled_amount
FROM payments p
WHERE p.payment_status IN ('COMPLETED', 'PAID')
GROUP BY p.payment_method
ORDER BY settled_revenue DESC;


-- ===================================================================
-- 5. MONTHLY PAYMENT VOLUME AND CASH FLOW (TIME-SERIES)
-- Groups financial settlement volume by transaction month.
-- ===================================================================
SELECT
    DATE_FORMAT(p.payment_date, '%Y-%m') AS settlement_month,
    COUNT(p.payment_id) AS total_transactions,
    SUM(CASE WHEN p.payment_status IN ('COMPLETED', 'PAID') THEN p.amount ELSE 0 END) AS successful_settled_amount,
    SUM(CASE WHEN p.payment_status = 'PENDING' THEN p.amount ELSE 0 END) AS pending_clearing_amount,
    SUM(CASE WHEN p.payment_status IN ('FAILED', 'CANCELLED', 'REFUNDED') THEN p.amount ELSE 0 END) AS voided_or_refunded_amount
FROM payments p
GROUP BY DATE_FORMAT(p.payment_date, '%Y-%m')
ORDER BY settlement_month ASC;


-- ===================================================================
-- 6. AVERAGE PAYMENT AMOUNT PER ORDER
-- Calculates order-to-payment coverage and average tranche size.
-- ===================================================================
SELECT
    p.order_id,
    o.order_status,
    o.total_amount AS order_contract_value,
    COUNT(p.payment_id) AS payment_installments,
    SUM(p.amount) AS total_paid_towards_order,
    ROUND(AVG(p.amount), 2) AS avg_installment_amount,
    CASE
        WHEN SUM(CASE WHEN p.payment_status IN ('COMPLETED', 'PAID') THEN p.amount ELSE 0 END) >= o.total_amount THEN 'FULLY_PAID'
        WHEN SUM(CASE WHEN p.payment_status IN ('COMPLETED', 'PAID') THEN p.amount ELSE 0 END) > 0 THEN 'PARTIALLY_PAID'
        ELSE 'UNPAID'
    END AS financial_fulfillment_state
FROM payments p
INNER JOIN orders o ON p.order_id = o.order_id
GROUP BY p.order_id, o.order_status, o.total_amount
ORDER BY p.order_id ASC;


-- ===================================================================
-- 7. FAILED AND REFUNDED PAYMENTS AUDIT TRAIL
-- Surfaces financial friction points, rejections, or reversed payments.
-- ===================================================================
SELECT
    p.payment_id,
    p.order_id,
    p.payment_status,
    p.payment_method,
    p.amount,
    p.transaction_reference,
    COALESCE(p.remarks, 'No failure/refund remarks provided') AS remarks,
    p.payment_date,
    b.full_name AS payer_buyer,
    f.full_name AS payee_farmer
FROM payments p
INNER JOIN orders o ON p.order_id = o.order_id
INNER JOIN users b ON o.buyer_id = b.user_id
INNER JOIN harvests h ON o.harvest_id = h.harvest_id
INNER JOIN users f ON h.farmer_id = f.user_id
WHERE p.payment_status IN ('FAILED', 'REFUNDED', 'CANCELLED')
ORDER BY p.payment_date DESC;


-- ===================================================================
-- 8. COMPLETED PAYMENT VALUE BY FARMER (FARMER PAYOUTS)
-- Payout earnings realized by individual farmers from cleared payments.
-- ===================================================================
SELECT
    f.user_id AS farmer_id,
    f.full_name AS farmer_name,
    COUNT(DISTINCT p.payment_id) AS cleared_payments_count,
    SUM(p.amount) AS total_net_payout_realized,
    ROUND(AVG(p.amount), 2) AS avg_payout_per_transaction
FROM payments p
INNER JOIN orders o ON p.order_id = o.order_id
INNER JOIN harvests h ON o.harvest_id = h.harvest_id
INNER JOIN users f ON h.farmer_id = f.user_id
WHERE p.payment_status IN ('COMPLETED', 'PAID')
GROUP BY f.user_id, f.full_name
ORDER BY total_net_payout_realized DESC;


-- ===================================================================
-- 9. COMPLETED PAYMENT VALUE BY BUYER (BUYER SPENDING)
-- Net expenditure cleared by registered buyers for fulfilled produce.
-- ===================================================================
SELECT
    b.user_id AS buyer_id,
    b.full_name AS buyer_name,
    bp.business_name,
    COUNT(DISTINCT p.payment_id) AS successful_settlements,
    SUM(p.amount) AS total_funds_disbursed,
    ROUND(AVG(p.amount), 2) AS avg_expenditure_per_settlement
FROM payments p
INNER JOIN orders o ON p.order_id = o.order_id
INNER JOIN users b ON o.buyer_id = b.user_id
LEFT JOIN buyer_profiles bp ON b.user_id = bp.buyer_id
WHERE p.payment_status IN ('COMPLETED', 'PAID')
GROUP BY b.user_id, b.full_name, bp.business_name
ORDER BY total_funds_disbursed DESC;
