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

export type PricingPlanType = 'monthly' | 'quarterly' | 'full_course';

export type AdmissionApplicationStatus =
  | 'submitted'
  | 'email_pending'
  | 'verified'
  | 'payment_pending'
  | 'payment_failed'
  | 'payment_verified'
  | 'enrolled'
  | 'rejected'
  | 'cancelled'
  | 'waitlisted';

export type PaymentIntentStatus = 'created' | 'pending' | 'verified' | 'failed' | 'cancelled';
export type PaymentGateway = 'jazzcash' | 'easypaisa';
export type ReferralRedemptionStatus = 'applied' | 'payment_pending' | 'verified' | 'rejected' | 'cancelled';
export type WalletLedgerType = 'credit' | 'debit';
export type WalletSource = 'referral_reward' | 'manual_adjustment' | 'invoice_credit_usage' | 'scholarship_adjustment';
export type ScholarshipStatus = 'passed' | 'failed' | 'applied' | 'expired';
export type OfferType =
  | 'quarterly_discount'
  | 'full_course_discount'
  | 'scholarship_discount'
  | 'referral_new_student_discount'
  | 'referral_reward';

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
  Referral = 'referral',
  Wallet = 'wallet',
  Scholarship = 'scholarship',
}

export type NotificationType =
  | 'system'
  | 'info'
  | 'fee'
  | 'class'
  | 'assignment'
  | 'certificate'
  | 'payment'
  | 'referral'
  | 'wallet'
  | 'scholarship';

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

  @OneToMany(() => AdmissionApplication, (application) => application.assignedTo)
  assignedAdmissionApplications: Relation<AdmissionApplication[]>;

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

  @Column({ name: 'course_interest', nullable: true })
  courseInterest?: string;

  @Column({ name: 'preferred_mode', nullable: true })
  preferredMode?: string;

  @Column({ name: 'preferred_timing', nullable: true })
  preferredTiming?: string;

  @Column({ name: 'preferred_days', nullable: true })
  preferredDays?: string;

  @Column({ name: 'admission_message', type: 'text', nullable: true })
  admissionMessage?: string;

  @Column({ name: 'email_verified', default: false })
  emailVerified: boolean;

  @Column({ name: 'email_verified_at', type: 'timestamptz', nullable: true })
  emailVerifiedAt?: Date;

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

  @OneToOne(() => StudentWallet, (wallet) => wallet.student)
  wallet?: Relation<StudentWallet>;

  @OneToMany(() => ReferralCode, (referralCode) => referralCode.student)
  referralCodes: Relation<ReferralCode[]>;

  @OneToMany(() => WalletLedger, (ledger) => ledger.student)
  walletLedger: Relation<WalletLedger[]>;

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

  @Column({ name: 'name', nullable: true })
  name?: string;

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

  @Column({ name: 'duration_months', type: 'integer', default: 3 })
  durationMonths: number;

  @Column({ name: 'duration_label', nullable: true })
  durationLabel?: string;

  @Column({ name: 'duration_unit', type: 'enum', enum: DurationUnitEnum, default: DurationUnitEnum.Weeks })
  durationUnit: DurationUnit;

  @Column({ name: 'mode', type: 'enum', enum: CourseModeEnum, default: CourseModeEnum.Hybrid })
  mode: CourseMode;

  @Column({ name: 'language', type: 'enum', enum: CourseLanguageEnum, default: CourseLanguageEnum.Mixed })
  language: CourseLanguage;

  @Column({ name: 'fee', type: 'numeric', precision: 12, scale: 2, default: 0 })
  fee: number;

  @Column({ name: 'monthly_fee', type: 'numeric', precision: 12, scale: 2, default: 5000 })
  monthlyFee: number;

  @Column({ name: 'discount_fee', type: 'numeric', precision: 12, scale: 2, nullable: true })
  discountFee?: number;

  @Column({ name: 'is_featured', default: false })
  isFeatured: boolean;

  @Column({ name: 'is_published', default: false })
  isPublished: boolean;

  @OneToMany(() => CourseModule, (module) => module.course)
  modules: Relation<CourseModule[]>;

  @OneToMany(() => CourseQuarter, (quarter) => quarter.course)
  quarters: Relation<CourseQuarter[]>;

  @OneToMany(() => CourseOutlineModule, (module) => module.course)
  outlineModules: Relation<CourseOutlineModule[]>;

  @OneToMany(() => CourseTopic, (topic) => topic.course)
  topics: Relation<CourseTopic[]>;

  @OneToMany(() => CourseTool, (tool) => tool.course)
  tools: Relation<CourseTool[]>;

  @OneToMany(() => CourseProject, (project) => project.course)
  projects: Relation<CourseProject[]>;

  @OneToMany(() => CourseOutcome, (outcome) => outcome.course)
  outcomes: Relation<CourseOutcome[]>;

  @OneToMany(() => CourseFAQ, (faq) => faq.course)
  faqs: Relation<CourseFAQ[]>;

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

  @OneToMany(() => AdmissionApplication, (application) => application.course)
  admissionApplications: Relation<AdmissionApplication[]>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

