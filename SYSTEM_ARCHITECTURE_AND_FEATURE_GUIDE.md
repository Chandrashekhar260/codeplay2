# Srujana (DataSentinel) — Comprehensive Architecture & Feature Guide

> **Target:** Complete, granular, end-to-end breakdown of every feature, technology stack choice, database schema, data flow, API payload, and background mathematical algorithm powering the Srujana DPDP compliance platform.

---

## 📑 Table of Contents
1. [Executive Summary & Purpose](#1-executive-summary--purpose)
2. [Complete Technology Stack](#2-complete-technology-stack)
3. [System Architecture & End-to-End Request Flow](#3-system-architecture--end-to-end-request-flow)
4. [Granular Feature-by-Feature Deep Dive](#4-granular-feature-by-feature-deep-dive)
   - [Feature 1: Multi-Tenant Workspace & Authentication](#feature-1-multi-tenant-workspace--authentication)
   - [Feature 2: Data Discovery & Offline Python PII Scanner](#feature-2-data-discovery--offline-python-pii-scanner)
   - [Feature 3: RoPA (Record of Processing Activities) & React Flow Graph](#feature-3-ropa-record-of-processing-activities--react-flow-graph)
   - [Feature 4: Statutory Governance & Rules Engine](#feature-4-statutory-governance--rules-engine)
   - [Feature 5: Consent Management, Ledger & Multilingual Notices](#feature-5-consent-management-ledger--multilingual-notices)
   - [Feature 6: Data Principal Rights (DSR / SAR) & Citizen Portal](#feature-6-data-principal-rights-dsr--sar--citizen-portal)
   - [Feature 7: Cookie & Tracker Governance](#feature-7-cookie--tracker-governance)
   - [Feature 8: Append-Only Immutable Audit Trail](#feature-8-append-only-immutable-audit-trail)
5. [Database Schema (Prisma & PostgreSQL) Reference](#5-database-schema-prisma--postgresql-reference)
6. [Frontend Architecture & UI Component Design](#6-frontend-architecture--ui-component-design)
7. [Repository File & Directory Structure](#7-repository-file--directory-structure)
8. [Setup, Environment Variables & Execution Guide](#8-setup-environment-variables--execution-guide)

---

## 1. Executive Summary & Purpose

### What is Srujana (DataSentinel)?
**Srujana (DataSentinel)** is a specialized, enterprise-grade Data Privacy and Governance platform engineered specifically for the **Digital Personal Data Protection Act, 2023 (DPDP Act 2023)** and **DPDP Rules 2025** of India.

### Why was it built?
Most global privacy solutions (e.g., OneTrust, BigID) are designed around Western regulations (GDPR, CCPA), costing tens of thousands of dollars annually, and lack awareness of:
1. **Indian Statutory Identifiers:** 12-digit Aadhaar cards, 10-character Permanent Account Numbers (PAN), and Indian 10-digit mobile phone numbers.
2. **Eighth Schedule Multilingual Mandate:** DPDP Section 5 requires data fiduciaries to provide statutory privacy notices in English and all 22 scheduled Indian languages (such as Hindi, Kannada, Tamil, Telugu, etc.).
3. **Statutory Legal Conflicts:** Section 12 Data Erasure rights often conflict with Indian tax obligations (e.g., **CGST Act Section 36** requiring 72-month invoice record preservation, and National Medical Commission rules for clinical notes).
4. **Micro, Small, and Medium Enterprises (MSMEs):** Indian MSMEs (dental clinics, diagnostic labs, retailers, coaching academies) process high-risk patient/customer data over informal channels like WhatsApp, unencrypted Excel sheets, and paper slips without legal safeguards.

DataSentinel solves this with a **zero-hallucination, deterministic, offline-capable platform** that automates discovery, consent receipts, RoPA registers, citizen portals, and cookie compliance.

---

## 2. Complete Technology Stack

| Layer | Technology | Purpose & Rationale |
| :--- | :--- | :--- |
| **Frontend UI Framework** | **React 18 + Vite** | High-performance SPA with fast HMR (Hot Module Replacement) and optimized production bundles. |
| **Frontend Language** | **TypeScript (Strict Mode)** | Complete end-to-end type safety across API interfaces, components, and props. |
| **Frontend Styling** | **Tailwind CSS + Vanilla CSS** | Enterprise data-dense design system (`border-slate-200`, `font-mono` numerals, status badges, zero AI tropes). |
| **UI Iconography** | **Lucide React** | Consistent, professional, pixel-perfect SVG iconography across all modules. |
| **Data Flow Graph** | **@xyflow/react (React Flow)** | Interactive node-edge relationship visualization of data pipelines (`DataSource` ➔ `Activity` ➔ `Storage` ➔ `Recipients`). |
| **Backend API Engine** | **Node.js (v18+) + Express** | High-throughput asynchronous REST API structured as a Modular Monolith. |
| **Backend Language** | **TypeScript** | Strict compile-time validation of controllers, routes, middleware, and services. |
| **Schema Validation** | **Zod** | Runtime input sanitization and strict payload validation for statutory compliance. |
| **Database & ORM** | **PostgreSQL (Neon Serverless) + Prisma ORM** | ACID-compliant relational data store with automated migrations and strict tenant isolation. |
| **File Processing & PII Engine** | **Python 3.10 + Pandas + OpenPyXL** | Native, offline execution of tabular inspection without leaking data to cloud LLMs. |
| **Mathematical Algorithms** | **Verhoeff Checksum Algorithm** | Dihedral group $D_5$ check digit verification eliminating false positives for Indian Aadhaar cards. |
| **Authentication & Tokens** | **JSON Web Tokens (JWT) + Bcrypt** | Salted password hashing (rounds = 10) and stateless Bearer authorization headers. |
| **Cryptographic Hashing** | **Node.js Crypto (`crypto.createHash('sha256')`)** | Tamper-evident digital signatures for Consent Receipts and DSR Completion Certificates. |

---

## 3. System Architecture & End-to-End Request Flow

Srujana is structured as a **Modular Monolith**. Every functional privacy domain lives in its own decoupled module (`modules/auth`, `modules/discovery`, `modules/mapping`, `modules/governance`, `modules/consent`, `modules/dsr`, `modules/cookies`, `modules/audit`).

### End-to-End Request Lifecycle:
```text
[ Citizen / Admin Browser ]
         │
         │  1. HTTP Request (e.g. POST /api/v1/consent/records)
         │     Bearer JWT in "Authorization: Bearer <token>"
         ▼
[ Vite Dev Server Proxy (Port 3000) ]
         │  Proxies requests matching /api/* to Port 5000
         ▼
[ Express Application (Port 5000) ]
         │
         ├──► 2. Global Middleware (cors, helmet, express.json())
         │
         ├──► 3. Auth & Tenant Context Middleware (`authMiddleware.ts`)
         │      - Verifies JWT secret signature
         │      - Extracts `tenantId`, `userId`, `role`
         │      - Attaches to `req.tenantId` and `req.user`
         │
         ├──► 4. Zod Request Body Validation (`validateBody(schema)`)
         │      - Returns HTTP 400 with exact error details if payload is malformed
         │
         ├──► 5. Module Controller (e.g., `consent.controller.ts`)
         │      - Extracts verified params and calls service layer
         │
         ├──► 6. Module Service (e.g., `consent.service.ts`)
         │      - Executes business logic & statutory DPDP legal guardrails
         │      - Calls Prisma Client with mandatory `where: { tenantId }` filter
         │
         ├──► 7. Database & Background Processes
         │      ├─► PostgreSQL (Neon DB) reads/writes
         │      ├─► Spawn Python sub-process (for PII file scanning)
         │      └─► Append-only Audit Service (`auditService.logEvent()`)
         │
         ▼
[ HTTP 200/201 JSON Response to Frontend Client ]
```

---

## 4. Granular Feature-by-Feature Deep Dive

---

### Feature 1: Multi-Tenant Workspace & Dual Authentication (MSME vs Citizen)

#### Purpose
Ensures complete logical isolation between different businesses (e.g., Dental Clinic A vs. Diagnostic Lab B), while empowering individual citizens to access their personal privacy vault. Both archetypes can securely register, sign in, persist sessions, and log out cleanly.

#### How It Works (Step-by-Step)
1. **Dual Role Architecture:**
   - **🏢 MSME Company (Data Fiduciary):** Businesses, hospitals, polyclinics, and retailers managing statutory DPDP compliance. Requires company name, admin credentials, and contact details. Onboarding automatically seeds `ADMIN`, `COMPLIANCE_OFFICER`, and `VIEWER` roles and grants access to the Enterprise Compliance Dashboard.
   - **👤 Individual User (Data Principal / Citizen):** Citizens, patients, and consumers exercising their DPDP Section 11–13 privacy rights. Requires name, personal email, and mobile phone number (for WhatsApp/SMS statutory notices). Automatically creates a personal privacy vault (`plan: CITIZEN`, role `CITIZEN`) and routes to the Citizen Privacy Rights Portal.
2. **Registration (`POST /api/v1/auth/register`):**
   - User submits `{ userType: 'MSME' | 'CITIZEN', tenantName?, email, password, firstName, lastName?, phone? }`.
   - The backend runs `bcrypt.hash(password, 12)` to produce a secure password hash.
   - For MSME: Creates a business tenant workspace with `plan: 'STARTER'`, seeds roles (`ADMIN`, `COMPLIANCE_OFFICER`, `VIEWER`), and creates the Admin user.
   - For Citizen: Creates a personal privacy vault tenant with `plan: 'CITIZEN'`, seeds role (`CITIZEN`), and creates the citizen user.
   - An append-only audit event (`AUTH_REGISTER_MSME` or `AUTH_REGISTER_CITIZEN`) is logged into `audit_events`.
   - Signs and returns a JWT token with user profile and tenant details.
3. **Login (`POST /api/v1/auth/login`):**
   - Verifies credentials against `bcrypt.compare()`.
   - Built-in 1-click Demo credentials for rapid testing:
     - Demo MSME: `ramesh.kumar@aarogyadiagnostics.in` / `Password123!`
     - Demo Citizen: `rahul.sharma@example.com` / `Password123!` (automatically auto-seeded if testing for the first time).
   - Generates and returns stateless JWT token.
4. **Session Persistence & Clean Sign Out:**
   - `datasentinel_token` and `datasentinel_user` are saved in `localStorage`. Normal browser reloads maintain the active session without premature session expiry.
   - **Universal Sign Out:** Both the MSME Topbar, Sidebar footer, and Citizen Portal header feature a dedicated **"Sign Out"** button. Clicking it clears the session tokens, resets workspace state, and reopens the dual Login/Signup modal.
5. **Tenant Context Enforcement (`authMiddleware.ts`):**
   - Every protected API endpoint verifies the JWT and attaches `req.tenantId` and `req.user`. Every single Prisma database query strictly appends `where: { tenantId: req.tenantId }`.

---

### Feature 2: Data Discovery & Offline Python PII Scanner

#### Purpose
Identifies sensitive Indian personal data hidden inside Excel files, CSVs, or customer rosters uploaded by business users, without sending raw personal data to cloud LLMs or third parties.

#### How It Works (Step-by-Step)
1. **Upload & Private Storage (`POST /api/v1/discovery/upload`):**
   - Multi-part form upload handled by Multer.
   - Saved locally to `uploads/<tenantId>/<filename>`.
   - Creates a `DataSource` entry with status `REGISTERED`.
2. **Background Process Spawning (`discovery.service.ts`):**
   - The Node.js service launches a child process:
     ```bash
     python backend/src/python/scanner.py "uploads/<tenantId>/<file>.xlsx"
     ```
3. **Python Scanner Execution (`scanner.py`):**
   - Reads sheets using `pandas` and `openpyxl`.
   - Iterates through columns and row cells.
   - **Indian Aadhaar Detection using Verhoeff Checksum:**
     A standard 12-digit number has a high false-positive rate. Indian Aadhaar cards utilize the **Verhoeff algorithm** (based on the dihedral group $D_5$ permutation and multiplication tables):
     ```python
     def validate_verhoeff_aadhaar(number_str: str) -> bool:
         clean = re.sub(r'[\s\-]', '', str(number_str))
         if not re.match(r'^[2-9]\d{11}$', clean):
             return False
         c = 0
         reversed_digits = [int(x) for x in reversed(clean)]
         for i, digit in enumerate(reversed_digits):
             c = VERHOEFF_D[c][VERHOEFF_P[i % 8][digit]]
         return c == 0
     ```
   - **Indian PAN Card Heuristic:** Regular expression `^[A-Z]{5}[0-9]{4}[A-Z]$`.
   - **Indian Mobile Phone Heuristic:** Regular expression `^(?:\+91[\-\s]?)?[6-9]\d{9}$`.
   - **Clinical / Health Data Heuristic:** Keyword dictionary matching: `prescription`, `diagnosis`, `blood`, `tsh`, `glucose`, `biopsy`, `dosage`, `treatment`.
4. **Output Ingestion:**
   - The Python script outputs a standardized JSON structure to `stdout`.
   - The Node.js backend parses the output, records `ScanJob` with `findingsCount`, stores all `ScanFinding` rows, and raises `RemediationFlag` entries (e.g., `UNENCRYPTED_CRITICAL_PII` with severity `CRITICAL`).

---

### Feature 3: RoPA (Record of Processing Activities) & React Flow Graph

#### Purpose
DPDP Act Section 8 mandates that data fiduciaries maintain transparent records of why they collect data, where it flows, who receives it, and when it is destroyed.

#### How It Works (Step-by-Step)
1. **Activity Registration (`POST /api/v1/mapping/activities`):**
   - Registers a business processing activity (e.g., *"Patient Consultation & Lab Report Dispatch"*).
   - Links to `legal_basis` (such as `CONSENT` or `STATUTORY_OBLIGATION`).
   - Can automatically import PII fields discovered in Feature 2 into `data_elements`.
2. **Lifecycle Flow Mapping:**
   - Tracks data movement across lifecycle stages: `COLLECTION`, `STORAGE`, `SHARING`, `DISPOSAL`.
   - Identifies systems: *WhatsApp*, *Tally ERP*, *Local Drive*, *AWS S3*.
   - Records third-party recipients (`Meta/WhatsApp`, `Diagnostic Cloud`).
3. **Interactive Visual Relationship Graph (`GET /api/v1/mapping/graph`):**
   - The backend service queries the database and transforms activities, flows, and systems into standard **React Flow** structures:
     - **Nodes:** Sources (cylinder), Activities (rectangle), Storage systems (server), Third-party recipients (globe).
     - **Edges:** Directed connections showing data movement with animated dotted lines.
   - Rendered in [`RopaPage.tsx`](file:///c:/Users/chandrashekhar/Downloads/srujan/srujana/frontend/src/pages/RopaPage.tsx) with interactive pan, zoom, mini-map, and details drawer.

---

### Feature 4: Statutory Governance & Rules Engine

#### Purpose
Enforces statutory compliance rules without generative AI hallucinations. Resolves data asset classifications and retention schedules deterministically.

#### Built-in Legal Rules Catalog (`governance.rules.ts`)
1. **Classification Tiering:**
   - `RESTRICTED`: Aadhaar, Biometrics, Health & Clinical diagnostics.
   - `CONFIDENTIAL`: PAN, Mobile Phone, Email, Physical Address.
   - `INTERNAL`: Employee IDs, Internal audit memos.
   - `PUBLIC`: Public press releases, Disclosed policies.
2. **Statutory Retention Rules:**
   - **Finance & Tax Records:** 72 Months (2,160 Days) under **Section 36 of Central Goods & Services Tax (CGST) Act 2017**.
   - **Security Access Logs:** 12 Months under **DPDP Rules 2025 Rule 6(1)(e)**.
   - **Clinical Patient Records:** 36 Months under National Medical Commission guidelines.
   - **Marketing Leads:** Immediate disposal upon consent withdrawal.
3. **Automated Asset Registration (`POST /api/v1/governance/assets`):**
   - When an asset is registered, the engine inspects the data categories and automatically sets the highest severity classification and calculates statutory `retention_days`.

---

### Feature 5: Consent Management, Ledger & Multilingual Notices

#### Purpose
Under DPDP Section 5 & 6, consent must be **free, specific, informed, unconditional, and unambiguous with clear affirmative action**. Pre-ticked boxes and deemed consent are illegal.

#### Key Mechanics
1. **Multilingual Notice Generator (`GET /api/v1/consent/notices?lang=...`):**
   - Serves pre-configured legal notices in:
     - **English (`en`)**
     - **हिन्दी Hindi (`hi`)**
     - **ಕನ್ನಡ Kannada (`kn`)**
   - Displays purpose, specific data categories collected, data principal rights, and DPO grievance contact info.
2. **Affirmative Action Guard (`POST /api/v1/consent/records`):**
   - Payload requires `channel` (`WHATSAPP_YES`, `PAPER_SLIP`, `WEB_PORTAL`, `RECEPTION_DESK`).
   - If affirmative action is missing or pre-selected, the backend rejects the transaction with `HTTP 400 DPDP_SEC_6_VIOLATION`.
3. **Statutory Consent Receipt:**
   - Every consent event generates a verifiable receipt.
   - A cryptographic SHA-256 hash digest is generated over:
     $$\text{Digest} = \text{SHA256}(\text{TenantId} + \text{UserRef} + \text{PurposeId} + \text{CapturedAt})$$
   - Can be exported as proof during regulatory audits by the Data Protection Board of India (DPBI).
4. **Immediate Withdrawal (`POST /api/v1/consent/records/withdraw`):**
   - Implements DPDP Section 6(4). Allows instant withdrawal of consent with a timestamped record in the ledger.

---

### Feature 6: Data Principal Rights (DSR / SAR) & Citizen Portal

#### Purpose
Enables citizens to exercise their statutory rights:
- **Right to Access (Section 11)**
- **Right to Correction & Updating (Section 12)**
- **Right to Erasure (Section 12(3))**
- **Right to Grievance Redressal (Section 13)**

#### How It Works
1. **Citizen Self-Service Portal (`DataPrincipalPortal.tsx`):**
   - Accessible via `#portal` hash link without needing internal admin credentials.
   - Citizen enters phone/email, selects request type, specifies details, and submits.
2. **Statutory Tax Retention Conflict Lock:**
   - Under Section 12(3), a citizen may request full erasure of their records.
   - **The Conflict:** If the business deletes invoice and payment data, they violate **Section 36 of CGST Act 2017** (punishable by tax authorities).
   - **DataSentinel's Solution:** When an erasure request touches financial or billing processing activities, the system automatically engages the `taxRetentionLock: true`.
   - The status updates to `RETAINED_TAX_CONFLICT`. The user's marketing/clinical data is marked for erasure, while billing records remain cryptographically locked until the 72-month period expires.
3. **Resolution & SHA-256 Certificate:**
   - Upon completion, the backend computes a SHA-256 audit proof and issues a tamper-evident Certificate of Fulfillment to the citizen.

---

### Feature 7: Cookie & Tracker Governance

#### Purpose
Websites operating in India must ensure that non-essential tracking cookies and marketing scripts (Google Analytics, Meta Pixel, Hotjar) do not fire before consent is explicitly given.

#### How It Works
1. **Crawler & Scanner (`cookie.scanner.ts`):**
   - Scans target website URLs and detects known script tags, `document.cookie` writers, and network requests.
   - Categorizes trackers into:
     - `NECESSARY`: Session tokens, CSRF protection (allowed by default).
     - `ANALYTICS`: Google Analytics, Mixpanel (blocked until consent).
     - `MARKETING`: Meta Pixel, Google Ads (blocked until consent).
     - `FUNCTIONAL`: Language preferences, video players.
2. **Banner Embed Script Generator (`cookie.service.ts`):**
   - Generates a lightweight, zero-dependency JavaScript snippet (`datasentinel-cookie.js`) that webmasters embed in their website header `<head>`.
   - The snippet intercepts DOM script injection and holds scripts with `type="text/plain"` until the user clicks "Accept" on the banner.

---

### Feature 8: Append-Only Immutable Audit Trail

#### Purpose
Guarantees non-repudiation for regulatory investigations by the Data Protection Board of India (DPBI). Every sensitive event in the platform is recorded permanently.

#### How It Works
1. Every module calls:
   ```typescript
   await auditService.logEvent({
     tenantId,
     actorId: req.user?.userId,
     action: 'CONSENT_WITHDRAWN',
     resourceType: 'CONSENT_RECORD',
     resourceId: record.recordId,
     diffJson: JSON.stringify({ oldStatus: 'GIVEN', newStatus: 'WITHDRAWN' }),
     ipAddress: req.ip,
     userAgent: req.headers['user-agent']
   });
   ```
2. The `audit_events` table contains no `UPDATE` or `DELETE` endpoints in the API. It is strictly append-only.
3. Displayed live on the `/audit` page with chronological filtering.

---

## 5. Database Schema (Prisma & PostgreSQL) Reference

The system database schema is organized into 8 interconnected domains:

```mermaid
erDiagram
    TENANTS ||--o{ USERS : "has"
    TENANTS ||--o{ DATA_SOURCES : "owns"
    TENANTS ||--o{ PROCESSING_ACTIVITIES : "defines"
    TENANTS ||--o{ DATA_ASSETS : "governs"
    TENANTS ||--o{ PURPOSES : "creates"
    TENANTS ||--o{ CONSENT_RECORDS : "tracks"
    TENANTS ||--o{ DSR_REQUESTS : "manages"
    TENANTS ||--o{ AUDIT_EVENTS : "records"

    DATA_SOURCES ||--o{ SCAN_JOBS : "executes"
    SCAN_JOBS ||--o{ SCAN_FINDINGS : "identifies"
    DATA_SOURCES ||--o{ REMEDIATION_FLAGS : "triggers"

    PROCESSING_ACTIVITIES ||--o{ DATA_ELEMENTS : "contains"
    PROCESSING_ACTIVITIES ||--o{ DATA_FLOWS : "routes"
    PROCESSING_ACTIVITIES ||--o{ THIRD_PARTY_RECIPIENTS : "shares"
    PROCESSING_ACTIVITIES ||--o{ RETENTION_POLICIES : "schedules"

    PURPOSES ||--o{ CONSENT_RECORDS : "validates"
    PROCESSING_ACTIVITIES ||--o{ DSR_REQUESTS : "affects"
```

### Key Models & Their Columns:
- **`tenants`**: `tenant_id` (PK, UUID), `name`, `plan`, `status`, `created_at`.
- **`users`**: `user_id` (PK, UUID), `tenant_id` (FK), `email`, `password_hash`, `first_name`, `last_name`.
- **`data_sources`**: `source_id` (PK, UUID), `tenant_id` (FK), `name`, `source_type`, `config`, `status`.
- **`scan_findings`**: `finding_id` (PK, UUID), `job_id` (FK), `field_name`, `pii_categories`, `sensitivity_level`.
- **`processing_activities`**: `activity_id` (PK, UUID), `tenant_id` (FK), `name`, `business_function`, `legal_basis`.
- **`data_flows`**: `flow_id` (PK, UUID), `activity_id` (FK), `flow_stage`, `system_name`, `location`, `safeguards`.
- **`consent_records`**: `record_id` (PK, UUID), `tenant_id` (FK), `user_ref`, `purpose_id` (FK), `status`, `channel`, `captured_at`, `withdrawn_at`.
- **`dsr_requests`**: `request_id` (PK, UUID), `tenant_id` (FK), `request_type`, `status`, `user_ref`, `tax_retention_lock`, `sha256_proof`.
- **`audit_events`**: `event_id` (PK, UUID), `tenant_id` (FK), `actor_id` (FK), `action`, `resource_type`, `diff_json`, `created_at`.

---

## 6. Frontend Architecture & UI Component Design

### Directory Structure & Responsibilities
```text
frontend/src/
├── api/
│   └── client.ts             # Central Axios/Fetch API client with JWT attachment & error normalization
├── components/
│   ├── auth/LoginModal.tsx   # Login and registration modal dialog
│   ├── layout/
│   │   ├── Sidebar.tsx       # Enterprise navigation menu with DPDP section indicators
│   │   └── Topbar.tsx        # Tenant workspace indicator, search, refresh, citizen portal button
│   └── ui/
│       └── Badge.tsx         # Universal status, classification, and severity badges
├── pages/
│   ├── OverviewPage.tsx      # Executive DPDP compliance score, risk counter, penalty liability
│   ├── DiscoveryPage.tsx     # File upload dropzone, discovered PII fields, remediation flags
│   ├── RopaPage.tsx          # RoPA data table + interactive React Flow visual graph
│   ├── GovernancePage.tsx    # Governed data assets & statutory rules matrix
│   ├── ConsentPage.tsx       # Multilingual notice preview, affirmative recorder, consent ledger
│   ├── DsrAdminPage.tsx      # Admin dashboard for processing citizen requests & tax locks
│   ├── CookieGovernancePage.tsx # Cookie scanner, categorizer, and embed code generator
│   ├── DataPrincipalPortal.tsx  # Standalone citizen self-service portal (#portal)
│   └── AuditPage.tsx         # Live append-only system audit stream
├── types/
│   └── index.ts              # Universal TypeScript interfaces matching backend models
├── App.tsx                   # Main router state, hash-based tab navigation, authentication state
└── main.tsx                  # Application bootstrap entry point
```

### Design Standards & Aesthetics
- **High Information Density:** Designed for compliance officers, legal counsels, and data protection officers.
- **Color Coding Hierarchy:**
  - `RESTRICTED` / `CRITICAL`: Rose (`bg-rose-50 text-rose-800 border-rose-200`)
  - `CONFIDENTIAL` / `HIGH`: Amber (`bg-amber-50 text-amber-800 border-amber-200`)
  - `INTERNAL` / `MEDIUM`: Slate/Blue (`bg-slate-100 text-slate-800 border-slate-300`)
  - `PUBLIC` / `SUCCESS`: Emerald (`bg-emerald-50 text-emerald-800 border-emerald-200`)
- **Tabular Numerals (`font-mono`):** Applied to timestamps, Aadhaar counts, penalty amounts (e.g. `₹250 Crore`), and SHA-256 hashes to guarantee aligned, readable tables.

---

## 7. Repository File & Directory Structure

```text
srujana/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma        # Complete database schema definitions (429 lines)
│   ├── src/
│   │   ├── config/              # Environment config & constants
│   │   ├── lib/                 # Prisma client instance & shared utilities
│   │   ├── middleware/          # authMiddleware, tenantIsolation, errorHandler
│   │   ├── modules/
│   │   │   ├── audit/           # Audit event logger & viewer
│   │   │   ├── auth/            # Registration, login, profile, RBAC
│   │   │   ├── consent/         # Multilingual notices, ledger, affirmative recorder
│   │   │   ├── cookies/         # Scanner, categorization, embed script
│   │   │   ├── discovery/       # File upload handler & Python orchestrator
│   │   │   ├── dsr/             # Data Principal Rights, tax conflict locks
│   │   │   ├── governance/      # Asset classification & statutory rules
│   │   │   ├── mapping/         # RoPA inventory & React Flow graph generator
│   │   │   └── platform/        # Tenant metrics & workspace settings
│   │   ├── python/
│   │   │   └── scanner.py       # Offline Python PII scanner with Verhoeff algorithm
│   │   ├── types/               # Express request augmentations & module types
│   │   ├── app.ts               # Express app initialization & route registration
│   │   └── index.ts             # Server startup entry point (Port 5000)
│   ├── uploads/                 # Private local storage for uploaded data files
│   ├── package.json             # Backend dependencies & npm scripts
│   └── tsconfig.json            # TypeScript configuration
│
├── frontend/
│   ├── src/                     # React application source code (see Section 6)
│   ├── index.html               # Main HTML entry point
│   ├── package.json             # Frontend dependencies & Vite scripts
│   ├── tailwind.config.js       # Tailwind CSS configuration
│   ├── tsconfig.json            # Frontend TypeScript configuration
│   └── vite.config.ts           # Vite build config with backend proxy setup
│
├── BUILD_PROGRESS.md            # Historic development and verification changelog
├── README.md                    # Quick-start documentation and project overview
└── SYSTEM_ARCHITECTURE_AND_FEATURE_GUIDE.md # (This Document) Complete architectural reference
```

---

## 8. Setup, Environment Variables & Execution Guide

### 1. Prerequisites
- **Node.js:** v18.0.0 or higher
- **Python:** v3.10 or higher with `pandas` and `openpyxl` installed (`pip install pandas openpyxl`)
- **PostgreSQL Database:** Local PostgreSQL instance or cloud database (e.g., Neon Serverless Postgres).

### 2. Environment Configuration (`backend/.env`)
```env
PORT=5000
DATABASE_URL="postgresql://user:password@ep-sample-pool.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"
JWT_SECRET="your-super-secure-jwt-secret-key-32-chars-minimum"
NODE_ENV="development"
FRONTEND_URL="http://localhost:3000"
```

### 3. Database Initialization
```bash
cd backend
npx prisma generate
npx prisma db push
```

### 4. Running the Complete System
Open two terminal windows:

**Terminal 1 — Backend API:**
```bash
cd backend
npm run dev
# Starts server at http://localhost:5000
```

**Terminal 2 — Frontend Application:**
```bash
cd frontend
npm run dev
# Starts Vite dev server at http://localhost:3000
```

### 5. Accessing the Platform
- **Admin & Compliance Workspace:** Navigate to `http://localhost:3000`
- **Citizen Self-Service Portal:** Navigate to `http://localhost:3000/#portal`
