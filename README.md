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

- **Frontend**: HTML5, CSS3, Vanilla JavaScript (No heavyweight frameworks; accessible and responsive)
- **Backend**: Java 21, Spring Boot 3.3.4 (Spring Web, Spring Data JPA, HikariCP)
- **Build Tool**: Apache Maven (with included Maven Wrapper `mvnw` / `mvnw.cmd`)
- **Database**: MySQL 8.0 (`agriconnect_db`)
- **API**: RESTful APIs returning standard JSON payloads
- **Architecture**:
  ```
  Frontend (HTML/CSS/JS)
         ↓ HTTP / JSON
    REST API (/api/**)
         ↓
     Controller (Spring MVC)
         ↓
      Service (Business Logic & Health Checks)
         ↓
     Repository (Spring Data JPA)
         ↓ JDBC / SQL
   MySQL Database (agriconnect_db)
  ```

---

## Current Phase

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

The frontend is a lightweight vanilla web application. You can run it using any of the following methods:

1. **Directly via Browser**:
   Double-click `frontend/index.html` or open it directly in your browser. (The backend CORS configuration explicitly permits `null` file origins).

2. **VS Code Live Server**:
   Right-click `frontend/index.html` in VS Code and select **Open with Live Server** (`http://localhost:5500`).

3. **Python HTTP Server**:
   ```bash
   python -m http.server 3000 --directory frontend
   ```
   Open `http://localhost:3000` in your browser.

---

## Testing

### 1. Automated Backend Unit Test
Run the test suite to verify MVC serialization and endpoint health:
```bash
cd backend
.\mvnw.cmd test
```

### 2. Testing the REST API
With the backend running, send a GET request:
```bash
curl http://localhost:8080/api/health
```

#### Expected Result
HTTP `200 OK` with JSON response:
```json
{
  "status": "UP",
  "application": "AgriConnect",
  "phase": "Phase 1",
  "database": "Connected (agriconnect_db)",
  "timestamp": "2026-09-23T22:52:30.123456"
}
```

### 3. Testing Frontend Connection
1. Open `frontend/index.html`.
2. The status card will show:
   - **Backend Status**: `Backend Status: Connected ✓`
   - **Database Connection**: `Database: Connected (agriconnect_db) ✓`
   - **Active Phase**: `Phase 1`
3. Click **↻ Refresh Status** to verify real-time polling.

---

## Future Phases Roadmap

- [x] **Phase 1 — Project Foundation and Environment Setup** *(Completed)*
- [x] **Phase 2 — Database Design & Relational Schema** *(Completed)*
- [x] **Phase 3 — Authentication & User Management** *(Completed)*
- [x] **Phase 4 — Farmer & Harvest Management** *(Completed)*
- [x] **Phase 5 — Quality Management & Verification** *(Completed)*
- [x] **Phase 6 — Buyer Requirements** *(Completed)*
- [x] **Phase 7 — Quality-Aware Matching** *(Completed)*
- [x] **Phase 8 — Order Management** *(Completed)*
- [ ] **Phase 9 — Delivery Management**
- [ ] **Phase 10 — Payment Management**
- [ ] **Phase 11 — Price History**
- [ ] **Phase 12 — Admin Dashboard**
- [ ] **Phase 13 — DBMS Queries & Reports**
- [ ] **Phase 14 — Security & Validation**
- [ ] **Phase 15 — Final UI/Integration**