@Entity('course_quarters')
@Index('idx_course_quarters_course_id', ['course'])
@Index('idx_course_quarters_sort_order', ['sortOrder'])
@Unique('uq_course_quarters_course_number', ['course', 'quarterNumber'])
export class CourseQuarter {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Course, (course) => course.quarters, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'course_id' })
  course: Relation<Course>;

  @Column({ name: 'quarter_number', type: 'integer' })
  quarterNumber: number;

  @Column({ name: 'title' })
  title: string;

  @Column({ name: 'subtitle', nullable: true })
  subtitle?: string;

  @Column({ name: 'description', type: 'text', nullable: true })
  description?: string;

  @Column({ name: 'duration_months', type: 'integer', default: 3 })
  durationMonths: number;

  @Column({ name: 'sort_order', default: 0 })
  sortOrder: number;

  @OneToMany(() => CourseOutlineModule, (module) => module.quarter)
  modules: Relation<CourseOutlineModule[]>;

  @OneToMany(() => CourseTopic, (topic) => topic.quarter)
  topics: Relation<CourseTopic[]>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

@Entity('course_outline_modules')
@Index('idx_course_outline_modules_course_id', ['course'])
@Index('idx_course_outline_modules_quarter_id', ['quarter'])
@Index('idx_course_outline_modules_sort_order', ['sortOrder'])
export class CourseOutlineModule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Course, (course) => course.outlineModules, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'course_id' })
  course: Relation<Course>;

  @ManyToOne(() => CourseQuarter, (quarter) => quarter.modules, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'quarter_id' })
  quarter: Relation<CourseQuarter>;

  @Column({ name: 'title' })
  title: string;

  @Column({ name: 'description', type: 'text', nullable: true })
  description?: string;

  @Column({ name: 'sort_order', default: 0 })
  sortOrder: number;

  @OneToMany(() => CourseTopic, (topic) => topic.module)
  topics: Relation<CourseTopic[]>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

@Entity('course_topics')
@Index('idx_course_topics_course_id', ['course'])
@Index('idx_course_topics_quarter_id', ['quarter'])
@Index('idx_course_topics_module_id', ['module'])
@Index('idx_course_topics_sort_order', ['sortOrder'])
export class CourseTopic {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Course, (course) => course.topics, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'course_id' })
  course: Relation<Course>;

  @ManyToOne(() => CourseQuarter, (quarter) => quarter.topics, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'quarter_id' })
  quarter: Relation<CourseQuarter>;

  @ManyToOne(() => CourseOutlineModule, (module) => module.topics, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'module_id' })
  module: Relation<CourseOutlineModule>;

  @Column({ name: 'title' })
  title: string;

  @Column({ name: 'description', type: 'text', nullable: true })
  description?: string;

  @Column({ name: 'level', default: 'foundation' })
  level: string;

  @Column({ name: 'sort_order', default: 0 })
  sortOrder: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

@Entity('course_tools')
@Index('idx_course_tools_course_id', ['course'])
@Index('idx_course_tools_sort_order', ['sortOrder'])
export class CourseTool {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Course, (course) => course.tools, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'course_id' })
  course: Relation<Course>;

  @Column({ name: 'name' })
  name: string;

  @Column({ name: 'type', nullable: true })
  type?: string;

  @Column({ name: 'icon', nullable: true })
  icon?: string;

  @Column({ name: 'sort_order', default: 0 })
  sortOrder: number;
}

