import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { UserRole } from '../../common/enums/user-role.enum';

export enum StudentSourceEnum {
  Website = 'website',
  Referral = 'referral',
  WalkIn = 'walk_in',
  SocialMedia = 'social_media',
  Admin = 'admin',
}

export type StudentSource = 'website' | 'referral' | 'walk_in' | 'social_media' | 'admin';

export enum StudentStatusEnum {
  Active = 'active',
  Inactive = 'inactive',
  Graduated = 'graduated',
  Dropped = 'dropped',
}

export type StudentStatus = 'active' | 'inactive' | 'graduated' | 'dropped';

export enum GenderEnum {
  Male = 'male',
  Female = 'female',
  PreferNotToSay = 'prefer_not_to_say',
}

export type Gender = 'male' | 'female' | 'prefer_not_to_say';

export enum CourseLevelEnum {
  Beginner = 'beginner',
  Intermediate = 'intermediate',
  Advanced = 'advanced',
}

export type CourseLevel = 'beginner' | 'intermediate' | 'advanced';

export enum DurationUnitEnum {
  Weeks = 'weeks',
  Months = 'months',
}

export type DurationUnit = 'weeks' | 'months';

export enum CourseModeEnum {
  Online = 'online',
  Physical = 'physical',
  Hybrid = 'hybrid',
}

export type CourseMode = 'online' | 'physical' | 'hybrid';

export enum CourseLanguageEnum {
  English = 'english',
  Urdu = 'urdu',
  RomanUrdu = 'roman_urdu',
  Mixed = 'mixed',
}

export type CourseLanguage = 'english' | 'urdu' | 'roman_urdu' | 'mixed';

export enum BatchStatusEnum {
  Upcoming = 'upcoming',
  Active = 'active',
  Completed = 'completed',
  Cancelled = 'cancelled',
}

export type BatchStatus = 'upcoming' | 'active' | 'completed' | 'cancelled';

export enum EnrollmentStatusEnum {
  Pending = 'pending',
  Active = 'active',
  Completed = 'completed',
  Cancelled = 'cancelled',
  Dropped = 'dropped',
}

export type EnrollmentStatus = 'pending' | 'active' | 'completed' | 'cancelled' | 'dropped';

export enum AttendanceStatusEnum {
  Present = 'present',
  Absent = 'absent',
  Late = 'late',
  Leave = 'leave',
}

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'leave';

export enum SubmissionStatusEnum {
  Submitted = 'submitted',
  Checked = 'checked',
  Late = 'late',
  Rejected = 'rejected',
}

export type SubmissionStatus = 'submitted' | 'checked' | 'late' | 'rejected';

export enum InstallmentTypeEnum {
  Full = 'full',
  Monthly = 'monthly',
  Custom = 'custom',
}

export type InstallmentType = 'full' | 'monthly' | 'custom';

export enum FeeStatusEnum {
  Unpaid = 'unpaid',
  Partial = 'partial',
  Paid = 'paid',
}

export type FeeStatus = 'unpaid' | 'partial' | 'paid';

export enum PaymentMethodEnum {
  Cash = 'cash',
  BankTransfer = 'bank_transfer',
  Easypaisa = 'easypaisa',
  Jazzcash = 'jazzcash',
  Card = 'card',
}

export type PaymentMethod = 'cash' | 'bank_transfer' | 'easypaisa' | 'jazzcash' | 'card';

export enum PaymentStatusEnum {
  Pending = 'pending',
  Verified = 'verified',
  Rejected = 'rejected',
}

export type PaymentStatus = 'pending' | 'verified' | 'rejected';

export enum InvoiceStatusEnum {
  Paid = 'paid',
  Unpaid = 'unpaid',
  Cancelled = 'cancelled',
}

export type InvoiceStatus = 'paid' | 'unpaid' | 'cancelled';

export enum CertificateStatusEnum {
  Issued = 'issued',
  Revoked = 'revoked',
}

export type CertificateStatus = 'issued' | 'revoked';

export enum LeadStatusEnum {
  New = 'new',
  Contacted = 'contacted',
  Converted = 'converted',
  Rejected = 'rejected',
}

