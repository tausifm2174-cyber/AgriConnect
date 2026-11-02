# AgriConnect — Database Design & Management (Phase 2)

## 1. Overview
**AgriConnect** employs a 3NF normalized MySQL 8.0 relational database designed for an agricultural B2B marketplace. The system connects Farmers and Commercial Buyers through a transparent, quality-graded harvest matching workflow.

---

## 2. Relational Schema Architecture

The database consists of **11 normalized tables**:

| # | Table Name | Description | Primary Key | Key Foreign Keys |
|---|---|---|---|---|
| 1 | `users` | Base identity & credentials | `user_id` | Unique `email`, `phone` |
| 2 | `farmer_profiles` | Role-specific farm details | `farmer_id` | `farmer_id -> users(user_id)` |
| 3 | `buyer_profiles` | Role-specific company details | `buyer_id` | `buyer_id -> users(user_id)` |
| 4 | `crops` | Standardized crop catalog | `crop_id` | Unique `crop_name` |
| 5 | `harvests` | Farmer lot offerings & stock | `harvest_id` | `farmer_id -> users`, `crop_id -> crops` |
| 6 | `quality_assessments` | Quality grading & inspection | `assessment_id` | Unique `harvest_id -> harvests`, `admin_id -> users` |
| 7 | `buyer_requirements` | Buyer purchase demand | `requirement_id` | `buyer_id -> users`, `crop_id -> crops` |
| 8 | `orders` | Point-in-time purchase contracts | `order_id` | `buyer_id -> users`, `harvest_id -> harvests` |
| 9 | `deliveries` | Logistics & dispatch tracking | `delivery_id` | Unique `order_id -> orders` |
| 10 | `payments` | Financial audit transactions | `payment_id` | `order_id -> orders` |
| 11 | `price_history` | Historical market rate trends | `price_id` | `crop_id -> crops` |

---

## 3. Important Architectural Decisions

### 1. User & Role Modeling (Option B)
- **Decision**: Implemented a unified `users` table with 1:1 specialization profile tables (`farmer_profiles`, `buyer_profiles`).
- **Rationale**: Avoids duplication of universal attributes (`full_name`, `email`, `phone`, `role`, `status`), guarantees global uniqueness of login identifiers across roles, eliminates sparse null values, and adheres strictly to Third Normal Form (3NF).

### 2. Point-in-Time Order Pricing
- **Decision**: The `orders` table explicitly records `agreed_price_per_kg` and `total_amount`.
- **Rationale**: An agricultural marketplace must preserve the historical contract value. If a farmer later adjusts their crop lot price from ₹25/kg to ₹35/kg, existing orders must remain completely immutable.

### 3. Payment Model (Order 1:N Payment)
- **Decision**: Supported multiple payment records per order.
- **Rationale**: B2B agricultural trade regularly involves advance partial deposits (e.g., 20-30%) with final settlement upon successful delivery, as well as tracking individual transaction attempts, UPI/NEFT references, and refunds.

### 4. Dynamic Quality-Aware Matching (No Separate Table)
- **Decision**: Quality-aware matching is executed as an optimized relational query across `buyer_requirements`, `harvests`, `crops`, and `quality_assessments` rather than creating a static table.
- **Rationale**: Creating a persistent matching table creates data redundancy, cache invalidation issues, and state synchronization bugs when harvest stock changes.

---

## 4. Normalization Summary (Academic Defense)

1. **First Normal Form (1NF)**:
   - All columns hold atomic scalar values.
   - Repeating groups (such as multiple payment installments) are modeled as distinct rows in child tables.
   - Every relation has a declared primary key.
2. **Second Normal Form (2NF)**:
   - The schema is in 1NF.
   - All non-key attributes are fully dependent on the primary key (no partial dependencies on composite keys).
3. **Third Normal Form (3NF)**:
   - The schema is in 2NF.
   - No transitive functional dependencies exist ($X \to Y \to Z$). Farmer attributes live in `users` and `farmer_profiles`, not transitively within `harvests` or `orders`.

---

## 5. Domain Constraints & Referential Integrity

- **Foreign Key Policies**: Configured with `ON DELETE RESTRICT` for transactional integrity on users, crops, orders, deliveries, and payments to prevent accidental data loss.
- **Domain CHECK Constraints**:
  - `freshness`, `appearance`, `size`, `color`, `ripeness` ratings constrained between `1` and `10`.
  - `damage_percentage` and `quality_score` constrained between `0.00` and `100.00`.
  - `quality_grade` constrained to `('A', 'B', 'C')`.
  - `verification_status` constrained to `('PENDING', 'VERIFIED', 'REJECTED')`.
  - Harvest stock: `CHECK (initial_quantity > 0 AND available_quantity >= 0 AND available_quantity <= initial_quantity)`.
  - Financial checks: Positive prices (`price_per_kg > 0`, `agreed_price_per_kg > 0`, `amount > 0`).

---

## 6. Performance Indexes

| Index Name | Table & Columns | Purpose |
|---|---|---|
| `idx_harvests_crop_status_avail` | `harvests(crop_id, status, available_quantity)` | Rapid marketplace filtering for available crop lots |
| `idx_qa_grade_status` | `quality_assessments(quality_grade, verification_status)` | Instant filtering of verified lots for quality matching |
| `idx_buyer_req_crop_status` | `buyer_requirements(crop_id, status, min_quality_grade)` | Fast buyer demand discovery |
| `idx_orders_buyer_status` | `orders(buyer_id, order_status)` | Quick order history retrieval |
| `idx_price_history_crop_date` | `price_history(crop_id, recorded_date)` | High-performance time-series mandi price analytics |

---

## 7. How to Initialize the Database & Run Queries

### Step 1: Execute Schema Scripts
From PowerShell or MySQL CLI:
```powershell
$mysql = "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe"

# 1. Create tables
Get-Content database\schema\01_create_tables.sql | & $mysql -u root -p agriconnect_db

# 2. Add constraints
Get-Content database\schema\02_create_constraints.sql | & $mysql -u root -p agriconnect_db

# 3. Create indexes
Get-Content database\schema\03_create_indexes.sql | & $mysql -u root -p agriconnect_db
```

### Step 2: Load Sample Data
```powershell
Get-Content database\data\sample_data.sql | & $mysql -u root -p agriconnect_db
```

### Step 3: Run Demonstration Queries
```powershell
Get-Content database\queries\demo_queries.sql | & $mysql -u root -p -t agriconnect_db
```

For visual presentation slides, see [database/ER_DIAGRAM.md](file:///c:/Users/mtaus/OneDrive/Desktop/Agriconnect/database/ER_DIAGRAM.md).
