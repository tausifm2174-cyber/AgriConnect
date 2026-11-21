# AgriConnect — Farmer-to-Market Management System

## Project Description
**AgriConnect** is a database-driven agricultural management web application designed to directly connect farmers and commercial buyers. Built as a college-level DBMS project, AgriConnect showcases relational database concepts, normalized schemas, multi-table transactions, quality grading, and matching algorithms while maintaining a clean, layered architectural separation.

The full workflow of the final system will encompass:
> Farmer → Harvest → Quality Assessment → Buyer Requirement → Quality-Aware Matching → Order → Delivery → Payment → Price History

The platform serves three user roles:
- **Farmer**
- **Buyer**
- **Admin**

---

## Technology Stack

- **Frontend**: React 18, Vite 6, React Router DOM v6, Axios, Lucide React (Responsive modern single-page application with Farmer, Buyer, and Admin portals)
- **Legacy Frontend**: HTML5/CSS3/Vanilla JS archived in `frontend-legacy/`
- **Backend**: Java 21, Spring Boot 3.3.4 (Spring Web, Spring Security, Spring Data JPA, HikariCP)
- **Build Tools**: Node.js / npm (Frontend) & Apache Maven with `mvnw` Wrapper (Backend)
- **Database**: MySQL 8.0 (`agriconnect_db`)
- **Security**: Stateless JWT Authentication, BCrypt Password Hashing, Role-Based Access Control (RBAC: `FARMER`, `BUYER`, `ADMIN`), IDOR Protection
- **Architecture**:
  ```
     React 18 + Vite SPA (frontend/)
             ↓ HTTP / Bearer JWT
        REST API (/api/**)
             ↓
         SecurityFilterChain (JWT Auth & RBAC)
             ↓
         Controllers (Spring MVC REST)
             ↓
         Services (Quality-Aware Matching, Contracts, Logistics, Settlements)
             ↓
         Repositories (Spring Data JPA)
             ↓ JDBC / SQL
       MySQL 8.0 Database (agriconnect_db)
  ```

---

## Current Phase

### Phase 15 — React Frontend Migration & Final Integration (Completed)
The purpose of Phase 15 is to transition the frontend to a modern, responsive, modular **React 18 + Vite** single-page architecture while preserving 100% of the Spring Boot backend, REST API contracts, MySQL schema, and 331 passing tests.

Key accomplishments in Phase 15:
- **Modular Frontend Architecture (`frontend/`)**:
  - React 18, Vite 6, Tailwind/CSS variables design system, React Router DOM v6.
  - Role-based Layouts (`FarmerLayout`, `BuyerLayout`, `AdminLayout`) with responsive collapsable sidebar navigation.
  - Comprehensive `AuthContext` managing JWT token persistence, auto-refresh of credentials from `/api/auth/me`, and route interception.
- **Complete Farmer Portal (Stage 2)**:
  - Overview Dashboard (`/farmer`), Profile (`/farmer/profile`), Harvest Inventory (`/farmer/harvests`, `/farmer/harvests/new`), Quality Reports (`/farmer/quality`), Buyer Demand (`/farmer/requirements`), Orders (`/farmer/orders`), Deliveries (`/farmer/deliveries`), Payments Ledger (`/farmer/payments`), and Market Prices (`/farmer/price-history`).
- **Complete Buyer Portal (Stage 3)**:
  - Commercial Dashboard (`/buyer`), Corporate Profile (`/buyer/profile`), Requirements Management (`/buyer/requirements`, `/buyer/requirements/new`, `/buyer/requirements/:id`), Quality-Aware Matching Engine (`/buyer/matches`), Orders (`/buyer/orders`, `/buyer/orders/:id`), Shipments Tracking (`/buyer/deliveries`), Payments & Ledger (`/buyer/payments`), and Mandi Price Intelligence (`/buyer/price-history`).
- **Complete Admin Operations Center (Stage 4)**:
  - Command Center (`/admin`), Stakeholder Directory (`/admin/users`, `/admin/users/:id`), Harvest Inventory Audit (`/admin/harvests`), Quality Inspections & Formal Certification (`/admin/quality`), Orders Monitoring (`/admin/orders`, `/admin/orders/:id`), Freight Logistics Fleet (`/admin/deliveries`), Escrow Financial Settlements (`/admin/payments`), Price Intelligence (`/admin/price-history`), and DBMS Operational Reports Reference (`/admin/reports`).
