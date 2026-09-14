# Phase B — Security, RLS and Multi-Tenant Isolation Walkthrough

## Summary of Changes

Phase B eliminated the security vulnerability of bypassing PostgreSQL Row Level Security (RLS) via service-role keys. All normal application operations are now scoped with user authentication tokens (`createScopedClient`), canonical RBAC is centralized, and multi-tenant isolation is strictly enforced across all backend modules without trusting client-supplied `company_id`.

---

### Key Implementations

1. **Scoped Client Infrastructure (`src/config/supabase.ts`)**
   - Configured `createScopedClient(accessToken: string)` to initialize authenticated PostgREST clients with `Authorization: Bearer <token>`.
   - Repositories now default to unprivileged `supabaseAnonClient` instead of `supabaseAdminClient`.
   - Documented and restricted `supabaseAdminClient` strictly to initial user bootstrap lookup in `AuthRepository.getUserByAuthId`.

2. **Centralized RBAC Permissions (`src/utils/permissions.ts`)**
   - Implemented centralized permission utilities using strictly the canonical database roles:
     - `ADMIN`: Full administrative and cross-company bypass.
     - `HR_MANAGER`: Company HR operations (employees, departments, job positions, working schedules, leave approval).
     - `HR_PAYROLL_MANAGER`: Company payroll lifecycle (create, compute, validate, pay, cancel payruns, send payslips).
     - `HR_PAYROLL_USER`: Permitted payroll read operations.
     - `EMPLOYEE`: Self-access to own profile, smart counts, attendance, leave requests, and payslips.
   - Replaced weak role-length check (`roles.length === 1 && roles[0] === 'EMPLOYEE'`) in payslips and attendance with centralized permission guards.

3. **Multi-Tenant Isolation Enforcement**
   - Prohibited using client-supplied `company_id` from body, query parameters, or URL parameters for non-admins.
   - Authoritative company is enforced server-side as `req.user.companyId`.
   - `GET /api/v1/companies` restricts non-admin users to only viewing their own company.
   - Cross-company resource access (employees, departments, job positions, schedules, contracts, attendance, time off, salary structures, payruns, payslips, dashboard metrics) returns `403 Forbidden` for non-admin cross-company attempts.

4. **Engine & Repository Refactoring**
   - Updated all 14 repositories, services, controllers, and computation engines (`ContractResolver`, `AttendanceCalculator`, `LeaveCalculator`, `PayrollEngine`) to accept and pass the scoped client.

5. **Security & Isolation Test Suite (`tests/security-isolation.test.ts`)**
   - Added 23 comprehensive automated tests verifying:
     - Missing / invalid token rejection (`401 Unauthorized`).
     - Role restriction enforcement (`403 Forbidden`).
     - Employee self-access allowed vs peer access denied (`403 Forbidden`).
     - Cross-tenant access and mutation denied across all entities (`403 Forbidden`).
     - Injection prevention for client-supplied `company_id`.

---

## Verification Results

### Automated Tests
- **Vitest**: 12/12 test suites passed, 124/124 tests passed (100% pass rate).
- **TypeScript Typecheck (`tsc --noEmit`)**: PASS (0 errors).
- **Build (`rimraf dist && tsc`)**: PASS.
