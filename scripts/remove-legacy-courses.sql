-- Remove legacy / duplicate courses that are not part of the canonical seed catalog.
-- Safe to run before npm run seed:courses on production.
-- Run:
-- docker exec -i attendfee_postgres psql -U postgres -d systemgrid_academy -v ON_ERROR_STOP=1 < scripts/remove-legacy-courses.sql

BEGIN;

CREATE TEMP TABLE legacy_course_ids ON COMMIT DROP AS
SELECT id, slug, title
FROM courses
WHERE slug NOT IN (
  'app-development-react-native',
  'desktop-app-development',
  'mean-stack-development',
  'pern-stack-development',
  'mern-stack-development',
  'django-full-stack-web-development',
  'python-fastapi-flask-full-stack',
  'laravel-full-stack-web-development',
  'aspnet-core-nextjs-full-stack',
  'data-science-and-analytics',
  'data-analysis',
  'ai-development-automation',
  'graphic-designing',
  'digital-marketing',
  'cybersecurity',
  'programming-fundamentals',
  'dsa',
  'english-language',
  'chinese-language',
  'ielts-preparation',
  'dit-1-year',
  'cit-6-month',
  'video-editing-6-month'
);

-- Courses tied to real enrollments/batches stay hidden instead of deleted.
UPDATE courses
SET is_published = false,
    is_featured = false
WHERE id IN (SELECT id FROM legacy_course_ids)
  AND (
    EXISTS (SELECT 1 FROM enrollments e WHERE e.course_id = legacy_course_ids.id)
    OR EXISTS (SELECT 1 FROM batches b WHERE b.course_id = legacy_course_ids.id)
  );

CREATE TEMP TABLE deletable_legacy_course_ids ON COMMIT DROP AS
SELECT id
FROM legacy_course_ids
WHERE id NOT IN (
  SELECT course_id FROM enrollments WHERE course_id IS NOT NULL
  UNION
  SELECT course_id FROM batches WHERE course_id IS NOT NULL
);

DELETE FROM learning_path_courses
WHERE course_id IN (SELECT id FROM deletable_legacy_course_ids);

DELETE FROM course_faqs
WHERE course_id IN (SELECT id FROM deletable_legacy_course_ids);

DELETE FROM course_outcomes
WHERE course_id IN (SELECT id FROM deletable_legacy_course_ids);

DELETE FROM course_projects
WHERE course_id IN (SELECT id FROM deletable_legacy_course_ids);

DELETE FROM course_tools
WHERE course_id IN (SELECT id FROM deletable_legacy_course_ids);

DELETE FROM course_topics
WHERE course_id IN (SELECT id FROM deletable_legacy_course_ids);

DELETE FROM course_outline_modules
WHERE course_id IN (SELECT id FROM deletable_legacy_course_ids);

DELETE FROM course_quarters
WHERE course_id IN (SELECT id FROM deletable_legacy_course_ids);

DELETE FROM courses
WHERE id IN (SELECT id FROM deletable_legacy_course_ids);

SELECT COUNT(*) AS remaining_published_courses
FROM courses
WHERE is_published = true;

SELECT slug, title
FROM courses
WHERE is_published = true
ORDER BY title;

COMMIT;
