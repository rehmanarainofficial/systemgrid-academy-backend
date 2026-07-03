import type { MigrationInterface, QueryRunner } from 'typeorm';

export class SnakeCaseAcademySchema1783079000000 implements MigrationInterface {
  name = 'SnakeCaseAcademySchema1783079000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    const rename = async (table: string, from: string, to: string) => {
      const hasFrom = await queryRunner.hasColumn(table, from);
      const hasTo = await queryRunner.hasColumn(table, to);
      if (hasFrom && !hasTo) {
        await queryRunner.query(`ALTER TABLE "${table}" RENAME COLUMN "${from}" TO "${to}"`);
      }
    };

    const renameMap: Record<string, Array<[string, string]>> = {
      users: [
        ['avatarUrl', 'avatar_url'],
        ['isActive', 'is_active'],
        ['lastLoginAt', 'last_login_at'],
        ['createdAt', 'created_at'],
        ['updatedAt', 'updated_at'],
      ],
      student_profiles: [
        ['guardianName', 'guardian_name'],
        ['guardianPhone', 'guardian_phone'],
        ['dateOfBirth', 'date_of_birth'],
        ['educationLevel', 'education_level'],
        ['createdAt', 'created_at'],
        ['updatedAt', 'updated_at'],
        ['userId', 'user_id'],
      ],
      course_categories: [
        ['isActive', 'is_active'],
        ['sortOrder', 'sort_order'],
        ['createdAt', 'created_at'],
        ['updatedAt', 'updated_at'],
      ],
      courses: [
        ['shortDescription', 'short_description'],
        ['durationUnit', 'duration_unit'],
        ['discountFee', 'discount_fee'],
        ['isFeatured', 'is_featured'],
        ['isPublished', 'is_published'],
        ['createdAt', 'created_at'],
        ['updatedAt', 'updated_at'],
        ['categoryId', 'category_id'],
      ],
      course_modules: [
        ['sortOrder', 'sort_order'],
        ['courseId', 'course_id'],
        ['createdAt', 'created_at'],
        ['updatedAt', 'updated_at'],
      ],
      lessons: [
        ['videoUrl', 'video_url'],
        ['resourceUrl', 'resource_url'],
        ['durationMinutes', 'duration_minutes'],
        ['isPreview', 'is_preview'],
        ['sortOrder', 'sort_order'],
        ['isPublished', 'is_published'],
        ['courseId', 'course_id'],
        ['moduleId', 'module_id'],
        ['createdAt', 'created_at'],
        ['updatedAt', 'updated_at'],
      ],
      instructors: [
        ['imageUrl', 'image_url'],
        ['isActive', 'is_active'],
        ['createdAt', 'created_at'],
        ['updatedAt', 'updated_at'],
      ],
      batches: [
        ['startDate', 'start_date'],
        ['endDate', 'end_date'],
        ['classDays', 'class_days'],
        ['startTime', 'start_time'],
        ['endTime', 'end_time'],
        ['courseId', 'course_id'],
        ['instructorId', 'instructor_id'],
        ['createdAt', 'created_at'],
        ['updatedAt', 'updated_at'],
        ['meetingUrl', 'meeting_url'],
        ['enrollmentNote', 'enrollment_note'],
      ],
      enrollments: [
        ['enrolledAt', 'enrolled_at'],
        ['completedAt', 'completed_at'],
        ['progressPercentage', 'progress_percentage'],
        ['studentId', 'student_id'],
        ['courseId', 'course_id'],
        ['batchId', 'batch_id'],
      ],
      class_schedules: [
        ['startTime', 'start_time'],
        ['endTime', 'end_time'],
        ['meetingUrl', 'meeting_url'],
        ['createdAt', 'created_at'],
        ['updatedAt', 'updated_at'],
        ['batchId', 'batch_id'],
        ['courseId', 'course_id'],
        ['lessonId', 'lesson_id'],
      ],
      attendance: [
        ['studentId', 'student_id'],
        ['batchId', 'batch_id'],
        ['markedById', 'marked_by_id'],
        ['createdAt', 'created_at'],
        ['updatedAt', 'updated_at'],
        ['courseId', 'course_id'],
        ['classScheduleId', 'class_schedule_id'],
      ],
      assignments: [
        ['dueDate', 'due_date'],
        ['totalMarks', 'total_marks'],
        ['attachmentUrl', 'attachment_url'],
        ['isPublished', 'is_published'],
        ['courseId', 'course_id'],
        ['batchId', 'batch_id'],
        ['createdAt', 'created_at'],
        ['updatedAt', 'updated_at'],
        ['moduleId', 'module_id'],
      ],
      assignment_submissions: [
        ['fileUrl', 'file_url'],
        ['textAnswer', 'text_answer'],
        ['marksObtained', 'marks_obtained'],
        ['submittedAt', 'submitted_at'],
        ['checkedAt', 'checked_at'],
        ['assignmentId', 'assignment_id'],
        ['studentId', 'student_id'],
        ['createdAt', 'created_at'],
        ['updatedAt', 'updated_at'],
      ],
      fee_plans: [
        ['totalAmount', 'total_amount'],
        ['discountAmount', 'discount_amount'],
        ['payableAmount', 'payable_amount'],
        ['paidAmount', 'paid_amount'],
        ['pendingAmount', 'pending_amount'],
        ['installmentType', 'installment_type'],
        ['enrollmentId', 'enrollment_id'],
        ['dueDate', 'due_date'],
        ['createdAt', 'created_at'],
        ['updatedAt', 'updated_at'],
      ],
      payments: [
        ['transactionId', 'transaction_id'],
        ['paymentDate', 'payment_date'],
        ['studentId', 'student_id'],
        ['enrollmentId', 'enrollment_id'],
        ['receivedById', 'received_by_id'],
        ['createdAt', 'created_at'],
        ['updatedAt', 'updated_at'],
      ],
      course_resources: [
        ['createdAt', 'created_at'],
        ['courseId', 'course_id'],
        ['lessonId', 'lesson_id'],
      ],
      invoices: [
        ['invoiceNumber', 'invoice_number'],
        ['issuedAt', 'issued_at'],
        ['pdfUrl', 'pdf_url'],
        ['paymentId', 'payment_id'],
        ['updatedAt', 'updated_at'],
      ],
      certificates: [
        ['certificateNumber', 'certificate_number'],
        ['issueDate', 'issue_date'],
        ['verificationCode', 'verification_code'],
        ['pdfUrl', 'pdf_url'],
        ['studentId', 'student_id'],
        ['courseId', 'course_id'],
        ['enrollmentId', 'enrollment_id'],
        ['createdAt', 'created_at'],
        ['updatedAt', 'updated_at'],
      ],
      leads: [
        ['courseInterest', 'course_interest'],
        ['createdAt', 'created_at'],
        ['assignedToId', 'assigned_to_id'],
        ['preferredMode', 'preferred_mode'],
        ['preferredTiming', 'preferred_timing'],
        ['studentLevel', 'student_level'],
        ['updatedAt', 'updated_at'],
      ],
      notifications: [
        ['isRead', 'is_read'],
        ['createdAt', 'created_at'],
        ['userId', 'user_id'],
        ['actionUrl', 'action_url'],
        ['updatedAt', 'updated_at'],
      ],
      audit_logs: [
        ['recordId', 'record_id'],
        ['createdAt', 'created_at'],
        ['userId', 'user_id'],
      ],
    };

    for (const [table, columns] of Object.entries(renameMap)) {
      for (const [from, to] of columns) {
        await rename(table, from, to);
      }
    }

    await queryRunner.query('ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "created_at" TIMESTAMP NOT NULL DEFAULT now()');
    await queryRunner.query('ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP NOT NULL DEFAULT now()');
    await queryRunner.query('ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "created_at" TIMESTAMP NOT NULL DEFAULT now()');
    await queryRunner.query('ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "fee_plan_id" uuid');
    await queryRunner.query(`
      UPDATE "payments" payment
      SET "fee_plan_id" = plan.id
      FROM "fee_plans" plan
      WHERE payment."fee_plan_id" IS NULL
        AND payment."enrollment_id" = plan."enrollment_id"
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'fk_payments_fee_plan_id'
        ) THEN
          ALTER TABLE "payments"
          ADD CONSTRAINT "fk_payments_fee_plan_id"
          FOREIGN KEY ("fee_plan_id") REFERENCES "fee_plans"("id") ON DELETE RESTRICT;
        END IF;
      END $$;
    `);

    await queryRunner.query('CREATE INDEX IF NOT EXISTS "idx_users_role" ON "users" ("role")');
    await queryRunner.query('CREATE INDEX IF NOT EXISTS "idx_users_is_active" ON "users" ("is_active")');
    await queryRunner.query('CREATE INDEX IF NOT EXISTS "idx_student_profiles_status" ON "student_profiles" ("status")');
    await queryRunner.query('CREATE INDEX IF NOT EXISTS "idx_student_profiles_city" ON "student_profiles" ("city")');
    await queryRunner.query('CREATE INDEX IF NOT EXISTS "idx_courses_category_id" ON "courses" ("category_id")');
    await queryRunner.query('CREATE INDEX IF NOT EXISTS "idx_courses_is_published" ON "courses" ("is_published")');
    await queryRunner.query('CREATE INDEX IF NOT EXISTS "idx_courses_is_featured" ON "courses" ("is_featured")');
    await queryRunner.query('CREATE INDEX IF NOT EXISTS "idx_batches_course_id" ON "batches" ("course_id")');
    await queryRunner.query('CREATE INDEX IF NOT EXISTS "idx_batches_status" ON "batches" ("status")');
    await queryRunner.query('CREATE INDEX IF NOT EXISTS "idx_enrollments_student_id" ON "enrollments" ("student_id")');
    await queryRunner.query('CREATE INDEX IF NOT EXISTS "idx_enrollments_course_id" ON "enrollments" ("course_id")');
    await queryRunner.query('CREATE INDEX IF NOT EXISTS "idx_attendance_date" ON "attendance" ("date")');
    await queryRunner.query('CREATE UNIQUE INDEX IF NOT EXISTS "uq_attendance_student_batch_date" ON "attendance" ("student_id", "batch_id", "date")');
    await queryRunner.query('CREATE UNIQUE INDEX IF NOT EXISTS "uq_assignment_submissions_assignment_student" ON "assignment_submissions" ("assignment_id", "student_id")');
    await queryRunner.query('CREATE INDEX IF NOT EXISTS "idx_fee_plans_enrollment_id" ON "fee_plans" ("enrollment_id")');
    await queryRunner.query('CREATE INDEX IF NOT EXISTS "idx_payments_fee_plan_id" ON "payments" ("fee_plan_id")');
    await queryRunner.query('CREATE INDEX IF NOT EXISTS "idx_payments_payment_date" ON "payments" ("payment_date")');
    await queryRunner.query('CREATE INDEX IF NOT EXISTS "idx_notifications_user_id" ON "notifications" ("user_id")');
    await queryRunner.query('CREATE INDEX IF NOT EXISTS "idx_audit_logs_created_at" ON "audit_logs" ("created_at")');
  }

  async down(): Promise<void> {
    // Intentional no-op: this migration normalizes a development schema from camelCase to snake_case.
    // Reverting column naming would risk breaking application code and generated foreign key names.
  }
}