export type LeadStatus = 'new' | 'contacted' | 'converted' | 'rejected';

export enum LeadSourceEnum {
  Website = 'website',
  AdmissionsPage = 'admissions_page',
  FreeDemoClassPage = 'free_demo_class_page',
  ContactPage = 'contact_page',
  CourseDetailPage = 'course_detail_page',
  Referral = 'referral',
  WalkIn = 'walk_in',
  SocialMedia = 'social_media',
}

export type LeadSource =
  | 'website'
  | 'admissions_page'
  | 'free_demo_class_page'
  | 'contact_page'
  | 'course_detail_page'
  | 'referral'
  | 'walk_in'
  | 'social_media';

export enum NotificationTypeEnum {
  System = 'system',
  Info = 'info',
  Fee = 'fee',
  Class = 'class',
  Assignment = 'assignment',
  Certificate = 'certificate',
  Payment = 'payment',
}

export type NotificationType = 'system' | 'info' | 'fee' | 'class' | 'assignment' | 'certificate' | 'payment';

export enum CourseResourceTypeEnum {
  Pdf = 'pdf',
  Link = 'link',
  Video = 'video',
  File = 'file',
}

export type CourseResourceType = 'pdf' | 'link' | 'video' | 'file';

export enum ClassScheduleStatusEnum {
  Upcoming = 'upcoming',
  Completed = 'completed',
  Cancelled = 'cancelled',
}

export type ClassScheduleStatus = 'upcoming' | 'completed' | 'cancelled';

@Entity('users')
@Index('idx_users_role', ['role'])
@Index('idx_users_is_active', ['isActive'])
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'name' })
  name: string;

  @Index('uq_users_email', { unique: true })
  @Column({ name: 'email', unique: true })
  email: string;

  @Column({ name: 'password', select: false })
  password: string;

  @Column({ name: 'role', type: 'enum', enum: UserRole, default: UserRole.Student })
  role: UserRole;

  @Column({ name: 'avatar_url', nullable: true })
  avatarUrl?: string;

  @Column({ name: 'phone', nullable: true })
  phone?: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'last_login_at', type: 'timestamptz', nullable: true })
  lastLoginAt?: Date;

  @OneToOne(() => StudentProfile, (profile) => profile.user)
  studentProfile?: Relation<StudentProfile>;

  @OneToMany(() => Notification, (notification) => notification.user)
  notifications: Relation<Notification[]>;

  @OneToMany(() => AuditLog, (auditLog) => auditLog.user)
  auditLogs: Relation<AuditLog[]>;

  @OneToMany(() => Lead, (lead) => lead.assignedTo)
  assignedLeads: Relation<Lead[]>;

  @OneToMany(() => Attendance, (attendance) => attendance.markedBy)
  markedAttendance: Relation<Attendance[]>;

  @OneToMany(() => Payment, (payment) => payment.receivedBy)
  receivedPayments: Relation<Payment[]>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

