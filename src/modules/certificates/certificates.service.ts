import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Brackets, DataSource, In } from 'typeorm';
import { Assignment, AssignmentSubmission, Attendance, AuditLog, Certificate, Course, Enrollment, StudentProfile, User } from '../../database/entities';
import { StudentNotificationsService } from '../notifications/student-notifications.service';
import { AdminCertificatesQueryDto } from './dto/admin-certificates-query.dto';
import { IssueCertificateDto } from './dto/issue-certificate.dto';

type CertificateEligibilityItem = {
  studentId: string;
  studentName: string;
  studentEmail: string;
  courseId: string;
  courseTitle: string;
  enrollmentId: string;
  progressPercentage: number;
  attendancePercentage: number;
  assignmentsCompleted: number;
  totalAssignments: number;
  finalProjectCompleted: boolean;
  eligible: boolean;
};

@Injectable()
export class CertificatesService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly studentNotifications: StudentNotificationsService,
  ) {}

  async findAll(query: AdminCertificatesQueryDto) {
    const repository = this.dataSource.getRepository(Certificate);
    const builder = repository.createQueryBuilder('certificate')
      .leftJoinAndSelect('certificate.student', 'student')
      .leftJoinAndSelect('student.user', 'user')
      .leftJoinAndSelect('certificate.course', 'course')
      .leftJoinAndSelect('certificate.enrollment', 'enrollment')
      .orderBy('certificate.issueDate', 'DESC');
    if (query.search?.trim()) {
      const search = `%${query.search.trim()}%`;
      builder.andWhere(new Brackets((where) => where.where('certificate.certificateNumber ILIKE :search', { search }).orWhere('certificate.verificationCode ILIKE :search', { search }).orWhere('user.name ILIKE :search', { search }).orWhere('user.email ILIKE :search', { search }).orWhere('course.title ILIKE :search', { search })));
    }
    if (query.studentId) builder.andWhere('student.id = :studentId', { studentId: query.studentId });
    if (query.courseId) builder.andWhere('course.id = :courseId', { courseId: query.courseId });
    if (query.status !== 'all') builder.andWhere('certificate.status = :status', { status: query.status });
    if (query.dateFrom) builder.andWhere('certificate.issueDate >= :dateFrom', { dateFrom: query.dateFrom });
    if (query.dateTo) builder.andWhere('certificate.issueDate <= :dateTo', { dateTo: query.dateTo });
    const [certificates, totalItems] = await builder.skip((query.page - 1) * query.limit).take(query.limit).getManyAndCount();
    const all = await repository.find();
    const eligible = await this.eligibility();
    return {
      summary: { totalCertificates: all.length, issued: all.filter((item) => item.status === 'issued').length, revoked: all.filter((item) => item.status === 'revoked').length, eligibleStudents: eligible.eligibleStudents.filter((item) => item.eligible).length },
      certificates: certificates.map((item) => this.mapList(item)),
      pagination: { page: query.page, limit: query.limit, totalItems, totalPages: Math.max(1, Math.ceil(totalItems / query.limit)) },
    };
  }

  async eligibility() {
    const enrollments = await this.dataSource.getRepository(Enrollment).find({ where: [{ status: 'completed' }, { progressPercentage: 100 }], relations: { student: { user: true }, course: true, batch: true }, order: { enrolledAt: 'DESC' } });
    const existing = await this.dataSource.getRepository(Certificate).find({ where: { enrollment: { id: In(enrollments.map((item) => item.id || '')) } }, relations: { enrollment: true } });
    const issued = new Set(existing.filter((item) => item.status === 'issued').map((item) => item.enrollment.id));
    const results: CertificateEligibilityItem[] = [];
    for (const enrollment of enrollments) {
      const attendance = await this.dataSource.getRepository(Attendance).find({ where: { student: { id: enrollment.student.id }, course: { id: enrollment.course.id } } });
      const attended = attendance.filter((item) => ['present', 'late'].includes(item.status)).length;
      const assignments = await this.dataSource.getRepository(Assignment).find({ where: { course: { id: enrollment.course.id } } });
      const checked = assignments.length ? await this.dataSource.getRepository(AssignmentSubmission).count({ where: { student: { id: enrollment.student.id }, assignment: { id: In(assignments.map((item) => item.id)) }, status: 'checked' } }) : 0;
      const attendancePercentage = attendance.length ? Math.round((attended / attendance.length) * 100) : 0;
      const eligible = !issued.has(enrollment.id) && Number(enrollment.progressPercentage) >= 100;
      results.push({ studentId: enrollment.student.id, studentName: enrollment.student.user.name, studentEmail: enrollment.student.user.email, courseId: enrollment.course.id, courseTitle: enrollment.course.title, enrollmentId: enrollment.id, progressPercentage: Number(enrollment.progressPercentage), attendancePercentage, assignmentsCompleted: checked, totalAssignments: assignments.length, finalProjectCompleted: checked >= assignments.length, eligible });
    }
    return { eligibleStudents: results };
  }

  async findOne(id: string) {
    const certificate = await this.entity(id);
    return { certificate: this.mapList(certificate) };
  }

  async issue(dto: IssueCertificateDto, actorId: string) {
    const enrollment = await this.dataSource.getRepository(Enrollment).findOne({ where: { id: dto.enrollmentId, student: { id: dto.studentId }, course: { id: dto.courseId } }, relations: { student: { user: true }, course: true, batch: true } });
    if (!enrollment) throw new BadRequestException('Enrollment does not belong to selected student and course');
    const existing = await this.dataSource.getRepository(Certificate).findOne({ where: { enrollment: { id: dto.enrollmentId }, status: 'issued' } });
    if (existing) throw new ConflictException('This enrollment already has an issued certificate');
    const certificate = await this.dataSource.getRepository(Certificate).save({ student: enrollment.student, course: enrollment.course, enrollment, certificateNumber: await this.nextNumber(), verificationCode: await this.nextCode(), issueDate: dto.issueDate, status: 'issued' });
    await this.log(actorId, 'issue', certificate.id, { enrollmentId: enrollment.id });
    await this.studentNotifications.notifyStudent(enrollment.student.id, {
      title: 'Certificate issued',
      message: `Your certificate for ${enrollment.course.title} has been issued.`,
      type: 'certificate',
      actionUrl: '/student/certificates',
    });
    return { message: 'Certificate issued successfully', certificate: { id: certificate.id, certificateNumber: certificate.certificateNumber, verificationCode: certificate.verificationCode } };
  }

  async revoke(id: string, actorId: string) {
    const certificate = await this.entity(id);
    certificate.status = 'revoked';
    await this.dataSource.getRepository(Certificate).save(certificate);
    await this.log(actorId, 'revoke', id);
    return { message: 'Certificate revoked successfully', status: certificate.status };
  }

  async remove(id: string, actorId: string) {
    const certificate = await this.entity(id);
    if (certificate.status === 'issued') throw new ConflictException('Issued certificates should be revoked instead of deleted');
    await this.dataSource.getRepository(Certificate).remove(certificate);
    await this.log(actorId, 'delete', id);
    return { message: 'Certificate deleted successfully' };
  }

  private async entity(id: string) {
    const certificate = await this.dataSource.getRepository(Certificate).findOne({ where: { id }, relations: { student: { user: true }, course: true, enrollment: true } });
    if (!certificate) throw new NotFoundException('Certificate not found');
    return certificate;
  }

  private mapList(certificate: Certificate) {
    return { id: certificate.id, certificateNumber: certificate.certificateNumber, verificationCode: certificate.verificationCode, studentId: certificate.student.id, studentName: certificate.student.user.name, studentEmail: certificate.student.user.email, courseId: certificate.course.id, courseTitle: certificate.course.title, issueDate: certificate.issueDate, status: certificate.status, pdfUrl: certificate.pdfUrl ?? '' };
  }

  private async nextNumber() {
    const count = await this.dataSource.getRepository(Certificate).count();
    return `SGA-CERT-${String(count + 1).padStart(4, '0')}`;
  }

  private async nextCode() {
    return `SGA-VERIFY-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  }

  private async log(actorId: string, action: string, recordId: string, metadata?: Record<string, unknown>) {
    await this.dataSource.getRepository(AuditLog).save({ user: { id: actorId } as User, action, module: 'certificates', recordId, metadata });
  }
}
