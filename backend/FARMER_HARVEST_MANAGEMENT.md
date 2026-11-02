# AgriConnect — Phase 4: Farmer & Harvest Management

## 1. Architectural Overview

AgriConnect Phase 4 implements end-to-end Farmer and Harvest Lot Management on top of the foundation, relational schema, and authentication layers created in Phases 1–3.

Authenticated farmers can view their specialized farm profile, browse the standard crop catalog, list newly harvested crop lots, monitor inventory availability, update lot pricing and status, and safely delete unreferenced lots.

```
+-----------------------------------------------------------------------------------+
|                                  Frontend Client                                  |
|     (Farmer Dashboard, Crop Select, Add Harvest Form, Lots Table, Edit Modal)     |
+-----------------------------------------+-----------------------------------------+
                                          |
                        HTTP Authorization: Bearer <JWT>
                                          |
                                          v
+-----------------------------------------------------------------------------------+
|                        Spring Boot 3.3.4 Security Engine                          |
|                                                                                   |
|  1. JwtAuthenticationFilter: Extracts & verifies farmer claims from JWT           |
|  2. SecurityFilterChain: /api/farmer/** requires ROLE_FARMER                      |
|                         /api/crops/** requires Authentication                     |
|  3. Ownership Validation: Farmer can only access & mutate their OWN harvests       |
+-----------------------------------------+-----------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
|                                Controller Layer                                   |
|   CropController (/api/crops)                                                     |
|   FarmerProfileController (/api/farmer/profile)                                   |
|   FarmerHarvestController (/api/farmer/harvests)                                   |
+-----------------------------------------+-----------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
|                     Service Layer (Transactional Business Logic)                  |
|     CropService           FarmerProfileService          HarvestService            |
|     - Catalog Queries     - Farm Specs & Stats          - Lot CRUD & Validation   |
|                                                         - Ownership Enforcement   |
|                                                         - Order Dependency Check  |
+-----------------------------------------+-----------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
|                        Persistence Layer (Spring Data JPA)                        |
|     CropRepository       FarmerProfileRepository        HarvestRepository         |
|     UserRepository       (countOrdersByHarvestId Native SQL check)                |
+-----------------------------------------+-----------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
|                            MySQL 8.0 (agriconnect_db)                             |
|          crops            users            farmer_profiles           harvests     |
+-----------------------------------------------------------------------------------+
```

---

## 2. Security & Ownership Architecture

### Critical Security Rule: Trust No Client Farmer ID
A client can never submit an arbitrary `farmer_id` to `POST /api/farmer/harvests` or any other farmer endpoint. The farmer identity is strictly derived from the verified JWT:

$$\text{JWT Bearer Token} \longrightarrow \text{JwtAuthenticationFilter} \longrightarrow \text{CustomUserDetails} \longrightarrow \text{farmerUserId}$$

### Horizontal Privilege Escalation Prevention
If Farmer A (e.g., User ID 3) attempts to view, edit, or delete a harvest lot owned by Farmer B (e.g., User ID 2):
1. `HarvestService` loads the harvest entity.
2. `validateOwnership(farmerUserId, harvest)` detects the identity mismatch.
3. An `AccessDeniedException` is thrown immediately, logging the violation and returning **HTTP 403 Forbidden**.

### Role-Based Access Control (RBAC)
- **FARMER**: Full access to `/api/farmer/**` and `/api/crops`.
- **BUYER**: Allowed access to `/api/crops`; strictly denied access to `/api/farmer/**` (**HTTP 403 Forbidden**).
- **Unauthenticated**: Strictly denied on all protected endpoints (**HTTP 401 Unauthorized**).

---

## 3. Relational Schema & Database Integrity

Phase 4 reuses the exact tables created during Phase 2 without modifying completed table definitions or constraints:

### Reused Entities & Tables
1. **`users`**: Central identity for farmers (`role = 'FARMER'`).
2. **`farmer_profiles`**: 1:1 specialization table storing `farm_location`, `farm_size_acres`, and `experience_years`.
3. **`crops`**: Master agricultural catalog storing `crop_id`, `crop_name`, `category`, `season`, and `description`.
4. **`harvests`**: Listed crop lots with `initial_quantity`, `available_quantity`, `price_per_kg`, `harvest_date`, `location`, and `status`.

### Domain Constraints Enforced
- `initial_quantity > 0.0`
- `available_quantity >= 0.0`
- `available_quantity <= initial_quantity`
- `price_per_kg > 0.0`
- `status` $\in$ `['AVAILABLE', 'PARTIALLY_SOLD', 'SOLD_OUT', 'CANCELLED']`