@Entity('student_profiles')
@Index('idx_student_profiles_status', ['status'])
@Index('idx_student_profiles_city', ['city'])
export class StudentProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('uq_student_profiles_user_id', { unique: true })
  @OneToOne(() => User, (user) => user.studentProfile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: Relation<User>;

  @Column({ name: 'guardian_name', nullable: true })
  guardianName?: string;

  @Column({ name: 'guardian_phone', nullable: true })
  guardianPhone?: string;

  @Index('uq_student_profiles_cnic', { unique: true, where: 'cnic IS NOT NULL' })
  @Column({ name: 'cnic', nullable: true })
  cnic?: string;

  @Column({ name: 'date_of_birth', type: 'date', nullable: true })
  dateOfBirth?: string;

  @Column({ name: 'gender', type: 'enum', enum: GenderEnum, nullable: true })
  gender?: Gender;

  @Column({ name: 'education_level', nullable: true })
  educationLevel?: string;

  @Column({ name: 'address', nullable: true })
  address?: string;

  @Column({ name: 'city', nullable: true })
  city?: string;

  @Column({ name: 'source', type: 'enum', enum: StudentSourceEnum, default: StudentSourceEnum.Website })
  source: StudentSource;

  @Column({ name: 'status', type: 'enum', enum: StudentStatusEnum, default: StudentStatusEnum.Active })
  status: StudentStatus;

  @OneToMany(() => Enrollment, (enrollment) => enrollment.student)
  enrollments: Relation<Enrollment[]>;

  @OneToMany(() => Attendance, (attendance) => attendance.student)
  attendanceRecords: Relation<Attendance[]>;

  @OneToMany(() => AssignmentSubmission, (submission) => submission.student)
  assignmentSubmissions: Relation<AssignmentSubmission[]>;

  @OneToMany(() => Payment, (payment) => payment.student)
  payments: Relation<Payment[]>;

  @OneToMany(() => Certificate, (certificate) => certificate.student)
  certificates: Relation<Certificate[]>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

@Entity('course_categories')
@Index('idx_course_categories_is_active', ['isActive'])
@Index('idx_course_categories_sort_order', ['sortOrder'])
export class CourseCategory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'name' })
  name: string;

  @Index('uq_course_categories_slug', { unique: true })
  @Column({ name: 'slug', unique: true })
  slug: string;

  @Column({ name: 'description', type: 'text', nullable: true })
  description?: string;

  @Column({ name: 'icon', nullable: true })
  icon?: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'sort_order', default: 0 })
  sortOrder: number;

  @OneToMany(() => Course, (course) => course.category)
  courses: Relation<Course[]>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

@Entity('courses')
@Index('idx_courses_category_id', ['category'])
@Index('idx_courses_is_published', ['isPublished'])
@Index('idx_courses_is_featured', ['isFeatured'])
@Index('idx_courses_level', ['level'])
@Index('idx_courses_mode', ['mode'])
@Check('chk_courses_fee_non_negative', 'fee >= 0')
@Check('chk_courses_discount_fee_non_negative', 'discount_fee IS NULL OR discount_fee >= 0')
export class Course {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => CourseCategory, (category) => category.courses, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'category_id' })
  category?: Relation<CourseCategory>;

  @Column({ name: 'title' })
  title: string;

  @Index('uq_courses_slug', { unique: true })
  @Column({ name: 'slug', unique: true })
  slug: string;

  @Column({ name: 'short_description' })
  shortDescription: string;

  @Column({ name: 'description', type: 'text', nullable: true })
  description?: string;

  @Column({ name: 'thumbnail', nullable: true })
  thumbnail?: string;

  @Column({ name: 'tech_stack', type: 'simple-array', nullable: true })
  techStack?: string[];

  @Column({ name: 'level', type: 'enum', enum: CourseLevelEnum, default: CourseLevelEnum.Beginner })
  level: CourseLevel;

  @Column({ name: 'duration', default: 12 })
  duration: number;

  @Column({ name: 'duration_unit', type: 'enum', enum: DurationUnitEnum, default: DurationUnitEnum.Weeks })
  durationUnit: DurationUnit;

  @Column({ name: 'mode', type: 'enum', enum: CourseModeEnum, default: CourseModeEnum.Hybrid })
  mode: CourseMode;

  @Column({ name: 'language', type: 'enum', enum: CourseLanguageEnum, default: CourseLanguageEnum.Mixed })
  language: CourseLanguage;

  @Column({ name: 'fee', type: 'numeric', precision: 12, scale: 2, default: 0 })
  fee: number;

  @Column({ name: 'discount_fee', type: 'numeric', precision: 12, scale: 2, nullable: true })
  discountFee?: number;

  @Column({ name: 'is_featured', default: false })
  isFeatured: boolean;

  @Column({ name: 'is_published', default: false })
  isPublished: boolean;

  @OneToMany(() => CourseModule, (module) => module.course)
  modules: Relation<CourseModule[]>;

  @OneToMany(() => Lesson, (lesson) => lesson.course)
  lessons: Relation<Lesson[]>;

  @OneToMany(() => Batch, (batch) => batch.course)
  batches: Relation<Batch[]>;

  @OneToMany(() => Enrollment, (enrollment) => enrollment.course)
  enrollments: Relation<Enrollment[]>;

  @OneToMany(() => Assignment, (assignment) => assignment.course)
  assignments: Relation<Assignment[]>;

  @OneToMany(() => Certificate, (certificate) => certificate.course)
  certificates: Relation<Certificate[]>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

