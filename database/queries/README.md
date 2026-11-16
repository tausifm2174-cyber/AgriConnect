# AgriConnect — Phase 13: DBMS Queries & Reports

This directory houses the comprehensive SQL demonstration library, analytical reports, database views, transaction workflows, indexing evaluations, and database normalization documentation for the **AgriConnect Farmer-to-Market Management System**.

---

## 1. Database Architecture & Schema Overview

AgriConnect operates on **MySQL 8.0+** using the InnoDB storage engine for ACID compliance, referential integrity, and row-level locking. The system models the end-to-end direct farmer-to-buyer agricultural marketplace across **11 core relational tables**:

```
                  ┌────────────────┐
                  │     users      │
                  └───────┬────────┘
             ┌────────────┴────────────┐
             ▼                         ▼
   ┌──────────────────┐       ┌──────────────────┐
   │ farmer_profiles  │       │  buyer_profiles  │
   └─────────┬────────┘       └────────┬─────────┘
             │                         │
             ▼                         ▼
      ┌────────────┐         ┌────────────────────┐
      │  harvests  │         │ buyer_requirements │
      └──────┬─────┘         └─────────┬──────────┘
             │                         │
             ├────────────┐            │
             ▼            ▼            ▼
┌────────────────────┐  ┌─────────────────────────┐
│quality_assessments │  │         orders          │
└────────────────────┘  └──────────────┬──────────┘
                                       │
                      ┌────────────────┴────────────────┐
                      ▼                                 ▼
             ┌─────────────────┐               ┌─────────────────┐
             │   deliveries    │               │    payments     │
             └─────────────────┘               └────────┬────────┘
                                                        │
                                                        ▼
                                               ┌─────────────────┐
                                               │  price_history  │
                                               └─────────────────┘
```

### Core Relational Entities
1. **`users`**: Base identity entity (PK: `user_id`) with role-based segregation (`FARMER`, `BUYER`, `ADMIN`) and account states (`ACTIVE`, `INACTIVE`, `SUSPENDED`).
2. **`farmer_profiles`**: 1-to-1 extension of `users` (PK/FK: `farmer_id`) holding farm size, location, and farming experience.
3. **`buyer_profiles`**: 1-to-1 extension of `users` (PK/FK: `buyer_id`) holding business structure and address.
4. **`crops`**: Master agricultural commodity catalog (PK: `crop_id`) categorizing commodities into `CEREAL`, `VEGETABLE`, `FRUIT`, `OILSEED`, `PULSE`, `OTHER`.
5. **`harvests`**: Producer harvest batches (PK: `harvest_id`, FKs: `farmer_id`, `crop_id`) with available quantity tracking.
6. **`quality_assessments`**: Quality assurance certification (PK: `assessment_id`, FK/Unique: `harvest_id`) rating freshness, damage percentage, quality score (0-100), and grade (`A`, `B`, `C`).
7. **`buyer_requirements`**: Demand-side procurement specifications (PK: `requirement_id`, FKs: `buyer_id`, `crop_id`) with minimum grade and target pricing.
8. **`orders`**: Binding trade contracts (PK: `order_id`, FKs: `buyer_id`, `harvest_id`, `requirement_id`) with agreed price and commercial quantity.
9. **`deliveries`**: Logistical transportation lifecycle (PK: `delivery_id`, FK/Unique: `order_id`) tracking transit duration, vehicles, and status.
10. **`payments`**: Multi-channel financial settlement (PK: `payment_id`, FK: `order_id`) recording banking rails, transaction references, and settlement status.
11. **`price_history`**: Hybrid price intelligence repository (PK: `price_id`, FKs: `crop_id`, `order_id`, `farmer_id`, `buyer_id`) tracking APMC Mandi benchmarks (`MARKET_MANDI`) and platform trades (`TRANSACTION_SALE`).

---

## 2. Database Normalization Analysis (1NF, 2NF, 3NF)

AgriConnect's relational schema is strictly normalized through **Third Normal Form (3NF)** to eliminate redundancy, avoid update anomalies, and enforce data consistency.

### First Normal Form (1NF)
> **Definition**: Every table has a distinct primary key, and each column contains only atomic (indivisible) values with no repeating groups.

