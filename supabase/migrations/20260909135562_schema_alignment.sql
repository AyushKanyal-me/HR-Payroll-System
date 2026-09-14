-- ============================================================
-- PeoplePay360 — Migration 6: Schema Alignment & Seed
-- Aligns database schema minimally with backend & frontend models
-- ============================================================

-- 1. COMPANIES: Add missing profile fields
ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS tax_id TEXT,
  ADD COLUMN IF NOT EXISTS registration_number TEXT,
  ADD COLUMN IF NOT EXISTS fiscal_year_start_month INTEGER DEFAULT 4,
  ADD COLUMN IF NOT EXISTS fiscal_year_end_month INTEGER DEFAULT 3,
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'India',
  ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- 2. DEPARTMENTS: Add parent hierarchy and manager reference
ALTER TABLE departments
  ADD COLUMN IF NOT EXISTS parent_department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS manager_id UUID REFERENCES employees(id) ON DELETE SET NULL;

-- 3. JOB POSITIONS: Add title, code, and department reference
ALTER TABLE job_positions
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS code TEXT,
  ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES departments(id) ON DELETE SET NULL;

UPDATE job_positions SET title = name WHERE title IS NULL;
UPDATE job_positions SET code = UPPER(REPLACE(name, ' ', '_')) WHERE code IS NULL;
ALTER TABLE job_positions ALTER COLUMN company_id DROP NOT NULL;

-- 4. WORKING SCHEDULES: Add hours_per_week, days_per_week, timezone
ALTER TABLE working_schedules
  ADD COLUMN IF NOT EXISTS hours_per_week NUMERIC DEFAULT 40,
  ADD COLUMN IF NOT EXISTS days_per_week INTEGER DEFAULT 5,
  ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'Asia/Kolkata';

UPDATE working_schedules SET hours_per_week = weekly_hours WHERE hours_per_week IS NULL AND weekly_hours IS NOT NULL;

-- 5. SCHEDULE DAYS: Add break_hours and total_hours
ALTER TABLE schedule_days
  ADD COLUMN IF NOT EXISTS break_hours NUMERIC DEFAULT 1.0,
  ADD COLUMN IF NOT EXISTS total_hours NUMERIC DEFAULT 8.0;

-- 6. EMPLOYEES: Add work_email, personal_email, hire_date, bank_ifsc, pan_number, aadhaar_number
ALTER TABLE employees
  ADD COLUMN IF NOT EXISTS work_email TEXT,
  ADD COLUMN IF NOT EXISTS personal_email TEXT,
  ADD COLUMN IF NOT EXISTS hire_date DATE,
  ADD COLUMN IF NOT EXISTS bank_ifsc TEXT,
  ADD COLUMN IF NOT EXISTS pan_number TEXT,
  ADD COLUMN IF NOT EXISTS aadhaar_number TEXT;

UPDATE employees SET work_email = email WHERE work_email IS NULL AND email IS NOT NULL;
UPDATE employees SET hire_date = date_of_joining WHERE hire_date IS NULL AND date_of_joining IS NOT NULL;
UPDATE employees SET bank_ifsc = ifsc_code WHERE bank_ifsc IS NULL AND ifsc_code IS NOT NULL;

-- 7. USERS: Add email, first_name, last_name
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS first_name TEXT,
  ADD COLUMN IF NOT EXISTS last_name TEXT;

-- 8. TIME OFF TYPES: Add is_paid
ALTER TABLE time_off_types
  ADD COLUMN IF NOT EXISTS is_paid BOOLEAN DEFAULT true;

UPDATE time_off_types SET is_paid = payroll_integration WHERE is_paid IS NULL AND payroll_integration IS NOT NULL;

-- 9. TIME OFF ALLOCATIONS: Add year
ALTER TABLE time_off_allocations
  ADD COLUMN IF NOT EXISTS year INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE);

-- 10. Ensure RLS is enabled on all tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE working_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_off_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_off_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_off_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE salary_structures ENABLE ROW LEVEL SECURITY;
ALTER TABLE salary_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE salary_structure_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE payruns ENABLE ROW LEVEL SECURITY;
ALTER TABLE payrun_employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE payslips ENABLE ROW LEVEL SECURITY;
ALTER TABLE payslip_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_warnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE payslip_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated, anon, service_role;

-- 11. INITIAL SEED DATA (Company, Departments, Job Positions, Schedules)
INSERT INTO companies (id, name, legal_name, tax_id, registration_number, currency, timezone, country, address)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'PeoplePay360 Global Corp',
  'PeoplePay360 Technologies Pvt. Ltd.',
  'PAN-AAACP1234K',
  'CIN-U72200MH2024PTC123456',
  'INR',
  'Asia/Kolkata',
  'India',
  '100 Business Boulevard, Suite 400'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO departments (id, company_id, name, code) VALUES
  ('d0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Engineering', 'ENG'),
  ('d0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Human Resources', 'HR'),
  ('d0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'Product & Design', 'PD'),
  ('d0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'Sales & Growth', 'SALES')
ON CONFLICT (id) DO NOTHING;

INSERT INTO job_positions (id, company_id, department_id, title, name, code) VALUES
  ('b0000000-0000-0000-0000-000000000011', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'Senior Software Engineer', 'Senior Software Engineer', 'SR_SWE'),
  ('b0000000-0000-0000-0000-000000000012', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'Frontend Specialist', 'Frontend Specialist', 'FE_SPEC'),
  ('b0000000-0000-0000-0000-000000000013', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000002', 'HR Generalist', 'HR Generalist', 'HR_GEN'),
  ('b0000000-0000-0000-0000-000000000014', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000003', 'Product Manager', 'Product Manager', 'PM')
ON CONFLICT (id) DO NOTHING;

INSERT INTO working_schedules (id, company_id, name, schedule_type, hours_per_week, days_per_week, timezone, is_active) VALUES
  ('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Standard 40h Weekly (Mon-Fri)', 'FIXED', 40, 5, 'Asia/Kolkata', true),
  ('c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Flexible Tech Schedule (40h)', 'FLEXIBLE', 40, 5, 'Asia/Kolkata', true)
ON CONFLICT (id) DO NOTHING;
