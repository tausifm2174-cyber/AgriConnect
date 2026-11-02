# AgriConnect — Quality Management & Quality Verification (Phase 5)

## 1. Phase 5 Purpose & Overview

**Phase 5: Quality Management** introduces official agricultural quality inspection and certification to AgriConnect. In an open farmer-to-market exchange, buyers need trusted, standardized produce ratings before committing to contracts, while farmers need transparent, auditable feedback on crop quality.

Phase 5 establishes a centralized, server-authoritative quality assessment engine where:
- **Authorized Administrators / Inspectors** inspect listed harvest lots and grade them against standard physical parameters.
- **Server-Side Algorithms** calculate standardized quality scores and letter grades. Frontend submissions of scores and grades are never trusted.
- **Verification Lifecycles** ensure lots transition through `PENDING`, `VERIFIED`, and `REJECTED` states.
- **Farmers** can view official quality certificates for their own harvest lots in a read-only view.
- **Ownership and Role Boundaries** strictly isolate administrative certification authority from public and buyer access.

---

## 2. End-to-End Quality Workflow

```text
       FARMER                          ADMIN (INSPECTOR)                      BUYER
         │                                     │                                │
1. Lists Harvest Lot                           │                                │
   POST /api/farmer/harvests                   │                                │
         │                                     │                                │
         │──────── (Lot Listed) ──────────────>│                                │
         │                                     │                                │
         │                             2. Reviews Queue                         │
         │                                GET /api/admin/quality/pending        │
         │                                     │                                │
         │                             3. Evaluates 5 Parameters + Damage %     │
         │                                (Freshness, Appearance, Size,         │
         │                                 Color, Ripeness, Damage)             │
         │                                     │                                │
         │                             4. Submits Official Assessment           │
         │                                POST /api/admin/quality               │
         │                                     │                                │
         │                                [Backend Calculates:                  │
         │                                 Score: 0.00 - 100.00                 │
         │                                 Grade: A, B, or C                    │
         │                                 Status: PENDING]                     │
         │                                     │                                │
         │                             5. Reviews & Certifies Lot               │
         │                                PUT /api/admin/quality/{id}/verify    │
         │                                (or rejects with /reject)             │
         │                                     │                                │
6. Inspects Certificate <──────────────────────┤                                │
   GET /api/farmer/harvests/{id}/quality       │                                │
   (Read-Only: Score, Grade, Parameters)       │                                │
                                               │                                │
                                               └──── (Future Phase 6) ─────────>│
                                                     Quality-Aware Matching
```

---

## 3. Quality Parameters & Rating Scales

Every quality assessment evaluates six physical attributes defined in the relational database:

| Parameter | Scale | Description | Database Column |
| :--- | :---: | :--- | :--- |
| **Freshness** | 1 – 10 | Harvest recency, turgidity, hydration, and moisture content | `freshness INT NOT NULL` |
| **Appearance** | 1 – 10 | Visual symmetry, skin texture, cleanliness, and freedom from blemishes | `appearance INT NOT NULL` |
| **Size Uniformity** | 1 – 10 | Consistency of produce dimensions matching standard market grades | `size INT NOT NULL` |
| **Color Vibrancy** | 1 – 10 | Pigmentation depth and color uniformity characteristic of mature crop | `color INT NOT NULL` |
| **Ripeness Index** | 1 – 10 | Optimal physiological maturity (neither under-ripe nor over-mature) | `ripeness INT NOT NULL` |
| **Damage Percentage** | 0.00 – 100.00% | Visible defects, bruises, pest incidence, or transit abrasion | `damage_percentage DECIMAL(5,2) NOT NULL` |

---

## 4. Quality Score Formula

The quality score is computed on the backend using the five core rating parameters:

$$\text{Average Rating} = \frac{\text{Freshness} + \text{Appearance} + \text{Size} + \text{Color} + \text{Ripeness}}{5}$$

$$\text{Quality Score} = \text{Average Rating} \times 10$$

* Both score and damage percentage are stored with two decimal places (`DECIMAL(5, 2)`), rounded using standard mathematical `RoundingMode.HALF_UP`.
* **Damage Percentage** is stored independently as an objective defect metric and does **not** silently overwrite the calculated score.

### Example Calculations:

1. **Grade A Example**:
   - Freshness = 10, Appearance = 9, Size = 9, Color = 10, Ripeness = 9
   - $\text{Total} = 47$
   - $\text{Average} = \frac{47}{5} = 9.4$
   - $\text{Quality Score} = 9.4 \times 10 = \mathbf{94.00}$ (Grade A)

2. **Grade B Example**:
   - Freshness = 7, Appearance = 7, Size = 6, Color = 7, Ripeness = 6
   - $\text{Total} = 33$
   - $\text{Average} = \frac{33}{5} = 6.6$
   - $\text{Quality Score} = 6.6 \times 10 = \mathbf{66.00}$ (Grade B)

