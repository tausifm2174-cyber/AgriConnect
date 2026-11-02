-- ===================================================================
-- AgriConnect — Phase 2: Relational Database Schema
-- Script: Sample Realistic Indian Agricultural Data
-- Database: MySQL 8.0+
-- ===================================================================

USE agriconnect_db;

-- -------------------------------------------------------------------
-- 1. USERS (Admin, Farmers, Buyers)
-- -------------------------------------------------------------------
INSERT INTO users (user_id, full_name, email, phone, role, status) VALUES
(1, 'Ramesh Sharma (Admin)', 'admin@agriconnect.org', '+919876543210', 'ADMIN', 'ACTIVE'),
(2, 'Rajesh Patel', 'rajesh.patel@kisan.in', '+919811122233', 'FARMER', 'ACTIVE'),
(3, 'Suresh Kumar', 'suresh.kumar@kisan.in', '+919822233344', 'FARMER', 'ACTIVE'),
(4, 'Ananya Devi', 'ananya.devi@kisan.in', '+919833344455', 'FARMER', 'ACTIVE'),
(5, 'Vikas Gupta', 'vikas.gupta@freshmarts.com', '+919844455566', 'BUYER', 'ACTIVE'),
(6, 'Priya Nair', 'priya.nair@agrofoods.in', '+919855566677', 'BUYER', 'ACTIVE'),
(7, 'Harpreet Singh', 'harpreet@punjabgrain.com', '+919866677788', 'BUYER', 'ACTIVE');

-- -------------------------------------------------------------------
-- 2. FARMER PROFILES
-- -------------------------------------------------------------------
INSERT INTO farmer_profiles (farmer_id, farm_location, farm_size_acres, experience_years) VALUES
(2, 'Nashik, Maharashtra', 15.50, 12),
(3, 'Karnal, Haryana', 25.00, 20),
(4, 'Mandya, Karnataka', 8.00, 6);

-- -------------------------------------------------------------------
-- 3. BUYER PROFILES
-- -------------------------------------------------------------------
INSERT INTO buyer_profiles (buyer_id, business_name, business_type, gstin, business_address) VALUES
(5, 'FreshMarts Supermarkets', 'RETAILER', '27ABCDE1234F1Z5', 'Bandra Kurla Complex, Mumbai, Maharashtra'),
(6, 'AgroFoods Processing Ltd', 'PROCESSOR', '29BCDEF2345G2Z6', 'Whitefield Industrial Area, Bangalore, Karnataka'),
(7, 'Punjab Grain Wholesalers', 'WHOLESALER', '03CDEFG3456H3Z7', 'GT Road Mandi, Amritsar, Punjab');

-- -------------------------------------------------------------------
-- 4. CROPS CATALOG
-- -------------------------------------------------------------------
INSERT INTO crops (crop_id, crop_name, category, season, description) VALUES
(1, 'Tomato (Hybrid Red)', 'VEGETABLE', 'ALL_SEASON', 'High-yield firm red tomatoes suitable for retail and processing'),
(2, 'Basmati Rice (1121)', 'CEREAL', 'KHARIF', 'Aromatic long-grain premium basmati paddy'),
(3, 'Wheat (Sharbati)', 'CEREAL', 'RABI', 'Golden grain sweet wheat with high protein content'),
(4, 'Red Onion (Nashik Quality)', 'VEGETABLE', 'RABI', 'Medium-to-large pungent red onions with long shelf life'),
(5, 'Alphonso Mango', 'FRUIT', 'ZAID', 'Export grade naturally ripened sweet Alphonso mangoes'),
(6, 'Soybean (Yellow)', 'OILSEED', 'KHARIF', 'High oil-content yellow soybean for solvent extraction');

-- -------------------------------------------------------------------
-- 5. HARVESTS
-- -------------------------------------------------------------------
INSERT INTO harvests (harvest_id, farmer_id, crop_id, initial_quantity, available_quantity, price_per_kg, harvest_date, location, status) VALUES
(1, 2, 1, 1000.00, 600.00, 25.00, '2026-09-18', 'Nashik, Maharashtra', 'AVAILABLE'),
(2, 3, 2, 5000.00, 2000.00, 65.00, '2026-09-15', 'Karnal, Haryana', 'AVAILABLE'),
(3, 4, 1, 800.00, 800.00, 28.00, '2026-09-20', 'Mandya, Karnataka', 'AVAILABLE'),
(4, 3, 3, 4000.00, 0.00, 24.00, '2026-09-10', 'Karnal, Haryana', 'SOLD_OUT'),
(5, 2, 4, 2500.00, 2500.00, 30.00, '2026-09-19', 'Nashik, Maharashtra', 'AVAILABLE'),
(6, 4, 5, 500.00, 500.00, 180.00, '2026-09-21', 'Mandya, Karnataka', 'AVAILABLE');