@Entity('course_projects')
@Index('idx_course_projects_course_id', ['course'])
@Index('idx_course_projects_sort_order', ['sortOrder'])
export class CourseProject {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Course, (course) => course.projects, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'course_id' })
  course: Relation<Course>;

  @Column({ name: 'title' })
  title: string;

  @Column({ name: 'description', type: 'text', nullable: true })
  description?: string;

  @Column({ name: 'quarter_number', type: 'integer', nullable: true })
  quarterNumber?: number;

  @Column({ name: 'skills', type: 'simple-array', nullable: true })
  skills?: string[];

  @Column({ name: 'sort_order', default: 0 })
  sortOrder: number;
}

@Entity('course_outcomes')
@Index('idx_course_outcomes_course_id', ['course'])
@Index('idx_course_outcomes_sort_order', ['sortOrder'])
export class CourseOutcome {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Course, (course) => course.outcomes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'course_id' })
  course: Relation<Course>;

  @Column({ name: 'title' })
  title: string;

  @Column({ name: 'description', type: 'text', nullable: true })
  description?: string;

  @Column({ name: 'sort_order', default: 0 })
  sortOrder: number;
}

@Entity('course_faqs')
@Index('idx_course_faqs_course_id', ['course'])
@Index('idx_course_faqs_sort_order', ['sortOrder'])
export class CourseFAQ {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Course, (course) => course.faqs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'course_id' })
  course: Relation<Course>;

  @Column({ name: 'question' })
  question: string;

  @Column({ name: 'answer', type: 'text' })
  answer: string;

  @Column({ name: 'sort_order', default: 0 })
  sortOrder: number;
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

  @ManyToOne(() => StudentProfile, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  student?: Relation<StudentProfile>;

  @ManyToOne(() => Course, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'course_id' })
  course?: Relation<Course>;

  @Column({ name: 'pricing_type', nullable: true })
  pricingType?: PricingPlanType;

  @Column({ name: 'course_duration_months', type: 'integer', default: 1 })
  courseDurationMonths: number;

  @Column({ name: 'base_monthly_fee', type: 'numeric', precision: 12, scale: 2, default: 5000 })
  baseMonthlyFee: number;

  @Column({ name: 'total_amount', type: 'numeric', precision: 12, scale: 2 })
  totalAmount: number;

  @Column({ name: 'discount_amount', type: 'numeric', precision: 12, scale: 2, default: 0 })
  discountAmount: number;

  @Column({ name: 'discount_percentage', type: 'numeric', precision: 5, scale: 2, default: 0 })
  discountPercentage: number;

  @Column({ name: 'referral_coupon_discount_amount', type: 'numeric', precision: 12, scale: 2, default: 0 })
  referralCouponDiscountAmount: number;

  @Column({ name: 'scholarship_discount_amount', type: 'numeric', precision: 12, scale: 2, default: 0 })
  scholarshipDiscountAmount: number;

  @Column({ name: 'wallet_credit_used', type: 'numeric', precision: 12, scale: 2, default: 0 })
  walletCreditUsed: number;

  @Column({ name: 'payable_amount', type: 'numeric', precision: 12, scale: 2 })
  payableAmount: number;

  @Column({ name: 'paid_amount', type: 'numeric', precision: 12, scale: 2, default: 0 })
  paidAmount: number;

  @Column({ name: 'pending_amount', type: 'numeric', precision: 12, scale: 2, default: 0 })
  pendingAmount: number;

  @Column({ name: 'installment_type', type: 'enum', enum: InstallmentTypeEnum, default: InstallmentTypeEnum.Full })
  installmentType: InstallmentType;

  @Column({ name: 'billing_cycle', nullable: true })
  billingCycle?: PricingPlanType;

  @Column({ name: 'due_date', type: 'date', nullable: true })
  dueDate?: string;

  @Column({ name: 'next_due_date', type: 'date', nullable: true })
  nextDueDate?: string;

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

  @ManyToOne(() => Invoice, (invoice) => invoice.payments, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'invoice_id' })
  invoiceRecord?: Relation<Invoice>;

  @OneToOne(() => PaymentIntent, (intent) => intent.payment, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'payment_intent_id' })
  paymentIntent?: Relation<PaymentIntent>;

  @Column({ name: 'amount', type: 'numeric', precision: 12, scale: 2 })
  amount: number;

  @Column({ name: 'method', type: 'enum', enum: PaymentMethodEnum, default: PaymentMethodEnum.Cash })
  method: PaymentMethod;

  @Column({ name: 'gateway', nullable: true })
  gateway?: PaymentGateway;

  @Column({ name: 'transaction_id', nullable: true })
  transactionId?: string;

  @Column({ name: 'gateway_reference', nullable: true })
  gatewayReference?: string;

  @Column({ name: 'payment_date', type: 'date' })
  paymentDate: string;

  @Column({ name: 'status', type: 'enum', enum: PaymentStatusEnum, default: PaymentStatusEnum.Pending })
  status: PaymentStatus;

  @ManyToOne(() => User, (user) => user.receivedPayments, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'received_by_id' })
  receivedBy?: Relation<User>;

  @Column({ name: 'notes', type: 'text', nullable: true })
  notes?: string;

  @Column({ name: 'raw_gateway_response', type: 'jsonb', nullable: true })
  rawGatewayResponse?: Record<string, unknown>;

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
@Index('idx_invoices_admission_application_id', ['admissionApplication'])
@Check('chk_invoices_amounts_non_negative', 'amount >= 0 AND gross_amount >= 0 AND payable_amount >= 0 AND paid_amount >= 0 AND pending_amount >= 0')
export class Invoice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => Payment, (payment) => payment.invoice, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'payment_id' })
  payment: Relation<Payment>;

  @OneToMany(() => Payment, (payment) => payment.invoiceRecord)
  payments: Relation<Payment[]>;

  @ManyToOne(() => AdmissionApplication, (application) => application.invoices, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'admission_application_id' })
  admissionApplication?: Relation<AdmissionApplication>;

  @ManyToOne(() => StudentProfile, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'student_id' })
  student?: Relation<StudentProfile>;

  @ManyToOne(() => Enrollment, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'enrollment_id' })
  enrollment?: Relation<Enrollment>;

  @ManyToOne(() => FeePlan, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'fee_plan_id' })
  feePlan?: Relation<FeePlan>;

  @Index('uq_invoices_invoice_number', { unique: true })
  @Column({ name: 'invoice_number', unique: true })
  invoiceNumber: string;

  @Column({ name: 'amount', type: 'numeric', precision: 12, scale: 2 })
  amount: number;

  @Column({ name: 'pricing_plan_type', nullable: true })
  pricingPlanType?: PricingPlanType;

  @Column({ name: 'gross_amount', type: 'numeric', precision: 12, scale: 2, default: 0 })
  grossAmount: number;

  @Column({ name: 'plan_discount_amount', type: 'numeric', precision: 12, scale: 2, default: 0 })
  planDiscountAmount: number;

  @Column({ name: 'referral_coupon_discount_amount', type: 'numeric', precision: 12, scale: 2, default: 0 })
  referralCouponDiscountAmount: number;

  @Column({ name: 'scholarship_discount_amount', type: 'numeric', precision: 12, scale: 2, default: 0 })
  scholarshipDiscountAmount: number;

  @Column({ name: 'wallet_credit_used', type: 'numeric', precision: 12, scale: 2, default: 0 })
  walletCreditUsed: number;

  @Column({ name: 'payable_amount', type: 'numeric', precision: 12, scale: 2, default: 0 })
  payableAmount: number;

  @Column({ name: 'paid_amount', type: 'numeric', precision: 12, scale: 2, default: 0 })
  paidAmount: number;

  @Column({ name: 'pending_amount', type: 'numeric', precision: 12, scale: 2, default: 0 })
  pendingAmount: number;

  @CreateDateColumn({ name: 'issued_at' })
  issuedAt: Date;

  @Column({ name: 'status', type: 'enum', enum: InvoiceStatusEnum, default: InvoiceStatusEnum.Paid })
  status: InvoiceStatus;

  @Column({ name: 'due_date', type: 'date', nullable: true })
  dueDate?: string;

  @Column({ name: 'paid_at', type: 'timestamptz', nullable: true })
  paidAt?: Date;

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

  @Column({ name: 'phone', nullable: true })
  phone?: string;

  @Column({ name: 'course_interest', nullable: true })
  courseInterest?: string;

  @Column({ name: 'city', nullable: true })
  city?: string;

  @Column({ name: 'guardian_name', nullable: true })
  guardianName?: string;

  @Column({ name: 'guardian_phone', nullable: true })
  guardianPhone?: string;

  @Column({ name: 'date_of_birth', type: 'date', nullable: true })
  dateOfBirth?: string;

  @Column({ name: 'gender', type: 'enum', enum: GenderEnum, nullable: true })
  gender?: Gender;

  @Column({ name: 'address', nullable: true })
  address?: string;

  @Column({ name: 'preferred_mode', nullable: true })
  preferredMode?: string;

  @Column({ name: 'preferred_timing', nullable: true })
  preferredTiming?: string;

  @Column({ name: 'preferred_days', nullable: true })
  preferredDays?: string;

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

