# AgriConnect — Phase 7: Quality-Aware Matching Engine

## 1. Purpose
The Quality-Aware Matching Engine bridges commercial buyer purchase specifications (Phase 6) with verified farmer harvest lots (Phase 4 & 5). It provides a deterministic, transparent, and read-only evaluation mechanism that computes compatibility scores and ranks eligible harvests for buyers without mutating inventory or creating orders.

---

## 2. Architecture & Data Flow
The matching engine is entirely dynamic and database-driven:

```text
Buyer Requirement (Phase 6)
          │
          ▼
   Hard Filters (Database SQL/JPQL)
   - Crop Match (crop_id)
   - Inventory Coverage (available_quantity >= required_quantity > 0)
   - Budget Constraint (price_per_kg <= max_price_per_kg)
   - Inventory Status (status = 'AVAILABLE')
   - Quality Certification (verification_status = 'VERIFIED')
   - Quality Grade (quality_grade IN acceptable_grades)
          │
          ▼
   Scoring Engine (100-Point Scale)
   - Price Score:    30 pts
   - Quality Score:  30 pts
   - Location Score: 20 pts
   - Quantity Score: 20 pts
          │
          ▼
   Deterministic Ranking
   (Match Score DESC -> Quality Score DESC -> Price ASC -> Quantity DESC)
          │
          ▼
   Composite DTO Response (Read-Only)
```

No persistent `matches` table is created; match results are derived dynamically from normalized 3NF relational data.

---

## 3. Hard Matching Criteria
A harvest lot is an eligible match **only if all** of the following hard criteria pass:
1. **Requirement Status**: Must be `OPEN`. (`CANCELLED`, `FULFILLED`, or `EXPIRED` requirements are rejected with `400 Bad Request`).
2. **Requirement Validity**: Required-by date must not be in the past (`required_by_date >= today`).
3. **Crop Match**: `harvest.crop_id = requirement.crop_id`.
4. **Available Quantity**: `harvest.available_quantity >= requirement.required_quantity` (and `available_quantity > 0`). Partial matching is disallowed in Phase 7.
5. **Price Ceiling**: `harvest.price_per_kg <= requirement.max_price_per_kg`.
6. **Harvest Status**: `harvest.status = HarvestStatus.AVAILABLE`.
7. **Quality Assessment Existence**: An official assessment must be linked 1:1 with the harvest.
8. **Verification Status**: `quality_assessment.verification_status = VerificationStatus.VERIFIED`. (`PENDING` or `REJECTED` lots are strictly excluded).
9. **Quality Grade Compatibility**: `harvest.quality_grade` meets or exceeds `requirement.min_quality_grade`.

---

## 4. Quality-Grade Hierarchy Logic
Quality grades are mapped to explicit numerical ranks rather than alphabetical comparison:
* **Grade A**: Rank 3 (Premium export / retail quality)
* **Grade B**: Rank 2 (Standard commercial / processing quality)
* **Grade C**: Rank 1 (Economy / industrial grade)

### Acceptance Rules:
* **Requirement Grade A**: Accepts **Grade A only** (3 >= 3).
* **Requirement Grade B**: Accepts **Grade A and Grade B** (3 >= 2, 2 >= 2).
* **Requirement Grade C**: Accepts **Grade A, Grade B, and Grade C** (3 >= 1, 2 >= 1, 1 >= 1).

---

## 5. Transparent 100-Point Scoring Formula

The total match score is calculated on a 100-point scale:

$$\text{Total Match Score} = \text{Price Score} (30) + \text{Quality Score} (30) + \text{Location Score} (20) + \text{Quantity Score} (20)$$

### 5.1 Price Score (30 Points Max)
Rewards pricing competitive advantages while providing a baseline score when the harvest price exactly meets the buyer's budget ceiling:
$$\text{priceRatio} = \frac{\text{harvestPrice}}{\text{maxPrice}}$$
$$\text{priceSavingsRatio} = \max(0, 1 - \text{priceRatio})$$
$$\text{priceScore} = \text{clamp}(10.0 + (\text{priceSavingsRatio} \times 20.0), 0, 30)$$

* At $\text{harvestPrice} = \text{maxPrice}$: Price Score = $10.0$ points.
* At $15\%$ discount: Price Score = $10.0 + (0.15 \times 20.0) = 13.0$ points.
* At $50\%$ discount: Price Score = $10.0 + (0.50 \times 20.0) = 20.0$ points.

### 5.2 Quality Score (30 Points Max)
Scales directly from the verified 100-point quality score:
$$\text{qualityScoreComponent} = \text{clamp}\left(\frac{\text{qualityAssessment.qualityScore}}{100.0} \times 30.0, 0, 30\right)$$

* Quality Score $100.0 \rightarrow 30.0$ points.
* Quality Score $92.5 \rightarrow 27.75$ points.
* Quality Score $80.0 \rightarrow 24.0$ points.
* Quality Score $60.0 \rightarrow 18.0$ points.

