# AgriConnect — Entity-Relationship (ER) Model & Presentation Document

This document provides the formal **Entity-Relationship (ER) Diagram** and Relational Schema specification for the college DBMS project **AgriConnect — Farmer-to-Market Management System**.

---

## 1. Visual Entity-Relationship Diagram (Mermaid)

```mermaid
erDiagram
    USERS ||--o| FARMER_PROFILES : "1:1 specializes"
    USERS ||--o| BUYER_PROFILES : "1:1 specializes"
    USERS ||--o{ HARVESTS : "1:N lists"
    USERS ||--o{ BUYER_REQUIREMENTS : "1:N posts"
    USERS ||--o{ ORDERS : "1:N places"
    USERS ||--o{ QUALITY_ASSESSMENTS : "1:N inspects/verifies"
    
    CROPS ||--o{ HARVESTS : "1:N categorizes"
    CROPS ||--o{ BUYER_REQUIREMENTS : "1:N specifies"
    CROPS ||--o{ PRICE_HISTORY : "1:N tracks price"
    
    HARVESTS ||--|| QUALITY_ASSESSMENTS : "1:1 assessed by"
    HARVESTS ||--o{ ORDERS : "1:N fulfilled by"
    
    ORDERS ||--|| DELIVERIES : "1:1 delivered via"
    ORDERS ||--o{ PAYMENTS : "1:N settled by"

    USERS {
        int user_id PK
        string full_name
        string email UK
        string phone UK
        enum role "FARMER | BUYER | ADMIN"
        enum status "ACTIVE | INACTIVE | SUSPENDED"
        timestamp created_at
    }

    FARMER_PROFILES {
        int farmer_id PK, FK
        string farm_location
        decimal farm_size_acres
        int experience_years
    }

    BUYER_PROFILES {
        int buyer_id PK, FK
        string business_name
        enum business_type "WHOLESALER | RETAILER | PROCESSOR | EXPORTER"
        string gstin UK
        string business_address
    }

    CROPS {
        int crop_id PK
        string crop_name UK
        enum category "CEREAL | PULSE | VEGETABLE | FRUIT | OILSEED | SPICE | CASH_CROP"
        enum season "KHARIF | RABI | ZAID | ALL_SEASON"
        string description
    }

    HARVESTS {
        int harvest_id PK
        int farmer_id FK
        int crop_id FK
        decimal initial_quantity
        decimal available_quantity
        decimal price_per_kg
        date harvest_date
        string location
        enum status "AVAILABLE | PARTIALLY_SOLD | SOLD_OUT | CANCELLED"
    }

    QUALITY_ASSESSMENTS {
        int assessment_id PK
        int harvest_id FK, UK
        int admin_id FK
        int freshness "1-10"
        int appearance "1-10"
        int size "1-10"
        int color "1-10"
        int ripeness "1-10"
        decimal damage_percentage "0-100"
        decimal quality_score "0-100"
        enum quality_grade "A | B | C"
        enum verification_status "PENDING | VERIFIED | REJECTED"
        date assessment_date
        string inspector_notes
    }

    BUYER_REQUIREMENTS {
        int requirement_id PK
        int buyer_id FK
        int crop_id FK
        decimal required_quantity
        decimal max_price_per_kg
        enum min_quality_grade "A | B | C"
        string preferred_location
        enum status "OPEN | FULFILLED | EXPIRED | CANCELLED"
    }

    ORDERS {
        int order_id PK
        int buyer_id FK
        int harvest_id FK
        decimal quantity
        decimal agreed_price_per_kg
        decimal total_amount
        enum order_status "PENDING | CONFIRMED | SHIPPED | DELIVERED | CANCELLED"
        timestamp order_date
    }

    DELIVERIES {
        int delivery_id PK
        int order_id FK, UK
        enum delivery_status "PENDING | DISPATCHED | IN_TRANSIT | DELIVERED | FAILED"
        string tracking_number UK
        string vehicle_number
        string delivery_address
        timestamp dispatched_at
        timestamp delivered_at
    }

    PAYMENTS {
        int payment_id PK
        int order_id FK
        decimal amount
        enum payment_method "BANK_TRANSFER | UPI | CASH | CHEQUE"
        enum payment_status "PENDING | COMPLETED | FAILED | REFUNDED"
        string transaction_reference UK
        timestamp payment_date
    }

    PRICE_HISTORY {
        int price_id PK
        int crop_id FK
        decimal modal_price_per_kg
        decimal min_price_per_kg
        decimal max_price_per_kg
        string market_location
        date recorded_date
    }
```

