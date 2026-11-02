# AgriConnect — Phase 3: Authentication & User Management

## 1. Architectural Overview

AgriConnect Phase 3 implements secure identity, authentication, session lifecycle, and role-based access control (RBAC) on top of the relational database architecture designed in Phase 2.

```
+-----------------------------------------------------------------------------------+
|                                  Frontend Client                                  |
|            (Vanilla JavaScript, HTML5, CSS3 - Storage: sessionStorage)             |
+-----------------------------------------+-----------------------------------------+
                                          |
                        HTTP Authorization: Bearer <JWT>
                                          |
                                          v
+-----------------------------------------------------------------------------------+
|                        Spring Boot 3.3.4 Security Engine                          |
|                                                                                   |
|  1. CorsFilter (permits localhost & file:// origins)                              |
|  2. JwtAuthenticationFilter (validates signature, expiration, blacklist)          |
|  3. SecurityFilterChain (Authorization rules & RBAC)                              |
|  4. CustomAuthenticationEntryPoint (JSON 401) & CustomAccessDeniedHandler (403)  |
+-----------------------------------------+-----------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
|                                Controller Layer                                   |
|   AuthController (/api/auth/**)          FarmerTestController (/api/farmer/test)  |
|   BuyerTestController (/api/buyer/test)  AdminTestController (/api/admin/test)    |
+-----------------------------------------+-----------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
|                     Service Layer (Transactional Business Logic)                  |
|     AuthService                 CustomUserDetailsService    TokenBlacklistService |
|     BCryptPasswordEncoder       JwtTokenProvider                                  |
+-----------------------------------------+-----------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
|                        Persistence Layer (Spring Data JPA)                        |
|     UserRepository        FarmerProfileRepository      BuyerProfileRepository     |
+-----------------------------------------+-----------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
|                            MySQL 8.0 (agriconnect_db)                             |
|          users            farmer_profiles            buyer_profiles               |
+-----------------------------------------------------------------------------------+
```

---

## 2. Authentication Strategy Decision: JWT vs. Server Sessions

### Selected Strategy: Stateless JWT (JSON Web Tokens) with Server-Side Revocation

**Rationale:**
1. **Frontend Architecture & Cross-Origin Independence**:
   The AgriConnect frontend is a lightweight Vanilla JS application that may be served from multiple environments (VS Code Live Server on `http://localhost:5500`, Python server on `http://localhost:3000`, or directly opened via `file://` protocol in browsers). Session cookies often encounter restrictive browser `SameSite` and third-party cookie policies when loaded across origins or via `file://` (which reports `Origin: null`). The `Authorization: Bearer <token>` standard header works uniformly across all transport layers without cookie cross-site restrictions.
2. **Stateless RESTful Design**:
   The backend API follows REST principles where request states are self-contained.
3. **Enterprise-Grade Token Revocation**:
   To fulfill the requirement that `POST /api/auth/logout` completely invalidates the token so subsequent requests to `/api/auth/me` and protected endpoints fail, a thread-safe `TokenBlacklistService` tracks revoked tokens until their natural expiration.
4. **Secure Secret Management**:
   The JWT signing key is derived via HMAC-SHA256 (256-bit strength) and is configurable via the `JWT_SECRET` environment variable with safe development defaults.

---

## 3. Database Schema Alignment & User Model

Phase 3 honors the relational design established in Phase 2:
- **Central User Table (`users`)**: Primary identity source for all roles (`FARMER`, `BUYER`, `ADMIN`).
- **No Duplicate Auth Tables**: All authentication credentials and role assignments are anchored strictly in `users`.
- **Specialization Profiles**:
  - `farmer_profiles` (1:1 with `users` where `role = 'FARMER'`)
  - `buyer_profiles` (1:1 with `users` where `role = 'BUYER'`)

### Schema Migration (`04_phase3_auth_migration.sql`)
In accordance with database design integrity rules, existing schema files were not overwritten. A migration script added:
- `password_hash VARCHAR(255) NOT NULL` to the `users` table.
- Backfilled existing sample accounts (`admin@agriconnect.org`, `rajesh.patel@kisan.in`, `vikas.gupta@freshmarts.com`, etc.) with secure BCrypt hashes matching the default test credential.

---

## 4. Key Security Controls

1. **Password Hashing**:
   - Implemented via Spring Security's `BCryptPasswordEncoder` (cost factor 10).
   - Passwords are never stored in plaintext.
   - Passwords and password hashes are **never returned in API responses** (omitted from `AuthResponse`, `UserResponse`, and DTOs).
   - Passwords are **never logged** in server or client console logs.
