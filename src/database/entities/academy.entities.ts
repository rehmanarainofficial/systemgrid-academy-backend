import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { UserRole } from '../../common/enums/user-role.enum';

export type StudentStatus = 'active' | 'inactive' | 'graduated' | 'dropped';
export type CourseLevel = 'beginner' | 'intermediate' | 'advanced';
export type CourseMode = 'online' | 'physical' | 'hybrid';
export type CourseLanguage = 'english' | 'urdu' | 'roman_urdu' | 'mixed';
export type BatchStatus = 'upcoming' | 'active' | 'completed' | 'cancelled';
export type EnrollmentStatus = 'pending' | 'active' | 'completed' | 'cancelled' | 'dropped';
export type AttendanceStatus = 'present' | 'absent' | 'late' | 'leave';
export type SubmissionStatus = 'submitted' | 'checked' | 'late' | 'rejected';
export type FeeStatus = 'unpaid' | 'partial' | 'paid';
export type PaymentStatus = 'pending' | 'verified' | 'rejected';
export type InvoiceStatus = 'paid' | 'unpaid' | 'cancelled';
export type CertificateStatus = 'issued' | 'revoked';
export type LeadStatus = 'new' | 'contacted' | 'converted' | 'rejected';
export type NotificationType =
  | 'system'
  | 'info'
  | 'fee'
  | 'class'
  | 'assignment'
  | 'certificate'
  | 'payment';
export type CourseResourceType = 'pdf' | 'link' | 'video' | 'file';
export type ClassScheduleStatus = 'upcoming' | 'completed' | 'cancelled';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.Student })
  role: UserRole;

  @Column({ nullable: true })
  avatarUrl?: string;

  @Column({ nullable: true })
  phone?: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  lastLoginAt?: Date;

  @OneToOne(() => StudentProfile, (profile) => profile.user)
  studentProfile?: Relation<StudentProfile>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('student_profiles')
export class StudentProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => User, (user) => user.studentProfile)
  @JoinColumn()
  user: User;

  @Column({ nullable: true })
  guardianName?: string;

  @Column({ nullable: true })
  guardianPhone?: string;

  @Column({ nullable: true })
  cnic?: string;

  @Column({ type: 'date', nullable: true })
  dateOfBirth?: string;

  @Column({ nullable: true })
  gender?: string;

  @Column({ nullable: true })
  educationLevel?: string;

  @Column({ nullable: true })
  address?: string;

  @Column({ nullable: true })
  city?: string;

  @Column({ default: 'website' })
  source: string;

  @Column({ default: 'active' })
  status: StudentStatus;

  @OneToMany(() => Enrollment, (enrollment) => enrollment.student)
  enrollments: Enrollment[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('course_categories')
export class CourseCategory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  slug: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ nullable: true })
  icon?: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: 0 })
  sortOrder: number;

  @OneToMany(() => Course, (course) => course.category)
  courses: Course[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('courses')
export class Course {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => CourseCategory, (category) => category.courses, { nullable: true })
  category?: CourseCategory;

  @Column()
  title: string;

  @Column({ unique: true })
  slug: string;

  @Column()
  shortDescription: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ nullable: true })
  thumbnail?: string;

  @Column({ default: 'beginner' })
  level: CourseLevel;

  @Column({ default: 12 })
  duration: number;

  @Column({ default: 'weeks' })
  durationUnit: 'weeks' | 'months';

  @Column({ default: 'hybrid' })
  mode: CourseMode;

  @Column({ default: 'mixed' })
  language: CourseLanguage;

  @Column({ type: 'numeric', default: 0 })
  fee: number;

  @Column({ type: 'numeric', nullable: true })
  discountFee?: number;

  @Column({ default: false })
  isFeatured: boolean;

  @Column({ default: false })
  isPublished: boolean;

  @OneToMany(() => CourseModule, (module) => module.course)
  modules: CourseModule[];

  @OneToMany(() => Lesson, (lesson) => lesson.course)
  lessons: Lesson[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('course_modules')
export class CourseModule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Course, (course) => course.modules)
  course: Course;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ default: 0 })
  sortOrder: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('lessons')