### 5.3 Location Score (20 Points Max)
Deterministic string and token matching:
* **Location Match (Exact, Substring, or Regional Token Match)**: $20.0$ points (`locationMatch = true`).
* **Unconstrained Requirement (Preferred Location is Null or Blank)**: $15.0$ points (`locationMatch = true`).
* **Different Location**: $10.0$ points (`locationMatch = false`).

### 5.4 Quantity Coverage Score (20 Points Max)
Evaluates lot sufficiency beyond the minimum required quantity:
$$\text{quantityRatio} = \frac{\text{availableQuantity}}{\text{requiredQuantity}}$$
$$\text{quantityScore} = \text{clamp}\left(\frac{\min(\text{quantityRatio}, 2.0)}{2.0} \times 20.0, 0, 20\right)$$

* Available = Required ($1.0\times$): $10.0$ points.
* Available = $1.5\times$ Required: $15.0$ points.
* Available $\ge 2.0\times$ Required: $20.0$ points.

---

## 6. Deterministic Ranking Rules
Eligible harvest matches are sorted strictly in order of:
1. `matchScore` DESC
2. `qualityScore` DESC
3. `pricePerKg` ASC
4. `availableQuantity` DESC

---

## 7. API Specification

### Endpoint:
```http
GET /api/buyer/requirements/{id}/matches
```

* **Role Required**: `ROLE_BUYER`
* **Query Parameters**: `sort=best` (optional)
* **Response Status**:
  * `200 OK`: Successful match retrieval (even when `totalMatches = 0`).
  * `400 Bad Request`: Requirement is `CANCELLED`, `EXPIRED`, or `FULFILLED`.
  * `401 Unauthorized`: Unauthenticated or missing Bearer token.
  * `403 Forbidden`: Authenticated user is not a Buyer, or does not own the requirement.
  * `404 Not Found`: Requirement ID does not exist.

### Request Example:
```http
GET /api/buyer/requirements/1/matches HTTP/1.1
Host: localhost:8080
Authorization: Bearer <buyer_jwt_token>
Accept: application/json
```

### Response Example:
```json
{
  "status": 200,
  "message": "Matching harvests retrieved successfully",
  "data": {
    "requirementId": 1,
    "cropId": 1,
    "cropName": "Tomato (Hybrid Red)",
    "requiredQuantity": 400.00,
    "maximumPricePerKg": 27.00,
    "minimumQualityGrade": "A",
    "preferredLocation": "Western India / Maharashtra",
    "requiredByDate": "2026-10-15",
    "status": "OPEN",
    "totalMatches": 1,
    "matches": [
      {
        "harvestId": 1,
        "cropId": 1,
        "cropName": "Tomato (Hybrid Red)",
        "farmerId": 2,
        "farmerName": "Rajesh Patel",
        "availableQuantity": 550.00,
        "pricePerKg": 26.00,
        "harvestDate": "2026-09-18",
        "location": "Nashik, Maharashtra",
        "qualityGrade": "A",
        "qualityScore": 92.50,
        "qualityVerificationStatus": "VERIFIED",
        "freshness": 9,
        "appearance": 9,
        "size": 8,
        "color": 9,
        "ripeness": 8,
        "damagePercentage": 3.50,
        "matchScore": 72.24,
        "priceScore": 10.74,
        "qualityScoreComponent": 27.75,
        "locationScore": 20.00,
        "quantityScore": 13.75,
        "locationMatch": true
      }
    ]
  },
  "timestamp": "2026-10-05T21:41:36.0396131"
}
```

---

## 8. Security & Ownership Protection
1. **JWT-Derived Identity**: The buyer identity is extracted exclusively from the validated JWT token (`@AuthenticationPrincipal CustomUserDetails`).
2. **Ownership Isolation**: A buyer can only query matches for requirements where `buyer_id = authenticated_user_id`. Cross-buyer attempts trigger an `AccessDeniedException` (HTTP 403).
3. **Role-Based Authorization**: Endpoints under `/api/buyer/**` are protected by `.hasRole('BUYER')`. Farmers and Admins receive 403 Forbidden.
4. **Server-Side Scoring**: The client never submits scores. All calculations are executed server-side.

---

## 9. Phase Boundary Confirmation
Phase 7 implements **strictly read-only matching**:
* **NO Orders created**
* **NO Inventory reservation or stock deduction**
* **NO Delivery creation**
* **NO Payments processed**
* **NO Price history updates**
* **NO AI/ML black-box estimation**
Produce reservations and order creation belong strictly to Phase 8.

---

## 10. Test Results
* **Total Automated Tests**: 172
* **Failures**: 0
* **Errors**: 0
* **Build Status**: `BUILD SUCCESS`
* **Coverage**: Full coverage across unit tests (`MatchingServiceTest`), integration tests (`MatchingIntegrationTest`), and live browser verification.