---

## 2. Relational Mapping & Foreign Key Cardinalities

| Relationship | Cardinality | Parent Entity | Child Entity | Foreign Key | Participation |
|---|---|---|---|---|---|
| User Specialization | 1:1 (optional) | `users` | `farmer_profiles` | `farmer_profiles.farmer_id -> users.user_id` | Total for Farmer role |
| User Specialization | 1:1 (optional) | `users` | `buyer_profiles` | `buyer_profiles.buyer_id -> users.user_id` | Total for Buyer role |
| Crop Categorization | 1:N | `crops` | `harvests` | `harvests.crop_id -> crops.crop_id` | Mandatory |
| Farmer Listing | 1:N | `users` | `harvests` | `harvests.farmer_id -> users.user_id` | Mandatory |
| Quality Inspection | 1:1 | `harvests` | `quality_assessments` | `quality_assessments.harvest_id -> harvests.harvest_id` | Mandatory per inspected batch |
| Admin Verification | 1:N | `users` | `quality_assessments` | `quality_assessments.admin_id -> users.user_id` | Mandatory |
| Buyer Demand | 1:N | `users` | `buyer_requirements` | `buyer_requirements.buyer_id -> users.user_id` | Mandatory |
| Crop Requirement | 1:N | `crops` | `buyer_requirements` | `buyer_requirements.crop_id -> crops.crop_id` | Mandatory |
| Crop Price History | 1:N | `crops` | `price_history` | `price_history.crop_id -> crops.crop_id` | Mandatory |
| Harvest Order | 1:N | `harvests` | `orders` | `orders.harvest_id -> harvests.harvest_id` | Mandatory |
| Buyer Purchase | 1:N | `users` | `orders` | `orders.buyer_id -> users.user_id` | Mandatory |
| Order Delivery | 1:1 | `orders` | `deliveries` | `deliveries.order_id -> orders.order_id` | Mandatory per dispatched order |
| Order Payment | 1:N | `orders` | `payments` | `payments.order_id -> orders.order_id` | Mandatory |

---

## 3. Normalization Summary (Academic Proof)

1. **First Normal Form (1NF)**:
   - Every attribute contains only atomic, indivisible values.
   - No multi-valued attributes or repeating groups (e.g., individual payment installments are rows in `payments`, not comma-separated lists in `orders`).
   - Every table possesses an explicit primary key (`user_id`, `crop_id`, `harvest_id`, etc.).

2. **Second Normal Form (2NF)**:
   - The schema is in 1NF.
   - No partial dependencies exist: every non-key column is functionally dependent on the **whole** primary key.
   - For 1:1 profile tables (`farmer_profiles`, `buyer_profiles`), the single attribute primary key (`farmer_id`, `buyer_id`) directly determines all respective profile fields.

3. **Third Normal Form (3NF)**:
   - The schema is in 2NF.
   - No transitive dependencies ($A \to B \to C$) exist among non-key attributes:
     - `orders` references `harvest_id` and stores snapshot `agreed_price_per_kg`, but farmer and crop metadata are isolated in `users` and `crops`.
     - Quality grading attributes (`freshness`, `size`, `damage_percentage`) are partitioned into `quality_assessments` rather than cluttering `harvests`.
     - Daily mandi market rates are stored in `price_history` rather than distorting static crop definitions.
