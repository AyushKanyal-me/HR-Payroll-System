# Enterprise HR & Payroll Management System

PeoplePay360 is an enterprise-grade, multi-tenant Human Resources and Payroll Management platform designed for mid-sized to enterprise organizations. It streamlines core HR workflows, employee lifecycle tracking, attendance and shift scheduling, leave management, automated tax and statutory payroll calculations, payslip generation, and immutable compliance audit logging.

---

## Key Features

### 1. Multi-Tier Role-Based Access Control (RBAC)
- Fine-grained permission architecture separating system operations across five canonical roles:
  - System Administrator: Full system oversight, tenant administration, global configuration, and security monitoring.
  - HR Manager: Department operations, position management, employee lifecycle, onboarding, and time-off request approvals.
  - Payroll Manager: Salary structures, compensation rules, payrun execution, tax computation, direct payment settlement, and payslip dispatch.
  - Payroll User: Read-only access to payroll records, payrun reports, and compensation structures.
  - Employee: Self-service portal for attendance check-ins, leave balance tracking, time-off requests, contract records, and historical payslip downloads.
- Server-side role validation middleware guarding all REST endpoints and client-side route guards ensuring seamless navigation security.

### 2. Multi-Tenant Enterprise Isolation
- Strict organization-level data boundary enforcement across all entities.
- Non-administrative requests are authenticated via scoped database clients that enforce PostgreSQL Row Level Security (RLS).
- Server-authoritative company context resolution preventing tenant parameter tampering and cross-organization data leakage.

### 3. Core HR & Employee Lifecycle Management
- Comprehensive employee records: personal profiles, emergency contacts, identification documents, and banking details.
- Organization structure modeling: hierarchical departments, job positions, and custom working schedules.
- Contract management: salary grade assignment, contract types (permanent, full-time, part-time, probation), effective date ranges, and version history.
- Kanban and tabular directory views with search, department filtering, and status tracking (Active, Inactive, Onboarding, Terminated).

### 4. Precision Payroll & Compensation Engine
- Configurable salary structures with formula-driven earning and deduction rules.
- Automated gross-to-net calculations incorporating base salary, allowances, statutory taxes, social security deductions, and unpaid leave penalties.
- Working days and shift calculations based on assigned organization schedules.
- Full payrun lifecycle management:
  - Draft creation for custom date ranges.
  - Batch computation across active employee contracts.
  - Discrepancy and warning detection (missing contracts, unapproved leaves, zero-hour anomalies).
  - One-click confirmation, payment execution, and immutable payslip snapshot generation.
- Automated PDF payslip generation and distribution tracking.

### 5. Attendance & Shift Tracking
- Multi-session daily attendance logging (Check-In / Check-Out with cumulative working hour computation).
- Real-time work status indicators (Present, Checked Out, Incomplete Sessions).
- Managerial attendance correction workflows with audit history.
- Integration with payroll calculation engine for automated loss-of-pay (LOP) deductions.

### 6. Time-Off & Leave Management
- Multi-category leave allocation management (Paid Leave, Sick Leave, Casual Leave, Unpaid Leave).
- Employee self-service request submission with reason tracking and date range validation.
- Multi-level manager approval and rejection workflows.
- Real-time leave balance computation and payroll deduction synchronization.

### 7. Immutable Audit Logging & Compliance
- Automatic logging of critical system operations (payroll confirmations, salary rule edits, employee status changes, time-off approvals).
- Detailed audit records capturing user identity, IP address, action type, entity identifier, timestamp, and request metadata.
- Searchable and filterable audit trail interface for enterprise compliance and security auditing.

### 8. Executive Dashboard & Analytics
- Real-time organization metrics: total headcounts, department headcounts, active payruns, and month-over-month payroll expenditure.
- Attendance health breakdown and leave utilization analytics.
- Interactive visualizations for department salary distribution and compensation trends.

---

## System Architecture

PeoplePay360 is built with a decoupled client-server architecture:

```
+-------------------------------------------------------------+
|                      React Frontend                         |
|  - React 18 / TypeScript / Vite                             |
|  - Custom Responsive Theme / Executive Dashboard            |
|  - Employee Self-Service Portal                             |
+------------------------------+------------------------------+
                               |
                               | REST API (Bearer JWT)
                               v
+-------------------------------------------------------------+
|                     Express.js Backend                      |
|  - TypeScript / Express / Zod Validation                    |
|  - RBAC Middleware & Security Isolation                     |
|  - Payroll Engine (Rules, Attendance, Deductions)           |
+------------------------------+------------------------------+
                               |
                               | Authenticated PostgREST / RLS
                               v
+-------------------------------------------------------------+
|                   Supabase / PostgreSQL                     |
|  - Multi-tenant Schema & Foreign Key Constraints            |
|  - Row Level Security (RLS) Policies                        |
|  - Database Functions & Audit Triggers                      |
+-------------------------------------------------------------+
```

---

## Technology Stack

### Backend
- Runtime: Node.js (v18+)
- Language: TypeScript
- Web Framework: Express.js
- Database & Auth: Supabase (PostgreSQL with Row Level Security)
- Validation: Zod schemas
- Testing: Vitest, Supertest (170 automated test cases)

### Frontend
- Framework: React 18 with TypeScript
- Build Tool: Vite
- Routing: React Router v6
- State & Context: React Context API (Auth, Toast notifications)
- Icons: Lucide React
- Visualizations: Chart.js and React-Chartjs-2
- Document Generation: jsPDF and jsPDF-AutoTable