@Entity('course_modules')
@Index('idx_course_modules_course_id', ['course'])
@Index('idx_course_modules_sort_order', ['sortOrder'])
export class CourseModule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Course, (course) => course.modules, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'course_id' })
  course: Relation<Course>;

  @Column({ name: 'title' })
  title: string;

  @Column({ name: 'description', type: 'text', nullable: true })
  description?: string;

  @Column({ name: 'sort_order', default: 0 })
  sortOrder: number;

  @OneToMany(() => Lesson, (lesson) => lesson.module)
  lessons: Relation<Lesson[]>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

@Entity('lessons')
@Index('idx_lessons_course_id', ['course'])
@Index('idx_lessons_module_id', ['module'])
@Index('idx_lessons_is_published', ['isPublished'])
@Index('idx_lessons_sort_order', ['sortOrder'])
export class Lesson {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Course, (course) => course.lessons, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'course_id' })
  course: Relation<Course>;

  @ManyToOne(() => CourseModule, (module) => module.lessons, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'module_id' })
  module?: Relation<CourseModule>;

  @Column({ name: 'title' })
  title: string;

  @Column({ name: 'description', type: 'text', nullable: true })
  description?: string;

  @Column({ name: 'video_url', nullable: true })
  videoUrl?: string;

  @Column({ name: 'resource_url', nullable: true })
  resourceUrl?: string;

  @Column({ name: 'duration_minutes', type: 'integer', nullable: true })
  durationMinutes?: number;

  @Column({ name: 'is_preview', default: false })
  isPreview: boolean;

  @Column({ name: 'sort_order', default: 0 })
  sortOrder: number;

  @Column({ name: 'is_published', default: false })
  isPublished: boolean;

  @OneToMany(() => CourseResource, (resource) => resource.lesson)
  resources: Relation<CourseResource[]>;

  @OneToMany(() => ClassSchedule, (schedule) => schedule.lesson)
  classSchedules: Relation<ClassSchedule[]>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

@Entity('instructors')
@Index('idx_instructors_is_active', ['isActive'])
export class Instructor {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'name' })
  name: string;

  @Index('uq_instructors_email', { unique: true, where: 'email IS NOT NULL' })
  @Column({ name: 'email', nullable: true })
  email?: string;

  @Column({ name: 'phone', nullable: true })
  phone?: string;

  @Column({ name: 'specialization', nullable: true })
  specialization?: string;

  @Column({ name: 'bio', type: 'text', nullable: true })
  bio?: string;

  @Column({ name: 'image_url', nullable: true })
  imageUrl?: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @OneToMany(() => Batch, (batch) => batch.instructor)
  batches: Relation<Batch[]>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

@Entity('batches')
@Index('idx_batches_course_id', ['course'])
@Index('idx_batches_instructor_id', ['instructor'])
@Index('idx_batches_status', ['status'])
@Index('idx_batches_start_date', ['startDate'])
export class Batch {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Course, (course) => course.batches, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'course_id' })
  course: Relation<Course>;

  @ManyToOne(() => Instructor, (instructor) => instructor.batches, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'instructor_id' })
  instructor?: Relation<Instructor>;

  @Column({ name: 'title' })
  title: string;

  @Index('uq_batches_code', { unique: true })
  @Column({ name: 'code', unique: true })
  code: string;

  @Column({ name: 'start_date', type: 'date' })
  startDate: string;

  @Column({ name: 'end_date', type: 'date', nullable: true })
  endDate?: string;

  @Column('text', { name: 'class_days', array: true, default: [] })
  classDays: string[];

  @Column({ name: 'start_time', type: 'time', nullable: true })
  startTime?: string;

  @Column({ name: 'end_time', type: 'time', nullable: true })
  endTime?: string;

  @Column({ name: 'mode', type: 'enum', enum: CourseModeEnum, default: CourseModeEnum.Hybrid })
  mode: CourseMode;

  @Column({ name: 'capacity', type: 'integer', default: 0 })
  capacity: number;

  @Column({ name: 'meeting_url', nullable: true })
  meetingUrl?: string;

  @Column({ name: 'location', nullable: true })
  location?: string;

  @Column({ name: 'enrollment_note', type: 'text', nullable: true })
  enrollmentNote?: string;

  @Column({ name: 'status', type: 'enum', enum: BatchStatusEnum, default: BatchStatusEnum.Upcoming })
  status: BatchStatus;

  @OneToMany(() => Enrollment, (enrollment) => enrollment.batch)
  enrollments: Relation<Enrollment[]>;

  @OneToMany(() => Attendance, (attendance) => attendance.batch)
  attendanceRecords: Relation<Attendance[]>;

  @OneToMany(() => Assignment, (assignment) => assignment.batch)
  assignments: Relation<Assignment[]>;

  @OneToMany(() => ClassSchedule, (schedule) => schedule.batch)
  classSchedules: Relation<ClassSchedule[]>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