* **Atomic Attributes**: Contact numbers, locations, and pricing fields are stored as single scalar values. For instance, `deliveries.tracking_number`, `users.phone`, and `harvests.price_per_kg` are scalar attributes.
* **No Repeating Groups**: In legacy architectures, a buyer's past purchases or a harvest's multiple inspections might have been stored as comma-delimited strings or JSON blobs. AgriConnect separates recurring relationships into distinct child tables (`orders`, `quality_assessments`, `payments`).
* **Explicit Primary Keys**: Every table defines an explicit single-column primary key (`user_id`, `crop_id`, `order_id`, etc.) enforced via `PRIMARY KEY` B-Tree indexes.

### Second Normal Form (2NF)
> **Definition**: The table is in 1NF, and all non-key attributes are fully functionally dependent on the entire primary key (no partial functional dependencies).

* **Single-Column Primary Keys**: In tables with single-attribute primary keys (`orders`, `harvests`, `crops`, `users`), partial key dependencies are mathematically impossible because there is no composite primary key to partially depend upon.
* **Separation of Farmer/Buyer Profiles**: Rather than keeping farm size or business addresses directly on `users` (which would leave those fields NULL or redundant for other roles), role-specific attributes reside in `farmer_profiles` (keyed by `farmer_id`) and `buyer_profiles` (keyed by `buyer_id`). Every attribute in `farmer_profiles` depends solely and completely on `farmer_id`.
* **Order Isolation**: The `orders` table depends strictly on `order_id`. Crop names, farmer locations, and buyer business types are not duplicated in `orders`; instead, foreign keys (`harvest_id`, `buyer_id`) link to their respective entities.

### Third Normal Form (3NF)
> **Definition**: The table is in 2NF, and no non-key attribute is transitively dependent on the primary key (no non-key attribute depends on another non-key attribute: $X \to Y$ and $Y \to Z$).

* **No Transitive Location Dependency**: `harvests` records `farmer_id` and the harvest's physical pickup location (`location`). It does *not* replicate `farmer_profiles.farm_location` or `users.full_name`. The farmer's permanent identity is reachable solely through `users.user_id`.
* **Quality Grade Calculation**: In `quality_assessments`, attributes such as `freshness`, `ripeness`, and `damage_percentage` are independent evaluation metrics recorded by the inspector. The resulting `quality_grade` reflects verified laboratory certification.
* **Decoupled Fulfillment & Financial State**: The `orders` table tracks commercial status (`order_status`), but transit milestones and vehicle coordinates are sequestered into `deliveries` (`order_id \to delivery_id`), while financial clearance is isolated in `payments` (`order_id \to payment_id`). Neither delivery nor payment fields are duplicated in `orders`.

---

## 3. SQL Query Catalog & Structure

The SQL queries in this directory are partitioned into modular, documented files:

