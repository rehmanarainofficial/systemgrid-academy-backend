import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { Brackets, DataSource, Repository } from 'typeorm';
import { UserRole } from '../../common/enums/user-role.enum';
import {
  AuditLog,
  Batch,
  Course,
  Enrollment,
  Gender,
  LeadSource,
  Lead,
  StudentSource,
  StudentProfile,
  User,
} from '../../database/entities';
import { AdmissionEmailService } from '../admissions/email.service';
import { AdminAlertsService } from '../notifications/admin-alerts.service';
import { AdminLeadsQueryDto } from './dto/admin-leads-query.dto';
import { ConvertLeadToStudentDto } from './dto/convert-lead-to-student.dto';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';

@Injectable()
export class LeadsService {
  private readonly logger = new Logger(LeadsService.name);

  constructor(
    @InjectRepository(Lead)
    private readonly leadsRepository: Repository<Lead>,
    private readonly dataSource: DataSource,
    private readonly adminAlertsService: AdminAlertsService,
    private readonly admissionEmailService: AdmissionEmailService,
  ) {}

  async create(createLeadDto: CreateLeadDto) {
    const {
      city,
      educationLevel,
      preferredMode,
      preferredTiming,
      selectedCourse,
      ...leadData
    } = createLeadDto;

    const lead = this.leadsRepository.create({
      ...leadData,
      city,
      studentLevel: educationLevel,
      preferredMode,
      preferredTiming,
      courseInterest: selectedCourse ?? leadData.courseInterest,
      source: this.normalizeLeadSource(leadData.source),
      status: 'new',
    });

    const saved = await this.leadsRepository.save(lead);

    await this.adminAlertsService.notifyAdmins({
      title: 'New lead received',
      message: `${saved.name} submitted a lead${saved.courseInterest ? ` for ${saved.courseInterest}` : ''}.`,
      type: 'info',
      actionUrl: '/admin/leads',
    });

    try {
      await this.admissionEmailService.sendNewLeadAlertEmail({
        name: saved.name,
        phone: saved.phone ?? '',
        email: saved.email,
        courseInterest: saved.courseInterest,
        source: saved.source,
        message: saved.message,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown error';
      this.logger.warn(`Lead alert email failed for ${saved.id}: ${message}`);
    }

    return saved;
  }

  async findAdminList(query: AdminLeadsQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const builder = this.leadsRepository
      .createQueryBuilder('lead')
      .leftJoinAndSelect('lead.assignedTo', 'assignedTo')
      .orderBy('lead.createdAt', 'DESC');

    if (query.search?.trim()) {
      const search = `%${query.search.trim()}%`;
      builder.andWhere(
        new Brackets((where) => {
          where
            .where('lead.name ILIKE :search', { search })
            .orWhere('lead.email ILIKE :search', { search })
            .orWhere('lead.phone ILIKE :search', { search });
        }),
      );
    }
    if (query.status && query.status !== 'all') {
      builder.andWhere('lead.status = :status', { status: query.status });
    } else {
      builder.andWhere('lead.status != :convertedStatus', {
        convertedStatus: 'converted',
      });
    }
    if (query.source && query.source !== 'all') {
      builder.andWhere('lead.source = :source', { source: query.source });
    }
    if (query.courseInterest?.trim()) {
      builder.andWhere('lead.courseInterest ILIKE :courseInterest', {
        courseInterest: `%${query.courseInterest.trim()}%`,
      });
    }

    const [leads, totalItems] = await builder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    const grouped = await this.leadsRepository
      .createQueryBuilder('lead')
      .select('lead.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('lead.status')
      .getRawMany<{ status: string; count: string }>();
    const counts = Object.fromEntries(
      grouped.map((item) => [item.status, Number(item.count)]),
    );
    const total = await this.leadsRepository
      .createQueryBuilder('lead')
      .where('lead.status != :convertedStatus', { convertedStatus: 'converted' })
      .getCount();

    return {
      summary: {
        total,
        new: counts.new ?? 0,
        contacted: counts.contacted ?? 0,
        converted: counts.converted ?? 0,
        rejected: counts.rejected ?? 0,
      },
      leads: leads.map((lead) => this.mapLead(lead)),
      pagination: {
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(totalItems / limit)),
        totalItems,
      },
    };
  }

  async findAdminDetail(id: string) {
    const lead = await this.leadsRepository.findOne({
      where: { id },
      relations: { assignedTo: true },
    });
    if (!lead) throw new NotFoundException('Lead not found');
    return this.mapLead(lead);
  }

  async updateAdmin(id: string, dto: UpdateLeadDto, actorId: string) {
    const lead = await this.leadsRepository.findOne({ where: { id } });
    if (!lead) throw new NotFoundException('Lead not found');

    if (dto.assignedToId) {
      const assignee = await this.dataSource.getRepository(User).findOne({
        where: { id: dto.assignedToId },
      });
      if (!assignee) throw new BadRequestException('Assigned user not found');
      lead.assignedTo = assignee;
    }
    if (dto.status === 'converted') {
      throw new BadRequestException(
        'Use the convert to student action to convert a lead',
      );
    }
    if (dto.status) lead.status = dto.status;
    if (dto.notes !== undefined) lead.notes = dto.notes.trim() || undefined;
    const saved = await this.leadsRepository.save(lead);
    await this.logAction(actorId, 'update', 'leads', id, { ...dto });
    return this.mapLead(saved);
  }

  async deleteAdmin(id: string, actorId: string) {
    const lead = await this.leadsRepository.findOne({ where: { id } });
    if (!lead) throw new NotFoundException('Lead not found');
    await this.leadsRepository.remove(lead);
    await this.logAction(actorId, 'delete', 'leads', id, {
      name: lead.name,
      status: lead.status,
    });
    return { message: 'Lead deleted successfully' };
  }

  async convertToStudent(
    id: string,
    dto: ConvertLeadToStudentDto,
    actorId: string,
  ) {
    const result = await this.dataSource.transaction(async (manager) => {
      const lead = await manager.findOne(Lead, { where: { id } });
      if (!lead) throw new NotFoundException('Lead not found');
      if (lead.status === 'converted') {
        throw new ConflictException('This lead has already been converted');
      }

      const email = (dto.email ?? lead.email)?.trim().toLowerCase();
      if (!email) {
        throw new BadRequestException(
          'Add an email address before converting this lead',
        );
      }
      if (await manager.findOne(User, { where: { email } })) {
        throw new ConflictException('A user with this email already exists');
      }

      const generatedPassword = dto.password ?? `${randomBytes(12).toString('base64url')}Aa1!`;
      const user = await manager.save(
        manager.create(User, {
          name: lead.name,
          email,
          phone: lead.phone,
          password: await bcrypt.hash(generatedPassword, 12),
          role: UserRole.Student,
          isActive: true,
        }),
      );
      const legacyDetails = this.extractLegacyAdmissionDetails(lead.message);
      const [preferredTiming, legacyPreferredDays] = (lead.preferredTiming ?? '')
        .split('|')
        .map((value) => value.trim());
      const profile = await manager.save(
        manager.create(StudentProfile, {
          user,
          city: lead.city,
          guardianName: lead.guardianName ?? legacyDetails.guardianName,
          guardianPhone: lead.guardianPhone ?? legacyDetails.guardianPhone,
          dateOfBirth: lead.dateOfBirth ?? legacyDetails.dateOfBirth,
          gender: lead.gender ?? legacyDetails.gender,
          address: lead.address ?? legacyDetails.address,
          educationLevel: lead.studentLevel,
          courseInterest: lead.courseInterest,
          preferredMode: lead.preferredMode,
          preferredTiming: preferredTiming || undefined,
          preferredDays: lead.preferredDays ?? legacyPreferredDays,
          admissionMessage: this.extractApplicantMessage(lead.message),
          passwordSent: true,
          passwordSentAt: new Date(),
          passwordLastChanged: new Date(),
          lastIssuedPassword: generatedPassword,
          source: this.toStudentSource(lead.source),
          status: 'active',
        }),
      );

      let enrollment: Enrollment | undefined;
      if (dto.courseId) {
        const course = await manager.findOne(Course, {
          where: { id: dto.courseId },
        });
        if (!course) throw new BadRequestException('Course not found');
        let batch: Batch | undefined;
        if (dto.batchId) {
          batch =
            (await manager.findOne(Batch, {
              where: { id: dto.batchId },
              relations: { course: true },
            })) ?? undefined;
          if (!batch || batch.course.id !== course.id) {
            throw new BadRequestException('Batch does not belong to the selected course');
          }
        }
        enrollment = await manager.save(
          manager.create(Enrollment, {
            student: profile,
            course,
            batch,
            status: 'active',
            progressPercentage: 0,
          }),
        );
      }

      lead.status = 'converted';
      lead.email = email;
      await manager.save(lead);
      await manager.save(
        manager.create(AuditLog, {
          user: { id: actorId } as User,
          action: 'convert_to_student',
          module: 'leads',
          recordId: lead.id,
          metadata: { studentId: profile.id, enrollmentId: enrollment?.id },
        }),
      );

      return {
        message: 'Admission accepted and student account created successfully',
        student: {
          id: profile.id,
          userId: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          status: profile.status,
        },
        passwordSetupRequired: !dto.password,
      };
    });

    await this.adminAlertsService.notifyAdmins({
      title: 'Lead converted to student',
      message: `${result.student.name} was converted from a lead to a student account.`,
      type: 'info',
      actionUrl: `/admin/students/${result.student.id}`,
    });

    return result;
  }

  private mapLead(lead: Lead) {
    return {
      id: lead.id,
      name: lead.name,
      email: lead.email ?? '',
      phone: lead.phone,
      city: lead.city ?? '',
      guardianName: lead.guardianName ?? '',
      guardianPhone: lead.guardianPhone ?? '',
      dateOfBirth: lead.dateOfBirth ?? '',
      gender: lead.gender ?? '',
      address: lead.address ?? '',
      courseInterest: lead.courseInterest ?? '',
      preferredMode: lead.preferredMode ?? '',
      preferredTiming: lead.preferredTiming ?? '',
      preferredDays: lead.preferredDays ?? '',
      studentLevel: lead.studentLevel ?? '',
      source: lead.source,
      status: lead.status,
      message: lead.message ?? '',
      notes: lead.notes ?? '',
      assignedTo: lead.assignedTo
        ? { id: lead.assignedTo.id, name: lead.assignedTo.name }
        : null,
      createdAt: lead.createdAt,
      updatedAt: lead.updatedAt,
    };
  }

  private normalizeLeadSource(source?: string): LeadSource {
    const allowed: LeadSource[] = [
      'website',
      'admissions_page',
      'free_demo_class_page',
      'contact_page',
      'course_detail_page',
      'referral',
      'walk_in',
      'social_media',
    ];
    return allowed.includes(source as LeadSource) ? (source as LeadSource) : 'website';
  }

  private toStudentSource(source?: string): StudentSource {
    if (source === 'referral' || source === 'walk_in' || source === 'social_media') return source;
    return 'website';
  }

  private extractLegacyAdmissionDetails(message?: string): {
    guardianName?: string;
    guardianPhone?: string;
    dateOfBirth?: string;
    gender?: Gender;
    address?: string;
  } {
    if (!message?.includes('Admission details:')) return {};

    const valueFor = (label: string) =>
      message.match(new RegExp(`^${label}:\\s*(.+)$`, 'im'))?.[1]?.trim();
    const genderValue = valueFor('Gender')?.toLowerCase().replaceAll(' ', '_');
    const gender = ['male', 'female', 'prefer_not_to_say'].includes(
      genderValue ?? '',
    )
      ? (genderValue as Gender)
      : undefined;

    return {
      guardianName: valueFor('Guardian name'),
      guardianPhone: valueFor('Guardian phone'),
      dateOfBirth: valueFor('Date of birth'),
      gender,
      address: valueFor('Address'),
    };
  }

  private extractApplicantMessage(message?: string) {
    const applicantMessage = message?.split(/\n\nAdmission details:/i)[0]?.trim();
    return applicantMessage || undefined;
  }

  private async logAction(
    actorId: string,
    action: string,
    module: string,
    recordId: string,
    metadata?: Record<string, unknown>,
  ) {
    await this.dataSource.getRepository(AuditLog).save({
      user: { id: actorId } as User,
      action,
      module,
      recordId,
      metadata,
    });
  }
}
