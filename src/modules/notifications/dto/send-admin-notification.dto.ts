import { ArrayMinSize, IsArray, IsIn, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class SendAdminNotificationDto {
  @IsString() @MaxLength(140) title: string;
  @IsString() @MaxLength(2000) message: string;
  @IsIn(['system', 'fee', 'class', 'assignment', 'certificate', 'payment'])
  type: 'system' | 'fee' | 'class' | 'assignment' | 'certificate' | 'payment';
  @IsIn(['all_students', 'course_students', 'batch_students', 'selected_students'])
  targetType: 'all_students' | 'course_students' | 'batch_students' | 'selected_students';
  @IsOptional() @IsUUID() courseId?: string;
  @IsOptional() @IsUUID() batchId?: string;
  @IsOptional() @IsArray() @ArrayMinSize(1) @IsUUID(undefined, { each: true }) studentIds?: string[];
  @IsOptional() @IsString() @MaxLength(240) actionUrl?: string;
}