@Entity('admission_applications')
@Index('idx_admission_applications_email', ['email'])
@Index('idx_admission_applications_status', ['status'])
@Index('idx_admission_applications_course_id', ['course'])
@Index('idx_admission_applications_created_at', ['createdAt'])
@Check('chk_admission_application_amounts', 'gross_amount >= 0 AND plan_discount_amount >= 0 AND referral_discount_amount >= 0 AND scholarship_discount_amount >= 0 AND final_payable_amount >= 0')
export class AdmissionApplication {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'name', nullable: true })
  name?: string;

  @Column({ name: 'email' })
  email: string;

  @Column({ name: 'phone', nullable: true })
  phone?: string;

  @Column({ name: 'guardian_name', nullable: true })
  guardianName?: string;

  @Column({ name: 'guardian_phone', nullable: true })
  guardianPhone?: string;

  @Column({ name: 'city', nullable: true })
  city?: string;

  @Column({ name: 'address', type: 'text', nullable: true })
  address?: string;

  @Column({ name: 'date_of_birth', type: 'date', nullable: true })
  dateOfBirth?: string;

  @Column({ name: 'gender', type: 'enum', enum: GenderEnum, nullable: true })
  gender?: Gender;

  @Column({ name: 'education_level', nullable: true })
  educationLevel?: string;

  @ManyToOne(() => Course, (course) => course.admissionApplications, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'course_id' })
  course?: Relation<Course>;

  @ManyToOne(() => Batch, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'batch_id' })
  batch?: Relation<Batch>;

  @Column({ name: 'preferred_mode', nullable: true })
  preferredMode?: string;

  @Column({ name: 'preferred_timing', nullable: true })
  preferredTiming?: string;

  @Column({ name: 'preferred_days', nullable: true })
  preferredDays?: string;

  @Column({ name: 'pricing_plan_type', nullable: true })
  pricingPlanType?: PricingPlanType;

  @Column({ name: 'referral_code_applied', nullable: true })
  referralCodeApplied?: string;

  @Column({ name: 'referral_discount_amount', type: 'numeric', precision: 12, scale: 2, default: 0 })
  referralDiscountAmount: number;

  @Column({ name: 'gross_amount', type: 'numeric', precision: 12, scale: 2, default: 0 })
  grossAmount: number;

  @Column({ name: 'plan_discount_amount', type: 'numeric', precision: 12, scale: 2, default: 0 })
  planDiscountAmount: number;

  @Column({ name: 'scholarship_discount_amount', type: 'numeric', precision: 12, scale: 2, default: 0 })
  scholarshipDiscountAmount: number;

  @Column({ name: 'final_payable_amount', type: 'numeric', precision: 12, scale: 2, default: 0 })
  finalPayableAmount: number;

  @Column({ name: 'status', default: 'email_pending' })
  status: AdmissionApplicationStatus;

  @Column({ name: 'email_verified', default: false })
  emailVerified: boolean;

  @Column({ name: 'email_otp_hash', nullable: true, select: false })
  emailOtpHash?: string;

  @Column({ name: 'email_otp_expires_at', type: 'timestamptz', nullable: true })
  emailOtpExpiresAt?: Date;

  @Column({ name: 'email_otp_sent_at', type: 'timestamptz', nullable: true })
  emailOtpSentAt?: Date;

  @Column({ name: 'email_otp_attempts', type: 'integer', default: 0 })
  emailOtpAttempts: number;

  @Column({ name: 'email_verified_at', type: 'timestamptz', nullable: true })
  emailVerifiedAt?: Date;

  @Column({ name: 'message', type: 'text', nullable: true })
  message?: string;

  @ManyToOne(() => User, (user) => user.assignedAdmissionApplications, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'assigned_to_id' })
  assignedTo?: Relation<User>;

  @OneToMany(() => Invoice, (invoice) => invoice.admissionApplication)
  invoices: Relation<Invoice[]>;

  @OneToMany(() => PaymentIntent, (intent) => intent.admissionApplication)
  paymentIntents: Relation<PaymentIntent[]>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