export class Lesson {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Course, (course) => course.lessons)
  course: Course;

  @ManyToOne(() => CourseModule, { nullable: true })
  module?: CourseModule;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ nullable: true })
  videoUrl?: string;

  @Column({ nullable: true })
  resourceUrl?: string;

  @Column({ nullable: true })
  durationMinutes?: number;

  @Column({ default: false })
  isPreview: boolean;

  @Column({ default: 0 })
  sortOrder: number;

  @Column({ default: false })
  isPublished: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('instructors')
export class Instructor {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  email?: string;

  @Column({ nullable: true })
  phone?: string;

  @Column({ nullable: true })
  specialization?: string;

  @Column({ type: 'text', nullable: true })
  bio?: string;

  @Column({ nullable: true })
  imageUrl?: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('batches')
export class Batch {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Course)
  course: Course;

  @ManyToOne(() => Instructor, { nullable: true })
  instructor?: Instructor;

  @Column()
  title: string;

  @Column({ unique: true })
  code: string;

  @Column({ type: 'date' })
  startDate: string;

  @Column({ type: 'date', nullable: true })
  endDate?: string;

  @Column('text', { array: true, default: [] })
  classDays: string[];

  @Column({ type: 'time', nullable: true })
  startTime?: string;

  @Column({ type: 'time', nullable: true })
  endTime?: string;

  @Column({ default: 'hybrid' })
  mode: CourseMode;

  @Column({ default: 25 })
  capacity: number;

  @Column({ default: 'upcoming' })
  status: BatchStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('enrollments')
export class Enrollment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => StudentProfile, (student) => student.enrollments)
  student: StudentProfile;

  @ManyToOne(() => Course)
  course: Course;

  @ManyToOne(() => Batch, { nullable: true })
  batch?: Batch;

  @Column({ default: 'pending' })
  status: EnrollmentStatus;

  @CreateDateColumn()
  enrolledAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  completedAt?: Date;

  @Column({ type: 'numeric', default: 0 })
  progressPercentage: number;
}

@Entity('class_schedules')
export class ClassSchedule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Batch)
  batch: Batch;

  @ManyToOne(() => Course)
  course: Course;

  @ManyToOne(() => Lesson, { nullable: true })
  lesson?: Lesson;

  @Column({ type: 'date' })
  date: string;

  @Column({ type: 'time' })
  startTime: string;

  @Column({ type: 'time' })
  endTime: string;

  @Column({ default: 'online' })
  mode: CourseMode;

  @Column({ nullable: true })
  meetingUrl?: string;

  @Column({ nullable: true })
  location?: string;

  @Column({ default: 'upcoming' })
  status: ClassScheduleStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('attendance')
export class Attendance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => StudentProfile)
  student: StudentProfile;

  @ManyToOne(() => Batch)
  batch: Batch;

  @ManyToOne(() => Course, { nullable: true })
  course?: Course;

  @ManyToOne(() => ClassSchedule, { nullable: true })
  classSchedule?: ClassSchedule;

  @Column({ type: 'date' })
  date: string;

  @Column({ default: 'present' })
  status: AttendanceStatus;

  @Column({ nullable: true })
  remarks?: string;

  @ManyToOne(() => User, { nullable: true })
  markedBy?: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('assignments')
export class Assignment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Course)
  course: Course;

  @ManyToOne(() => Batch, { nullable: true })
  batch?: Batch;

  @ManyToOne(() => CourseModule, { nullable: true })
  module?: CourseModule;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'timestamptz', nullable: true })
  dueDate?: Date;

  @Column({ default: 100 })
  totalMarks: number;

  @Column({ nullable: true })
  attachmentUrl?: string;

  @Column({ default: false })
  isPublished: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('assignment_submissions')