2. **Public Registration Restriction**:
   - Public registration allows only `FARMER` and `BUYER` roles.
   - Any attempt to register an `ADMIN` account via `POST /api/auth/register` is blocked with HTTP `400 Bad Request`.
3. **Atomicity & Transactional Profile Creation**:
   - The registration method (`AuthService.register()`) is annotated with `@Transactional`.
   - The creation of the `users` record and the corresponding `farmer_profiles` or `buyer_profiles` record occurs within a single transaction. If profile creation fails, the transaction is rolled back completely, preventing orphaned identity records.
4. **Validation & Conflict Handling**:
   - Enforces unique constraints for both `email` and `phone`. Duplicate submissions return HTTP `409 Conflict`.
   - Enforces format checks on email and minimum password length (minimum 6 characters).

---

## 5. REST API Specifications

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Registers a new Farmer or Buyer and returns a JWT Bearer token |
| `POST` | `/api/auth/login` | Public | Authenticates credentials and returns a JWT Bearer token |
| `GET` | `/api/auth/me` | Authenticated | Returns current authenticated user profile (safe attributes only) |
| `POST` | `/api/auth/logout` | Authenticated | Blacklists current JWT token and clears security context |
| `GET` | `/api/farmer/test` | Role: `FARMER` | Protected test endpoint verifying farmer access |
| `GET` | `/api/buyer/test` | Role: `BUYER` | Protected test endpoint verifying commercial buyer access |
| `GET` | `/api/admin/test` | Role: `ADMIN` | Protected test endpoint verifying system administrator access |
| `GET` | `/api/health` | Public | System and database health status (Phase 1 baseline) |

### Sample Payloads

#### 1. Registration (`POST /api/auth/register`)
```json
{
  "fullName": "Balram Singh",
  "email": "balram@kisan.in",
  "phone": "+919876543299",
  "password": "Password@123",
  "role": "FARMER",
  "farmLocation": "Nashik, Maharashtra",
  "farmSizeAcres": 12.5,
  "experienceYears": 10
}
```

#### Response (`201 Created`):
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "tokenType": "Bearer",
  "userId": 8,
  "fullName": "Balram Singh",
  "email": "balram@kisan.in",
  "phone": "+919876543299",
  "role": "FARMER",
  "status": "ACTIVE",
  "message": "User registered successfully as FARMER"
}
```

#### 2. Login (`POST /api/auth/login`)
```json
{
  "email": "balram@kisan.in",
  "password": "Password@123"
}
```

#### 3. Current User (`GET /api/auth/me`)
Headers: `Authorization: Bearer <token>`
```json
{
  "userId": 8,
  "fullName": "Balram Singh",
  "email": "balram@kisan.in",
  "phone": "+919876543299",
  "role": "FARMER",
  "status": "ACTIVE",
  "farmerProfile": {
    "farmerId": 8,
    "farmLocation": "Nashik, Maharashtra",
    "farmSizeAcres": 12.5,
    "experienceYears": 10
  }
}
```

---

## 6. Environment Variables

| Variable | Default Value | Description |
|---|---|---|
| `DB_HOST` | `localhost` | MySQL Server host |
| `DB_PORT` | `3306` | MySQL Server port |
| `DB_NAME` | `agriconnect_db` | Database catalog name |
| `DB_USERNAME` | `root` | Database user |
| `DB_PASSWORD` | *(empty)* | Database password |
| `JWT_SECRET` | *(internal dev key)* | 256-bit secret key used for signing JWT tokens |
| `JWT_EXPIRATION_MS`| `86400000` (24h) | JWT token lifespan in milliseconds |

---

## 7. How to Test Authentication

### Automated Tests
Run the comprehensive test suite (unit tests, MVC mock tests, security integration tests, and MySQL persistence tests):
```powershell
cd backend
.\mvnw.cmd test
```

### Manual API Testing via curl
1. **Login as existing Farmer**:
   ```bash
   curl -X POST http://localhost:8080/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"rajesh.patel@kisan.in","password":"Password@123"}'
   ```
2. **Access Farmer Protected Endpoint**:
   ```bash
   curl -X GET http://localhost:8080/api/farmer/test \
     -H "Authorization: Bearer <YOUR_TOKEN>"
   ```
3. **Attempt Access to Buyer Endpoint with Farmer Token (Expected: HTTP 403 Forbidden)**:
   ```bash
   curl -X GET http://localhost:8080/api/buyer/test \
     -H "Authorization: Bearer <YOUR_TOKEN>"
   ```
4. **Logout**:
   ```bash
   curl -X POST http://localhost:8080/api/auth/logout \
     -H "Authorization: Bearer <YOUR_TOKEN>"
   ```