| File Name | Phase 13 Requirement | Primary Focus |
|---|---|---|
| [`01_basic_crud.sql`](file:///c:/Users/mtaus/OneDrive/Desktop/Agriconnect/database/queries/01_basic_crud.sql) | Part 3: Basic CRUD | `SELECT` filtering (`WHERE`, `ORDER BY`, `LIMIT`, `LIKE`, `BETWEEN`, `IN`, `IS NULL`), safe `INSERT`, `UPDATE`, and `DELETE`. |
| [`02_join_queries.sql`](file:///c:/Users/mtaus/OneDrive/Desktop/Agriconnect/database/queries/02_join_queries.sql) | Part 4: Relational JOINs | Multi-table joins across 8 entities; 6 dedicated queries covering harvests, orders, logistics, and counterparty discovery. |
| [`03_aggregate_queries.sql`](file:///c:/Users/mtaus/OneDrive/Desktop/Agriconnect/database/queries/03_aggregate_queries.sql) | Part 5 & 6: Aggregates, GROUP BY & HAVING | Statistical metrics (`COUNT`, `SUM`, `AVG`, `MIN`, `MAX`), multidimensional grouping, and threshold filtering. |
| [`04_subqueries.sql`](file:///c:/Users/mtaus/OneDrive/Desktop/Agriconnect/database/queries/04_subqueries.sql) | Part 7: Subqueries | Correlated subqueries, scalar subqueries in `HAVING`, membership subqueries (`IN`, `EXISTS`), and derived tables. |
| [`05_quality_reports.sql`](file:///c:/Users/mtaus/OneDrive/Desktop/Agriconnect/database/queries/05_quality_reports.sql) | Part 8: Quality Reports | Grade distribution, damage percentages, pending inspection queue, and quality-price correlation. |
| [`06_order_reports.sql`](file:///c:/Users/mtaus/OneDrive/Desktop/Agriconnect/database/queries/06_order_reports.sql) | Part 9: Order Reports | Lifecycle volume, commodity turnover, counterparty analysis, cancellations audit, and monthly time-series. |
| [`07_delivery_reports.sql`](file:///c:/Users/mtaus/OneDrive/Desktop/Agriconnect/database/queries/07_delivery_reports.sql) | Part 10: Delivery Reports | Freight logistics, transit duration calculation (`TIMESTAMPDIFF`), delivery success rates, and lifecycle comparison. |
| [`08_payment_reports.sql`](file:///c:/Users/mtaus/OneDrive/Desktop/Agriconnect/database/queries/08_payment_reports.sql) | Part 11: Payment Reports | Settlement methods, monthly cash flow, farmer payouts, buyer spending, and payment fulfillment states. |
| [`09_price_reports.sql`](file:///c:/Users/mtaus/OneDrive/Desktop/Agriconnect/database/queries/09_price_reports.sql) | Part 12: Price History Reports | APMC Mandi benchmarks vs platform transactions, price trends, quality-price spread, and regional pricing. |
| [`10_farmer_reports.sql`](file:///c:/Users/mtaus/OneDrive/Desktop/Agriconnect/database/queries/10_farmer_reports.sql) | Part 13: Farmer Reports | Sales performance, crop portfolio yields, quality ratings, payout tracking, and top-performing commodities. |
| [`11_buyer_reports.sql`](file:///c:/Users/mtaus/OneDrive/Desktop/Agriconnect/database/queries/11_buyer_reports.sql) | Part 14: Buyer Reports | Procurement summaries, crop purchasing breakdowns, payment balances, and demand-vs-procurement gaps. |
| [`12_marketplace_reports.sql`](file:///c:/Users/mtaus/OneDrive/Desktop/Agriconnect/database/queries/12_marketplace_reports.sql) | Part 15: Marketplace Reports | Executive KPI scorecard, supply-demand deficits, leaderboards, fulfillment ratios, and trading premiums. |
| [`13_views.sql`](file:///c:/Users/mtaus/OneDrive/Desktop/Agriconnect/database/queries/13_views.sql) | Part 16: SQL Views | Definitions of 4 production views (`vw_verified_harvests`, `vw_order_summary`, `vw_order_delivery_payment`, `vw_marketplace_price_summary`) and query demos. |
| [`14_transactions.sql`](file:///c:/Users/mtaus/OneDrive/Desktop/Agriconnect/database/queries/14_transactions.sql) | Part 17: ACID Transactions | Atomic order placement with stock deduction, rollback on deficit, and Spring `@Transactional` architecture. |

---

## 4. SQL Views (Virtual Tables)

AgriConnect defines four core SQL views to simplify complex joins and safeguard sensitive user data:

### 1. `vw_verified_harvests`
* **Purpose**: Encapsulates quality-approved harvests ready for matchmaking.
* **Underlying Tables**: `harvests h`, `users u`, `crops c`, `quality_assessments qa`
* **Filter**: `qa.verification_status = 'VERIFIED'`
* **Privacy**: Excludes password hashes and sensitive phone/email credentials.

### 2. `vw_order_summary`
* **Purpose**: Unifies commercial contract details across buyers, farmers, and crops.
* **Underlying Tables**: `orders o`, `users b` (buyer), `harvests h`, `users f` (farmer), `crops c`
* **Use Case**: Powers buyer/farmer order histories and executive turnover reports.

### 3. `vw_order_delivery_payment`
* **Purpose**: End-to-end operational view tracking commercial order status, physical delivery status, and financial settlement status.
* **Underlying Tables**: `orders o`, `users b`, `harvests h`, `users f`, `crops c`, `deliveries d`, `payments p`
* **Use Case**: Used for auditing orders that have been physically delivered but remain financially pending or unpaid.

### 4. `vw_marketplace_price_summary`
* **Purpose**: Combines APMC Mandi reference rates (`MARKET_MANDI`) with real platform transaction sales (`TRANSACTION_SALE`).
* **Underlying Tables**: `price_history ph`, `crops c`, `users f`, `users b`
* **Effective Price**: Evaluated dynamically using `COALESCE(ph.unit_price, ph.modal_price_per_kg)`.

---

## 5. Performance Optimization & Indexing Strategy

AgriConnect utilizes composite and single-column B-Tree indexes targeting foreign keys, search filters, and range queries.

### Key Production Indexes
1. `users(role, status)`: Accelerates authentication and administrative user directory filtering.
2. `harvests(crop_id, status, available_quantity)`: Composite index optimizing Quality-Aware Matchmaking by eliminating full table scans.
3. `harvests(farmer_id)` & `harvests(price_per_kg)`: Accelerates farmer catalog retrieval and price-range filtering.
4. `quality_assessments(quality_grade, verification_status)`: Filters certified Grade A/B/C lots instantaneously.
5. `buyer_requirements(crop_id, status, min_quality_grade)`: Matches open buyer demand against available harvests.
6. `orders(buyer_id, order_status)` & `orders(harvest_id)`: Speeds up buyer purchase lookups and batch-demand tracking.
7. `deliveries(delivery_status)`: Optimizes logistics dispatch feeds.
8. `price_history(crop_id, recorded_date)`: Facilitates rapid historical time-series aggregation.
9. `price_history(source_type)`: Distinguishes Mandi benchmarks from transaction records.

### Query Plan Evaluation (`EXPLAIN`)
Running `EXPLAIN` against core reporting queries confirms index-driven execution:
* **Query**: `EXPLAIN SELECT * FROM vw_verified_harvests WHERE quality_grade = 'A';`
  * Execution plan leverages `ref` lookup on `idx_qa_grade_status` with `key_len = 3`, resolving matched rows directly, followed by `eq_ref` primary key joins on `harvests`, `crops`, and `users`. Zero table scans (`ALL`) occur.
* **Query**: `EXPLAIN SELECT * FROM price_history WHERE crop_id = 1 AND source_type = 'MARKET_MANDI';`
  * Execution plan utilizes `idx_price_history_crop_date` for indexed lookups with `rows = 3`, achieving constant/logarithmic search time.

---

## 6. Database Constraints & Referential Integrity

AgriConnect enforces integrity at the relational database engine level:

1. **Primary Key Constraints**: Enforces entity uniqueness on `user_id`, `crop_id`, `harvest_id`, `order_id`, etc.
2. **Foreign Key Constraints with Referential Action**:
   * `orders.buyer_id \to users.user_id` (RESTRICT on delete, preserving trade contract history).
   * `orders.harvest_id \to harvests.harvest_id` (RESTRICT on delete, protecting harvest batch audit trails).
   * `deliveries.order_id \to orders.order_id` (UNIQUE, enforcing strict 1-to-1 delivery per order).
   * `quality_assessments.harvest_id \to harvests.harvest_id` (UNIQUE, enforcing single assessment per harvest lot).
3. **Unique Constraints**:
   * `users.email` and `users.phone` prevent duplicate accounts.
   * `crops.crop_name` prevents duplicate catalog entries.
   * `deliveries.tracking_number` prevents conflicting logistics identifiers.
   * `payments.transaction_reference` prevents double-charging and duplicate settlement claims.
4. **ENUM Domain Constraints**:
   * Enforces valid states across `role` (`FARMER`, `BUYER`, `ADMIN`), `status` (`ACTIVE`, `INACTIVE`, `SUSPENDED`), `quality_grade` (`A`, `B`, `C`), `order_status` (`PENDING`, `ACCEPTED`, `REJECTED`, `CANCELLED`, `CONFIRMED`, `SHIPPED`, `DELIVERED`), and `payment_status` (`PENDING`, `PROCESSING`, `COMPLETED`, `PAID`, `FAILED`, `CANCELLED`, `REFUNDED`).

---

## 7. Safe Execution Guidelines

> [!CAUTION]
> **Production Data Safety Policy**
> - All reporting queries (`02` through `12` and `13`) are strictly read-only (`SELECT`).
> - Destructive operations (`DROP TABLE`, `TRUNCATE`, uncontrolled `DELETE`) are prohibited.
> - The DML demonstration script (`01_basic_crud.sql`) uses dedicated demonstration records and immediately cleans them up.
> - The transaction demonstration script (`14_transactions.sql`) operates within explicit `ROLLBACK` blocks or transactional restoration routines to guarantee zero permanent disruption to existing inventory.