### Foreign Key & Referential Integrity on Deletion
In `database/schema/02_create_constraints.sql`, `orders.harvest_id` has an `ON DELETE RESTRICT` foreign key constraint:
- Before executing a harvest deletion, `HarvestRepository.countOrdersByHarvestId(harvestId)` verifies whether any orders reference this lot.
- If order count $> 0$, deletion is blocked and a structured **HTTP 400 Bad Request** is returned:
  > *"Cannot delete harvest #X because N order(s) are associated with it. You can mark its status as CANCELLED instead."*
- If no orders reference it, the lot is safely deleted from MySQL.

---

## 4. REST API Endpoint Specifications

### 4.1. Agricultural Crop Catalog

#### `GET /api/crops`
- **Access**: Authenticated users (`ROLE_FARMER`, `ROLE_BUYER`, `ROLE_ADMIN`)
- **Description**: Returns the full catalog of crops sorted alphabetically.
- **Response**: `200 OK`
```json
{
  "status": 200,
  "message": "Crops retrieved successfully",
  "data": [
    {
      "cropId": 5,
      "cropName": "Alphonso Mango",
      "category": "FRUIT",
      "season": "ZAID",
      "description": "Export grade naturally ripened sweet Alphonso mangoes"
    },
    {
      "cropId": 2,
      "cropName": "Basmati Rice (1121)",
      "category": "CEREAL",
      "season": "KHARIF",
      "description": "Aromatic long-grain premium basmati paddy"
    }
  ]
}
```

#### `GET /api/crops/{id}`
- **Access**: Authenticated users
- **Description**: Returns details for a single crop by ID.

---

### 4.2. Farmer Profile

#### `GET /api/farmer/profile`
- **Access**: `ROLE_FARMER`
- **Description**: Retrieves current farmer's profile, farm specifications, and live harvest statistics.
- **Response**: `200 OK`
```json
{
  "status": 200,
  "message": "Farmer profile retrieved successfully",
  "data": {
    "farmerId": 2,
    "fullName": "Rajesh Patel",
    "email": "rajesh.patel@kisan.in",
    "phone": "+919811122233",
    "farmLocation": "Nashik, Maharashtra",
    "farmSizeAcres": 15.50,
    "experienceYears": 12,
    "totalHarvestsCount": 2,
    "activeHarvestsCount": 2
  }
}
```

#### `PUT /api/farmer/profile`
- **Access**: `ROLE_FARMER`
- **Description**: Updates farm location, farm size in acres, and experience years.

---

### 4.3. Harvest Management

#### `POST /api/farmer/harvests`
- **Access**: `ROLE_FARMER`
- **Request Body**:
```json
{
  "cropId": 1,
  "quantity": 1000.00,
  "pricePerKg": 25.00,
  "harvestDate": "2026-10-01",
  "location": "Nashik Farm Sector 4"
}
```
- **Response**: `201 Created`
```json
{
  "status": 200,
  "message": "Harvest lot created successfully",
  "data": {
    "harvestId": 10,
    "farmerId": 2,
    "farmerName": "Rajesh Patel",
    "cropId": 1,
    "cropName": "Tomato (Hybrid Red)",
    "cropCategory": "VEGETABLE",
    "cropSeason": "ALL_SEASON",
    "initialQuantity": 1000.00,
    "availableQuantity": 1000.00,
    "pricePerKg": 25.00,
    "harvestDate": "2026-10-01",
    "location": "Nashik Farm Sector 4",
    "status": "AVAILABLE"
  }
}
```

#### `GET /api/farmer/harvests`
- **Access**: `ROLE_FARMER`
- **Description**: Retrieves all harvest lots listed by the authenticated farmer, newest first.
- **Response**: `200 OK`

#### `GET /api/farmer/harvests/{id}`
- **Access**: `ROLE_FARMER` (Owner only)
- **Response**: `200 OK` or `403 Forbidden` if not owner.

#### `PUT /api/farmer/harvests/{id}`
- **Access**: `ROLE_FARMER` (Owner only)
- **Request Body**:
```json
{
  "pricePerKg": 28.50,
  "availableQuantity": 900.00,
  "location": "Nashik Cold Storage Unit 2",
  "status": "AVAILABLE"
}
```
- **Response**: `200 OK` or `403 Forbidden`

#### `DELETE /api/farmer/harvests/{id}`
- **Access**: `ROLE_FARMER` (Owner only)
- **Response**: `200 OK` if unreferenced, or `400 Bad Request` if referenced by customer orders.

