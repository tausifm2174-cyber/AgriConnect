# AgriConnect — Phase 6: Buyer Requirements Management

## 1. Phase 6 Purpose
The objective of **Phase 6: Buyer Requirements Management** is to empower commercial buyers on the AgriConnect platform to publish, view, update, cancel, and manage their crop procurement requirements in a structured, relational format.

A buyer requirement formalizes demand:
- **Crop**: Selected from the standardized master crop catalog (e.g., Tomato, Alphonso Mango, Basmati Rice).
- **Required Quantity**: Total quantity needed (kg).
- **Maximum Price**: Ceiling price acceptable to the buyer (₹/kg).
- **Minimum Quality Grade**: Quality threshold required (`A`, `B`, or `C`).
- **Preferred Location**: Geographic sourcing preference (e.g., Nashik, Ratnagiri, Karnal).
- **Required By Date**: Deadline by which the procurement must be fulfilled.
- **Status**: Lifecycle status (`OPEN`, `FULFILLED`, `EXPIRED`, `CANCELLED`).

These requirements represent verified market demand, which will subsequently be fed into the multi-parameter matching engine in **Phase 7**.

---

## 2. Buyer Requirement Lifecycle & Status Rules

The lifecycle strictly adheres to the existing MySQL database enum definition (`OPEN`, `FULFILLED`, `EXPIRED`, `CANCELLED`):

```text
              [ Buyer Posts ]
                     ↓
                 +-------+
                 |  OPEN | <--- (Initial state upon creation)
                 +-------+
                  /  |  \
      [Cancel]   /   |   \  [Deadline Passes]
                v    |    v
     +-----------+   |   +-----------+
     | CANCELLED |   |   |  EXPIRED  |
     +-----------+   |   +-----------+
                     |
                     |  [Phase 7+ Matching & Orders]
                     v
               +-----------+
               | FULFILLED |
               +-----------+
```

### State Definitions & Transition Rules
1. **OPEN**:
   - Initial state for any newly submitted requirement.
   - Fully editable by the owning buyer (quantity, price, minimum grade, preferred location, deadline, crop).
   - Can be transitioned to `CANCELLED` by the owning buyer.
2. **CANCELLED**:
   - Explicitly closed by the buyer when demand is withdrawn.
   - Terminal state for Phase 6; cannot be edited or revived.
3. **EXPIRED**:
   - Dynamically evaluated or updated when `requiredByDate < today`.
   - Protects against matching stale demand in later phases.
4. **FULFILLED**:
   - Reserved strictly for subsequent transaction phases (Order placement / completion).
   - Phase 6 does **NOT** manually or automatically set requirements to `FULFILLED`.

---

## 3. Database Relationship & Architecture

Phase 6 reuses the existing `buyer_requirements` table created in Phase 2, with a non-destructive migration script `05_phase6_buyer_requirements.sql` to support fulfillment deadlines:

```sql
-- Migration snippet from database/schema/05_phase6_buyer_requirements.sql
ALTER TABLE buyer_requirements 
ADD COLUMN IF NOT EXISTS required_by_date DATE NULL AFTER preferred_location;
```

### Relational Schema Diagram
```
+-------------------------------------------------------+
|                         users                         |
|-------------------------------------------------------|
| PK user_id INT AUTO_INCREMENT                         |
|    role    ENUM('FARMER', 'BUYER', 'ADMIN')           |
+-------------------------------------------------------+
                           ^
                           | 1:N (buyer_id -> user_id)
+--------------------------|----------------------------+
|                   buyer_requirements                  |
|-------------------------------------------------------|
| PK requirement_id     INT AUTO_INCREMENT              |
| FK buyer_id           INT NOT NULL                    |
| FK crop_id            INT NOT NULL                    |
|    required_quantity  DECIMAL(10,2) NOT NULL          |
|    max_price_per_kg   DECIMAL(10,2) NOT NULL          |
|    min_quality_grade  ENUM('A', 'B', 'C') NOT NULL    |
|    preferred_location VARCHAR(100)                    |
|    required_by_date   DATE NULL                       |
|    status             ENUM('OPEN', 'FULFILLED',       |
|                            'EXPIRED', 'CANCELLED')    |
|    created_at         TIMESTAMP DEFAULT CURRENT_TIME  |
|    updated_at         TIMESTAMP ON UPDATE CURRENT_TIME|
+-------------------------------------------------------+
                           |
                           | N:1 (crop_id -> crop_id)
                           v
+-------------------------------------------------------+
|                         crops                         |
|-------------------------------------------------------|
| PK crop_id INT AUTO_INCREMENT                         |
|    crop_name VARCHAR(100) NOT NULL                    |
|    category  VARCHAR(50)                              |
+-------------------------------------------------------+
```

---

## 4. Entity Design