@Entity('payment_intents')
@Index('idx_payment_intents_status', ['status'])
@Index('idx_payment_intents_merchant_transaction_id', ['merchantTransactionId'])
@Index('idx_payment_intents_admission_application_id', ['admissionApplication'])
@Check('chk_payment_intents_amount_non_negative', 'amount >= 0')
export class PaymentIntent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => AdmissionApplication, (application) => application.paymentIntents, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'admission_application_id' })
  admissionApplication: Relation<AdmissionApplication>;

  @ManyToOne(() => StudentProfile, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'student_id' })
  student?: Relation<StudentProfile>;

  @ManyToOne(() => Invoice, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'invoice_id' })
  invoice: Relation<Invoice>;

  @ManyToOne(() => FeePlan, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'fee_plan_id' })
  feePlan?: Relation<FeePlan>;

  @Column({ name: 'gateway' })
  gateway: PaymentGateway;

  @Column({ name: 'amount', type: 'numeric', precision: 12, scale: 2 })
  amount: number;

  @Column({ name: 'currency', default: 'PKR' })
  currency: string;

  @Column({ name: 'status', default: 'created' })
  status: PaymentIntentStatus;

  @Column({ name: 'gateway_reference', nullable: true })
  gatewayReference?: string;

  @Index('uq_payment_intents_merchant_transaction_id', { unique: true })
  @Column({ name: 'merchant_transaction_id', unique: true })
  merchantTransactionId: string;

  @Column({ name: 'redirect_url', nullable: true })
  redirectUrl?: string;

  @Column({ name: 'callback_payload', type: 'jsonb', nullable: true })
  callbackPayload?: Record<string, unknown>;

  @Column({ name: 'verified_at', type: 'timestamptz', nullable: true })
  verifiedAt?: Date;

  @OneToOne(() => Payment, (payment) => payment.paymentIntent)
  payment?: Relation<Payment>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