---

## 5. Frontend Implementation

The frontend at `frontend/` was extended to include the **Farmer Dashboard** when a user with `ROLE_FARMER` authenticates:
1. **Farmer Overview Statistics Bar**:
   - Displays Farm Location, Farm Size (Acres), Experience (Years), Total Harvests, and Active Listed Lots.
   - Quick action: "✏️ Edit Farm Profile" opens modal to update farm specs.
2. **Add New Harvest Lot Form**:
   - Asynchronously loads crops from `GET /api/crops` into a styled `<select>`.
   - Inputs for Quantity (kg), Price per kg (₹), Harvest Date (defaults to today), and Location (pre-filled from farm profile).
   - Validates input client-side and server-side with inline field errors.
3. **My Harvested Lots Table & Inventory Tracking**:
   - Filter tabs: `All Lots`, `Available`, `Partially Sold`, `Sold Out`, `Cancelled` with real-time lot count badges.
   - Displays Lot ID badge (`#H-1`), Crop name with Category badge, Available/Initial quantity, Price/kg, Harvest date, Location, and Status pill.
   - Action buttons: "✏️ Edit" opens edit modal; "🗑️ Delete" safely deletes or suggests cancellation if orders exist.
4. **Edit Harvest Modal**:
   - Allows updating available quantity (capped at initial quantity), unit price, harvest date, location, and status.

---

## 6. Testing & Quality Verification

### 6.1. Automated Maven Test Suite
Ran `.\mvnw.cmd test`:
- **Total Tests Run**: 64
- **Failures**: 0
- **Errors**: 0
- **Skipped**: 0
- **Build Result**: `BUILD SUCCESS`

Test classes include:
- `HarvestServiceTest`: 14 unit tests verifying business constraints, edge cases, zero/negative validations, ownership isolation, and order dependency safety.
- `FarmerHarvestIntegrationTest`: 16 integration tests verifying real MySQL persistence, HTTP status codes, security filters, role barriers, and cascade safety.
- `SecurityIntegrationTest`: 10 RBAC and JWT security tests.
- `AuthDatabaseIntegrationTest`: 6 database transaction tests.
- `AuthServiceTest`: 10 service tests.
- `AuthControllerTest`: 7 web tier tests.
- `AgriConnectApplicationTests`: Foundation health tests.

### 6.2. Live API Testing
Verified against live Spring Boot backend (`http://localhost:8080`):
- `GET /api/health` $\rightarrow$ 200 OK (`Connected (agriconnect_db)`)
- `POST /api/auth/login` as Farmer $\rightarrow$ 200 OK with JWT
- `GET /api/crops` $\rightarrow$ 200 OK (returned 6 crops)
- `GET /api/farmer/profile` $\rightarrow$ 200 OK (returned Rajesh Patel, Nashik, 2 harvests)
- `POST /api/farmer/harvests` $\rightarrow$ 201 Created (Created Lot `#H-11`)
- `PUT /api/farmer/harvests/11` $\rightarrow$ 200 OK (Updated price to ₹29.50)
- `DELETE /api/farmer/harvests/1` (with orders) $\rightarrow$ 400 Bad Request (blocked delete)
- `DELETE /api/farmer/harvests/11` (unreferenced) $\rightarrow$ 200 OK (safely deleted)
- BUYER accessing `/api/farmer/harvests` $\rightarrow$ 403 Forbidden
- Logged-out token accessing protected API $\rightarrow$ 401 Unauthorized

### 6.3. Automated Browser Subagent Flow
Automated browser subagent verified the user flow:
- Sign in as Farmer (`Rajesh Patel`).
- Farmer Dashboard stats and harvest table rendered.
- Added harvest lot for `Basmati Rice (1121)`, 500 kg, ₹68.00.
- Updated price to ₹72.50 via modal.
- Deleted new lot.
- Signed out and returned to authentication screen.
- Screen recording generated: `farmer_harvest_full_demo.webp`.

---

## 7. Strict Phase Boundary Confirmation

Phase 4 strictly adheres to its boundary and **does NOT implement**:
- Quality assessments, quality scores, or quality grades (Phase 5)
- Buyer requirements posting (Phase 6)
- Quality-aware matching algorithm (Phase 7)
- Order placement or order contracts (Phase 8)
- Delivery tracking (Phase 9)
- Payments (Phase 10)
- Market price history analytics (Phase 11)
- Admin dashboards (Phase 12)