@Entity('enrollments')
@Index('idx_enrollments_student_id', ['student'])
@Index('idx_enrollments_course_id', ['course'])
@Index('idx_enrollments_batch_id', ['batch'])
@Index('idx_enrollments_status', ['status'])
@Check('chk_enrollments_progress_percentage', 'progress_percentage >= 0 AND progress_percentage <= 100')
export class Enrollment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => StudentProfile, (student) => student.enrollments, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'student_id' })
  student: Relation<StudentProfile>;

  @ManyToOne(() => Course, (course) => course.enrollments, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'course_id' })
  course: Relation<Course>;

  @ManyToOne(() => Batch, (batch) => batch.enrollments, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'batch_id' })
  batch?: Relation<Batch>;

  @Column({ name: 'status', type: 'enum', enum: EnrollmentStatusEnum, default: EnrollmentStatusEnum.Pending })
  status: EnrollmentStatus;

  @CreateDateColumn({ name: 'enrolled_at' })
  enrolledAt: Date;

  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  completedAt?: Date;

  @Column({ name: 'progress_percentage', type: 'numeric', precision: 5, scale: 2, default: 0 })
  progressPercentage: number;

  @OneToMany(() => FeePlan, (feePlan) => feePlan.enrollment)
  feePlans: Relation<FeePlan[]>;

  @OneToMany(() => Payment, (payment) => payment.enrollment)
  payments: Relation<Payment[]>;

  @OneToMany(() => Certificate, (certificate) => certificate.enrollment)
  certificates: Relation<Certificate[]>;
}

@Entity('class_schedules')
@Index('idx_class_schedules_batch_id', ['batch'])
@Index('idx_class_schedules_course_id', ['course'])
@Index('idx_class_schedules_date', ['date'])
@Index('idx_class_schedules_status', ['status'])
export class ClassSchedule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Batch, (batch) => batch.classSchedules, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'batch_id' })
  batch: Relation<Batch>;

  @ManyToOne(() => Course, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'course_id' })
  course: Relation<Course>;

  @ManyToOne(() => Lesson, (lesson) => lesson.classSchedules, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'lesson_id' })
  lesson?: Relation<Lesson>;

  @Column({ name: 'date', type: 'date' })
  date: string;

  @Column({ name: 'start_time', type: 'time' })
  startTime: string;

  @Column({ name: 'end_time', type: 'time' })
  endTime: string;

  @Column({ name: 'mode', type: 'enum', enum: CourseModeEnum, default: CourseModeEnum.Online })
  mode: CourseMode;

  @Column({ name: 'meeting_url', nullable: true })
  meetingUrl?: string;

  @Column({ name: 'location', nullable: true })
  location?: string;

  @Column({ name: 'status', type: 'enum', enum: ClassScheduleStatusEnum, default: ClassScheduleStatusEnum.Upcoming })
  status: ClassScheduleStatus;

  @OneToMany(() => Attendance, (attendance) => attendance.classSchedule)
  attendanceRecords: Relation<Attendance[]>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

