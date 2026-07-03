import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { AssignmentSubmission, AuditLog, User } from '../../database/entities';
import { ReviewSubmissionDto } from './dto/review-submission.dto';

@Injectable()
export class SubmissionsService {
  constructor(@InjectRepository(AssignmentSubmission) private readonly repository: Repository<AssignmentSubmission>, private readonly dataSource: DataSource) {}
  async review(id: string, dto: ReviewSubmissionDto, actorId: string) {
    const submission = await this.repository.findOne({ where: { id }, relations: { assignment: true } });
    if (!submission) throw new NotFoundException('Submission not found');
    if (dto.marksObtained > submission.assignment.totalMarks) throw new BadRequestException('Marks cannot exceed assignment total marks');
    submission.marksObtained = dto.marksObtained;
    submission.feedback = dto.feedback?.trim() || undefined;
    submission.status = dto.status;
    submission.checkedAt = new Date();
    await this.repository.save(submission);
    await this.dataSource.getRepository(AuditLog).save({ user: { id: actorId } as User, action: 'review', module: 'submissions', recordId: id, metadata: { assignmentId: submission.assignment.id, status: dto.status, marksObtained: dto.marksObtained } });
    return { message: 'Submission reviewed successfully', status: submission.status, marksObtained: Number(submission.marksObtained) };
  }
}