- **Showcase Integration & QA (Stage 5)**:
  - End-to-end multi-role demonstration workflow verified against real MySQL database data.
  - 100% test pass rate preserved (331 backend tests, 0 failures, 0 skipped).
  - Legacy frontend preserved in `frontend-legacy/` as an archive.

Key accomplishments in Phase 13:
- **Comprehensive SQL Query Demonstration Library (`database/queries/`)**:
  - `01_basic_crud.sql`: SQL DML filtering (`WHERE`, `ORDER BY`, `LIMIT`, `LIKE`, `BETWEEN`, `IN`, `IS NULL`), safe demonstration inserts, updates, and deletes.
  - `02_join_queries.sql`: Multi-table joins across 8 relational entities, including 6 dedicated multi-way joins traversing harvest, quality, buyer, order, delivery, and payment records.
  - `03_aggregate_queries.sql`: Statistical functions (`COUNT`, `SUM`, `AVG`, `MIN`, `MAX`), multi-dimensional `GROUP BY`, and threshold filtering using `HAVING`.
  - `04_subqueries.sql`: Scalar subqueries, correlated subqueries (e.g. crop pricing premiums, highest-priced harvests per crop), membership subqueries (`IN`, `EXISTS`), and derived tables.
  - `05_quality_reports.sql`: Quality inspection grade distribution (A, B, C), defect percentages, pending inspection queue, and quality-price correlation.
  - `06_order_reports.sql`: Commercial contract volumes, crop turnover, counterparty analysis, cancellations audit, and monthly time-series (`DATE_FORMAT`).
  - `07_delivery_reports.sql`: Freight logistics, shipment transit duration calculations (`TIMESTAMPDIFF`), delivery success rates, and order-to-delivery lifecycle comparisons.
  - `08_payment_reports.sql`: Settlement channels, monthly cash flow, farmer payout ledgers, buyer expenditure, and financial fulfillment states.
  - `09_price_reports.sql`: APMC Mandi benchmarks (`MARKET_MANDI`) vs realized platform sales (`TRANSACTION_SALE`), commodity spreads, price trends, and regional pricing.
  - `10_farmer_reports.sql`: Supply-side operational reporting, crop portfolio yields, inspection track records, and payout tracking.
  - `11_buyer_reports.sql`: Demand-side procurement analytics, commodity purchase breakdowns, outstanding balances, and demand-vs-procurement gap analysis.
  - `12_marketplace_reports.sql`: Executive KPI scorecard, supply-demand deficits, producer/purchaser leaderboards, and conversion ratios.
  - `13_views.sql`: Reusable virtual tables (`vw_verified_harvests`, `vw_order_summary`, `vw_order_delivery_payment`, `vw_marketplace_price_summary`) and analytical queries.
  - `14_transactions.sql`: ACID transaction demonstrations (atomic order creation with stock deduction, rollback on stock deficit), and Spring Boot `@Transactional` integration architecture.
- **Relational Schema Migration (`11_phase13_dbms_reports.sql`)**:
  - Implements idempotent `CREATE OR REPLACE VIEW` definitions for all 4 analytical views.
- **Full Normalization & Architecture Documentation (`database/queries/README.md`)**:
  - Thorough academic analysis of 1NF, 2NF, and 3NF across all 11 core tables using actual schema attributes.
  - Performance optimization index documentation and `EXPLAIN` query execution plan verification.
- **Automated Verification Test Suite (`Phase13DatabaseVerificationTest.java`)**:
  - 4 automated tests verifying view existence, multi-table join integrity, subqueries, and database constraint enforcement.
  - Regression test suite expanded to **309 passing tests** (0 failures, 0 errors, 0 skipped).

### Phase 12 — Admin Dashboard (Completed)
The purpose of Phase 12 is to implement a comprehensive centralized Admin Operations & System Control Center providing administrators with unified oversight across all marketplace domains: users, produce listings, quality certifications, commercial orders, logistics fulfillment, financial escrow, and price analytics.