3. **Grade C Example**:
   - Freshness = 4, Appearance = 5, Size = 4, Color = 5, Ripeness = 4
   - $\text{Total} = 22$
   - $\text{Average} = \frac{22}{5} = 4.4$
   - $\text{Quality Score} = 4.4 \times 10 = \mathbf{44.00}$ (Grade C)

---

## 5. Quality Grade Determination Rule

The official letter grade is assigned exclusively by the server according to strict score boundaries:

| Score Range | Grade | Market Classification |
| :---: | :---: | :--- |
| **80.00 – 100.00** | **Grade A** | Premium table quality, export standard, top tier supermarket retail |
| **60.00 – 79.99** | **Grade B** | Standard commercial grade, domestic wholesale, commercial food processing |
| **0.00 – 59.99** | **Grade C** | Discount industrial grade, animal feed, extraction, or bulk canning |

### Exact Boundary Cases:
- Score `80.00` $\rightarrow$ **Grade A**
- Score `79.99` $\rightarrow$ **Grade B**
- Score `79.00` $\rightarrow$ **Grade B**
- Score `60.00` $\rightarrow$ **Grade B**
- Score `59.99` $\rightarrow$ **Grade C**
- Score `59.00` $\rightarrow$ **Grade C**

---

## 6. Verification Status Lifecycle

```text
       [ Harvest Created ]
                │
                ▼
        [ NOT ASSESSED ]
                │
                │  POST /api/admin/quality
                ▼
           [ PENDING ] ◄──────────────────────┐
                │                             │
        ┌───────┴───────┐                     │
        │               │                     │ PUT /api/admin/quality/{id}
        ▼               ▼                     │ (Re-inspection / Edit)
   [ VERIFIED ]    [ REJECTED ] ──────────────┘
```

1. **NOT ASSESSED**: Initial state of a newly created harvest lot. Appears in the administrator's inspection queue.
2. **PENDING**: Assessment has been recorded by an inspector; awaiting formal supervisor verification or laboratory corroboration.
3. **VERIFIED**: Administrator checks the lot and approves it. The lot is certified and eligible for future buyer matching.
4. **REJECTED**: Assessment failed minimum quality parameters or lot details were disputed. Inspector remarks document the reason for rejection.
5. **Re-Assessment Rule**: If an existing assessment is edited via `PUT /api/admin/quality/{id}`, the verification status is automatically reset to `PENDING` so it must be re-verified by an authorized administrator.

---

## 7. REST API Endpoints Specification

### Admin Endpoints (Requires `ROLE_ADMIN`)

| Method | Endpoint | Description | Status Code |
| :--- | :--- | :--- | :---: |
| `GET` | `/api/admin/quality/pending` | Get harvest lots requiring assessment or filtered by status (`?status=PENDING\|VERIFIED\|REJECTED\|ALL`) | `200 OK` |
| `GET` | `/api/admin/quality/harvests/{harvestId}` | Get harvest details and existing assessment for inspection | `200 OK` |
| `POST` | `/api/admin/quality` | Record new official quality assessment | `201 Created` |
| `GET` | `/api/admin/quality/{assessmentId}` | Get quality assessment by ID | `200 OK` |
| `PUT` | `/api/admin/quality/{assessmentId}` | Update assessment parameters (recalculates score/grade, resets status to `PENDING`) | `200 OK` |
| `PUT` | `/api/admin/quality/{assessmentId}/verify` | Formally certify and verify quality assessment | `200 OK` |
| `PUT` | `/api/admin/quality/{assessmentId}/reject` | Mark assessment as rejected with optional inspector remarks | `200 OK` |
| `GET` | `/api/admin/quality/metrics` | Get overview counts (Pending, Verified, Rejected, Total) | `200 OK` |

### Farmer Endpoints (Requires `ROLE_FARMER`)

| Method | Endpoint | Description | Status Code |
| :--- | :--- | :--- | :---: |
| `GET` | `/api/farmer/harvests/{harvestId}/quality` | View quality certificate for own harvest lot (Ownership strictly enforced) | `200 OK` |

---

## 8. Security & Authorization Rules

1. **JWT-Derived Identity**:
   - `admin_id` and `farmer_id` are never accepted from client request bodies.
   - The assessing or verifying administrator is resolved strictly from `@AuthenticationPrincipal CustomUserDetails userDetails` extracted from the cryptographically signed JWT.
2. **Role-Based Access Control (RBAC)**:
   - `/api/admin/**` endpoints are guarded by Spring Security `hasRole('ADMIN')`. Farmers and buyers receive `HTTP 403 Forbidden`.
   - `/api/farmer/**` endpoints are guarded by `hasRole('FARMER')`. Admins and buyers receive `HTTP 403 Forbidden`.
   - Anonymous requests without Bearer tokens receive `HTTP 401 Unauthorized`.
