import { IsDateString, IsUUID } from 'class-validator';

export class IssueCertificateDto {
  @IsUUID() studentId: string;
  @IsUUID() courseId: string;
  @IsUUID() enrollmentId: string;
  @IsDateString() issueDate: string;
}