@Entity('attendance')
@Unique('uq_attendance_student_batch_date', ['student', 'batch', 'date'])
@Index('idx_attendance_student_id', ['student'])
@Index('idx_attendance_batch_id', ['batch'])
@Index('idx_attendance_date', ['date'])
@Index('idx_attendance_status', ['status'])
export class Attendance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => StudentProfile, (student) => student.attendanceRecords, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'student_id' })
  student: Relation<StudentProfile>;

  @ManyToOne(() => Batch, (batch) => batch.attendanceRecords, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'batch_id' })
  batch: Relation<Batch>;

  @ManyToOne(() => Course, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'course_id' })
  course?: Relation<Course>;

  @ManyToOne(() => ClassSchedule, (schedule) => schedule.attendanceRecords, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'class_schedule_id' })
  classSchedule?: Relation<ClassSchedule>;

  @Column({ name: 'date', type: 'date' })
  date: string;

  @Column({ name: 'status', type: 'enum', enum: AttendanceStatusEnum, default: AttendanceStatusEnum.Present })
  status: AttendanceStatus;

  @Column({ name: 'remarks', nullable: true })
  remarks?: string;

  @ManyToOne(() => User, (user) => user.markedAttendance, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'marked_by_id' })
  markedBy?: Relation<User>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

@Entity('assignments')
@Index('idx_assignments_course_id', ['course'])
@Index('idx_assignments_batch_id', ['batch'])
@Index('idx_assignments_due_date', ['dueDate'])
@Index('idx_assignments_is_published', ['isPublished'])
export class Assignment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Course, (course) => course.assignments, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'course_id' })
  course: Relation<Course>;

  @ManyToOne(() => Batch, (batch) => batch.assignments, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'batch_id' })
  batch?: Relation<Batch>;

  @ManyToOne(() => CourseModule, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'module_id' })
  module?: Relation<CourseModule>;

  @Column({ name: 'title' })
  title: string;

  @Column({ name: 'description', type: 'text' })
  description: string;

  @Column({ name: 'due_date', type: 'timestamptz' })
  dueDate: Date;

  @Column({ name: 'total_marks', type: 'integer' })
  totalMarks: number;

  @Column({ name: 'attachment_url', nullable: true })
  attachmentUrl?: string;

  @Column({ name: 'is_published', default: false })
  isPublished: boolean;

  @OneToMany(() => AssignmentSubmission, (submission) => submission.assignment)
  submissions: Relation<AssignmentSubmission[]>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

@Entity('assignment_submissions')
@Unique('uq_assignment_submissions_assignment_student', ['assignment', 'student'])
@Index('idx_assignment_submissions_assignment_id', ['assignment'])
@Index('idx_assignment_submissions_student_id', ['student'])
@Index('idx_assignment_submissions_status', ['status'])
export class AssignmentSubmission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Assignment, (assignment) => assignment.submissions, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'assignment_id' })
  assignment: Relation<Assignment>;

  @ManyToOne(() => StudentProfile, (student) => student.assignmentSubmissions, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'student_id' })
  student: Relation<StudentProfile>;

  @Column({ name: 'file_url', nullable: true })
  fileUrl?: string;

  @Column({ name: 'text_answer', type: 'text', nullable: true })
  textAnswer?: string;

  @Column({ name: 'marks_obtained', type: 'integer', nullable: true })
  marksObtained?: number;

  @Column({ name: 'feedback', type: 'text', nullable: true })
  feedback?: string;

  @Column({ name: 'status', type: 'enum', enum: SubmissionStatusEnum, default: SubmissionStatusEnum.Submitted })
  status: SubmissionStatus;

  @CreateDateColumn({ name: 'submitted_at' })
  submittedAt: Date;

  @Column({ name: 'checked_at', type: 'timestamptz', nullable: true })
  checkedAt?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

