-- ===================================================================
-- AgriConnect — Phase 2: Relational Database Schema
-- Script 03: Performance Optimization Indexes
-- Database: MySQL 8.0+
-- ===================================================================

USE agriconnect_db;

-- 1. Index on Users by Role and Status
-- Justification: Optimizes administrative queries filtering active users by role (e.g., active farmers, active buyers).
CREATE INDEX idx_users_role_status ON users(role, status);

-- 2. Composite Index on Harvests for Marketplace Availability
-- Justification: Critical for Quality-Aware Matching to quickly filter unsold harvest lots by crop and availability.
CREATE INDEX idx_harvests_crop_status_avail ON harvests(crop_id, status, available_quantity);

-- 3. Index on Harvests by Farmer
-- Justification: Speeds up lookup of a specific farmer's harvest catalog.
CREATE INDEX idx_harvests_farmer ON harvests(farmer_id);

-- 4. Index on Harvest Pricing
-- Justification: Accelerates price-range filtering and sorting (e.g., finding the most cost-effective crop lots).
CREATE INDEX idx_harvests_price ON harvests(price_per_kg);

-- 5. Composite Index on Quality Assessment Grade and Status
-- Justification: Core index for quality-aware matching; filters only VERIFIED harvests matching requested quality grades (A, B, C).
CREATE INDEX idx_qa_grade_status ON quality_assessments(quality_grade, verification_status);

-- 6. Composite Index on Buyer Requirements
-- Justification: Speeds up buyer demand discovery queries filtering active requirements by crop and minimum quality grade.
CREATE INDEX idx_buyer_req_crop_status ON buyer_requirements(crop_id, status, min_quality_grade);

-- 7. Index on Buyer Requirements by Buyer
-- Justification: Accelerates retrieving all requirements posted by a specific buyer.
CREATE INDEX idx_buyer_req_buyer ON buyer_requirements(buyer_id);

-- 8. Composite Index on Orders by Buyer and Status
-- Justification: Fast retrieval of a buyer's order history, active purchases, and fulfillment tracking.
CREATE INDEX idx_orders_buyer_status ON orders(buyer_id, order_status);

-- 9. Index on Orders by Harvest
-- Justification: Facilitates tracking total demand, sold quantity, and order history per harvest batch.
CREATE INDEX idx_orders_harvest ON orders(harvest_id);

-- 10. Index on Deliveries by Status
-- Justification: Accelerates logistical dispatch queries and shipment tracking.
CREATE INDEX idx_deliveries_status ON deliveries(delivery_status);

-- 11. Composite Index on Price History by Crop and Date
-- Justification: Essential for time-series trend analysis, calculating historical price averages, min/max, and date-range reporting.
CREATE INDEX idx_price_history_crop_date ON price_history(crop_id, recorded_date);
