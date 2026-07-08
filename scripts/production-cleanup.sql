-- SystemGrid Academy — remove seeded demo/test data from production.
-- Keeps: superadmin/admin/staff accounts, real course catalog, real admissions.
-- Run: docker exec -i attendfee_postgres psql -U postgres -d systemgrid_academy -v ON_ERROR_STOP=1 < scripts/production-cleanup.sql

BEGIN;

CREATE TEMP TABLE demo_user_ids ON COMMIT DROP AS
SELECT id
FROM users
WHERE email LIKE '%@example.com'
   OR email LIKE '%@student.test'
   OR email LIKE 'test.%@systemgrid.academy'
   OR email LIKE 'qa.%@systemgrid.academy'
   OR email IN (
     'student@systemgrid.academy',
     'maya.instructor@systemgrid.academy',
     'ahsan.instructor@systemgrid.academy',
     'sara.instructor@systemgrid.academy',
     'test.instructor@systemgrid.academy',
     'qa.instructor.20260706@systemgrid.academy',
     'qa.api.admin.20260706@systemgrid.academy'
   );

CREATE TEMP TABLE demo_student_profile_ids ON COMMIT DROP AS
SELECT sp.id
FROM student_profiles sp
WHERE sp.user_id IN (SELECT id FROM demo_user_ids);

CREATE TEMP TABLE demo_admission_ids ON COMMIT DROP AS
SELECT id
FROM admission_applications
WHERE email LIKE '%@example.com'
   OR email LIKE '%@student.test';

DELETE FROM payment_intents
WHERE admission_application_id IN (SELECT id FROM demo_admission_ids);

DELETE FROM assignment_submissions
WHERE student_id IN (SELECT id FROM demo_student_profile_ids);

DELETE FROM attendance
WHERE student_id IN (SELECT id FROM demo_student_profile_ids);

DELETE FROM payments
WHERE student_id IN (SELECT id FROM demo_student_profile_ids);

DELETE FROM invoices
WHERE student_id IN (SELECT id FROM demo_student_profile_ids)
   OR admission_application_id IN (SELECT id FROM demo_admission_ids);

DELETE FROM fee_plans
WHERE student_id IN (SELECT id FROM demo_student_profile_ids);

DELETE FROM certificates
WHERE student_id IN (SELECT id FROM demo_student_profile_ids);

DELETE FROM enrollments
WHERE student_id IN (SELECT id FROM demo_student_profile_ids);

DELETE FROM notifications
WHERE user_id IN (SELECT id FROM demo_user_ids);

DELETE FROM admission_applications
WHERE id IN (SELECT id FROM demo_admission_ids);

DELETE FROM leads
WHERE email LIKE '%@example.com';

UPDATE batches
SET instructor_id = NULL
WHERE instructor_id IN (
  SELECT i.id
  FROM instructors i
  WHERE i.email LIKE '%@example.com'
     OR i.email LIKE 'test.%@systemgrid.academy'
     OR i.email LIKE 'qa.%@systemgrid.academy'
     OR i.email IN (
       'ahsan.instructor@systemgrid.academy',
       'sara.instructor@systemgrid.academy',
       'maya.instructor@systemgrid.academy',
       'test.instructor@systemgrid.academy',
       'qa.instructor.20260706@systemgrid.academy'
     )
);

DELETE FROM instructors
WHERE email LIKE '%@example.com'
   OR email LIKE 'test.%@systemgrid.academy'
   OR email LIKE 'qa.%@systemgrid.academy'
   OR email IN (
     'ahsan.instructor@systemgrid.academy',
     'sara.instructor@systemgrid.academy',
     'maya.instructor@systemgrid.academy',
     'test.instructor@systemgrid.academy',
     'qa.instructor.20260706@systemgrid.academy'
   );

DELETE FROM student_profiles
WHERE id IN (SELECT id FROM demo_student_profile_ids);

DELETE FROM users
WHERE id IN (SELECT id FROM demo_user_ids);

DELETE FROM payment_intents
WHERE status = 'pending';

SELECT COUNT(*) AS demo_users_targeted FROM demo_user_ids;

COMMIT;

SELECT COUNT(*) AS remaining_students FROM users WHERE role = 'student';
SELECT COUNT(*) AS remaining_instructors FROM instructors;
SELECT COUNT(*) AS remaining_leads FROM leads;
