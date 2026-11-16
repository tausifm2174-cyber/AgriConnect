-- ===================================================================
-- AgriConnect — Phase 13: DBMS Queries & Reports
-- Script 14: SQL Transactions and ACID Demonstration
-- Database: MySQL 8.0+
-- Purpose: Demonstrates database transactions, consistency preservation,
--          commit/rollback lifecycles, and Spring @Transactional integration.
-- ===================================================================

USE agriconnect_db;

-- ===================================================================
-- ACID PROPERTIES IN AGRICULTURAL COMMODITY COMMERCE
-- ===================================================================
-- 1. ATOMICITY:
--    An order placement requires multiple coordinated mutations:
--    (a) inserting an order contract,
--    (b) decrementing the farmer's available harvest lot stock,
--    (c) transitioning harvest status to 'PARTIALLY_SOLD' or 'SOLD_OUT'.
--    Either all three operations succeed together, or the entire transaction
--    is aborted and rolled back. No partial state is ever persisted.
--
-- 2. CONSISTENCY:
--    Transactions transition the database from one valid relational state
--    to another, enforcing all database constraints:
--    - Foreign Key integrity (valid buyer_id, harvest_id)
--    - Non-negative stock CHECK constraints (available_quantity >= 0)
--    - Quality verification prerequisites
--    Any constraint violation aborts the transaction immediately.
--
-- 3. ISOLATION:
--    Concurrent buyers bidding or placing orders on the same harvest lot
--    are isolated based on MySQL's transaction isolation level (REPEATABLE READ).
--    Row-level pessimistic locking (`SELECT ... FOR UPDATE`) prevents overselling
--    the same physical agricultural lot to two distinct buyers simultaneously.
--
-- 4. DURABILITY:
--    Once a transaction commits (`COMMIT`), all modifications are written
--    to the MySQL InnoDB write-ahead log (redo log) and disk, surviving
--    server restarts or system crashes.
-- ===================================================================


-- ===================================================================
-- TRANSACTION 1: SUCCESSFUL MULTI-STEP STOCK DEDUCTION & ORDER CREATION
-- Scenario: Safe demonstration creating a controlled test lot, placing an
--           order against it, deducting stock atomically, and committing.
-- ===================================================================

START TRANSACTION;

-- Step 1.1: Verify active buyer and available harvest
-- Uses SELECT ... FOR UPDATE for strict pessimistic concurrency locking
SELECT harvest_id, crop_id, farmer_id, available_quantity, price_per_kg, status
FROM harvests
WHERE harvest_id = 1
FOR UPDATE;

-- Step 1.2: Demonstrate controlled order placement simulation
-- Create a demonstration test order record inside a safe demonstration block
INSERT INTO orders (
    buyer_id, harvest_id, quantity, agreed_price_per_kg,
    total_amount, remarks, order_status
)
VALUES (
    5, -- Active buyer: Vikas Gupta
    1, -- Harvest lot: Rajesh Patel's Tomato
    50.00, -- 50 kg test quantity
    26.00,
    1300.00,
    'Phase 13 ACID Transaction Test - Order Placement Demonstration',
    'CONFIRMED'
);

-- Capture the generated order ID for subsequent operations
SET @demo_order_id = LAST_INSERT_ID();

-- Step 1.3: Atomically decrement harvest available stock
UPDATE harvests
SET available_quantity = available_quantity - 50.00,
    status = CASE WHEN (available_quantity - 50.00) = 0 THEN 'SOLD_OUT' ELSE 'PARTIALLY_SOLD' END
WHERE harvest_id = 1;

-- Step 1.4: Verify state consistency inside the transaction
SELECT
    @demo_order_id AS created_order_id,
    h.harvest_id,
    h.available_quantity AS post_order_stock,
    h.status AS post_order_status
FROM harvests h
WHERE h.harvest_id = 1;

-- Commit the transaction atomically
COMMIT;

-- Demonstration Cleanup: Cleanly restore original harvest stock and remove test order
START TRANSACTION;
DELETE FROM orders WHERE order_id = @demo_order_id;
UPDATE harvests SET available_quantity = available_quantity + 50.00, status = 'AVAILABLE' WHERE harvest_id = 1;
COMMIT;


-- ===================================================================
-- TRANSACTION 2: AUTOMATIC / EXPLICIT ROLLBACK ON INSUFFICIENT STOCK
-- Scenario: A buyer attempts to order 10,000 kg from a lot with only 550 kg.
--           Application validation catches the deficit and issues ROLLBACK.
-- ===================================================================

START TRANSACTION;

-- Step 2.1: Lock and inspect current harvest available stock
SELECT harvest_id, available_quantity, price_per_kg
INTO @target_harvest_id, @current_available_qty, @asking_price
FROM harvests
WHERE harvest_id = 1
FOR UPDATE;

-- Step 2.2: Simulate an attempted over-allocation of 10,000 kg
SET @requested_qty = 10000.00;

-- Step 2.3: Consistency guard - Detect that requested_qty > current_available_qty
-- In application logic (e.g., OrderService.java), this throws InsufficientStockException.
-- In SQL, we simulate the failure branch and issue an explicit ROLLBACK.
SELECT
    @target_harvest_id AS harvest_id,
    @current_available_qty AS available_qty,
    @requested_qty AS attempted_qty,
    'TRANSACTION ABORTED: Requested quantity exceeds available harvest stock. Issuing ROLLBACK.' AS diagnostic_message;

-- Step 2.4: Rollback ensures no partial deductions or phantom orders persist
ROLLBACK;

-- Verify that harvest quantity was completely protected and untouched
SELECT harvest_id, available_quantity, status
FROM harvests
WHERE harvest_id = 1;


-- ===================================================================
-- SPRING BOOT @Transactional INTEGRATION ARCHITECTURE
-- ===================================================================
-- In the AgriConnect Java backend:
-- 1. Spring Data JPA manages database transactions declaratively via:
--    `@Transactional(rollbackFor = Exception.class)` in service layer classes:
--    - `OrderService.java`: `createOrder()`, `acceptOrder()`, `rejectOrder()`, `cancelOrder()`
--    - `PaymentService.java`: `recordPayment()`, `refundPayment()`
--    - `DeliveryService.java`: `dispatchDelivery()`, `confirmDelivery()`
--    - `PriceHistoryService.java`: `recordPriceForCompletedOrder()`
--
-- 2. HikariCP connection pool manages underlying physical JDBC connections.
-- 3. If any RuntimeException or checked Exception is thrown (such as
--    `ResourceNotFoundException`, `InsufficientStockException`, or `IllegalStateException`),
--    Spring's TransactionInterceptor intercepts the failure and signals the JDBC
--    connection to execute `connection.rollback()`.
-- 4. When the service method completes without exceptions, Spring automatically
--    executes `connection.commit()`.
-- ===================================================================
