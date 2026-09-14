-- ============================================================
-- PeoplePay360 — Migration 8: Tighten Table Grants
-- Revoke unconditional ALL grants from anon and restrict table access
-- ============================================================

-- Revoke dangerous ALL grants on schema public tables from anon
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;

-- Grant standard SELECT and authenticated usage
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO authenticated, service_role;