export class AssignmentSubmission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Assignment)
  assignment: Assignment;

  @ManyToOne(() => StudentProfile)
  student: StudentProfile;

  @Column({ nullable: true })
  fileUrl?: string;

  @Column({ type: 'text', nullable: true })
  textAnswer?: string;

  @Column({ type: 'numeric', nullable: true })
  marksObtained?: number;

  @Column({ type: 'text', nullable: true })
  feedback?: string;

  @Column({ default: 'submitted' })
  status: SubmissionStatus;

  @CreateDateColumn()
  submittedAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  checkedAt?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('fee_plans')
export class FeePlan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => Enrollment)
  @JoinColumn()
  enrollment: Enrollment;

  @Column({ type: 'numeric' })
  totalAmount: number;

  @Column({ type: 'numeric', default: 0 })
  discountAmount: number;

  @Column({ type: 'numeric' })
  payableAmount: number;

  @Column({ type: 'numeric', default: 0 })
  paidAmount: number;

  @Column({ type: 'numeric', default: 0 })
  pendingAmount: number;

  @Column({ default: 'full' })
  installmentType: 'full' | 'monthly' | 'custom';

  @Column({ type: 'date', nullable: true })
  dueDate?: string;

  @Column({ default: 'unpaid' })
  status: FeeStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => StudentProfile)
  student: StudentProfile;

  @ManyToOne(() => Enrollment)
  enrollment: Enrollment;

  @Column({ type: 'numeric' })
  amount: number;

  @Column({ default: 'cash' })
  method: 'cash' | 'bank_transfer' | 'easypaisa' | 'jazzcash' | 'card';

  @Column({ nullable: true })
  transactionId?: string;

  @Column({ type: 'date' })
  paymentDate: string;

  @Column({ default: 'pending' })
  status: PaymentStatus;

  @ManyToOne(() => User, { nullable: true })
  receivedBy?: User;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('course_resources')
export class CourseResource {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Course)
  course: Relation<Course>;

  @ManyToOne(() => Lesson, { nullable: true })
  lesson?: Relation<Lesson>;

  @Column()
  title: string;

  @Column({ default: 'file' })
  type: CourseResourceType;

  @Column()
  url: string;

  @CreateDateColumn()
  createdAt: Date;
}

@Entity('invoices')
export class Invoice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => Payment)
  @JoinColumn()
  payment: Payment;

  @Column({ unique: true })
  invoiceNumber: string;

  @Column({ type: 'numeric' })
  amount: number;

  @CreateDateColumn()
  issuedAt: Date;

  @Column({ default: 'paid' })
  status: InvoiceStatus;

  @Column({ nullable: true })
  pdfUrl?: string;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('certificates')
export class Certificate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => StudentProfile)
  student: StudentProfile;

  @ManyToOne(() => Course)
  course: Course;

  @ManyToOne(() => Enrollment)
  enrollment: Enrollment;

  @Column({ unique: true })
  certificateNumber: string;

  @Column({ type: 'date' })
  issueDate: string;

  @Column({ unique: true })
  verificationCode: string;

  @Column({ nullable: true })
  pdfUrl?: string;

  @Column({ default: 'issued' })
  status: CertificateStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('leads')
export class Lead {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  email?: string;

  @Column()
  phone: string;

  @Column({ nullable: true })
  courseInterest?: string;

  @Column({ nullable: true })
  city?: string;

  @Column({ nullable: true })
  preferredMode?: string;

  @Column({ nullable: true })
  preferredTiming?: string;

  @Column({ nullable: true })
  studentLevel?: string;

  @Column({ type: 'text', nullable: true })
  message?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ default: 'website' })
  source: string;

  @Column({ default: 'new' })
  status: LeadStatus;

  @ManyToOne(() => User, { nullable: true })
  assignedTo?: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  user: User;

  @Column()
  title: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ default: 'info' })
  type: NotificationType;

  @Column({ default: false })
  isRead: boolean;

  @Column({ nullable: true })
  actionUrl?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('settings')
export class Setting {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  key: string;

  @Column({ type: 'jsonb' })
  value: unknown;
}

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { nullable: true })
  user?: User;

  @Column()
  action: string;

  @Column()
  module: string;

  @Column({ nullable: true })
  recordId?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  @CreateDateColumn()
  createdAt: Date;
}
