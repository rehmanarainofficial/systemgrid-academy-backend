-- SystemGrid Academy — remove ALL test/transactional data from production.
-- KEEPS: courses, blogs, categories, learning paths, offers, settings,
--         admins/staff/instructor users, instructors, batches, assignments (definitions), lessons.
-- REMOVES: leads, admissions, students, enrollments, payments, invoices, certificates, etc.
--
-- Run on VPS:
--   cd /var/www/systemgrid-academy-backend
--   docker exec -i systemgrid_academy_postgres_prod psql -U systemgrid -d systemgrid_academy -v ON_ERROR_STOP=1 < scripts/production-cleanup-test-data.sql

\echo '=== BEFORE cleanup ==='
SELECT 'leads' AS item, COUNT(*)::text AS count FROM leads
UNION ALL SELECT 'admissions', COUNT(*)::text FROM admission_applications
UNION ALL SELECT 'students', COUNT(*)::text FROM users WHERE role = 'student'
UNION ALL SELECT 'enrollments', COUNT(*)::text FROM enrollments
UNION ALL SELECT 'courses', COUNT(*)::text FROM courses
UNION ALL SELECT 'blogs', COUNT(*)::text FROM blog_posts
UNION ALL SELECT 'instructors', COUNT(*)::text FROM instructors
UNION ALL SELECT 'admin_users', COUNT(*)::text FROM users WHERE role IN ('super_admin', 'admin', 'staff');

BEGIN;

-- Child tables first (FK-safe order)
DELETE FROM referral_redemptions;
DELETE FROM wallet_ledger;
DELETE FROM scholarship_tests;
DELETE FROM assignment_submissions;
DELETE FROM attendance;
DELETE FROM certificates;

UPDATE payments
SET payment_intent_id = NULL,
    invoice_id = NULL;

DELETE FROM payment_intents;
DELETE FROM payments;
DELETE FROM invoices;
DELETE FROM fee_plans;
DELETE FROM enrollments;
DELETE FROM referral_codes;
DELETE FROM student_wallets;

DELETE FROM notifications;

DELETE FROM admission_applications;
DELETE FROM leads;

DELETE FROM student_profiles
WHERE user_id IN (SELECT id FROM users WHERE role = 'student');

DELETE FROM users
WHERE role = 'student';

COMMIT;

\echo '=== AFTER cleanup (should be 0 for test data) ==='
SELECT 'leads' AS item, COUNT(*)::text AS count FROM leads
UNION ALL SELECT 'admissions', COUNT(*)::text FROM admission_applications
UNION ALL SELECT 'students', COUNT(*)::text FROM users WHERE role = 'student'
UNION ALL SELECT 'enrollments', COUNT(*)::text FROM enrollments
UNION ALL SELECT 'courses', COUNT(*)::text FROM courses
UNION ALL SELECT 'blogs', COUNT(*)::text FROM blog_posts
UNION ALL SELECT 'instructors', COUNT(*)::text FROM instructors
UNION ALL SELECT 'admin_users', COUNT(*)::text FROM users WHERE role IN ('super_admin', 'admin', 'staff');
