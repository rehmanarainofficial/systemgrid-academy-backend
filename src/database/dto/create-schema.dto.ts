import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Max,
  Min,
  MinLength,
} from 'class-validator';
import { UserRole } from '../../common/enums/user-role.enum';
import {
  AttendanceStatusEnum,
  BatchStatusEnum,
  CertificateStatusEnum,
  CourseLanguageEnum,
  CourseLevelEnum,
  CourseModeEnum,
  DurationUnitEnum,
  EnrollmentStatusEnum,
  FeeStatusEnum,
  InstallmentTypeEnum,
  LeadSourceEnum,
  LeadStatusEnum,
  NotificationTypeEnum,
  PaymentMethodEnum,
  PaymentStatusEnum,
  StudentSourceEnum,
  StudentStatusEnum,
  SubmissionStatusEnum,
} from '../entities';

export class CreateUserDto {
  @IsString() @Length(2, 120) name: string;
  @IsEmail() email: string;
  @IsString() @MinLength(8) password: string;
  @IsEnum(UserRole) role: UserRole;
  @IsOptional() @IsString() avatarUrl?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

export class CreateStudentDto {
  @IsUUID() userId: string;
  @IsOptional() @IsString() guardianName?: string;
  @IsOptional() @IsString() guardianPhone?: string;
  @IsOptional() @IsString() cnic?: string;
  @IsOptional() @IsDateString() dateOfBirth?: string;
  @IsOptional() @IsString() gender?: string;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsString() city?: string;
  @IsOptional() @IsEnum(StudentSourceEnum) source?: StudentSourceEnum;
  @IsOptional() @IsEnum(StudentStatusEnum) status?: StudentStatusEnum;
}

export class CreateCourseCategoryDto {
  @IsString() @Length(2, 120) name: string;
  @IsString() @Length(2, 160) slug: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() icon?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional() @IsInt() sortOrder?: number;
}

export class CreateCourseDto {
  @IsOptional() @IsUUID() categoryId?: string;
  @IsString() @Length(2, 180) title: string;
  @IsString() @Length(2, 180) slug: string;
  @IsString() shortDescription: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() thumbnail?: string;
  @IsEnum(CourseLevelEnum) level: CourseLevelEnum;
  @IsNumber() @Min(1) duration: number;
  @IsEnum(DurationUnitEnum) durationUnit: DurationUnitEnum;
  @IsEnum(CourseModeEnum) mode: CourseModeEnum;
  @IsEnum(CourseLanguageEnum) language: CourseLanguageEnum;
  @IsNumber() @Min(0) fee: number;
  @IsOptional() @IsNumber() @Min(0) discountFee?: number;
  @IsOptional() @IsBoolean() isFeatured?: boolean;
  @IsOptional() @IsBoolean() isPublished?: boolean;
}

export class CreateCourseModuleDto {
  @IsUUID() courseId: string;
  @IsString() title: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsInt() sortOrder?: number;
}

export class CreateLessonDto {
  @IsUUID() courseId: string;
  @IsOptional() @IsUUID() moduleId?: string;
  @IsString() title: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() videoUrl?: string;
  @IsOptional() @IsString() resourceUrl?: string;
  @IsOptional() @IsInt() @Min(0) durationMinutes?: number;
  @IsOptional() @IsBoolean() isPreview?: boolean;
  @IsOptional() @IsInt() sortOrder?: number;
  @IsOptional() @IsBoolean() isPublished?: boolean;
}

export class CreateInstructorDto {
  @IsString() name: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() specialization?: string;
  @IsOptional() @IsString() bio?: string;
  @IsOptional() @IsString() imageUrl?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

export class CreateBatchDto {
  @IsUUID() courseId: string;
  @IsOptional() @IsUUID() instructorId?: string;
  @IsString() title: string;
  @IsString() code: string;
  @IsDateString() startDate: string;
  @IsOptional() @IsDateString() endDate?: string;
  @IsArray() classDays: string[];
  @IsOptional() @IsString() startTime?: string;
  @IsOptional() @IsString() endTime?: string;
  @IsEnum(CourseModeEnum) mode: CourseModeEnum;
  @IsInt() @Min(1) capacity: number;
  @IsOptional() @IsEnum(BatchStatusEnum) status?: BatchStatusEnum;
}

export class CreateEnrollmentDto {
  @IsUUID() studentId: string;
  @IsUUID() courseId: string;
  @IsOptional() @IsUUID() batchId?: string;
  @IsOptional() @IsEnum(EnrollmentStatusEnum) status?: EnrollmentStatusEnum;
  @IsOptional() @IsNumber() @Min(0) @Max(100) progressPercentage?: number;
}

export class CreateAttendanceDto {
  @IsUUID() studentId: string;
  @IsUUID() batchId: string;
  @IsDateString() date: string;
  @IsEnum(AttendanceStatusEnum) status: AttendanceStatusEnum;
  @IsOptional() @IsString() remarks?: string;
  @IsOptional() @IsUUID() markedById?: string;
}

export class CreateAssignmentDto {
  @IsUUID() courseId: string;
  @IsOptional() @IsUUID() batchId?: string;
  @IsString() title: string;
  @IsString() description: string;
  @IsDateString() dueDate: string;
  @IsInt() @Min(1) totalMarks: number;
  @IsOptional() @IsString() attachmentUrl?: string;
  @IsOptional() @IsBoolean() isPublished?: boolean;
}

export class CreateAssignmentSubmissionDto {
  @IsUUID() assignmentId: string;
  @IsUUID() studentId: string;
  @IsOptional() @IsString() fileUrl?: string;
  @IsOptional() @IsString() textAnswer?: string;
  @IsOptional() @IsInt() @Min(0) marksObtained?: number;
  @IsOptional() @IsString() feedback?: string;
  @IsOptional() @IsEnum(SubmissionStatusEnum) status?: SubmissionStatusEnum;
}

export class CreateFeePlanDto {
  @IsUUID() enrollmentId: string;
  @IsNumber() @Min(0) totalAmount: number;
  @IsOptional() @IsNumber() @Min(0) discountAmount?: number;
  @IsNumber() @Min(0) payableAmount: number;
  @IsOptional() @IsNumber() @Min(0) paidAmount?: number;
  @IsOptional() @IsNumber() @Min(0) pendingAmount?: number;
  @IsEnum(InstallmentTypeEnum) installmentType: InstallmentTypeEnum;
  @IsOptional() @IsEnum(FeeStatusEnum) status?: FeeStatusEnum;
}

export class CreatePaymentDto {
  @IsUUID() studentId: string;
  @IsUUID() enrollmentId: string;
  @IsUUID() feePlanId: string;
  @IsNumber() @Min(1) amount: number;
  @IsEnum(PaymentMethodEnum) method: PaymentMethodEnum;
  @IsOptional() @IsString() transactionId?: string;
  @IsDateString() paymentDate: string;
  @IsOptional() @IsEnum(PaymentStatusEnum) status?: PaymentStatusEnum;
  @IsOptional() @IsUUID() receivedById?: string;
  @IsOptional() @IsString() notes?: string;
}

export class CreateInvoiceDto {
  @IsUUID() paymentId: string;
  @IsString() invoiceNumber: string;
  @IsNumber() @Min(0) amount: number;
  @IsOptional() @IsString() pdfUrl?: string;
}

export class CreateCertificateDto {
  @IsUUID() studentId: string;
  @IsUUID() courseId: string;
  @IsUUID() enrollmentId: string;
  @IsString() certificateNumber: string;
  @IsDateString() issueDate: string;
  @IsString() verificationCode: string;
  @IsOptional() @IsString() pdfUrl?: string;
  @IsOptional() @IsEnum(CertificateStatusEnum) status?: CertificateStatusEnum;
}

export class CreateLeadDto {
  @IsString() name: string;
  @IsOptional() @IsEmail() email?: string;
  @IsString() phone: string;
  @IsOptional() @IsString() courseInterest?: string;
  @IsOptional() @IsString() message?: string;
  @IsOptional() @IsEnum(LeadSourceEnum) source?: LeadSourceEnum;
  @IsOptional() @IsEnum(LeadStatusEnum) status?: LeadStatusEnum;
  @IsOptional() @IsUUID() assignedToId?: string;
}

export class CreateNotificationDto {
  @IsUUID() userId: string;
  @IsString() title: string;
  @IsString() message: string;
  @IsOptional() @IsEnum(NotificationTypeEnum) type?: NotificationTypeEnum;
  @IsOptional() @IsBoolean() isRead?: boolean;
}

export class CreateSettingDto {
  @IsString() key: string;
  @IsObject() value: Record<string, unknown>;
}

export class CreateAuditLogDto {
  @IsOptional() @IsUUID() userId?: string;
  @IsString() action: string;
  @IsString() module: string;
  @IsOptional() @IsString() recordId?: string;
  @IsOptional() @IsObject() metadata?: Record<string, unknown>;
}