@Entity('fee_plans')
@Index('idx_fee_plans_enrollment_id', ['enrollment'])
@Index('idx_fee_plans_status', ['status'])
@Check('chk_fee_plans_amounts', 'total_amount >= 0 AND discount_amount >= 0 AND payable_amount >= 0 AND paid_amount >= 0 AND pending_amount >= 0')
export class FeePlan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Enrollment, (enrollment) => enrollment.feePlans, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'enrollment_id' })
  enrollment: Relation<Enrollment>;

  @Column({ name: 'total_amount', type: 'numeric', precision: 12, scale: 2 })
  totalAmount: number;

  @Column({ name: 'discount_amount', type: 'numeric', precision: 12, scale: 2, default: 0 })
  discountAmount: number;

  @Column({ name: 'payable_amount', type: 'numeric', precision: 12, scale: 2 })
  payableAmount: number;

  @Column({ name: 'paid_amount', type: 'numeric', precision: 12, scale: 2, default: 0 })
  paidAmount: number;

  @Column({ name: 'pending_amount', type: 'numeric', precision: 12, scale: 2, default: 0 })
  pendingAmount: number;

  @Column({ name: 'installment_type', type: 'enum', enum: InstallmentTypeEnum, default: InstallmentTypeEnum.Full })
  installmentType: InstallmentType;

  @Column({ name: 'due_date', type: 'date', nullable: true })
  dueDate?: string;

  @Column({ name: 'status', type: 'enum', enum: FeeStatusEnum, default: FeeStatusEnum.Unpaid })
  status: FeeStatus;

  @OneToMany(() => Payment, (payment) => payment.feePlan)
  payments: Relation<Payment[]>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

@Entity('payments')
@Index('idx_payments_student_id', ['student'])
@Index('idx_payments_enrollment_id', ['enrollment'])
@Index('idx_payments_fee_plan_id', ['feePlan'])
@Index('idx_payments_status', ['status'])
@Index('idx_payments_payment_date', ['paymentDate'])
@Check('chk_payments_amount_positive', 'amount > 0')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => StudentProfile, (student) => student.payments, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'student_id' })
  student: Relation<StudentProfile>;

  @ManyToOne(() => Enrollment, (enrollment) => enrollment.payments, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'enrollment_id' })
  enrollment: Relation<Enrollment>;

  @ManyToOne(() => FeePlan, (feePlan) => feePlan.payments, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'fee_plan_id' })
  feePlan?: Relation<FeePlan>;

  @Column({ name: 'amount', type: 'numeric', precision: 12, scale: 2 })
  amount: number;

  @Column({ name: 'method', type: 'enum', enum: PaymentMethodEnum, default: PaymentMethodEnum.Cash })
  method: PaymentMethod;

  @Column({ name: 'transaction_id', nullable: true })
  transactionId?: string;

  @Column({ name: 'payment_date', type: 'date' })
  paymentDate: string;

  @Column({ name: 'status', type: 'enum', enum: PaymentStatusEnum, default: PaymentStatusEnum.Pending })
  status: PaymentStatus;

  @ManyToOne(() => User, (user) => user.receivedPayments, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'received_by_id' })
  receivedBy?: Relation<User>;

  @Column({ name: 'notes', type: 'text', nullable: true })
  notes?: string;

  @OneToOne(() => Invoice, (invoice) => invoice.payment)
  invoice?: Relation<Invoice>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

@Entity('course_resources')
@Index('idx_course_resources_course_id', ['course'])
@Index('idx_course_resources_lesson_id', ['lesson'])
export class CourseResource {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Course, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'course_id' })
  course: Relation<Course>;

  @ManyToOne(() => Lesson, (lesson) => lesson.resources, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'lesson_id' })
  lesson?: Relation<Lesson>;

  @Column({ name: 'title' })
  title: string;

  @Column({ name: 'type', type: 'enum', enum: CourseResourceTypeEnum, default: CourseResourceTypeEnum.File })
  type: CourseResourceType;

  @Column({ name: 'url' })
  url: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

@Entity('invoices')
@Index('idx_invoices_payment_id', ['payment'])
export class Invoice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => Payment, (payment) => payment.invoice, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'payment_id' })
  payment: Relation<Payment>;

  @Index('uq_invoices_invoice_number', { unique: true })
  @Column({ name: 'invoice_number', unique: true })
  invoiceNumber: string;

  @Column({ name: 'amount', type: 'numeric', precision: 12, scale: 2 })
  amount: number;

  @CreateDateColumn({ name: 'issued_at' })
  issuedAt: Date;

  @Column({ name: 'status', type: 'enum', enum: InvoiceStatusEnum, default: InvoiceStatusEnum.Paid })
  status: InvoiceStatus;

  @Column({ name: 'pdf_url', nullable: true })
  pdfUrl?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