Located in `backend/src/main/java/com/agriconnect/entity/BuyerRequirement.java`:
- `@Entity` mapped to `@Table(name = "buyer_requirements")`.
- `@ManyToOne(fetch = FetchType.LAZY)` relationship with `User` (mapped column: `buyer_id`).
- `@ManyToOne(fetch = FetchType.LAZY)` relationship with `Crop` (mapped column: `crop_id`).
- Enumerated `minQualityGrade` mapped via `QualityGrade` (`A`, `B`, `C`).
- Enumerated `status` mapped via `RequirementStatus` (`OPEN`, `FULFILLED`, `EXPIRED`, `CANCELLED`), with JSON creator alias support for `ACTIVE` -> `OPEN`.
- Audit timestamps `@CreationTimestamp` (`createdAt`) and `@UpdateTimestamp` (`updatedAt`).

---

## 5. REST API Endpoints

All buyer requirements endpoints reside under `/api/buyer/requirements` and require authenticated users with role `ROLE_BUYER`.

| HTTP Method | Endpoint | Role | Description |
|:---|:---|:---|:---|
| `GET` | `/api/buyer/requirements` | `BUYER` | Retrieves all requirements belonging to the authenticated buyer, ordered newest first |
| `POST` | `/api/buyer/requirements` | `BUYER` | Creates a new procurement requirement. Buyer identity is extracted from JWT |
| `GET` | `/api/buyer/requirements/{id}` | `BUYER` | Retrieves a single requirement by ID. Ownership verified; returns 403 on foreign lots |
| `PUT` | `/api/buyer/requirements/{id}` | `BUYER` | Updates an open requirement (quantity, price, min grade, location, deadline, crop) |
| `PUT` | `/api/buyer/requirements/{id}/cancel` | `BUYER` | Cancels an open requirement. Non-owners receive 403 Forbidden |
| `GET` | `/api/buyer/requirements/metrics` | `BUYER` | Provides aggregated metrics (Total, Open, Fulfilled, Expired, Cancelled) for buyer dashboard |

---

## 6. Validation Rules

Validation is strictly enforced on the server using Jakarta Bean Validation (`@Valid`) and custom service layer validations:

1. **Crop Selection**:
   - `cropId`: `@NotNull`. Must reference an existing row in `crops` table (returns `404 Not Found` if missing).
2. **Required Quantity**:
   - `requiredQuantity`: `@NotNull`, `@Positive(message = "Required quantity must be greater than zero")`. Zero or negative values rejected with `400 Bad Request`.
3. **Maximum Price**:
   - `maxPricePerKg`: `@NotNull`, `@Positive(message = "Maximum price per kg must be greater than zero")`. Zero or negative values rejected with `400 Bad Request`.
4. **Minimum Quality Grade**:
   - `minQualityGrade`: `@NotNull`. Must be valid `QualityGrade` (`A`, `B`, or `C`).
5. **Preferred Location**:
   - `preferredLocation`: `@NotBlank`, `@Size(max = 100)`. Whitespace trimmed.
6. **Required By Date**:
   - `requiredByDate`: `@NotNull`. Cannot be in the past (`requiredByDate.isBefore(LocalDate.now())` triggers `400 Bad Request`).
7. **Identity Protection**:
   - `buyerId` is **NEVER** accepted from request bodies or query parameters. Identity is strictly derived from `CustomUserDetails.getUserId()`.

---

## 7. Security & Ownership Protection

1. **Role-Based Access Control (RBAC)**:
   - Configured in `SecurityConfig.java`:
     ```java
     .requestMatchers("/api/buyer/**").hasRole("BUYER")
     ```
   - Unauthenticated requests receive `HTTP 401 Unauthorized`.
   - Authenticated Farmers or Admins attempting to invoke buyer endpoints receive `HTTP 403 Forbidden`.
2. **Horizontal Privilege Escalation (Cross-Owner Protection)**:
   - When Buyer A creates requirement `#1`, Buyer B attempting `GET /api/buyer/requirements/1`, `PUT /api/buyer/requirements/1`, or `PUT /api/buyer/requirements/1/cancel` receives:
     ```json
     {
       "status": 403,
       "message": "Access denied: you do not have permission to access or modify this buyer requirement",
       "data": null,
       "timestamp": "2026-10-04T19:15:30.123456"
     }
     ```
3. **State Protection**:
   - Updating or cancelling an already `CANCELLED` or `FULFILLED` requirement is blocked with `400 Bad Request`.

---

## 8. Example API Requests and Responses

### 8.1. Create Buyer Requirement
**Request:**
```http
POST /api/buyer/requirements HTTP/1.1
Host: localhost:8080
Authorization: Bearer <BUYER_JWT_TOKEN>
Content-Type: application/json

{
  "cropId": 1,
  "requiredQuantity": 400.00,
  "maxPricePerKg": 27.00,
  "minQualityGrade": "A",
  "preferredLocation": "Nashik",
  "requiredByDate": "2026-10-15"
}
```

