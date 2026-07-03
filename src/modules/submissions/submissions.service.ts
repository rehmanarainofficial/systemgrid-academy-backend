import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, DataSource, Repository } from 'typeorm';
import { AssignmentSubmission, AuditLog, User } from '../../database/entities';
import { AdminSubmissionsQueryDto } from './dto/admin-submissions-query.dto';
import { ReviewSubmissionDto } from './dto/review-submission.dto';

@Injectable()
export class SubmissionsService {
  constructor(@InjectRepository(AssignmentSubmission) private readonly repository: Repository<AssignmentSubmission>, private readonly dataSource: DataSource) {}
  async findAll(query: AdminSubmissionsQueryDto) {
    const builder = this.repository
      .createQueryBuilder('submission')
      .leftJoinAndSelect('submission.assignment', 'assignment')
      .leftJoinAndSelect('assignment.course', 'course')
      .leftJoinAndSelect('assignment.batch', 'batch')
      .leftJoinAndSelect('submission.student', 'student')
      .leftJoinAndSelect('student.user', 'user')
      .orderBy('submission.submittedAt', 'DESC');

    if (query.search?.trim()) {
      const search = `%${query.search.trim()}%`;
      builder.andWhere(new Brackets((where) => {
        where
          .where('user.name ILIKE :search', { search })
          .orWhere('user.email ILIKE :search', { search })
          .orWhere('assignment.title ILIKE :search', { search })
          .orWhere('course.title ILIKE :search', { search })
          .orWhere('batch.title ILIKE :search', { search });
      }));
    }
    if (query.courseId) builder.andWhere('course.id = :courseId', { courseId: query.courseId });
    if (query.batchId) builder.andWhere('batch.id = :batchId', { batchId: query.batchId });
    if (query.assignmentId) builder.andWhere('assignment.id = :assignmentId', { assignmentId: query.assignmentId });
    if (query.status !== 'all') builder.andWhere('submission.status = :status', { status: query.status });

    const [submissions, totalItems] = await builder.skip((query.page - 1) * query.limit).take(query.limit).getManyAndCount();
    const grouped = await this.repository.createQueryBuilder('submission').select('submission.status', 'status').addSelect('COUNT(*)', 'count').groupBy('submission.status').getRawMany<{ status: string; count: string }>();
    const counts = Object.fromEntries(grouped.map((item) => [item.status, Number(item.count)]));
    const total = await this.repository.count();
    return {
      summary: { total, submitted: counts.submitted ?? 0, checked: counts.checked ?? 0, late: counts.late ?? 0, rejected: counts.rejected ?? 0 },
      submissions: submissions.map((item) => this.map(item)),
      pagination: { page: query.page, limit: query.limit, totalItems, totalPages: Math.max(1, Math.ceil(totalItems / query.limit)) },
    };
  }

  async findOne(id: string) {
    const submission = await this.repository.findOne({ where: { id }, relations: { assignment: { course: true, batch: true }, student: { user: true } } });
    if (!submission) throw new NotFoundException('Submission not found');
    return this.map(submission);
  }

  async review(id: string, dto: ReviewSubmissionDto, actorId: string) {
    const submission = await this.repository.findOne({ where: { id }, relations: { assignment: true } });
    if (!submission) throw new NotFoundException('Submission not found');
    if (dto.status === 'checked' && dto.marksObtained === undefined) throw new BadRequestException('Marks are required when checking a submission');
    if (dto.marksObtained !== undefined && dto.marksObtained > submission.assignment.totalMarks) throw new BadRequestException('Marks cannot exceed assignment total marks');
    submission.marksObtained = dto.status === 'checked' ? dto.marksObtained : undefined;
    submission.feedback = dto.feedback?.trim() || undefined;
    submission.status = dto.status;
    submission.checkedAt = new Date();
    await this.repository.save(submission);
    await this.dataSource.getRepository(AuditLog).save({ user: { id: actorId } as User, action: 'review', module: 'submissions', recordId: id, metadata: { assignmentId: submission.assignment.id, status: dto.status, marksObtained: dto.marksObtained } });
    return { message: 'Submission reviewed successfully', status: submission.status, marksObtained: submission.marksObtained === undefined ? null : Number(submission.marksObtained) };
  }

  async updateStatus(id: string, status: 'checked' | 'rejected', actorId: string) {
    if (!['checked', 'rejected'].includes(status)) throw new BadRequestException('Invalid submission status');
    const submission = await this.repository.findOne({ where: { id }, relations: { assignment: true } });
    if (!submission) throw new NotFoundException('Submission not found');
    submission.status = status;
    submission.checkedAt = new Date();
    await this.repository.save(submission);
    await this.dataSource.getRepository(AuditLog).save({ user: { id: actorId } as User, action: 'update_status', module: 'submissions', recordId: id, metadata: { status } });
    return { message: 'Submission status updated successfully', status };
  }

  private map(item: AssignmentSubmission) {
    return {
      id: item.id,
      assignmentId: item.assignment.id,
      assignmentTitle: item.assignment.title,
      courseTitle: item.assignment.course?.title ?? '',
      batchTitle: item.assignment.batch?.title ?? '',
      studentId: item.student.id,
      studentName: item.student.user.name,
      studentEmail: item.student.user.email,
      fileUrl: item.fileUrl ?? '',
      textAnswer: item.textAnswer ?? '',
      totalMarks: item.assignment.totalMarks,
      marksObtained: item.marksObtained === undefined || item.marksObtained === null ? null : Number(item.marksObtained),
      feedback: item.feedback ?? '',
      status: item.status,
      submittedAt: item.submittedAt,
      checkedAt: item.checkedAt ?? null,
    };
  }
}