@Entity('certificates')
@Index('idx_certificates_student_id', ['student'])
@Index('idx_certificates_course_id', ['course'])
@Index('idx_certificates_enrollment_id', ['enrollment'])
@Index('idx_certificates_status', ['status'])
export class Certificate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => StudentProfile, (student) => student.certificates, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'student_id' })
  student: Relation<StudentProfile>;

  @ManyToOne(() => Course, (course) => course.certificates, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'course_id' })
  course: Relation<Course>;

  @ManyToOne(() => Enrollment, (enrollment) => enrollment.certificates, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'enrollment_id' })
  enrollment: Relation<Enrollment>;

  @Index('uq_certificates_certificate_number', { unique: true })
  @Column({ name: 'certificate_number', unique: true })
  certificateNumber: string;

  @Column({ name: 'issue_date', type: 'date' })
  issueDate: string;

  @Index('uq_certificates_verification_code', { unique: true })
  @Column({ name: 'verification_code', unique: true })
  verificationCode: string;

  @Column({ name: 'pdf_url', nullable: true })
  pdfUrl?: string;

  @Column({ name: 'status', type: 'enum', enum: CertificateStatusEnum, default: CertificateStatusEnum.Issued })
  status: CertificateStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

@Entity('leads')
@Index('idx_leads_status', ['status'])
@Index('idx_leads_source', ['source'])
@Index('idx_leads_assigned_to_id', ['assignedTo'])
@Index('idx_leads_created_at', ['createdAt'])
export class Lead {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'name' })
  name: string;

  @Column({ name: 'email', nullable: true })
  email?: string;

  @Column({ name: 'phone' })
  phone: string;

  @Column({ name: 'course_interest', nullable: true })
  courseInterest?: string;

  @Column({ name: 'city', nullable: true })
  city?: string;

  @Column({ name: 'preferred_mode', nullable: true })
  preferredMode?: string;

  @Column({ name: 'preferred_timing', nullable: true })
  preferredTiming?: string;

  @Column({ name: 'student_level', nullable: true })
  studentLevel?: string;

  @Column({ name: 'message', type: 'text', nullable: true })
  message?: string;

  @Column({ name: 'notes', type: 'text', nullable: true })
  notes?: string;

  @Column({ name: 'source', type: 'enum', enum: LeadSourceEnum, default: LeadSourceEnum.Website })
  source: LeadSource;

  @Column({ name: 'status', type: 'enum', enum: LeadStatusEnum, default: LeadStatusEnum.New })
  status: LeadStatus;

  @ManyToOne(() => User, (user) => user.assignedLeads, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'assigned_to_id' })
  assignedTo?: Relation<User>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

@Entity('notifications')
@Index('idx_notifications_user_id', ['user'])
@Index('idx_notifications_is_read', ['isRead'])
@Index('idx_notifications_type', ['type'])
@Index('idx_notifications_created_at', ['createdAt'])
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.notifications, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: Relation<User>;

  @Column({ name: 'title' })
  title: string;

  @Column({ name: 'message', type: 'text' })
  message: string;

  @Column({ name: 'type', type: 'enum', enum: NotificationTypeEnum, default: NotificationTypeEnum.Info })
  type: NotificationType;

  @Column({ name: 'is_read', default: false })
  isRead: boolean;

  @Column({ name: 'action_url', nullable: true })
  actionUrl?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

@Entity('settings')
export class Setting {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('uq_settings_key', { unique: true })
  @Column({ name: 'key', unique: true })
  key: string;

  @Column({ name: 'value', type: 'jsonb' })
  value: unknown;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

@Entity('audit_logs')
@Index('idx_audit_logs_user_id', ['user'])
@Index('idx_audit_logs_module', ['module'])
@Index('idx_audit_logs_record_id', ['recordId'])
@Index('idx_audit_logs_created_at', ['createdAt'])
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.auditLogs, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'user_id' })
  user?: Relation<User>;

  @Column({ name: 'action' })
  action: string;

  @Column({ name: 'module' })
  module: string;

  @Column({ name: 'record_id', nullable: true })
  recordId?: string;

  @Column({ name: 'metadata', type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