**Response (HTTP 201 Created):**
```json
{
  "status": 201,
  "message": "Buyer requirement created successfully",
  "data": {
    "requirementId": 8,
    "buyerId": 5,
    "buyerName": "Vikas Gupta",
    "cropId": 1,
    "cropName": "Tomato (Hybrid)",
    "cropCategory": "Vegetables",
    "requiredQuantity": 400.00,
    "maxPricePerKg": 27.00,
    "minQualityGrade": "A",
    "preferredLocation": "Nashik",
    "requiredByDate": "2026-10-15",
    "status": "OPEN",
    "createdAt": "2026-10-04T19:08:06",
    "updatedAt": "2026-10-04T19:08:06"
  },
  "timestamp": "2026-10-04T19:08:06.312104"
}
```

### 8.2. Update Buyer Requirement
**Request:**
```http
PUT /api/buyer/requirements/8 HTTP/1.1
Host: localhost:8080
Authorization: Bearer <BUYER_JWT_TOKEN>
Content-Type: application/json

{
  "cropId": 1,
  "requiredQuantity": 500.00,
  "maxPricePerKg": 29.50,
  "minQualityGrade": "A",
  "preferredLocation": "Nashik Industrial Area",
  "requiredByDate": "2026-10-20"
}
```

**Response (HTTP 200 OK):**
```json
{
  "status": 200,
  "message": "Buyer requirement updated successfully",
  "data": {
    "requirementId": 8,
    "buyerId": 5,
    "buyerName": "Vikas Gupta",
    "cropId": 1,
    "cropName": "Tomato (Hybrid)",
    "cropCategory": "Vegetables",
    "requiredQuantity": 500.00,
    "maxPricePerKg": 29.50,
    "minQualityGrade": "A",
    "preferredLocation": "Nashik Industrial Area",
    "requiredByDate": "2026-10-20",
    "status": "OPEN",
    "createdAt": "2026-10-04T19:08:06",
    "updatedAt": "2026-10-04T19:12:30"
  },
  "timestamp": "2026-10-04T19:12:30.412"
}
```

### 8.3. Cancel Buyer Requirement
**Request:**
```http
PUT /api/buyer/requirements/8/cancel HTTP/1.1
Host: localhost:8080
Authorization: Bearer <BUYER_JWT_TOKEN>
```

**Response (HTTP 200 OK):**
```json
{
  "status": 200,
  "message": "Buyer requirement cancelled successfully",
  "data": {
    "requirementId": 8,
    "buyerId": 5,
    "buyerName": "Vikas Gupta",
    "cropId": 1,
    "cropName": "Tomato (Hybrid)",
    "cropCategory": "Vegetables",
    "requiredQuantity": 500.00,
    "maxPricePerKg": 29.50,
    "minQualityGrade": "A",
    "preferredLocation": "Nashik Industrial Area",
    "requiredByDate": "2026-10-20",
    "status": "CANCELLED",
    "createdAt": "2026-10-04T19:08:06",
    "updatedAt": "2026-10-04T19:15:00"
  },
  "timestamp": "2026-10-04T19:15:00.781"
}
```

---

## 9. Test Results

### 9.1. Automated Maven Test Suite
Ran command:
```powershell
.\mvnw.cmd clean test
```

Results:
```text
[INFO] Results:
[INFO] 
[INFO] Tests run: 148, Failures: 0, Errors: 0, Skipped: 0
[INFO] 
[INFO] ------------------------------------------------------------------------
[INFO] BUILD SUCCESS
[INFO] ------------------------------------------------------------------------
```

### Breakdown of Test Coverage:
1. `BuyerRequirementServiceTest` (16 unit tests):
   - Valid requirement creation, crop not found error handling, past date validation, ownership isolation, invalid updates, cancellation state checks.
2. `BuyerRequirementIntegrationTest` (18 MockMvc integration tests):
   - CRUD lifecycle, cross-buyer 403 authorization checks, unauthenticated 401 checks, Farmer 403 rejection, Bean validation assertions.
3. Pre-existing Regression Suites (114 tests):
   - `AgriConnectApplicationTests`, `AuthControllerTest`, `AuthServiceTest`, `AuthDatabaseIntegrationTest`, `SecurityIntegrationTest`, `HarvestServiceTest`, `FarmerHarvestIntegrationTest`, `QualityAssessmentServiceTest`, `QualityAssessmentIntegrationTest`.

---

## 10. Phase Boundary Verification

Phase 6 strictly adheres to the scope boundary:
- **NOT IMPLEMENTED**:
  - No matching algorithms or farmer discovery (`/api/buyer/matches` or `/api/matching`).
  - No automated harvest searches or farmer scoring/ranking.
  - No order placement, negotiation, or contract commitments.
  - No delivery schedules or logistics records.
  - No payment or escrow transactions.
  - No price history recording.
- **Phase 7 Ready**:
  - Requirement records stored in `buyer_requirements` are normalized, validated, and indexed to serve as demand inputs for Phase 7 matching.
