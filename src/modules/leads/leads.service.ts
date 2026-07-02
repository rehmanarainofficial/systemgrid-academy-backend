import {
  BadRequestException,
  ConflictException,
  Injectable,
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
  Lead,
  StudentProfile,
  User,
} from '../../database/entities';
import { AdminLeadsQueryDto } from './dto/admin-leads-query.dto';
import { ConvertLeadToStudentDto } from './dto/convert-lead-to-student.dto';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';

@Injectable()
export class LeadsService {
  constructor(
    @InjectRepository(Lead)
    private readonly leadsRepository: Repository<Lead>,
    private readonly dataSource: DataSource,
  ) {}

  create(createLeadDto: CreateLeadDto) {
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
      source: leadData.source ?? 'website',
      status: 'new',
    });

    return this.leadsRepository.save(lead);
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
    const total = await this.leadsRepository.count();

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
    return this.dataSource.transaction(async (manager) => {
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
      const profile = await manager.save(
        manager.create(StudentProfile, {
          user,
          city: lead.city,
          educationLevel: lead.studentLevel,
          source: lead.source,
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
        message: 'Lead converted to student successfully',
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
  }

  private mapLead(lead: Lead) {
    return {
      id: lead.id,
      name: lead.name,
      email: lead.email ?? '',
      phone: lead.phone,
      city: lead.city ?? '',
      courseInterest: lead.courseInterest ?? '',
      preferredMode: lead.preferredMode ?? '',
      preferredTiming: lead.preferredTiming ?? '',
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