-- -------------------------------------------------------------------
-- 6. QUALITY ASSESSMENTS
-- -------------------------------------------------------------------
INSERT INTO quality_assessments (assessment_id, harvest_id, admin_id, freshness, appearance, size, color, ripeness, damage_percentage, quality_score, quality_grade, verification_status, assessment_date, inspector_notes) VALUES
(1, 1, 1, 9, 9, 8, 9, 8, 3.50, 92.50, 'A', 'VERIFIED', '2026-09-19', 'Exceptional freshness, vibrant uniform red, minimal transit damage'),
(2, 2, 1, 9, 9, 9, 8, 9, 1.00, 94.00, 'A', 'VERIFIED', '2026-09-16', 'Long grain certified 1121 standard, moisture under 12%'),
(3, 3, 1, 8, 7, 8, 7, 7, 6.00, 82.00, 'B', 'VERIFIED', '2026-09-21', 'Good table quality, slight size variations, firm skin'),
(4, 4, 1, 7, 7, 7, 7, 7, 8.00, 78.50, 'B', 'VERIFIED', '2026-09-11', 'Standard milling grade, clean grain with standard lustre'),
(5, 5, 1, 6, 6, 6, 6, 6, 14.00, 65.00, 'C', 'VERIFIED', '2026-09-20', 'Fair quality, small-to-medium bulbs with minor outer peel drying'),
(6, 6, 1, 8, 8, 8, 8, 8, 5.00, 85.00, 'B', 'PENDING', '2026-09-22', 'Pending final brix sugar test verification');

-- -------------------------------------------------------------------
-- 7. BUYER REQUIREMENTS
-- -------------------------------------------------------------------
INSERT INTO buyer_requirements (requirement_id, buyer_id, crop_id, required_quantity, max_price_per_kg, min_quality_grade, preferred_location, status) VALUES
(1, 5, 1, 400.00, 27.00, 'A', 'Western India / Maharashtra', 'OPEN'),
(2, 6, 1, 1000.00, 30.00, 'B', 'South India / Karnataka', 'OPEN'),
(3, 7, 2, 3000.00, 70.00, 'A', 'North India / Punjab / Haryana', 'OPEN'),
(4, 5, 4, 1500.00, 35.00, 'B', 'Maharashtra', 'OPEN');

-- -------------------------------------------------------------------
-- 8. ORDERS
-- -------------------------------------------------------------------
INSERT INTO orders (order_id, buyer_id, harvest_id, quantity, agreed_price_per_kg, total_amount, order_status, order_date) VALUES
(1, 5, 1, 400.00, 25.00, 10000.00, 'CONFIRMED', '2026-09-20 10:30:00'),
(2, 7, 2, 3000.00, 65.00, 195000.00, 'DELIVERED', '2026-09-17 14:15:00'),
(3, 6, 4, 4000.00, 24.00, 96000.00, 'DELIVERED', '2026-09-12 11:00:00');

-- -------------------------------------------------------------------
-- 9. DELIVERIES
-- -------------------------------------------------------------------
INSERT INTO deliveries (delivery_id, order_id, delivery_status, tracking_number, vehicle_number, delivery_address, dispatched_at, delivered_at) VALUES
(1, 1, 'DISPATCHED', 'TRK-MH-2026-001', 'MH-15-AB-1234', 'FreshMarts Distribution Center, Kurla, Mumbai - 400070', '2026-09-21 06:00:00', NULL),
(2, 2, 'DELIVERED', 'TRK-PB-2026-002', 'PB-02-CD-5678', 'Punjab Grain Silos, Mandi Road, Amritsar - 143001', '2026-09-18 08:30:00', '2026-09-19 16:45:00'),
(3, 3, 'DELIVERED', 'TRK-KA-2026-003', 'KA-05-EF-9012', 'AgroFoods Plant #4, Industrial Area, Bangalore - 560066', '2026-09-13 09:00:00', '2026-09-15 13:20:00');

-- -------------------------------------------------------------------
-- 10. PAYMENTS
-- -------------------------------------------------------------------
INSERT INTO payments (payment_id, order_id, amount, payment_method, payment_status, transaction_reference, payment_date) VALUES
(1, 1, 3000.00, 'UPI', 'COMPLETED', 'UPI-2026-9901-AXIS', '2026-09-20 10:35:00'),
(2, 1, 7000.00, 'BANK_TRANSFER', 'PENDING', 'NEFT-2026-9902-HDFC', '2026-09-20 11:00:00'),
(3, 2, 195000.00, 'BANK_TRANSFER', 'COMPLETED', 'RTGS-2026-8801-SBI', '2026-09-17 15:00:00'),
(4, 3, 96000.00, 'CHEQUE', 'COMPLETED', 'CHQ-2026-7701-ICICI', '2026-09-12 11:30:00');

-- -------------------------------------------------------------------
-- 11. PRICE HISTORY
-- -------------------------------------------------------------------
INSERT INTO price_history (price_id, crop_id, modal_price_per_kg, min_price_per_kg, max_price_per_kg, market_location, recorded_date) VALUES
(1, 1, 24.50, 20.00, 28.00, 'Nashik APMC', '2026-09-15'),
(2, 1, 25.00, 21.00, 29.00, 'Nashik APMC', '2026-09-18'),
(3, 1, 26.50, 22.00, 31.00, 'Vashi APMC, Mumbai', '2026-09-20'),
(4, 2, 64.00, 58.00, 68.00, 'Karnal Grain Market', '2026-09-14'),
(5, 2, 65.50, 60.00, 70.00, 'Karnal Grain Market', '2026-09-18'),
(6, 3, 23.50, 21.00, 25.00, 'Khanna APMC, Punjab', '2026-09-10'),
(7, 3, 24.00, 21.50, 26.00, 'Karnal Grain Market', '2026-09-15'),
(8, 4, 28.00, 22.00, 32.00, 'Lasalgaon APMC, Nashik', '2026-09-16'),
(9, 4, 30.50, 24.00, 34.00, 'Lasalgaon APMC, Nashik', '2026-09-19');