---

## Project Structure

```
PeoplePay360-HR-Payroll/
├── backend/
│   ├── docs/                   # API specifications and security documentation
│   ├── src/
│   │   ├── config/             # Environment and Supabase client configuration
│   │   ├── middleware/         # Authentication, RBAC, error handling, validation
│   │   ├── modules/
│   │   │   ├── attendance/     # Attendance tracking and session management
│   │   │   ├── audit-logs/     # Compliance and audit trail logging
│   │   │   ├── auth/           # Authentication and credential management
│   │   │   ├── companies/      # Multi-tenant company administration
│   │   │   ├── contracts/      # Employee contracts and salary linkage
│   │   │   ├── dashboard/      # Executive KPIs and analytics aggregation
│   │   │   ├── departments/    # Organizational departments
│   │   │   ├── employees/      # Core employee records and lifecycle
│   │   │   ├── payroll/        # Payroll computation engine and payruns
│   │   │   ├── payslips/       # Payslip generation and distribution
│   │   │   ├── positions/      # Job positions and title management
│   │   │   ├── salary/         # Salary structures and calculation rules
│   │   │   ├── schedules/      # Working hours and shift schedules
│   │   │   └── time-off/       # Leave allocations and time-off requests
│   │   ├── routes/             # Global API routing table
│   │   ├── types/              # Shared backend TypeScript types
│   │   ├── utils/              # Permissions, response formatters, PDF utils
│   │   ├── app.ts              # Express application configuration
│   │   └── server.ts           # HTTP server entry point
│   ├── tests/                  # Integration, unit, security, and RBAC test suites
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── api/                # Axios API client and endpoint definitions
│   │   ├── components/         # Reusable UI components, layout shell, doodles
│   │   ├── context/            # AuthContext and ToastContext
│   │   ├── pages/              # Portal, Dashboard, HR, Payroll, Settings pages
│   │   ├── styles/             # Global CSS design system
│   │   ├── types/              # Frontend TypeScript interfaces
│   │   ├── utils/              # Formatting, constants, and PDF exporter
│   │   ├── App.tsx             # Root routing and role guards
│   │   └── main.tsx            # React application bootstrap
│   ├── index.html
│   ├── package.json
│   └── vite.config.ts
├── supabase/
│   ├── migrations/             # SQL migrations (Schema, RLS, Functions)
│   ├── seed.sql                # Initial seed data for development
│   └── config.toml
├── .gitignore
└── README.md
```

---

## Getting Started

### Prerequisites
- Node.js (v18.0.0 or higher)
- npm (v9.0.0 or higher)
- Supabase Project or local PostgreSQL instance

### 1. Clone the Repository
```bash
git clone https://github.com/AyushKanyal-me/HR-Payroll-System.git
cd HR-Payroll-System
```

### 2. Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create your environment configuration:
   ```bash
   cp .env.example .env
   ```
4. Populate `backend/.env` with your Supabase credentials:
   ```env
   PORT=4000
   NODE_ENV=development
   API_PREFIX=/api/v1
   CORS_ORIGIN=http://localhost:3000,http://localhost:5173
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your-supabase-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
   ```
5. Run the backend development server:
   ```bash
   npm run dev
   ```
   The backend API will be running at `http://localhost:4000/api/v1`.

### 3. Frontend Setup
1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create your environment configuration:
   ```bash
   cp .env.example .env
   ```
4. Populate `frontend/.env`:
   ```env
   VITE_API_BASE_URL=http://localhost:4000/api/v1
   ```
5. Run the frontend development server:
   ```bash
   npm run dev
   ```
   The application will be accessible at `http://localhost:5173`.

---

## Database Migrations

Apply the migration scripts located in the `supabase/migrations/` directory to configure the PostgreSQL database schema, relational constraints, Row Level Security policies, and trigger functions:

```bash
# Using Supabase CLI
supabase db reset
# Or apply migrations directly to your database instance:
# 1. 20260909135557_initial_schema.sql
# 2. 20260909135558_dependent_tables.sql
# 3. 20260909135559_deferred_fks_and_indexes.sql
# 4. 20260909135560_rls_policies.sql
# 5. 20260909135561_database_functions.sql
# 6. 20260909135562_schema_alignment.sql
# 7. 20260909135563_re_enable_rls.sql
# 8. 20260909135564_tighten_security_grants.sql
```

---

## Running Automated Tests

The backend includes 170 comprehensive automated test cases across 15 test suites covering unit logic, calculation accuracy, RBAC permissions, multi-tenant security isolation, and database integration:

```bash
cd backend
npm test
```

To run test suites with code coverage reporting:
```bash
cd backend
npm run test:coverage
```

---

## Security & Enterprise Compliance

- Multi-Tenant RLS: PostgreSQL Row Level Security is enforced for every authenticated user query.
- Token Scoping: Database connections leverage the user bearer token to ensure data operations never exceed the caller privilege level.
- Input Validation: Strict request validation on all endpoints using Zod schema parsing.
- Audit Trail: Immutable logging of all sensitive state transitions and administrative operations.
- Secret Sanitization: Passwords and sensitive tokens are strictly hashed and excluded from API responses and client-side storage.

---

## License

This project is licensed under the MIT License.