Key accomplishments in Phase 12:
- **Relational Schema Migration (`10_phase12_admin_dashboard.sql`)**:
  - Added dedicated index `idx_price_history_source` on `price_history(source_type)` for optimized source filtering.
  - Added dedicated index `idx_harvests_status_only` on `harvests(status)` for fast marketplace lot aggregation.
  - Added dedicated index `idx_buyer_req_status_only` on `buyer_requirements(status)` for high-performance demand counting.
- **Unified Analytics & Aggregation Engine (`AdminDashboardService`)**:
  - Computes platform-wide KPIs directly via database-side SQL/JPA queries (`COUNT`, `SUM`, `AVG`), preventing in-memory iteration overhead.
  - Generates cross-domain activity stream chronologically ordering events across orders, deliveries, payments, quality certifications, harvests, and mandi price records.
- **Administrative User Directory & Specialization Oversight (`AdminUserService`)**:
  - Filter users by Role (`FARMER`, `BUYER`, `ADMIN`) and operational status (`ACTIVE`, `INACTIVE`, `SUSPENDED`).
  - Search keyword filtering across full name, email, and phone.
  - Deep inspection of Farmer specialization profiles (farm location, acreage, experience) and Buyer profiles (business name, type, GSTIN, address).
  - Strictly sanitized: passwords and password hashes are never exposed.
- **Quality Inspection API Enhancement (`AdminQualityController`)**:
  - Added `GET /api/admin/quality` returning all system quality assessments.
- **Strict Role-Based Access Control (RBAC)**:
  - All `/api/admin/**` endpoints protected by Spring Security (`hasRole('ADMIN')`).
  - Non-admin users (Farmers, Commercial Buyers) receive `403 Forbidden`; unauthenticated requests receive `401 Unauthorized`.
- **REST APIs**:
  - `GET /api/admin/dashboard` (Platform-wide statistical summary and KPIs)
  - `GET /api/admin/dashboard/recent-activity` (Live chronological marketplace activity feed)
  - `GET /api/admin/users` (Search and list system users with role/status filters)
  - `GET /api/admin/users/{id}` (Detailed user inspection with specialization profile)
  - `GET /api/admin/quality` (All marketplace quality assessments)
- **Frontend Integration**:
  - Centralized **Operations Control Center** card with 8 major KPI tiles (Users, Harvests, Quality, Demands, Orders, Deliveries, Payments, Price Intelligence).
  - Real-time **Marketplace Activity Stream** with domain icons and status badges.
  - **User Directory & Role Oversight** table with multi-criteria filtering and detailed user inspection modal.
- **Test Suite**:
  - 19 dedicated tests covering service aggregations, activity feed ordering, user filtering, controller contracts, idempotent database migrations, and live Spring Boot integration with RBAC security enforcement.
  - 305 total automated tests passing across Phases 1–12 (`BUILD SUCCESS`).

### Phase 11 — Price History & Analytics (Completed)
The purpose of Phase 11 is to implement comprehensive historical price intelligence and market trend analytics.

Key accomplishments in Phase 9:
- **Relational Schema Migration (`07_phase9_delivery_management.sql`)**:
  - Updated `deliveries.delivery_status` ENUM with full lifecycle statuses (`PENDING`, `DISPATCHED`, `IN_TRANSIT`, `SHIPPED`, `DELIVERED`, `CANCELLED`, `FAILED`).
  - Added `remarks VARCHAR(255)` for carrier, handling, and handover notes.
  - Added `estimated_delivery_date DATETIME` for target arrival estimates.
  - Added `updated_at TIMESTAMP` with automatic `CURRENT_TIMESTAMP ON UPDATE` auditing.
  - Added composite index `idx_deliveries_order_status (order_id, delivery_status)` for efficient status and order lookups.
  - Maintained 1:1 relational guarantee: `order_id INT NOT NULL UNIQUE`.
- **Atomic State Synchronization & Lifecycle Consistency**:
  - Strict lifecycle transitions: `PENDING -> SHIPPED -> DELIVERED` (or `CANCELLED`/`FAILED`).
  - Order-Delivery synchronization:
    - Scheduling delivery for an `ACCEPTED` order atomically advances order status to `CONFIRMED`.
    - Dispatching a shipment (`/ship`) transitions both delivery and order to `SHIPPED`.
    - Marking delivered by farmer (`/deliver`) or confirming receipt by buyer (`/confirm-received`) atomically transitions both delivery and order to `DELIVERED`.
    - Invalid backward transitions (e.g. `DELIVERED -> SHIPPED`, `SHIPPED -> ACCEPTED`) are strictly rejected with HTTP 400.
    - Duplicate delivery creation attempts on the same order are blocked with HTTP 400 (`DuplicateDeliveryException`).