@Entity('referral_codes')
@Index('idx_referral_codes_student_id', ['student'])
export class ReferralCode {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => StudentProfile, (student) => student.referralCodes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  student: Relation<StudentProfile>;

  @Index('uq_referral_codes_code', { unique: true })
  @Column({ name: 'code', unique: true })
  code: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'total_uses', type: 'integer', default: 0 })
  totalUses: number;

  @Column({ name: 'total_verified_uses', type: 'integer', default: 0 })
  totalVerifiedUses: number;

  @Column({ name: 'total_credit_earned', type: 'numeric', precision: 12, scale: 2, default: 0 })
  totalCreditEarned: number;

  @OneToMany(() => ReferralRedemption, (redemption) => redemption.referralCode)
  redemptions: Relation<ReferralRedemption[]>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

@Entity('referral_redemptions')
@Index('idx_referral_redemptions_status', ['status'])
@Index('idx_referral_redemptions_application_id', ['referredApplication'])
export class ReferralRedemption {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => ReferralCode, (referralCode) => referralCode.redemptions, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'referral_code_id' })
  referralCode: Relation<ReferralCode>;

  @ManyToOne(() => StudentProfile, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'referrer_student_id' })
  referrerStudent: Relation<StudentProfile>;

  @ManyToOne(() => AdmissionApplication, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'referred_application_id' })
  referredApplication: Relation<AdmissionApplication>;

  @ManyToOne(() => StudentProfile, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'referred_student_id' })
  referredStudent?: Relation<StudentProfile>;

  @Column({ name: 'status', default: 'applied' })
  status: ReferralRedemptionStatus;

  @Column({ name: 'referred_student_discount_amount', type: 'numeric', precision: 12, scale: 2, default: 500 })
  referredStudentDiscountAmount: number;

  @Column({ name: 'referrer_credit_amount', type: 'numeric', precision: 12, scale: 2, default: 1000 })
  referrerCreditAmount: number;

  @Column({ name: 'verified_at', type: 'timestamptz', nullable: true })
  verifiedAt?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

