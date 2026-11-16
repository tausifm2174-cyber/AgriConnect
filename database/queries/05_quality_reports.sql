-- ===================================================================
-- AgriConnect — Phase 13: DBMS Queries & Reports
-- Script 05: Quality Management and Inspection Reports
-- Database: MySQL 8.0+
-- Purpose: Provides analytical quality reports covering grade distributions,
--          defect percentages, verification states, and quality-price correlation.
-- ===================================================================

USE agriconnect_db;

-- ===================================================================
-- 1. QUALITY GRADE DISTRIBUTION (A, B, C)
-- Analyzes grade breakdown across verified agricultural lots.
-- ===================================================================
SELECT
    qa.quality_grade,
    COUNT(qa.assessment_id) AS total_lots_assessed,
    ROUND(COUNT(qa.assessment_id) * 100.0 / (
        SELECT COUNT(*) FROM quality_assessments WHERE verification_status = 'VERIFIED'
    ), 2) AS grade_percentage,
    ROUND(AVG(qa.quality_score), 2) AS avg_score_in_grade,
    ROUND(AVG(qa.damage_percentage), 2) AS avg_damage_in_grade
FROM quality_assessments qa
WHERE qa.verification_status = 'VERIFIED'
GROUP BY qa.quality_grade
ORDER BY qa.quality_grade ASC;


-- ===================================================================
-- 2. VERIFIED QUALITY METRICS BY CROP
-- Aggregates quality indicators for officially approved produce lots.
-- ===================================================================
SELECT
    c.crop_id,
    c.crop_name,
    c.category AS crop_category,
    COUNT(qa.assessment_id) AS verified_lots_count,
    ROUND(AVG(qa.quality_score), 2) AS avg_quality_score,
    ROUND(MIN(qa.quality_score), 2) AS min_quality_score,
    ROUND(MAX(qa.quality_score), 2) AS max_quality_score,
    ROUND(AVG(qa.freshness), 2) AS avg_freshness_rating,
    ROUND(AVG(qa.damage_percentage), 2) AS avg_damage_percentage
FROM quality_assessments qa
INNER JOIN harvests h ON qa.harvest_id = h.harvest_id
INNER JOIN crops c ON h.crop_id = c.crop_id
WHERE qa.verification_status = 'VERIFIED'
GROUP BY c.crop_id, c.crop_name, c.category
ORDER BY avg_quality_score DESC;


-- ===================================================================
-- 3. PENDING QUALITY ASSESSMENTS QUEUE
-- Surfaces lots requiring administrative inspection before marketplace approval.
-- ===================================================================
SELECT
    qa.assessment_id,
    h.harvest_id,
    f.full_name AS farmer_name,
    f.phone AS farmer_phone,
    c.crop_name,
    h.initial_quantity,
    h.location AS farm_location,
    qa.assessment_date,
    qa.verification_status
FROM quality_assessments qa
INNER JOIN harvests h ON qa.harvest_id = h.harvest_id
INNER JOIN users f ON h.farmer_id = f.user_id
INNER JOIN crops c ON h.crop_id = c.crop_id
WHERE qa.verification_status = 'PENDING'
ORDER BY qa.assessment_date ASC;


-- ===================================================================
-- 4. REJECTED QUALITY ASSESSMENTS LOG
-- Tracks lots rejected due to quality threshold or damage violations.
-- ===================================================================
SELECT
    qa.assessment_id,
    h.harvest_id,
    f.full_name AS farmer_name,
    c.crop_name,
    qa.quality_score,
    qa.quality_grade,
    qa.damage_percentage,
    qa.inspector_notes,
    qa.assessment_date,
    insp.full_name AS assessed_by
FROM quality_assessments qa
INNER JOIN harvests h ON qa.harvest_id = h.harvest_id
INNER JOIN users f ON h.farmer_id = f.user_id
INNER JOIN crops c ON h.crop_id = c.crop_id
LEFT JOIN users insp ON qa.admin_id = insp.user_id
WHERE qa.verification_status = 'REJECTED'
ORDER BY qa.assessment_date DESC;


-- ===================================================================
-- 5. TOP-QUALITY FARMERS RANKING
-- Identifies agricultural producers maintaining the highest quality standards.
-- ===================================================================
SELECT
    f.user_id AS farmer_id,
    f.full_name AS farmer_name,
    COUNT(qa.assessment_id) AS total_verified_lots,
    SUM(CASE WHEN qa.quality_grade = 'A' THEN 1 ELSE 0 END) AS grade_a_lots,
    SUM(CASE WHEN qa.quality_grade = 'B' THEN 1 ELSE 0 END) AS grade_b_lots,
    SUM(CASE WHEN qa.quality_grade = 'C' THEN 1 ELSE 0 END) AS grade_c_lots,
    ROUND(AVG(qa.quality_score), 2) AS overall_avg_quality_score,
    ROUND(AVG(qa.damage_percentage), 2) AS avg_damage_percentage
FROM quality_assessments qa
INNER JOIN harvests h ON qa.harvest_id = h.harvest_id
INNER JOIN users f ON h.farmer_id = f.user_id
WHERE qa.verification_status = 'VERIFIED'
GROUP BY f.user_id, f.full_name
ORDER BY overall_avg_quality_score DESC, grade_a_lots DESC;


-- ===================================================================
-- 6. DAMAGE AND DEFECT PERCENTAGE ANALYSIS BY CROP
-- Identifies physical crop shrinkage and damage vulnerability across categories.
-- ===================================================================
SELECT
    c.crop_name,
    COUNT(qa.assessment_id) AS inspected_lots,
    ROUND(MIN(qa.damage_percentage), 2) AS min_damage_pct,
    ROUND(AVG(qa.damage_percentage), 2) AS avg_damage_pct,
    ROUND(MAX(qa.damage_percentage), 2) AS max_damage_pct,
    SUM(CASE WHEN qa.damage_percentage > 10.00 THEN 1 ELSE 0 END) AS high_defect_lots_count
FROM quality_assessments qa
INNER JOIN harvests h ON qa.harvest_id = h.harvest_id
INNER JOIN crops c ON h.crop_id = c.crop_id
GROUP BY c.crop_id, c.crop_name
ORDER BY avg_damage_pct DESC;


-- ===================================================================
-- 7. QUALITY GRADE VERSUS ASKING AND REALIZED PRICE CORRELATION
-- Analyzes economic premium commanded by higher quality certifications.
-- ===================================================================
SELECT
    qa.quality_grade,
    COUNT(DISTINCT h.harvest_id) AS total_harvest_lots,
    ROUND(AVG(h.price_per_kg), 2) AS avg_farmer_asking_price,
    ROUND(MIN(h.price_per_kg), 2) AS min_asking_price,
    ROUND(MAX(h.price_per_kg), 2) AS max_asking_price,
    ROUND(AVG(o.agreed_price_per_kg), 2) AS avg_realized_order_price
FROM quality_assessments qa
INNER JOIN harvests h ON qa.harvest_id = h.harvest_id
LEFT JOIN orders o ON h.harvest_id = o.harvest_id
WHERE qa.verification_status = 'VERIFIED'
GROUP BY qa.quality_grade
ORDER BY qa.quality_grade ASC;