- **Strict Role-Based Access Control (RBAC) & Ownership Security**:
  - Authenticated identities extracted strictly from JWT (`ROLE_BUYER`, `ROLE_FARMER`, `ROLE_ADMIN`).
  - Buyer permissions: Schedule delivery for own orders, inspect inbound deliveries, confirm delivery receipt. Insecure Direct Object Access (IDOR) to other buyers' deliveries blocked with HTTP 403 Forbidden.
  - Farmer permissions: Schedule delivery for own orders, inspect outgoing deliveries for own produce, dispatch shipments (`PATCH .../ship`) with carrier/tracking info, mark delivered (`PATCH .../deliver`). Modifications to other farmers' deliveries blocked with HTTP 403 Forbidden.
  - Admin permissions: View and monitor all platform deliveries, inspect full audit details, and update statuses.
  - Unauthenticated requests blocked with HTTP 401 Unauthorized; cross-role violations blocked with HTTP 403 Forbidden.
- **REST APIs**:
  - **Buyer**:
    - `POST /api/buyer/deliveries` (Schedule delivery for accepted order)
    - `GET /api/buyer/deliveries` (Inbound deliveries history)
    - `GET /api/buyer/deliveries/{id}` (Single delivery tracking details)
    - `PATCH /api/buyer/deliveries/{id}/confirm-received` (Buyer confirms produce delivery receipt)
  - **Farmer**:
    - `POST /api/farmer/deliveries` (Schedule delivery for accepted order)
    - `GET /api/farmer/deliveries` (Outgoing shipments for farmer's produce)
    - `GET /api/farmer/deliveries/{id}` (Single delivery tracking details)
    - `PATCH /api/farmer/deliveries/{id}/ship` (Farmer dispatches shipment with vehicle/tracking)
    - `PATCH /api/farmer/deliveries/{id}/deliver` (Farmer marks delivery complete)
  - **Admin**:
    - `GET /api/admin/deliveries` (Global logistics monitoring with status filters)
    - `GET /api/admin/deliveries/{id}` (Detailed logistics inspection)
    - `PATCH /api/admin/deliveries/{id}/status` (Administrative status and remarks update)
- **Frontend Integration**:
  - **Farmer Workflow**: Outgoing Deliveries & Logistics dashboard card with status filter tabs (`ALL`, `PENDING`, `SHIPPED`, `DELIVERED`), Ship modal, and rich Delivery Details inspection modal.
  - **Buyer Workflow**: Inbound Deliveries & Tracking dashboard card with status filter tabs, Confirm Receipt action, and Delivery Details inspection modal.
  - **Admin Workflow**: Global Delivery & Logistics Monitoring card with multi-role oversight.
  - **Order Synchronization**: Schedule delivery shortcuts embedded directly within accepted order rows.
- **Test Suite**:
  - 18 isolated Mockito unit tests in `DeliveryServiceTest` covering 100% of functional requirements and edge cases.
  - 8 `@WebMvcTest` controller tests in `DeliveryControllerTest` verifying endpoints and security.
  - 109 total unit & WebMvc tests passing with `BUILD SUCCESS`.

### Phase 8 — Order Management (Completed)
The purpose of Phase 8 is to implement a complete, atomic order management lifecycle connecting buyer requirements and quality-aware matching results to farmer harvest purchases.

Key accomplishments in Phase 8:
- **Relational Schema Migration (`06_phase8_order_management.sql`)**:
  - Expanded `orders.order_status` ENUM to include `PENDING`, `ACCEPTED`, `REJECTED`, `CANCELLED`, `CONFIRMED`, `SHIPPED`, `DELIVERED`.
  - Added nullable `requirement_id` with foreign key `fk_orders_requirement` referencing `buyer_requirements(requirement_id)`.
  - Added `remarks VARCHAR(255)` and `cancellation_reason VARCHAR(255)`.
  - Added index `idx_orders_status` on `order_status` for high-throughput filtering.
- **Concurrency & Inventory Protection**:
  - Pessimistic write locking (`@Lock(LockModeType.PESSIMISTIC_WRITE)`) on `Harvest` rows executing `SELECT ... FOR UPDATE` within Spring `@Transactional`.
  - Atomic stock reservation: immediately deducts purchased quantity from `available_quantity` upon order creation.
  - Automatic status transition: transitions harvest to `SOLD_OUT` if remaining stock reaches 0, or `PARTIALLY_SOLD` otherwise.
  - Over-selling prevention: verified via multi-threaded concurrency stress test (`OrderIntegrationTest.testConcurrentOrdersCannotOversellStock`).
  - Exactly-once stock restoration: rejecting or cancelling an order safely restores harvest stock back to farmer inventory. Double-restoration is strictly prevented.
- **Order Lifecycle & State Transitions**:
  - Strict transition validation: `PENDING -> ACCEPTED`, `PENDING -> REJECTED`, `PENDING -> CANCELLED`.
  - Terminal state locking: Orders in `ACCEPTED`, `REJECTED`, or `CANCELLED` cannot be re-transitioned.
- **REST APIs**:
  - **Buyer**:
    - `POST /api/buyer/orders` (Atomic order placement with stock deduction)
    - `GET /api/buyer/orders` (Buyer's purchase history)
    - `GET /api/buyer/orders/{id}` (Single order details; cross-buyer access blocked with 403)
    - `PATCH /api/buyer/orders/{id}/cancel` (Buyer cancels pending order; restores stock)
  - **Farmer**:
    - `GET /api/farmer/orders` (Incoming orders for farmer's harvests)
    - `GET /api/farmer/orders/{id}` (Order details; cross-farmer access blocked with 403)
    - `PATCH /api/farmer/orders/{id}/accept` (Farmer accepts pending order)
    - `PATCH /api/farmer/orders/{id}/reject` (Farmer rejects pending order; restores stock)
  - **Admin**:
    - `GET /api/admin/orders` (Global marketplace order monitoring with optional status filter)
    - `GET /api/admin/orders/{id}` (Order details)
- **Frontend Integration**:
  - **Buyer Workflow**: Integrated `[🛒 Place Order]` button on matched harvest cards, opening order placement modal with live price & total amount calculations. Added "My Purchase Orders" dashboard with status filter tabs and cancellation modal.
  - **Farmer Workflow**: Added "Incoming Buyer Orders" dashboard card with status filter tabs, Accept action, and Reject modal with reason collection.
  - **Admin Workflow**: Added "Marketplace Order Monitoring" card with full metrics, status filter tabs, and shared Order Details inspection modal.
- **Test Suite**:
  - 200 total automated tests passing (`.\backend\mvnw.cmd test`), covering unit tests, integration tests, security boundaries, stock mutations, rollback scenarios, and multi-threaded race conditions.

### Phase 14: Security Hardening & Validation Refinement
- **Comprehensive Security Audit**: Completed full end-to-end security review across Authentication, JWT Token Security, Role-Based Access Control (RBAC), Insecure Direct Object References (IDOR), Request & Business Validation, SQL/JPA Injection Prevention, Exception Handling & Data Leakage Prevention, Sensitive Response Data Exclusion, and Frontend Client Enforcement.
- **Centralized Exception Sanitization (`GlobalExceptionHandler`)**:
  - `HttpMessageNotReadableException` -> Safe 400 Bad Request ("Malformed JSON request or invalid field format.")
  - `MethodArgumentTypeMismatchException` -> Safe 400 Bad Request ("Invalid parameter value for: {param}")
  - `MissingServletRequestParameterException` -> Safe 400 Bad Request
  - `IllegalArgumentException` / `IllegalStateException` -> Safe 400 Bad Request
  - `DataIntegrityViolationException` -> Safe 409 Conflict ("Database constraint or data integrity conflict. Operation could not be completed.")
  - `HttpRequestMethodNotSupportedException` -> Safe 405 Method Not Allowed
  - Internal database details, Hibernate queries, and Java stack traces are strictly hidden from clients.
- **Automated Security Hardening Regression Suite (`SecurityHardeningTest.java`)**:
  - 22 focused security tests covering:
    - 401 Unauthorized verification on unauthenticated requests and tampered/malformed JWTs.
    - 403 Forbidden verification on cross-role privilege escalation (Farmer -> Buyer/Admin, Buyer -> Farmer/Admin).
    - 400 Bad Request rejection when attempting to register as `ADMIN` on the public registration endpoint.
    - IDOR prevention ensuring farmers cannot modify/view other farmers' harvests, quality reports, or incoming orders, and buyers cannot access/cancel other buyers' orders or requirements.
    - Request validation verifying boundary checks on quantities, ratings, and emails.
    - Strict exclusion of passwords and password hashes from API responses (`/api/auth/me`, `/api/admin/users/{id}`).
- **Total Test Suite**: Expanded to **331 automated tests** passing (`.\backend\mvnw.cmd test` / `scratch/run_tests.py`), 0 failures, 0 errors, 0 skipped (`BUILD SUCCESS`).

For full architectural details, see [backend/BUYER_REQUIREMENTS.md](backend/BUYER_REQUIREMENTS.md), [backend/QUALITY_MANAGEMENT.md](backend/QUALITY_MANAGEMENT.md), [backend/FARMER_HARVEST_MANAGEMENT.md](backend/FARMER_HARVEST_MANAGEMENT.md), and [backend/AUTHENTICATION.md](backend/AUTHENTICATION.md).

---

## Prerequisites

Before running the project locally, ensure you have the following installed:
1. **Java**: JDK 21 (or compatible Java 17+ LTS)
2. **Maven**: Apache Maven 3.9+ (or use the provided `backend/mvnw.cmd`)
3. **MySQL**: MySQL Server 8.0+ running on port `3306`
4. **IDE/Editor**: VS Code, IntelliJ IDEA, or Eclipse
5. **Web Browser**: Google Chrome, Mozilla Firefox, or Microsoft Edge

---

## Project Structure

```
AgriConnect/
├── backend/                               # Spring Boot application
│   ├── pom.xml                            # Maven dependencies & build configuration
│   ├── mvnw / mvnw.cmd                    # Maven wrapper scripts
│   ├── .mvn/wrapper/                      # Maven wrapper properties
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/agriconnect/
│   │   │   │   ├── AgriConnectApplication.java   # Spring Boot entry point
│   │   │   │   ├── controller/            # REST API controllers
│   │   │   │   │   └── HealthController.java
│   │   │   │   ├── service/               # Business logic & health checks
│   │   │   │   │   └── HealthService.java
│   │   │   │   ├── repository/            # Spring Data JPA repositories (Phase 2)
│   │   │   │   ├── entity/                # Relational JPA entities (Phase 2)
│   │   │   │   ├── dto/                   # Data Transfer Objects
│   │   │   │   │   └── HealthResponse.java
│   │   │   │   ├── config/                # CORS and application configs
│   │   │   │   │   └── WebConfig.java
│   │   │   │   └── exception/             # Centralized exception handlers
│   │   │   │       └── GlobalExceptionHandler.java
│   │   │   └── resources/
│   │   │       └── application.properties # Database & server configuration
│   │   └── test/
│   │       └── java/com/agriconnect/
│   │           └── AgriConnectApplicationTests.java # Controller & MVC tests
├── frontend/                              # Frontend client application
│   ├── index.html                         # Landing and system status page
│   ├── css/
│   │   └── style.css                      # Custom agricultural responsive design
│   └── js/
│       └── app.js                         # Asynchronous API caller and UI updater
├── database/                              # Database documentation and schema
│   ├── README.md                          # Database setup instructions
│   └── schema/                            # SQL DDL scripts (populated in Phase 2)
│       └── .gitkeep
├── .gitignore                             # Git ignore rules
└── README.md                              # Main project documentation
```

---

## Database Setup

1. Start your local MySQL server (Service name: `MySQL80` on Windows).
2. Connect to MySQL via terminal or MySQL Workbench:
   ```bash
   mysql -u root -p
   ```
3. Create the database:
   ```sql
   CREATE DATABASE IF NOT EXISTS agriconnect_db
   CHARACTER SET utf8mb4
   COLLATE utf8mb4_unicode_ci;
   ```
4. Verify database creation:
   ```sql
   SHOW DATABASES LIKE 'agriconnect_db';
   ```

---

## Backend Setup & Configuration

Database credentials are parameterized using environment variables with local defaults in [application.properties](file:///c:/Users/mtaus/OneDrive/Desktop/Agriconnect/backend/src/main/resources/application.properties):

| Environment Variable | Default Value | Description |
|----------------------|---------------|-------------|
| `DB_HOST` | `localhost` | MySQL host address |
| `DB_PORT` | `3306` | MySQL port |
| `DB_NAME` | `agriconnect_db` | Database name |
| `DB_USERNAME` | `root` | Database username |
| `DB_PASSWORD` | *(empty)* | Database password |

If your MySQL `root` user has a password (e.g. `your_password`), you can set it in your environment before running, or pass it as a Maven property or command-line parameter:

**In PowerShell:**
```powershell
$env:DB_PASSWORD="your_password"
```

**In CMD:**
```cmd
set DB_PASSWORD=your_password
```

---

## Running the Backend

From the `backend` directory, run:

```bash
# Using Maven Wrapper (recommended on Windows):
.\mvnw.cmd spring-boot:run

# Or using installed Maven:
mvn spring-boot:run
```

To pass credentials directly on startup:
```bash
.\mvnw.cmd spring-boot:run -Dspring-boot.run.arguments="--DB_PASSWORD=your_password"
```

The application will start on: `http://localhost:8080`.

---

## Running the Frontend

The active production frontend is a modern **React 18 + Vite** application located in `frontend/`.

From the `frontend` directory:

```bash
# Install dependencies
npm install

# Start Vite development server
npm run dev
```

Open `http://localhost:5173` (or the URL printed by Vite) in your browser.

> **Note**: The legacy HTML/CSS/Vanilla-JS frontend is archived for reference in `frontend-legacy/`.

---

## Three-Role Showcase Demonstration Flow

AgriConnect supports three primary roles with verified real-data demonstration workflows:

1. **Farmer Portal (`/farmer`)**:
   - Log in as `rajesh.patel@kisan.in` / `Password@123`
   - View crop yields, list new produce lots (`/farmer/harvests/new`), review official lab quality certificates, accept incoming purchase contracts, schedule dispatches, and track payments.
2. **Buyer Portal (`/buyer`)**:
   - Log in as `vikas.gupta@freshmarts.com` / `Password@123`
   - Post procurement requirements, execute the **Quality-Aware Matching Engine** with deterministic 100-point scoring, place binding purchase orders, track freight telematics, and settle invoices.
3. **Admin Command Center (`/admin`)**:
   - Log in as `admin@agriconnect.org` / `Password@123`
   - Monitor platform-wide KPIs, perform 100-point physical quality grading and certification (`/admin/quality`), oversee freight logistics, audit payments, and inspect the DBMS Reports catalog (`/admin/reports`).

---

## Testing

### 1. Automated Backend Regression Test Suite
Run the full 331-test suite verifying controllers, matching logic, security guards, and database views:
```bash
cd backend
.\mvnw.cmd test
```

### 2. Frontend Production Build
Validate that the entire React SPA compiles cleanly:
```bash
cd frontend
npm run build
```

---

## Project Roadmap

- [x] **Phase 1 — Project Foundation and Environment Setup** *(Completed)*
- [x] **Phase 2 — Database Design & Relational Schema** *(Completed)*
- [x] **Phase 3 — Authentication & User Management** *(Completed)*
- [x] **Phase 4 — Farmer & Harvest Management** *(Completed)*
- [x] **Phase 5 — Quality Management & Verification** *(Completed)*
- [x] **Phase 6 — Buyer Requirements** *(Completed)*
- [x] **Phase 7 — Quality-Aware Matching** *(Completed)*
- [x] **Phase 8 — Order Management** *(Completed)*
- [x] **Phase 9 — Delivery Management** *(Completed)*
- [x] **Phase 10 — Payment Management** *(Completed)*
- [x] **Phase 11 — Price History & Analytics** *(Completed)*
- [x] **Phase 12 — Admin Dashboard** *(Completed)*
- [x] **Phase 13 — DBMS Queries & Reports** *(Completed)*
- [x] **Phase 14 — Security & Validation** *(Completed)*
- [x] **Phase 15 — React Frontend Migration & Final Integration** *(Completed)*
