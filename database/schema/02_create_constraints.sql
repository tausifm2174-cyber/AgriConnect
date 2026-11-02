-- ===================================================================
-- AgriConnect — Phase 2: Relational Database Schema
-- Script 02: Foreign Keys & Business Integrity Constraints
-- Database: MySQL 8.0+
-- ===================================================================

USE agriconnect_db;

-- -------------------------------------------------------------------
-- 1. FOREIGN KEY CONSTRAINTS
-- -------------------------------------------------------------------

-- Farmer Profile -> User (1:1 Relationship)
ALTER TABLE farmer_profiles
    ADD CONSTRAINT fk_farmer_profile_user
    FOREIGN KEY (farmer_id) REFERENCES users(user_id)
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- Buyer Profile -> User (1:1 Relationship)
ALTER TABLE buyer_profiles
    ADD CONSTRAINT fk_buyer_profile_user
    FOREIGN KEY (buyer_id) REFERENCES users(user_id)
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- Harvest -> Farmer (User) and Crop (1:N Relationships)
ALTER TABLE harvests
    ADD CONSTRAINT fk_harvests_farmer
    FOREIGN KEY (farmer_id) REFERENCES users(user_id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
    ADD CONSTRAINT fk_harvests_crop
    FOREIGN KEY (crop_id) REFERENCES crops(crop_id)
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- Quality Assessment -> Harvest (1:1) and Admin User (1:N)
ALTER TABLE quality_assessments
    ADD CONSTRAINT fk_qa_harvest
    FOREIGN KEY (harvest_id) REFERENCES harvests(harvest_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT fk_qa_admin
    FOREIGN KEY (admin_id) REFERENCES users(user_id)
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- Buyer Requirement -> Buyer (User) and Crop (1:N Relationships)
ALTER TABLE buyer_requirements
    ADD CONSTRAINT fk_requirements_buyer
    FOREIGN KEY (buyer_id) REFERENCES users(user_id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
    ADD CONSTRAINT fk_requirements_crop
    FOREIGN KEY (crop_id) REFERENCES crops(crop_id)
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- Orders -> Buyer (User) and Harvest (1:N Relationships)
ALTER TABLE orders
    ADD CONSTRAINT fk_orders_buyer
    FOREIGN KEY (buyer_id) REFERENCES users(user_id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
    ADD CONSTRAINT fk_orders_harvest
    FOREIGN KEY (harvest_id) REFERENCES harvests(harvest_id)
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- Deliveries -> Order (1:1 Relationship)
ALTER TABLE deliveries
    ADD CONSTRAINT fk_deliveries_order
    FOREIGN KEY (order_id) REFERENCES orders(order_id)
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- Payments -> Order (1:N Relationship)
ALTER TABLE payments
    ADD CONSTRAINT fk_payments_order
    FOREIGN KEY (order_id) REFERENCES orders(order_id)
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- Price History -> Crop (1:N Relationship)
ALTER TABLE price_history
    ADD CONSTRAINT fk_price_history_crop
    FOREIGN KEY (crop_id) REFERENCES crops(crop_id)
    ON DELETE RESTRICT ON UPDATE CASCADE;


-- -------------------------------------------------------------------
-- 2. DOMAIN CHECK CONSTRAINTS
-- -------------------------------------------------------------------

-- Farmer Profile Constraints
ALTER TABLE farmer_profiles
    ADD CONSTRAINT chk_farmer_farm_size
    CHECK (farm_size_acres > 0.0),
    ADD CONSTRAINT chk_farmer_experience
    CHECK (experience_years >= 0);

-- Harvest Constraints (Availability, positive quantities and prices)
ALTER TABLE harvests
    ADD CONSTRAINT chk_harvest_quantities
    CHECK (initial_quantity > 0.0 AND available_quantity >= 0.0 AND available_quantity <= initial_quantity),
    ADD CONSTRAINT chk_harvest_price
    CHECK (price_per_kg > 0.0);

-- Quality Assessment Parameter Constraints (1-10 scale and 0-100% ranges)
ALTER TABLE quality_assessments
    ADD CONSTRAINT chk_qa_freshness CHECK (freshness BETWEEN 1 AND 10),
    ADD CONSTRAINT chk_qa_appearance CHECK (appearance BETWEEN 1 AND 10),
    ADD CONSTRAINT chk_qa_size CHECK (size BETWEEN 1 AND 10),
    ADD CONSTRAINT chk_qa_color CHECK (color BETWEEN 1 AND 10),
    ADD CONSTRAINT chk_qa_ripeness CHECK (ripeness BETWEEN 1 AND 10),
    ADD CONSTRAINT chk_qa_damage CHECK (damage_percentage >= 0.00 AND damage_percentage <= 100.00),
    ADD CONSTRAINT chk_qa_score CHECK (quality_score >= 0.00 AND quality_score <= 100.00);

-- Buyer Requirement Constraints
ALTER TABLE buyer_requirements
    ADD CONSTRAINT chk_req_quantity CHECK (required_quantity > 0.0),
    ADD CONSTRAINT chk_req_price CHECK (max_price_per_kg > 0.0);

-- Order Constraints (Preserve agreed price and positive order size)
ALTER TABLE orders
    ADD CONSTRAINT chk_order_quantity CHECK (quantity > 0.0),
    ADD CONSTRAINT chk_order_price CHECK (agreed_price_per_kg > 0.0),
    ADD CONSTRAINT chk_order_total CHECK (total_amount > 0.0);

-- Payment Constraints
ALTER TABLE payments
    ADD CONSTRAINT chk_payment_amount CHECK (amount > 0.0);

-- Price History Constraints
ALTER TABLE price_history
    ADD CONSTRAINT chk_price_history_modal CHECK (modal_price_per_kg > 0.0),
    ADD CONSTRAINT chk_price_history_min CHECK (min_price_per_kg > 0.0),
    ADD CONSTRAINT chk_price_history_range CHECK (max_price_per_kg >= min_price_per_kg);