@Entity('student_wallets')
@Index('idx_student_wallets_student_id', ['student'])
@Check('chk_student_wallets_non_negative', 'balance >= 0 AND total_earned >= 0 AND total_used >= 0')
export class StudentWallet {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => StudentProfile, (student) => student.wallet, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  student: Relation<StudentProfile>;

  @Column({ name: 'balance', type: 'numeric', precision: 12, scale: 2, default: 0 })
  balance: number;

  @Column({ name: 'total_earned', type: 'numeric', precision: 12, scale: 2, default: 0 })
  totalEarned: number;

  @Column({ name: 'total_used', type: 'numeric', precision: 12, scale: 2, default: 0 })
  totalUsed: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

@Entity('wallet_ledger')
@Index('idx_wallet_ledger_student_id', ['student'])
@Index('idx_wallet_ledger_created_at', ['createdAt'])
export class WalletLedger {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => StudentProfile, (student) => student.walletLedger, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  student: Relation<StudentProfile>;

  @Column({ name: 'type' })
  type: WalletLedgerType;

  @Column({ name: 'source' })
  source: WalletSource;

  @Column({ name: 'amount', type: 'numeric', precision: 12, scale: 2 })
  amount: number;

  @Column({ name: 'balance_after', type: 'numeric', precision: 12, scale: 2 })
  balanceAfter: number;

  @Column({ name: 'reference_id', nullable: true })
  referenceId?: string;

  @Column({ name: 'description', type: 'text', nullable: true })
  description?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

@Entity('scholarship_tests')
@Index('idx_scholarship_tests_student_id', ['student'])
@Index('idx_scholarship_tests_enrollment_id', ['enrollment'])
export class ScholarshipTest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => StudentProfile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  student: Relation<StudentProfile>;

  @ManyToOne(() => Course, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'course_id' })
  course: Relation<Course>;

  @ManyToOne(() => Enrollment, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'enrollment_id' })
  enrollment: Relation<Enrollment>;

  @Column({ name: 'quarter_number', type: 'integer' })
  quarterNumber: number;

  @Column({ name: 'score_percentage', type: 'numeric', precision: 5, scale: 2 })
  scorePercentage: number;

  @Column({ name: 'status', default: 'failed' })
  status: ScholarshipStatus;

  @Column({ name: 'discount_percentage', type: 'numeric', precision: 5, scale: 2, default: 0 })
  discountPercentage: number;

  @Column({ name: 'valid_from', type: 'date', nullable: true })
  validFrom?: string;

  @Column({ name: 'valid_until', type: 'date', nullable: true })
  validUntil?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

@Entity('offers')
@Index('idx_offers_slug', ['slug'])
@Index('idx_offers_type', ['type'])
export class Offer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'name' })
  name: string;

  @Index('uq_offers_slug', { unique: true })
  @Column({ name: 'slug', unique: true })
  slug: string;

  @Column({ name: 'description', type: 'text', nullable: true })
  description?: string;

  @Column({ name: 'type' })
  type: OfferType;

  @Column({ name: 'discount_percentage', type: 'numeric', precision: 5, scale: 2, default: 0 })
  discountPercentage: number;

  @Column({ name: 'discount_amount', type: 'numeric', precision: 12, scale: 2, default: 0 })
  discountAmount: number;

  @Column({ name: 'applies_to', nullable: true })
  appliesTo?: string;

  @Column({ name: 'min_course_duration_months', type: 'integer', nullable: true })
  minCourseDurationMonths?: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'start_date', type: 'date', nullable: true })
  startDate?: string;

  @Column({ name: 'end_date', type: 'date', nullable: true })
  endDate?: string;

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
