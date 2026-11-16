# AgriConnect — Phase 4: Farmer & Harvest Management Walkthrough

This document outlines the step-by-step verification, implementation, and demonstration of Phase 4: Farmer & Harvest Management.

---

## 1. Summary of Accomplishments

- **Crop Master Catalog**: Mapped `crops` table to `Crop` JPA entity and exposed `GET /api/crops` & `GET /api/crops/{id}`.
- **Farmer Profile & Analytics**: Exposed `GET /api/farmer/profile` & `PUT /api/farmer/profile`, returning farm location, acreage, experience, total lot count, and active lot count.
- **Harvest Management & CRUD**:
  - `POST /api/farmer/harvests` (Adds a new harvest lot; identity is strictly extracted from JWT).
  - `GET /api/farmer/harvests` (Retrieves only the authenticated farmer's lots, newest first).
  - `GET /api/farmer/harvests/{id}` (Retrieves a single harvest lot; denies access to non-owners).
  - `PUT /api/farmer/harvests/{id}` (Updates price, available quantity, status, location, date; denies non-owners).
  - `DELETE /api/farmer/harvests/{id}` (Safely deletes unreferenced lots; blocks deletion if linked to orders with HTTP 400).
- **Strict Security & Ownership Rules**:
  - `ROLE_FARMER` authorization enforced on all `/api/farmer/**` endpoints.
  - Horizontal privilege escalation prevention: Farmers accessing another farmer's lots receive **HTTP 403 Forbidden**.
  - Buyers accessing `/api/farmer/**` receive **HTTP 403 Forbidden**.
  - Unauthenticated requests receive **HTTP 401 Unauthorized**.
- **Frontend Farmer Dashboard**:
  - Real-time statistics bar (Farm location, size in acres, experience, total lots, active lots).
  - Crop selection dropdown loaded asynchronously from `GET /api/crops`.
  - Add Harvest Lot form with validation and feedback alerts.
  - My Harvested Lots table with status pills, lot badges, and filter tabs (`ALL`, `AVAILABLE`, `PARTIALLY_SOLD`, `SOLD_OUT`, `CANCELLED`).
  - Edit Harvest Modal and Edit Farmer Profile Modal.
- **Testing & Verification**:
  - 64 automated Maven tests passing (`mvnw.cmd test`).
  - Live API testing with PowerShell commands verifying all endpoints.
  - Browser subagent automation verifying the complete frontend workflow.

---

## 2. Test Execution Results

### 2.1. Automated Maven Test Suite
Ran command:
```bash
.\mvnw.cmd test
```

```
[INFO] Results:
[INFO] 
[INFO] Tests run: 64, Failures: 0, Errors: 0, Skipped: 0
[INFO] 
[INFO] ------------------------------------------------------------------------
[INFO] BUILD SUCCESS
[INFO] ------------------------------------------------------------------------
[INFO] Total time:  29.345 s
```

Test classes executed:
1. `AgriConnectApplicationTests` (1 test): System health API checks.
2. `AuthControllerTest` (7 tests): Auth controller mock MVC checks.
3. `AuthServiceTest` (10 tests): Registration, password hashing, and token generation tests.
4. `AuthDatabaseIntegrationTest` (6 tests): Real MySQL transaction rollback tests.
5. `SecurityIntegrationTest` (10 tests): RBAC and JWT filter chain tests.
6. `HarvestServiceTest` (14 tests): Business validation, ownership boundary, and order check tests.
7. `FarmerHarvestIntegrationTest` (16 tests): Full HTTP integration tests with real MySQL database.

---

## 3. Browser Demonstration

The browser subagent tested the UI end-to-end:
1. Navigated to `http://localhost:3000/index.html`.
2. Signed in as Farmer (`Rajesh Patel`).
3. Verified Farmer Dashboard stats and loaded `My Harvested Lots` table.
4. Added new harvest lot for `Basmati Rice (1121)` (500 kg @ ₹68.00/kg).
5. Opened edit modal on the new lot and updated price to ₹72.50.
6. Deleted the new lot from the table.
7. Clicked Sign Out and verified return to the Sign In screen.

Demo recording artifact:
`farmer_harvest_full_demo_1791058458621.webp`

---

# AgriConnect — Phase 5: Quality Management & Verification Walkthrough

This section outlines the implementation, automated verification, live API verification, and browser demonstration of **Phase 5: Quality Management & Verification**.

---

## 1. Summary of Phase 5 Accomplishments

- **JPA Relational Mapping**:
  - `QualityAssessment` entity mapped directly to existing `quality_assessments` table without altering schema.
  - `@OneToOne` bidirectional mapping with `Harvest` lot (`harvest_id` unique constraint preserved).
  - `@ManyToOne` mapping with admin `User` (`admin_id` foreign key).
  - Enums `QualityGrade` (`A`, `B`, `C`) and `VerificationStatus` (`PENDING`, `VERIFIED`, `REJECTED`).
- **Authoritative Server-Side Scoring & Grading**:
  - Five core parameters (1–10 scale): `freshness`, `appearance`, `size`, `color`, `ripeness`.
  - Damage percentage: `damage_percentage` (0.00% to 100.00%).
  - Score formula: `qualityScore = ((freshness + appearance + size + color + ripeness) / 5.0) * 10`
  - Grade formula: `Score >= 80 -> Grade A`, `Score >= 60 -> Grade B`, `Score < 60 -> Grade C`.
  - Backend is 100% authoritative; incoming score or grade from clients is ignored/forbidden.
- **Admin Quality Management APIs**:
  - `GET /api/admin/quality/pending`: Retrieves lots awaiting inspection with live assessment status.
  - `GET /api/admin/quality/harvests/{id}`: Detailed lot metadata and existing assessment.
  - `GET /api/admin/quality/metrics`: High-level quality metrics (pending, verified, rejected counts).
  - `POST /api/admin/quality`: Assesses lot and sets status to `PENDING` (or 409 Conflict if already assessed).
  - `GET /api/admin/quality/{id}`: Retrieves quality assessment by ID.
  - `PUT /api/admin/quality/{id}`: Updates parameters, recalculates score/grade, resets status to `PENDING`.
  - `PUT /api/admin/quality/{id}/verify`: Sets status to `VERIFIED`.
  - `PUT /api/admin/quality/{id}/reject`: Sets status to `REJECTED`.
- **Farmer Read-Only Quality API**:
  - `GET /api/farmer/harvests/{harvestId}/quality`: Returns quality certificate data.
  - Ownership validation: Farmers accessing lots owned by other farmers receive **HTTP 403 Forbidden**.
  - Graceful handling: If lot is unassessed, returns friendly pending message instead of 404.
- **Frontend Extensions**:
  - Admin Quality Management Section: 3 KPI overview cards (Pending, Verified, Rejected), filter tabs, and queue table with action buttons.
  - Inspection Modal: Pre-populated lot details, sliders/inputs with live preview calculation.
  - Farmer Quality Modal: Read-only visual certificate with Grade badge and 5-factor breakdown.
- **RBAC Enforcement**:
  - Admin endpoints accessible exclusively by `ROLE_ADMIN`.
  - Farmer endpoints accessible exclusively by `ROLE_FARMER`.
  - Buyers receive **HTTP 403 Forbidden** on write/admin quality endpoints.

---

## 2. Test Execution Results

Ran complete regression and new feature test suite:
```bash
cd backend
.\mvnw.cmd test
```

### Maven Test Report
```
[INFO] Results:
[INFO] 
[INFO] Tests run: 114, Failures: 0, Errors: 0, Skipped: 0
[INFO] 
[INFO] ------------------------------------------------------------------------
[INFO] BUILD SUCCESS
[INFO] ------------------------------------------------------------------------
```

### Test Classes Executed (114 Total Tests)
1. `QualityAssessmentCalculationTest` (10 tests):
   - Formulas for Grade A, B, C, and boundary thresholds (80.0, 79.9, 60.0, 59.9).
   - Parameter validations (`1 <= parameter <= 10`, `0 <= damage <= 100`).
2. `QualityAssessmentServiceTest` (12 tests):
   - Service unit tests with Mockito.
   - Verification status transitions (`PENDING` -> `VERIFIED`, `PENDING` -> `REJECTED`).
   - Duplicate assessment prevention (409 Conflict).
   - Farmer ownership validation (403 Forbidden on foreign lot).
3. `QualityAssessmentIntegrationTest` (28 tests):
   - Real Spring Boot MockMvc integration with MySQL database.
   - Admin full lifecycle: create (201) -> get (200) -> update (200) -> verify (200) -> reject (200).
   - Farmer read-only view on owned harvest (200).
   - Farmer accessing another farmer's harvest (403).
   - Farmer or Buyer attempting to create or update assessment (403).
   - Unauthenticated requests (401).
   - Duplicate lot assessment rejection (409).
4. `AgriConnectApplicationTests` (1 test): System health check.
5. `AuthControllerTest` (7 tests): Auth controller MVC tests.
6. `AuthServiceTest` (10 tests): User auth and token tests.
7. `AuthDatabaseIntegrationTest` (6 tests): Transaction rollback tests.
8. `SecurityIntegrationTest` (10 tests): Security filter chain and RBAC tests.
9. `HarvestServiceTest` (14 tests): Harvest business validations.
10. `FarmerHarvestIntegrationTest` (16 tests): Harvest HTTP integration tests.

---

## 3. Live API Verification

PowerShell live API test script executed against running Spring Boot server on `http://localhost:8080`:
- **Step 1**: Admin authentication -> JWT received.
- **Step 2**: `GET /api/admin/quality/pending` -> Harvest queue retrieved.
- **Step 3**: `POST /api/admin/quality` on harvest #11 -> Created with Score 86.00, Grade A, Status `PENDING` (201 Created).
- **Step 4**: `GET /api/admin/quality/{id}` -> Verified assessment payload (200 OK).
- **Step 5**: `PUT /api/admin/quality/{id}` -> Updated parameters -> Recalculated Score 72.00, Grade B, Status reset to `PENDING` (200 OK).
- **Step 6**: `PUT /api/admin/quality/{id}/verify` -> Verified assessment status updated to `VERIFIED` (200 OK).
- **Step 7**: Farmer authentication -> JWT received.
- **Step 8**: `GET /api/farmer/harvests/{harvestId}/quality` -> Farmer successfully viewed quality certificate (200 OK).
- **Step 9**: Farmer attempting `POST /api/admin/quality` -> Denied with **HTTP 403 Forbidden**.
- **Step 10**: Buyer authentication -> Attempting `POST /api/admin/quality` -> Denied with **HTTP 403 Forbidden**.
- **Step 11**: Unauthenticated request to `/api/admin/quality/pending` -> Denied with **HTTP 401 Unauthorized**.

---

## 4. Browser Demonstration

The browser subagent executed a full 3-role automated verification on `http://localhost:3000`:

1. **Admin Quality Workflow**:
   - Logged in as Admin (`admin@agriconnect.com`).
   - Admin Quality Management section appeared automatically with KPI overview counts.
   - Selected Harvest Lot `#H-12` (`Sweet Corn`).
   - Entered quality parameters with live frontend preview (82.00 / Grade A).
   - Saved assessment; status changed to `PENDING`.
   - Verified the assessment; status pill transitioned to `VERIFIED` and metrics updated.

2. **Farmer Workflow**:
   - Logged out and logged in as Farmer Rajesh Patel (`rajesh@farmer.com`).
   - Admin Quality Management section was completely hidden.
   - Opened `My Harvested Lots` table and located `#H-12`.
   - Clicked `⭐ Quality` button; opened read-only Quality Assessment Certificate displaying Score 82.00, Grade A, and Inspector Ramesh Sharma.
   - All fields were strictly non-editable.

3. **Buyer Security Boundary**:
   - Logged in as Buyer Priya Sharma (`priya@buyer.com`).
   - Both Farmer Dashboard and Admin Quality Management sections remained hidden.
   - Tested direct API request to admin quality endpoint in browser test bench -> Received **HTTP 403 Forbidden**.

Browser recording artifact:
`phase5_browser_verify_1791116417575.webp`

---

# AgriConnect — Phase 6: Buyer Requirements Management Walkthrough

This section documents the end-to-end implementation, automated test suite results, live API verification, and browser demonstration for **Phase 6: Buyer Requirements Management**.

---

## 1. Summary of Phase 6 Accomplishments

- **Database Reuse & Non-Destructive Migration**:
  - Reused existing `buyer_requirements` table from Phase 2.
  - Added non-destructive migration script `05_phase6_buyer_requirements.sql` to add `required_by_date` for deadline tracking and backfilled sample records.
- **Relational JPA Entity Mapping**:
  - `BuyerRequirement` mapped with `@ManyToOne` to buyer `User` (`buyer_id`) and `@ManyToOne` to `Crop` (`crop_id`).
  - Enumerated `RequirementStatus` (`OPEN`, `FULFILLED`, `EXPIRED`, `CANCELLED`) adhering strictly to the database enum.
  - Enumerated `QualityGrade` (`A`, `B`, `C`).
- **Commercial Buyer Requirements REST APIs**:
  - `POST /api/buyer/requirements`: Creates new requirement; validates crop existence, quantity > 0, price > 0, grade, location, and non-past deadline. Buyer identity derived strictly from JWT.
  - `GET /api/buyer/requirements`: Lists all requirements for the authenticated buyer, ordered newest first.
  - `GET /api/buyer/requirements/{id}`: Returns single requirement with strict ownership validation (HTTP 403 on cross-buyer access).
  - `PUT /api/buyer/requirements/{id}`: Updates requirement fields on open requirements; prevents editing cancelled or fulfilled requirements.
  - `PUT /api/buyer/requirements/{id}/cancel`: Sets status to `CANCELLED`; verifies ownership.
  - `GET /api/buyer/requirements/metrics`: Returns real-time KPI overview counts (Total, Open, Fulfilled, Expired, Cancelled) for buyer dashboard.
- **Security & Authorization (RBAC & Cross-Owner Isolation)**:
  - Role-based security in `SecurityConfig`: `/api/buyer/**` restricted to `ROLE_BUYER`.
  - Identity never accepted from client payload.
  - Cross-buyer access strictly blocked: Buyer B attempting `GET`, `PUT`, or `cancel` on Buyer A's requirement receives **HTTP 403 Forbidden**.
  - Non-buyers (Farmers and Admins) attempting to create or edit buyer requirements receive **HTTP 403 Forbidden**.
  - Unauthenticated requests receive **HTTP 401 Unauthorized**.
- **Frontend Commercial Buyer Dashboard**:
  - Dynamic KPI Summary Cards: Active Requirements, Fulfilled Requirements, Expired Requirements, Cancelled Requirements.
  - Post Requirement Form: Standardized crop selection dropdown, quantity input, maximum price ceiling, minimum quality grade dropdown, location, and date picker.
  - My Requirements Table: Displays requirement ID, crop name with category badge, quantity, ceiling price, minimum quality badge, location, required-by date, status pill, and action buttons (`Details`, `Edit`, `Cancel`).
  - Interactive Filter Tabs: `ALL`, `OPEN`, `FULFILLED`, `EXPIRED`, `CANCELLED`.
  - View Requirement Details modal displaying all requirement metadata.
  - Edit Requirement modal for modifying open requirements.
  - Instant status update upon cancellation.
- **Strict Phase Boundary**:
  - Zero matching algorithms or automated farmer searches implemented.
  - Zero order, delivery, payment, or price history workflows implemented.

---

## 2. Automated Test Results

Ran command:
```powershell
.\mvnw.cmd clean test
```

```text
[INFO] Results:
[INFO] 
[INFO] Tests run: 148, Failures: 0, Errors: 0, Skipped: 0
[INFO] 
[INFO] ------------------------------------------------------------------------
[INFO] BUILD SUCCESS
[INFO] ------------------------------------------------------------------------
```

### Test Suites Breakdown:
1. `BuyerRequirementServiceTest` (16 unit tests):
   - Valid requirement creation, crop existence check, positive quantity validation, positive price validation, past deadline rejection, buyer ownership isolation, update validation, cancel state transitions, metrics calculation.
2. `BuyerRequirementIntegrationTest` (18 MockMvc integration tests):
   - Real Spring Boot MockMvc integration with live MySQL database.
   - Buyer creates requirement (201 Created).
   - Buyer lists requirements (200 OK).
   - Buyer gets single requirement by ID (200 OK).
   - Buyer updates requirement (200 OK).
   - Buyer cancels requirement (200 OK).
   - Cross-buyer protection: Buyer B accessing Buyer A's requirement receives HTTP 403 Forbidden.
   - Cross-buyer protection: Buyer B modifying Buyer A's requirement receives HTTP 403 Forbidden.
   - Cross-buyer protection: Buyer B cancelling Buyer A's requirement receives HTTP 403 Forbidden.
   - Role protection: Farmer attempting buyer operations receives HTTP 403 Forbidden.
   - Unauthenticated requests receive HTTP 401 Unauthorized.
   - Validation failures: invalid crop (404), zero/negative quantity (400), zero/negative price (400), invalid quality grade (400), past date (400).
3. Regression Test Suites (114 tests):
   - `AgriConnectApplicationTests`, `AuthControllerTest`, `AuthServiceTest`, `AuthDatabaseIntegrationTest`, `SecurityIntegrationTest`, `HarvestServiceTest`, `FarmerHarvestIntegrationTest`, `QualityAssessmentServiceTest`, `QualityAssessmentIntegrationTest`.

---

## 3. Live API Verification

PowerShell live API test script executed against running Spring Boot server on `http://localhost:8080`:

| Step | Action / Endpoint | Result | Status |
|:---|:---|:---|:---|
| 1 | Health Check (`GET /api/health`) | `status: "UP"`, Database Connected | PASS (200) |
| 2 | Buyer A Authentication (`POST /api/auth/login`) | Received JWT token for Vikas Gupta | PASS (200) |
| 3 | Retrieve Master Crops (`GET /api/crops`) | Master crop catalog returned | PASS (200) |
| 4 | Create Buyer Requirement (`POST /api/buyer/requirements`) | Created requirement #REQ-8 for Tomato (400 kg @ ₹27/kg) | PASS (201) |
| 5 | Retrieve Buyer Requirements (`GET /api/buyer/requirements`) | List returned containing created requirement | PASS (200) |
| 6 | Get Requirement By ID (`GET /api/buyer/requirements/8`) | Requirement details returned | PASS (200) |
| 7 | Update Requirement (`PUT /api/buyer/requirements/8`) | Updated quantity to 500 kg and price to ₹29.50/kg | PASS (200) |
| 8 | Cancel Requirement (`PUT /api/buyer/requirements/8/cancel`) | Status transitioned to `CANCELLED` | PASS (200) |
| 9 | Get Requirement Metrics (`GET /api/buyer/requirements/metrics`) | Metric counts reflect 1 cancelled requirement | PASS (200) |
| 10 | Buyer B Authentication (`POST /api/auth/login`) | Received JWT token for Priya Nair | PASS (200) |
| 11 | Buyer B Cross-Owner GET (`GET /api/buyer/requirements/8`) | Blocked with **HTTP 403 Forbidden** | PASS (403) |
| 12 | Buyer B Cross-Owner PUT (`PUT /api/buyer/requirements/8`) | Blocked with **HTTP 403 Forbidden** | PASS (403) |
| 13 | Buyer B Cross-Owner Cancel (`PUT /api/buyer/requirements/8/cancel`) | Blocked with **HTTP 403 Forbidden** | PASS (403) |
| 14 | Farmer Authentication (`POST /api/auth/login`) | Received JWT token for Rajesh Patel | PASS (200) |
| 15 | Farmer Write Attempt (`POST /api/buyer/requirements`) | Blocked with **HTTP 403 Forbidden** | PASS (403) |
| 16 | Unauthenticated GET (`GET /api/buyer/requirements`) | Blocked with **HTTP 401 Unauthorized** | PASS (401) |

---

## 4. Browser Demonstration

The browser subagent executed a full automated UI demonstration on `http://localhost:3000`:

1. **Buyer Workflow (Vikas Gupta)**:
   - Logged in as commercial buyer Vikas Gupta (`vikas.gupta@freshmarts.com`).
   - Commercial Buyer Requirements Dashboard loaded with KPI summary cards.
   - Populated and submitted Post Requirement form:
     - Crop: Alphonso Mango (ID: 3)
     - Required Quantity: 850 kg
     - Maximum Price: ₹72.50/kg
     - Minimum Quality Grade: Grade A
     - Preferred Location: Nashik
     - Required By Date: 2026-10-30
   - Submitted successfully; requirement `#REQ-9` immediately rendered in the My Requirements table.
   - Clicked **Details** on `#REQ-9`: View modal opened displaying all parameters; verified and closed modal.
   - Clicked **Edit** on `#REQ-9`: Edit modal opened; updated quantity to 950 kg and ceiling price to ₹78.00/kg; saved; table immediately reflected updated values.
   - Clicked **Cancel** on `#REQ-9`: Confirmed cancellation; status pill dynamically transitioned from `OPEN` (green) to `CANCELLED` (red); action buttons disabled.
2. **Farmer RBAC Isolation (Rajesh Patel)**:
   - Logged in as Farmer Rajesh Patel.
   - Verified that the Buyer Dashboard and all buyer requirement controls are completely hidden.
   - Farmer Dashboard and lot management remain fully functional.
3. **Admin RBAC Isolation (Ramesh Sharma)**:
   - Logged in as Admin Ramesh Sharma.
   - Verified that the Buyer Dashboard is completely hidden.
   - Admin Quality Management remains fully functional.

Demo recording artifact:
`phase6_edit_cancel_demo_1791141057123.webp`

---

# AgriConnect — Phase 7: Quality-Aware Matching Walkthrough

This section documents the architecture, implementation, test verification, live API execution, and browser demonstration of **Phase 7: Quality-Aware Matching Engine**.

---

## 1. Summary of Accomplishments

- **Relational Matching Engine (`MatchingService`)**:
  - Implemented high-performance database-level matching query joining `QualityAssessment` -> `Harvest` -> `Crop` -> `Farmer`.
  - Enforced 9 hard matching filters:
    1. Requirement is `OPEN`.
    2. Requirement target date is not expired (`required_by_date >= today`).
    3. Master crop match (`harvest.crop_id = requirement.crop_id`).
    4. Full inventory coverage (`harvest.available_quantity >= requirement.required_quantity` with `available_quantity > 0`).
    5. Price ceiling (`harvest.price_per_kg <= requirement.max_price_per_kg`).
    6. Harvest lot status is `AVAILABLE`.
    7. 1:1 official quality assessment exists.
    8. Quality verification status is `VERIFIED` (`PENDING` and `REJECTED` strictly excluded).
    9. Quality grade satisfies or exceeds required minimum grade.
- **Explicit Quality Grade Hierarchy**:
  - Grade A: Rank 3 (Accepts Grade A only)
  - Grade B: Rank 2 (Accepts Grade A and Grade B)
  - Grade C: Rank 1 (Accepts Grade A, Grade B, and Grade C)
- **100-Point Deterministic Match Scoring Engine**:
  - **Price Score (30 pts max)**: $10.0$ baseline at maxPrice + up to $20.0$ pts discount savings.
  - **Quality Score (30 pts max)**: Scaled from verified quality score ($\frac{\text{score}}{100.0} \times 30.0$).
  - **Location Score (20 pts max)**: $20.0$ pts for exact/token location match, $15.0$ pts for unconstrained, $10.0$ pts otherwise.
  - **Quantity Score (20 pts max)**: $10.0$ pts at $1.0\times$ coverage, scaling to $20.0$ pts at $\ge 2.0\times$ coverage.
  - **Total Match Score**: Clamped between $0.00$ and $100.00$, rounded to 2 decimal places.
- **Deterministic Ranking Rules**:
  1. `matchScore` DESC
  2. `qualityScore` DESC
  3. `pricePerKg` ASC
  4. `availableQuantity` DESC
- **Commercial Buyer REST API**:
  - `GET /api/buyer/requirements/{id}/matches` (Retrieves ranked harvest lots, composite scores, and verified quality metrics).
- **Strict Security & RBAC Isolation**:
  - Buyer identity strictly derived from JWT context (`@AuthenticationPrincipal CustomUserDetails`).
  - Cross-buyer access forbidden (**HTTP 403 Forbidden**).
  - Role-based authorization (`hasRole('BUYER')`); Farmers and Admins receive **HTTP 403 Forbidden**.
  - Unauthenticated requests receive **HTTP 401 Unauthorized**.
  - Cancelled/Expired requirements rejected (**HTTP 400 Bad Request**).
- **Frontend Buyer Matching UI**:
  - `[🎯 View Matches]` button on open requirements in Buyer Requirements table.
  - Interactive Matching Results Modal displaying requirement target specs, total matches found, and ranked harvest cards.
  - Prominent Match Score badge (`88.75 / 100`) and 4-component score breakdown metrics.
  - `[🔬 View Quality Inspection]` modal showing the 5 sensory parameters (Freshness, Appearance, Size, Color, Ripeness) + damage % + inspector remarks.
  - Empty state displaying helpful suggestions when no lots satisfy hard criteria.
- **Strict Phase Boundary**:
  - Read-only matching.
  - Does NOT reserve stock, mutate inventory, or create orders (Orders belong strictly to Phase 8).

---

## 2. Test Suite Execution Results

Ran complete automated test suite:
```bash
.\mvnw.cmd test
```

Output:
```text
[INFO] Results:
[INFO] 
[INFO] Tests run: 172, Failures: 0, Errors: 0, Skipped: 0
[INFO] 
[INFO] ------------------------------------------------------------------------
[INFO] BUILD SUCCESS
[INFO] ------------------------------------------------------------------------
```

### Phase 7 Test Breakdown (24 New Tests):
1. **`MatchingServiceTest` (16 Unit Tests)**:
   - `testValidMatch_Success`: Valid match returns positive score.
   - `testWrongCrop_HardFilterRejects`: Wrong crop lot rejected.
   - `testInsufficientQuantity_HardFilterRejects`: Insufficient inventory rejected.
   - `testPriceTooHigh_HardFilterRejects`: Price exceeding max price rejected.
   - `testPendingQuality_HardFilterRejects`: PENDING quality assessment rejected.
   - `testRejectedQuality_HardFilterRejects`: REJECTED quality assessment rejected.
   - `testRequirementA_RejectsGradeB`: Grade A requirement rejects Grade B harvest.
   - `testRequirementB_AcceptsAAndB_RejectsC`: Grade B requirement accepts A & B, rejects C.
   - `testRequirementC_AcceptsAllGrades`: Grade C requirement accepts A, B, and C.
   - `testExpiredRequirement_ThrowsBadRequest`: Overdue date auto-expires and throws 400.
   - `testCancelledRequirement_ThrowsBadRequest`: Cancelled requirement throws 400.
   - `testOwnershipProtection_ThrowsAccessDenied`: Non-owner buyer blocked with 403.
   - `testNonBuyerRole_ThrowsAccessDenied`: Farmer blocked with 403.
   - `testScoreCalculation_Boundaries`: Boundary conditions for price, quality, location, quantity, and total score verified.
   - `testRankingOrder_Deterministic`: Multiple candidates deterministically sorted.
   - `testNoMatches_ReturnsEmptyListWithTotalZero`: Zero eligible matches returns empty list with 200 OK.
2. **`MatchingIntegrationTest` (8 Spring Boot MockMvc Integration Tests)**:
   - `testBuyerGetsMatchesForRequirement_Success`: Buyer retrieves matches for own requirement (200 OK).
   - `testCrossBuyerAccess_Forbidden`: Cross-buyer access forbidden (403 Forbidden).
   - `testFarmerRoleAccess_Forbidden`: Farmer blocked from matching API (403 Forbidden).
   - `testUnauthenticated_Unauthorized`: Unauthenticated request rejected (401 Unauthorized).
   - `testCancelledRequirement_BadRequest`: Cancelled requirement rejected (400 Bad Request).
   - `testNonExistentRequirement_NotFound`: Unknown requirement ID returns 404 Not Found.
   - `testRequirementNoMatches_Returns200WithEmptyMatches`: No suitable lots returns 200 with `totalMatches: 0`.
   - `testExpiredRequirement_BadRequest`: Overdue date returns 400 Bad Request.

---

## 3. Live API Verification Matrix

| Step | Action / Endpoint | Result | Status |
|:---|:---|:---|:---|
| 1 | Health Check (`GET /api/health`) | `status: "UP"`, `database: "Connected (agriconnect_db)"` | PASS (200) |
| 2 | Unauthenticated Matching Request (`GET /api/buyer/requirements/1/matches`) | Blocked with missing authentication | PASS (401) |
| 3 | Farmer Login & Matching Attempt | Authenticated as Rajesh Patel, blocked from buyer matching endpoint | PASS (403) |
| 4 | Buyer Vikas Gupta Login & Matching Request (`GET /api/buyer/requirements/1/matches`) | Received 1 verified match (Rajesh Patel, 550kg, ₹26/kg, Grade A, Match Score 72.24/100) | PASS (200) |
| 5 | Cross-Owner Attempt (Buyer Priya Nair requests matches for Requirement 1) | Blocked by ownership boundary | PASS (403) |
| 6 | Ineligible Requirement Attempt (Cancelled Requirement 8) | Rejected with message: "Requirement #8 has status CANCELLED and cannot be matched." | PASS (400) |

---

## 4. Browser Demonstration

Automated browser demonstration executed using `browser_subagent`:
1. Navigated to `file:///C:/Users/mtaus/OneDrive/Desktop/Agriconnect/frontend/index.html`.
2. Signed in as commercial buyer Vikas Gupta (`vikas.gupta@freshmarts.com`).
3. Buyer Requirements Dashboard loaded showing active purchase requirements.
4. Located requirement `#REQ-1` (Tomato - Hybrid Red, 400 kg, ₹27.00/kg, Grade A).
5. Clicked **`🎯 View Matches`**:
   - Modal opened displaying target requirement specs and `1 Eligible Harvest` badge.
   - Matched card for Rajesh Patel displayed with Match Score **72.24 / 100**.
   - Score breakdown displayed: Price Match 10.7 / 30, Quality Score 27.8 / 30, Location Match 20.0 / 20, Quantity Coverage 13.8 / 20.
6. Clicked **`🔬 View Quality Inspection`**:
   - Quality inspection modal opened displaying 5 sensory parameters (Freshness 9/10, Appearance 9/10, Size 8/10, Color 9/10, Ripeness 8/10, Damage 3.50%, Score 92.50, Grade A, VERIFIED).
7. Closed inspection modal and matching modal smoothly.

Demo recording artifact:
`file:///C:/Users/mtaus/.gemini/antigravity-ide/brain/f6dd57ba-b4a1-4dac-9083-a981cb37e019/buyer_matching_flow_1791217258623.webp`

---

# AgriConnect — Phase 8: Order Management Walkthrough

This section outlines the implementation, database migration, automated testing, concurrency protection, and frontend verification for **Phase 8: Order Management**.

---

## 1. Summary of Phase 8 Accomplishments

- **Relational Schema Migration (`database/schema/06_phase8_order_management.sql`)**:
  - Enhanced existing `orders` table to accommodate commercial negotiations and buyer-requirement linkage.
  - Extended `order_status` ENUM to include `PENDING`, `ACCEPTED`, `REJECTED`, `CANCELLED`, `CONFIRMED`, `SHIPPED`, `DELIVERED`.
  - Added nullable `requirement_id INT NULL` with foreign key `fk_orders_requirement` referencing `buyer_requirements(requirement_id) ON DELETE SET NULL`.
  - Added `remarks VARCHAR(255) NULL` and `cancellation_reason VARCHAR(255) NULL`.
  - Added index `idx_orders_status` on `order_status` for fast status-filtered queries.
- **Atomic Stock Management & Concurrency Protection**:
  - Implemented `@Lock(LockModeType.PESSIMISTIC_WRITE)` in `HarvestRepository.findByIdForUpdate(Integer id)` issuing `SELECT ... FOR UPDATE` row locks.
  - Stock is atomically checked and deducted immediately upon order placement: `available_quantity = available_quantity - ordered_quantity`.
  - Harvest status automatically transitions: `SOLD_OUT` if remaining stock reaches `0.00`, or `PARTIALLY_SOLD` if stock remains.
  - Multi-threaded concurrency stress test (`OrderIntegrationTest.testConcurrentOrdersCannotOversellStock`) verified 10 concurrent order threads competing for 50 kg available stock; exactly one succeeded while 9 received HTTP 400 without overselling or negative inventory.
- **Stock Restoration & Double-Restoration Prevention**:
  - If a Farmer rejects an order or a Buyer cancels a pending order: reserved quantity is added back to harvest `available_quantity` exactly once.
  - Transition validity is validated under pessimistic locks; terminal states (`ACCEPTED`, `REJECTED`, `CANCELLED`) cannot be re-executed, making double restoration impossible.
- **Role-Bounded REST APIs**:
  - **Buyer Endpoints**:
    - `POST /api/buyer/orders`: Authenticated buyer places an order; derives buyer from JWT; validates verified quality assessment, stock availability, positive quantity, price ceiling, and non-self-purchase.
    - `GET /api/buyer/orders`: Retrieves purchase orders placed by authenticated buyer.
    - `GET /api/buyer/orders/{id}`: Single order details; cross-buyer access forbidden (403).
    - `PATCH /api/buyer/orders/{id}/cancel`: Buyer cancels pending order; restores stock.
  - **Farmer Endpoints**:
    - `GET /api/farmer/orders`: Retrieves incoming purchase orders for authenticated farmer's harvests.
    - `GET /api/farmer/orders/{id}`: Single order details; cross-farmer access forbidden (403).
    - `PATCH /api/farmer/orders/{id}/accept`: Farmer confirms pending order (`PENDING -> ACCEPTED`).
    - `PATCH /api/farmer/orders/{id}/reject`: Farmer rejects pending order (`PENDING -> REJECTED`), restoring stock.
  - **Admin Endpoints**:
    - `GET /api/admin/orders`: Marketplace order monitoring with optional status filter.
    - `GET /api/admin/orders/{id}`: Order details inspection.
- **Frontend Integration**:
  - **Buyer Interface**:
    - `[🛒 Place Order]` button on matched harvest cards opening `#place-order-modal`.
    - Live calculation preview displaying requested quantity, rate, and total contract amount.
    - "My Purchase Orders" card with status filter tabs (`ALL`, `PENDING`, `ACCEPTED`, `REJECTED`, `CANCELLED`).
    - Cancellation modal with optional cancellation reason.
  - **Farmer Interface**:
    - "Incoming Buyer Orders" card with status filter tabs and real-time counts.
    - Inline `[✅ Accept]` action and `[❌ Reject]` modal with rejection reason.
  - **Admin Interface**:
    - "Marketplace Order Monitoring" card with comprehensive transaction history and status filter tabs.
    - Shared Order Details inspection modal.

---

## 2. Test Execution Results

Ran complete automated test suite:
```bash
.\backend\mvnw.cmd -f backend/pom.xml test
```

Output:
```text
[INFO] Results:
[INFO]
[INFO] Tests run: 200, Failures: 0, Errors: 0, Skipped: 0
[INFO]
[INFO] ------------------------------------------------------------------------
[INFO] BUILD SUCCESS
[INFO] ------------------------------------------------------------------------
[INFO] Total time:  01:32 min
```

### Phase 8 Test Breakdown (28 New Tests):
1. **`OrderServiceTest` (13 Unit Tests)**:
   - `testCreateOrder_Success`: Order creation with stock deduction and lot status transition.
   - `testCreateOrder_ExceedsAvailableStock_ThrowsBadRequest`: Overselling attempt blocked.
   - `testCreateOrder_ZeroOrNegativeQuantity_ThrowsBadRequest`: Invalid quantity blocked.
   - `testCreateOrder_UnverifiedQuality_ThrowsBadRequest`: Harvest without VERIFIED quality blocked.
   - `testCreateOrder_FarmerCannotBuyOwnHarvest_ThrowsBadRequest`: Self-purchase blocked.
   - `testCreateOrder_PriceExceedsRequirementCeiling_ThrowsBadRequest`: Price higher than requirement max price rejected.
   - `testFarmerAcceptOrder_Success`: Transition PENDING -> ACCEPTED.
   - `testFarmerRejectOrder_RestoresStockExactlyOnce`: Transition PENDING -> REJECTED restores stock.
   - `testFarmerRejectOrder_DoubleRestorationPrevented`: Non-pending rejection rejected.
   - `testBuyerCancelOrder_RestoresStockExactlyOnce`: Transition PENDING -> CANCELLED restores stock.
   - `testBuyerCancelOrder_DoubleCancellationPrevented`: Non-pending cancellation rejected.
   - `testCrossUserAccess_Forbidden`: Non-owner farmer or buyer cannot view or modify other's orders (403).
   - `testAdminOrderMonitoring_Success`: Admin can view all orders and filter by status.
2. **`OrderIntegrationTest` (14 Spring Boot MockMvc Integration Tests)**:
   - `testBuyerPlacesOrder_Success`: 201 Created with correct stock deduction.
   - `testBuyerOrderExceedsStock_BadRequest`: 400 Bad Request on stock deficit.
   - `testBuyerOrderZeroQuantity_BadRequest`: 400 Bad Request on zero quantity.
   - `testBuyerOrderUnverifiedHarvest_BadRequest`: 400 Bad Request on unverified harvest.
   - `testCrossBuyerAccess_Forbidden`: 403 Forbidden on another buyer's order.
   - `testFarmerViewsOwnOrders_Success`: 200 OK returning farmer's incoming orders.
   - `testCrossFarmerAccess_Forbidden`: 403 Forbidden on another farmer's order.
   - `testFarmerAcceptOrder_Success`: 200 OK confirming order.
   - `testFarmerRejectOrder_RestoresStock`: 200 OK with stock restoration.
   - `testBuyerCancelOrder_RestoresStock`: 200 OK with stock restoration.
   - `testDoubleCancellation_BadRequest`: 400 Bad Request on re-cancelling.
   - `testInvalidStatusTransition_BadRequest`: 400 Bad Request on invalid state transition.
   - `testSecurity_UnauthenticatedAndWrongRoles`: 401 Unauthorized & 403 Forbidden verification.
   - `testConcurrentOrdersCannotOversellStock`: Multi-threaded concurrency stress test verifying inventory isolation under contention.
3. **`OrderDatabaseMigrationTest` (1 Test)**:
   - Verifies DDL execution and MySQL schema integrity.

---

## 3. How to Test Phase 8 in Browser

1. Open `frontend/index.html` in browser.
2. **Buyer Workflow**:
   - Sign in as Buyer: `vikas.gupta@freshmarts.com` / `Password@123`.
   - In Buyer Requirements Dashboard, find requirement `#REQ-1` and click `[🎯 View Matches]`.
   - On the matched harvest card, click `[🛒 Place Order]`.
   - Review live price preview, adjust quantity (e.g. 50 kg), add remarks, and click `Confirm & Place Order`.
   - Observe success notification, and verify order appears in "My Purchase Orders" with `PENDING` status.
3. **Farmer Workflow**:
   - Sign in as Farmer: `rajesh.patel@kisan.in` / `Password@123`.
   - In Farmer Dashboard, scroll to "Incoming Buyer Orders".
   - View newly received order, review buyer details and crop information.
   - Click `[✅ Accept]` to confirm transaction, or `[❌ Reject]` to decline with reason and restore inventory.
4. **Admin Workflow**:
   - Sign in as Admin: `admin@agriconnect.com` / `Admin@123`.
   - Scroll to "Marketplace Order Monitoring" card.
   - Filter by status tabs (`PENDING`, `ACCEPTED`, `REJECTED`, `CANCELLED`).
   - Click `[👁️ Details]` to view comprehensive contract terms, timestamps, and cancellation notes.

---

# AgriConnect — Phase 9: Delivery Management Walkthrough

This section outlines the implementation, testing, API specifications, and frontend integration of **Phase 9: Delivery Management**.

---

## 1. Summary of Accomplishments

- **Relational Schema Migration (`07_phase9_delivery_management.sql`)**:
  - Expanded `deliveries.delivery_status` ENUM to include `PENDING`, `DISPATCHED`, `IN_TRANSIT`, `SHIPPED`, `DELIVERED`, `CANCELLED`, `FAILED`.
  - Added `remarks VARCHAR(255)`, `estimated_delivery_date DATETIME`, and `updated_at TIMESTAMP` with automatic `CURRENT_TIMESTAMP ON UPDATE`.
  - Added composite index `idx_deliveries_order_status` on `(order_id, delivery_status)`.
  - Preserved existing 1:1 `order_id INT NOT NULL UNIQUE` constraint.
- **Bi-Directional Order & Delivery Synchronization**:
  - Maintained atomic `@Transactional` consistency between `Order` and `Delivery`.
  - Initial delivery scheduling transitions accepted orders to `CONFIRMED`.
  - Shipment dispatch (`/ship`) transitions both delivery and order to `SHIPPED`.
  - Delivery completion (`/deliver` by farmer or `/confirm-received` by buyer) transitions both delivery and order to `DELIVERED`.
  - Enforced strict transition validation preventing invalid state reversions (`DELIVERED -> SHIPPED`, etc.).
  - Duplicate delivery prevention: only 1 delivery per order is allowed.
- **Strict Role-Based Security & IDOR Prevention**:
  - Verified user identity via JWT token extraction.
  - Farmers can only view and manage shipments for their own produce lots.
  - Buyers can only view and manage inbound deliveries for their own orders.
  - Cross-user access blocked with HTTP 403 Forbidden; unauthenticated access blocked with HTTP 401 Unauthorized.
- **REST Endpoints**:
  - **Buyer**:
    - `POST /api/buyer/deliveries`
    - `GET /api/buyer/deliveries`
    - `GET /api/buyer/deliveries/{id}`
    - `PATCH /api/buyer/deliveries/{id}/confirm-received`
  - **Farmer**:
    - `POST /api/farmer/deliveries`
    - `GET /api/farmer/deliveries`
    - `GET /api/farmer/deliveries/{id}`
    - `PATCH /api/farmer/deliveries/{id}/ship`
    - `PATCH /api/farmer/deliveries/{id}/deliver`
  - **Admin**:
    - `GET /api/admin/deliveries`
    - `GET /api/admin/deliveries/{id}`
    - `PATCH /api/admin/deliveries/{id}/status`
- **Frontend Dashboard Enhancements**:
  - Farmer Dashboard: "Outgoing Deliveries & Logistics" card with status filtering, Ship dispatch modal, and delivery details modal.
  - Buyer Dashboard: "Inbound Deliveries & Tracking" card with status filtering, Confirm Receipt button, and tracking modal.
  - Admin Dashboard: "Global Delivery & Logistics Monitoring" card with global oversight.

---

## 2. Test Execution Results

Executed automated unit test suite:
```bash
cmd.exe /c "cd /d .../backend && mvnw.cmd test -Dtest=DeliveryServiceTest,DeliveryControllerTest,MatchingServiceTest,QualityAssessmentServiceTest,QualityAssessmentCalculationTest,HarvestServiceTest,AuthServiceTest,OrderServiceTest"
```

```text
[INFO] Results:
[INFO]
[INFO] Tests run: 109, Failures: 0, Errors: 0, Skipped: 0
[INFO]
[INFO] ------------------------------------------------------------------------
[INFO] BUILD SUCCESS
[INFO] ------------------------------------------------------------------------
```

### Tests Summary:
1. **`DeliveryServiceTest` (18 Unit Tests)**:
   - `testCreateDelivery_Success`: Creates delivery for ACCEPTED order, sets order status to CONFIRMED.
   - `testCreateDelivery_NonExistentOrder_ThrowsNotFound`: Rejects nonexistent order ID with 404.
   - `testCreateDelivery_OrderNotAccepted_ThrowsBadRequest`: Rejects delivery creation for unaccepted order.
   - `testCreateDelivery_DuplicateDelivery_ThrowsBadRequest`: Rejects duplicate delivery for the same order.
   - `testCreateDelivery_MissingAddress_ThrowsBadRequest`: Rejects missing/empty delivery address.
   - `testCreateDelivery_BuyerOwnership_Success`: Buyer creates delivery for their own order.
   - `testCreateDelivery_CrossBuyer_ThrowsForbidden`: Buyer attempting delivery for another buyer's order blocked with 403.
   - `testCreateDelivery_CrossFarmer_ThrowsForbidden`: Farmer attempting delivery for another farmer's harvest blocked with 403.
   - `testFarmerShipDelivery_Success`: Dispatches delivery and synchronizes order status to SHIPPED.
   - `testFarmerShipDelivery_InvalidStatusTransition_ThrowsBadRequest`: Rejects shipment on DELIVERED delivery.
   - `testFarmerShipDelivery_CrossFarmer_ThrowsForbidden`: Cross-farmer shipment modification blocked with 403.
   - `testFarmerMarkDelivered_Success`: Completes delivery and synchronizes order status to DELIVERED.
   - `testBuyerConfirmReceived_Success`: Buyer confirms receipt and synchronizes order status to DELIVERED.
   - `testBuyerConfirmReceived_CrossBuyer_ThrowsForbidden`: Cross-buyer receipt confirmation blocked with 403.
   - `testBuyerGetDeliveryById_CrossBuyer_ThrowsForbidden`: Cross-buyer delivery retrieval blocked with 403.
   - `testFarmerGetDeliveryById_CrossFarmer_ThrowsForbidden`: Cross-farmer delivery retrieval blocked with 403.
   - `testAdminGetDeliveries_Success`: Admin views all platform deliveries.
   - `testAdminUpdateDeliveryStatus_Success`: Admin updates status and remarks.
2. **`DeliveryControllerTest` (8 WebMvc Tests)**:
   - `testBuyerCreateDelivery_Success`: POST /api/buyer/deliveries returns 201 Created.
   - `testBuyerGetDeliveries_Success`: GET /api/buyer/deliveries returns 200 OK.
   - `testBuyerGetDeliveryById_Success`: GET /api/buyer/deliveries/{id} returns 200 OK.
   - `testBuyerConfirmReceived_Success`: PATCH /api/buyer/deliveries/{id}/confirm-received returns 200 OK.
   - `testFarmerGetDeliveries_Success`: GET /api/farmer/deliveries returns 200 OK.
   - `testFarmerShipDelivery_Success`: PATCH /api/farmer/deliveries/{id}/ship returns 200 OK.
   - `testFarmerDeliverDelivery_Success`: PATCH /api/farmer/deliveries/{id}/deliver returns 200 OK.
   - `testAdminGetDeliveries_Success`: GET /api/admin/deliveries returns 200 OK.
3. **Frontend Syntax Validation**:
   - `node -c frontend/js/app.js`: Clean exit with code 0 (zero syntax errors).

---

## 3. How to Test Phase 9 in Browser

1. Open `frontend/index.html` in browser.
2. **Step 1: Order Acceptance (Farmer)**:
   - Sign in as Farmer: `rajesh.patel@kisan.in` / `Password@123`.
   - In "Incoming Buyer Orders", find an order and click `[✅ Accept]`.
3. **Step 2: Schedule Delivery (Farmer or Buyer)**:
   - On the accepted order, click `[🚚 Delivery]`.
   - Enter destination shipping address, carrier/vehicle info, tracking code, and remarks.
   - Click `Create Delivery Record`.
   - Verify order status updates to `CONFIRMED` and delivery appears in "Outgoing Deliveries & Logistics" with `PENDING` status.
4. **Step 3: Dispatch Shipment (Farmer)**:
   - In "Outgoing Deliveries & Logistics", click `[🚚 Ship]` on the pending delivery.
   - Enter vehicle registration number (e.g. `MH-12-AB-5678`) and waybill code (e.g. `AGC-EXP-9001`).
   - Click `Confirm Dispatch (Ship)`.
   - Notice both the delivery and underlying purchase order instantly transition to `SHIPPED`.
5. **Step 4: Receive & Confirm Delivery (Buyer)**:
   - Sign in as Buyer: `vikas.gupta@freshmarts.com` / `Password@123`.
   - Go to "Inbound Deliveries & Tracking".
   - View live tracking details, vehicle info, and dispatch timestamps.
   - Click `[✅ Confirm Receipt]`.
   - Observe both delivery and order status transition to `DELIVERED`.
6. **Step 5: Admin Monitoring**:
   - Sign in as Admin: `admin@agriconnect.com` / `Admin@123`.
   - Open "Global Delivery & Logistics Monitoring" to review platform-wide shipments, carriers, and fulfillment timelines.




---

# AgriConnect — Phase 10: Payment Management Walkthrough

This section outlines the implementation, testing, API specifications, and frontend integration of **Phase 10: Payment Management**.

---

## 1. Summary of Accomplishments

- **Relational Schema Migration (`08_phase10_payment_management.sql`)**:
  - Expanded `payments.payment_status` ENUM to include `PENDING`, `PROCESSING`, `COMPLETED`, `PAID`, `FAILED`, `CANCELLED`, `REFUNDED`.
  - Added `remarks VARCHAR(255)`, `created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`, and `updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`.
  - Added composite indexes:
    - `idx_payments_order_status` on `(order_id, payment_status)`
    - `idx_payments_status_date` on `(payment_status, payment_date)`
  - Preserved foreign key integrity with `orders(order_id)`.
- **Payment Lifecycle & Financial State Machine**:
  - Enforced valid linear and branching state progressions:
    - `PENDING` -> `PROCESSING`, `COMPLETED`, `PAID`, `CANCELLED`, `FAILED`
    - `PROCESSING` -> `COMPLETED`, `PAID`, `FAILED`, `CANCELLED`
    - `COMPLETED`, `PAID` -> `REFUNDED`
    - `FAILED`, `CANCELLED`, `REFUNDED` are strictly terminal.
  - Backward reversions (e.g. `COMPLETED -> PENDING`, `FAILED -> COMPLETED`) rejected with HTTP 400 Bad Request.
- **Financial Balance & Overpayment Prevention**:
  - Aggregate queries dynamically compute total settled amount per order.
  - Overpayment prevention rejects amounts exceeding the remaining order balance with HTTP 400.
  - Double payment prevention rejects payments against 100% settled orders.
- **Multi-Tenant Ownership & RBAC Security**:
  - Buyers own payment creation and viewing for their purchase contracts.
  - Farmers access payment audit receipts exclusively for their sold produce orders.
  - Administrators monitor all marketplace transactions, audit records, and manage settlement state / refunds.
  - Strict IDOR defenses returning HTTP 403 Forbidden on unauthorized cross-tenant access.
- **Bi-Directional Order Synchronization**:
  - When payment settles on an `ACCEPTED` order, the order is automatically synchronized to `CONFIRMED`.
  - Payments are blocked on `CANCELLED`, `REJECTED`, or unaccepted (`PENDING`) orders.

---

## 2. API Endpoints

### Buyer Endpoints (`ROLE_BUYER`)
- `POST /api/buyer/payments`: Submit/record a payment against an order.
- `GET /api/buyer/payments`: Retrieve all payments made by authenticated buyer.
- `GET /api/buyer/payments/{paymentId}`: Retrieve single payment details (IDOR-protected).
- `GET /api/buyer/payments/order/{orderId}`: Get financial balance and settlement summary for order.

### Farmer Endpoints (`ROLE_FARMER`)
- `GET /api/farmer/payments`: Retrieve all received payment records for farmer's produce.
- `GET /api/farmer/payments/{paymentId}`: Retrieve single payment details (IDOR-protected).
- `GET /api/farmer/payments/order/{orderId}`: Get order settlement summary.

### Admin Endpoints (`ROLE_ADMIN`)
- `GET /api/admin/payments`: Retrieve all payments across the marketplace with optional `status` and `method` filters.
- `GET /api/admin/payments/{paymentId}`: Retrieve payment audit record.
- `PATCH /api/admin/payments/{paymentId}/status`: Update payment status (e.g., approve refund).
- `GET /api/admin/payments/order/{orderId}`: Get order settlement summary.

---

## 3. Test Coverage & Verification Results

- **PaymentServiceTest**: 17 unit tests verifying creation, status transitions, balance checks, overpayment rejection, refund handling, and tenant isolation.
- **PaymentControllerTest**: 8 MockMvc tests verifying RBAC security, response envelopes, and parameter validation.
- **PaymentDatabaseMigrationTest**: 1 integration test verifying idempotent schema application against MySQL.
- **PaymentIntegrationTest**: 6 end-to-end integration tests verifying database persistence, multi-stage settlement, overpayment rejection, and RBAC isolation.
- **Full Test Suite**: 269 tests executed across Phases 1–10, 0 failures, 0 errors, 0 skipped (`BUILD SUCCESS`).

---

# AgriConnect — Phase 11: Price History & Analytics Walkthrough

This section outlines the implementation, testing, database schema extension, DBMS analytical queries, API specifications, and frontend integration of **Phase 11: Price History & Analytics**.

---

## 1. Summary of Accomplishments

- **Relational Schema Migration (`09_phase11_price_history.sql`)**:
  - Unified dual-source pricing model:
    - `MARKET_MANDI`: APMC mandi benchmarks (seeded benchmark records preserved).
    - `TRANSACTION_SALE`: Actual completed commercial marketplace sales transactions.
  - Extended `price_history` table:
    - `source_type ENUM('MARKET_MANDI', 'TRANSACTION_SALE') DEFAULT 'TRANSACTION_SALE'`
    - `order_id INT NULL` (with FK `fk_price_history_order` to `orders(order_id)`)
    - `farmer_id INT NULL` (with FK `fk_price_history_farmer` to `users(user_id)`)
    - `buyer_id INT NULL` (with FK `fk_price_history_buyer` to `users(user_id)`)
    - `quantity DECIMAL(10,2) NULL`
    - `unit_price DECIMAL(8,2) NULL`
    - `total_amount DECIMAL(12,2) NULL`
  - Constraints & Indexes:
    - Unique constraint `idx_price_history_order_unique` on `order_id` to guarantee database-level idempotency and prevent duplicate sale recording.
    - Composite index `idx_price_history_crop_price` on `(crop_id, unit_price)` for fast filtering and range scans.
    - Single-column indexes `idx_price_history_farmer` and `idx_price_history_buyer` for rapid role-specific tenant lookups.
- **Automated Settlement Lifecycle Hook**:
  - Connected `PaymentService` to `PriceHistoryService`.
  - When payment successfully settles (`PaymentStatus.isSuccessful()`), the system automatically and idempotently captures the agreed transaction pricing into `price_history`.
  - Safeguarded against cancelled or rejected orders.
- **Academic DBMS Aggregation & Trend Analytics**:
  - Implemented optimized JPA/JPQL aggregation queries:
    - Average price (`AVG(COALESCE(unitPrice, modalPricePerKg))`)
    - Minimum price (`MIN(COALESCE(unitPrice, minPricePerKg))`)
    - Maximum price (`MAX(COALESCE(unitPrice, maxPricePerKg))`)
    - Total trading volume (`COALESCE(SUM(quantity), 0)`)
    - Total contract volume and count (`COUNT(ph)`)
  - Statistical time-series trend classification (`UPWARD`, `DOWNWARD`, `STABLE`, `INSUFFICIENT_DATA`).
  - Platform-wide macro summary with automatic identification of highest and lowest priced commodities.
- **RBAC Security & Role-Specific Access**:
  - **Farmers**: Can inspect historical sales realizations, contracted prices, volumes sold, and buyers.
  - **Buyers**: Can evaluate crop price trends, APMC benchmark rates, and statistical metrics for commercial intelligence.
  - **Administrators**: Can audit global price history across all sources, filter by commercial vs mandi benchmark, and review macroscopic market summaries.
  - **Universal**: Authenticated cross-role endpoints for common crop analytics and summaries.
- **Frontend Dashboard Integration**:
  - Farmer dashboard: Added "Historical Produce Sales & Pricing" card with crop and date filtering.
  - Buyer dashboard: Added "Crop Market Intelligence & Price History" with interactive crop selector, 5 KPI analytical tiles (Average, Range, Latest, Volume, Trend), and price history table.
  - Admin dashboard: Added "Marketplace Price History & Platform Analytics" with 5 platform macro KPI tiles, source type filtering, and global history table.
  - Validated syntax with `node -c frontend/js/app.js`.

---

## 2. API Endpoints

### Farmer Endpoints (`ROLE_FARMER`)
- `GET /api/farmer/price-history`: Retrieve historical sales records for the authenticated farmer with optional `cropId`, `startDate`, and `endDate` parameters.

### Buyer Endpoints (`ROLE_BUYER`)
- `GET /api/buyer/price-history`: Retrieve market price history with optional `cropId`, `startDate`, and `endDate` filters.
- `GET /api/buyer/price-history/analytics/{cropId}`: Retrieve aggregated statistics (AVG, MIN, MAX, Volume, Trend) for a crop.

### Admin Endpoints (`ROLE_ADMIN`)
- `GET /api/admin/price-history`: Retrieve all pricing entries with `cropId`, `sourceType`, `startDate`, and `endDate` filters.
- `GET /api/admin/price-history/summary`: Retrieve platform-wide macro summary and per-crop performance metrics.

### Universal Authenticated Endpoints (`ROLE_FARMER`, `ROLE_BUYER`, `ROLE_ADMIN`)
- `GET /api/price-history/crop/{cropId}`: Retrieve price history for a given crop.
- `GET /api/price-history/analytics/{cropId}`: Retrieve DBMS analytics for a given crop.
- `GET /api/price-history/summary`: Retrieve marketplace pricing summary.

---

## 3. Test Coverage & Verification Results

- **PriceHistoryServiceTest**: 9 unit tests verifying idempotent creation, cancelled order rejection, role-specific queries, crop analytics calculation, and marketplace aggregation.
- **PriceHistoryControllerTest**: 5 MockMvc WebMvc tests verifying HTTP 200 responses, JSON envelopes, and controller route mappings.
- **PriceHistoryDatabaseMigrationTest**: 1 integration test verifying column existence, data types, indexes, and FK constraints against MySQL.
- **PriceHistoryIntegrationTest**: 2 end-to-end integration tests verifying payment completion -> price history creation, duplicate prevention, and RBAC security enforcement.
- **Full Test Suite**: 286 tests executed across Phases 1–11, 0 failures, 0 errors, 0 skipped (`BUILD SUCCESS`).

# AgriConnect — Phase 12: Admin Dashboard Walkthrough

This section outlines the implementation, testing, database schema optimization, centralized aggregation architecture, API specifications, and frontend integration of **Phase 12: Admin Dashboard**.

---

## 1. Summary of Phase 12 Accomplishments

- **Relational Schema Migration (`10_phase12_admin_dashboard.sql`)**:
  - `idx_price_history_source`: Created non-unique index on `price_history(source_type)` to optimize source-based aggregation and filtering.
  - `idx_harvests_status_only`: Created non-unique index on `harvests(status)` to accelerate inventory and availability counting.
  - `idx_buyer_req_status_only`: Created non-unique index on `buyer_requirements(status)` for efficient active demand metrics.
- **Centralized Admin Dashboard Service (`AdminDashboardService`)**:
  - Direct database-side SQL/JPA aggregations (`countByRole`, `countByStatus`, `sumTotalAmountByOrderStatus`, `sumOverallCompletedPaymentValue`, `findOverallAveragePrice`, `findOverallTotalQuantity`).
  - Zero entity memory-loading for analytics: high throughput and low memory footprint.
  - Real-time marketplace activity stream: amalgamates and chronologically sorts recent events across orders, deliveries, payments, quality certifications, harvests, and price entries.
- **User Management & Role Oversight (`AdminUserService`)**:
  - Search and filter registered market participants by role (`FARMER`, `BUYER`, `ADMIN`), status (`ACTIVE`, `INACTIVE`, `SUSPENDED`), and keyword (name, email, phone).
  - Specialized profile inspection: retrieves farm details for farmers and business/GSTIN details for buyers.
  - Security and privacy: passwords and BCrypt hashes are strictly excluded from all DTOs and responses.
- **Admin Quality Controller Enhancement (`AdminQualityController`)**:
  - Added `GET /api/admin/quality` returning all quality assessment records for comprehensive auditability.
- **Role-Based Access Control (RBAC)**:
  - All admin endpoints under `/api/admin/**` protected by Spring Security (`hasRole('ADMIN')`).
  - Cross-role requests by Farmers and Buyers return HTTP 403 Forbidden.
  - Unauthenticated requests return HTTP 401 Unauthorized.
- **Frontend Integration**:
  - Centralized **Operations & System Control Center** card with 8 major KPI tiles (Users, Produce, Quality, Requirements, Orders, Logistics, Payments, Price Intelligence).
  - Real-time **Marketplace Activity Stream** with color-coded domain icons and status badges.
  - **System User Directory & Role Oversight** table with multi-criteria filtering and detailed user inspection modal.
  - Maintained complete JavaScript syntax validity (`node -c frontend/js/app.js` passes with code 0).

---

## 2. API Endpoints

### Dashboard Analytics (`ROLE_ADMIN`)
- `GET /api/admin/dashboard`: Platform-wide statistical summary and domain KPIs.
- `GET /api/admin/dashboard/recent-activity`: Live chronological marketplace activity feed with configurable limit.

### User Management (`ROLE_ADMIN`)
- `GET /api/admin/users`: Search and list users with optional `role`, `status`, and `search` query parameters.
- `GET /api/admin/users/{id}`: Inspect single user details including specialized profiles.

### Quality Inspection (`ROLE_ADMIN`)
- `GET /api/admin/quality`: Retrieve all quality assessments across the platform.

---

## 3. Test Coverage & Verification Results

- **AdminDashboardServiceTest**: 2 unit tests verifying KPI aggregations and multi-entity activity stream chronological sorting.
- **AdminUserServiceTest**: 3 unit tests verifying multi-criteria user filtering, farmer/buyer profile mapping, and 404 handling.
- **AdminDashboardControllerTest**: 3 WebMvc tests verifying HTTP 200 responses, status envelopes, and admin endpoint contracts.
- **AdminUserControllerTest**: 2 WebMvc tests verifying user listing, search filters, and profile lookup.
- **AdminDashboardDatabaseMigrationTest**: 1 integration test verifying index creation and existence against live MySQL `agriconnect_db`.
- **AdminDashboardIntegrationTest**: 8 end-to-end integration tests verifying admin statistics retrieval, activity feed, user filtering, and strict RBAC enforcement (HTTP 403 for non-admins, HTTP 401 for unauthenticated).
- **Full Test Suite**: 305 tests executed across Phases 1–12, 0 failures, 0 errors, 0 skipped (`BUILD SUCCESS`).