3. **Harvest Ownership Protection**:
   - When a farmer accesses `GET /api/farmer/harvests/{harvestId}/quality`, the service verifies that `harvest.getFarmer().getUserId().equals(authenticatedUserId)`.
   - Accessing another farmer's harvest quality returns `HTTP 403 Forbidden`.
4. **Duplicate Prevention (1:1 Relationship)**:
   - The relational database schema enforces `UNIQUE (harvest_id)` in `quality_assessments`.
   - Attempting to create a second assessment for an already-assessed harvest returns `HTTP 409 Conflict`.

---

## 9. Relational Database Mapping

The entity directly reuses the Phase 2 `quality_assessments` table without schema modifications:

```sql
CREATE TABLE IF NOT EXISTS quality_assessments (
    assessment_id INT AUTO_INCREMENT PRIMARY KEY,
    harvest_id INT NOT NULL UNIQUE,
    admin_id INT NOT NULL,
    freshness INT NOT NULL,
    appearance INT NOT NULL,
    size INT NOT NULL,
    color INT NOT NULL,
    ripeness INT NOT NULL,
    damage_percentage DECIMAL(5, 2) NOT NULL,
    quality_score DECIMAL(5, 2) NOT NULL,
    quality_grade ENUM('A', 'B', 'C') NOT NULL,
    verification_status ENUM('PENDING', 'VERIFIED', 'REJECTED') DEFAULT 'PENDING',
    assessment_date DATE NOT NULL,
    inspector_notes VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_qa_harvest FOREIGN KEY (harvest_id) REFERENCES harvests(harvest_id) ON DELETE CASCADE,
    CONSTRAINT fk_qa_admin FOREIGN KEY (admin_id) REFERENCES users(user_id) ON DELETE RESTRICT
);
```

---

## 10. Example API Requests and Responses

### Create Assessment Request (`POST /api/admin/quality`)
```json
{
  "harvestId": 10,
  "freshness": 9,
  "appearance": 8,
  "size": 9,
  "color": 8,
  "ripeness": 9,
  "damagePercentage": 4.0,
  "inspectorNotes": "Aromatic long-grain lot, moisture under 12%, uniform pigmentation"
}
```

### Response (`201 Created`)
```json
{
  "status": 200,
  "message": "Quality assessment created successfully",
  "data": {
    "assessmentId": 18,
    "harvestId": 10,
    "farmerId": 2,
    "farmerName": "Rajesh Patel",
    "cropId": 2,
    "cropName": "Basmati Rice (1121)",
    "cropCategory": "CEREAL",
    "harvestDate": "2026-10-04",
    "harvestLocation": "Nashik Mandi Yard 2",
    "initialQuantity": 1200.00,
    "availableQuantity": 1200.00,
    "adminId": 1,
    "adminName": "Ramesh Sharma (Admin)",
    "freshness": 9,
    "appearance": 8,
    "size": 9,
    "color": 8,
    "ripeness": 9,
    "damagePercentage": 4.00,
    "qualityScore": 86.00,
    "qualityGrade": "A",
    "verificationStatus": "PENDING",
    "assessmentDate": "2026-10-04",
    "inspectorNotes": "Aromatic long-grain lot, moisture under 12%, uniform pigmentation"
  },
  "timestamp": "2026-10-04T18:15:30.123"
}
```

### Farmer Inspection Response (`GET /api/farmer/harvests/10/quality`)
```json
{
  "status": 200,
  "message": "Quality assessment retrieved successfully",
  "data": {
    "assessmentId": 18,
    "harvestId": 10,
    "cropName": "Basmati Rice (1121)",
    "cropCategory": "CEREAL",
    "farmerId": 2,
    "farmerName": "Rajesh Patel",
    "qualityScore": 86.00,
    "qualityGrade": "A",
    "freshness": 9,
    "appearance": 8,
    "size": 9,
    "color": 8,
    "ripeness": 9,
    "damagePercentage": 4.00,
    "verificationStatus": "VERIFIED",
    "assessmentDate": "2026-10-04",
    "adminName": "Ramesh Sharma (Admin)",
    "inspectorNotes": "Aromatic long-grain lot, moisture under 12%, uniform pigmentation"
  },
  "timestamp": "2026-10-04T18:16:00.456"
}
```

---

## 11. Automated Test Suite Summary

- **Tests Run**: 114
- **Failures**: 0
- **Errors**: 0
- **Skipped**: 0
- **Build Status**: `BUILD SUCCESS`

Test classes:
1. `QualityAssessmentCalculationTest`: Comprehensive unit testing of mathematical formulas, boundary rounding, Grade A/B/C transitions, and 1–10 / 0–100 scale limits.
2. `QualityAssessmentServiceTest`: Mockito unit tests verifying admin-only creation, duplicate rejection (409), recalculation upon update, verification/rejection, and farmer ownership protection (403).
3. `QualityAssessmentIntegrationTest`: Full Spring Security & Database MockMvc integration tests covering all RBAC boundaries, farmer view permissions, admin workflow lifecycle, and constraint enforcement.
