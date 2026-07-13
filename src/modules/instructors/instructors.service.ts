import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { Brackets, DataSource } from 'typeorm';
import { UserRole } from '../../common/enums/user-role.enum';
import { AuditLog, Batch, Instructor, User } from '../../database/entities';
import { AdminInstructorsQueryDto } from './dto/admin-instructors-query.dto';
import { CreateInstructorDto } from './dto/create-instructor.dto';
import { UpdateInstructorDto } from './dto/update-instructor.dto';

@Injectable()
export class InstructorsService {
  constructor(private readonly dataSource: DataSource) {}

  async findAll(query: AdminInstructorsQueryDto) {
    const repository = this.dataSource.getRepository(Instructor);
    const builder = repository.createQueryBuilder('instructor').orderBy('instructor.createdAt', 'DESC');
    if (query.search?.trim()) {
      const search = `%${query.search.trim()}%`;
      builder.andWhere(new Brackets((where) => where.where('instructor.name ILIKE :search', { search }).orWhere('instructor.email ILIKE :search', { search }).orWhere('instructor.phone ILIKE :search', { search }).orWhere('instructor.specialization ILIKE :search', { search })));
    }
    if (query.status === 'active') builder.andWhere('instructor.isActive = true');
    if (query.status === 'inactive') builder.andWhere('instructor.isActive = false');
    if (query.specialization?.trim()) builder.andWhere('instructor.specialization ILIKE :specialization', { specialization: `%${query.specialization.trim()}%` });
    const [instructors, totalItems] = await builder.skip((query.page - 1) * query.limit).take(query.limit).getManyAndCount();
    const all = await repository.find();
    const batches = await this.dataSource.getRepository(Batch).find({ relations: { instructor: true } });
    return {
      summary: { total: all.length, active: all.filter((item) => item.isActive).length, inactive: all.filter((item) => !item.isActive).length, assignedToBatches: new Set(batches.filter((item) => item.instructor).map((item) => item.instructor!.id)).size },
      instructors: instructors.map((item) => this.map(item, batches.filter((batch) => batch.instructor?.id === item.id).length)),
      pagination: { page: query.page, limit: query.limit, totalItems, totalPages: Math.max(1, Math.ceil(totalItems / query.limit)) },
    };
  }

  async findOne(id: string) {
    const instructor = await this.entity(id);
    const count = await this.dataSource.getRepository(Batch).count({ where: { instructor: { id } } });
    return this.map(instructor, count);
  }

  async findPublic() {
    const instructors = await this.dataSource.getRepository(Instructor).find({
      where: { isActive: true, showOnWebsite: true },
      order: { name: 'ASC' },
    });

    return {
      items: instructors.map((instructor) => this.mapPublic(instructor)),
      meta: { total: instructors.length },
    };
  }

  async create(dto: CreateInstructorDto, actorId: string) {
    await this.ensureEmail(dto.email);
    const loginUser = await this.provisionLoginUser(dto);
    const instructor = await this.dataSource.getRepository(Instructor).save({
      name: dto.name.trim(),
      email: dto.email.trim().toLowerCase(),
      phone: dto.phone.trim(),
      specialization: dto.specialization.trim(),
      bio: dto.bio.trim(),
      imageUrl: dto.imageUrl?.trim() || undefined,
      isActive: dto.isActive ?? true,
      showOnWebsite: dto.showOnWebsite ?? false,
      user: loginUser,
    });
    await this.log(actorId, 'create', instructor.id, loginUser ? { loginAccount: loginUser.id } : undefined);
    return this.findOne(instructor.id);
  }

  // Creates (or promotes an existing) user account with the Instructor role so
  // the instructor can log into the instructor portal. Requires email+password.
  private async provisionLoginUser(dto: CreateInstructorDto): Promise<User> {
    const email = dto.email.trim().toLowerCase();
    const users = this.dataSource.getRepository(User);
    const existing = await users.findOne({ where: { email } });
    if (existing) {
      existing.role = UserRole.Instructor;
      existing.isActive = dto.isActive ?? true;
      existing.password = await bcrypt.hash(dto.password, 12);
      return users.save(existing);
    }
    return users.save(
      users.create({
        name: dto.name.trim(),
        email,
        phone: dto.phone.trim(),
        password: await bcrypt.hash(dto.password, 12),
        role: UserRole.Instructor,
        isActive: dto.isActive ?? true,
      }),
    );
  }

  async update(id: string, dto: UpdateInstructorDto, actorId: string) {
    const instructor = await this.entity(id);
    if (dto.email && dto.email.toLowerCase() !== instructor.email?.toLowerCase()) await this.ensureEmail(dto.email, id);
    if (dto.name) instructor.name = dto.name.trim();
    if (dto.email !== undefined) instructor.email = dto.email.trim().toLowerCase() || undefined;
    if (dto.phone) instructor.phone = dto.phone.trim();
    if (dto.specialization) instructor.specialization = dto.specialization.trim();
    if (dto.bio !== undefined) instructor.bio = dto.bio.trim() || undefined;
    if (dto.imageUrl !== undefined) instructor.imageUrl = dto.imageUrl.trim() || undefined;
    if (dto.isActive !== undefined) instructor.isActive = dto.isActive;
    if (dto.showOnWebsite !== undefined) instructor.showOnWebsite = dto.showOnWebsite;
    await this.dataSource.getRepository(Instructor).save(instructor);
    await this.log(actorId, 'update', id, { fields: Object.keys(dto) });
    return this.findOne(id);
  }

  async toggle(id: string, actorId: string) {
    const instructor = await this.entity(id);
    instructor.isActive = !instructor.isActive;
    await this.dataSource.getRepository(Instructor).save(instructor);
    await this.log(actorId, 'toggle_status', id, { isActive: instructor.isActive });
    return { message: `Instructor ${instructor.isActive ? 'activated' : 'deactivated'} successfully`, isActive: instructor.isActive };
  }

  async remove(id: string, actorId: string) {
    const instructor = await this.entity(id);
    const batches = await this.dataSource.getRepository(Batch).count({ where: { instructor: { id } } });
    if (batches) throw new ConflictException('This instructor is assigned to batches. Deactivate instead.');
    await this.dataSource.getRepository(Instructor).remove(instructor);
    await this.log(actorId, 'delete', id);
    return { message: 'Instructor deleted successfully' };
  }

  private async entity(id: string) {
    const instructor = await this.dataSource.getRepository(Instructor).findOne({ where: { id } });
    if (!instructor) throw new NotFoundException('Instructor not found');
    return instructor;
  }

  private async ensureEmail(email: string, excludedId?: string) {
    const existing = await this.dataSource.getRepository(Instructor).findOne({ where: { email: email.trim().toLowerCase() } });
    if (existing && existing.id !== excludedId) throw new BadRequestException('Instructor email already exists');
  }

  private map(instructor: Instructor, batchesCount: number) {
    return { id: instructor.id, name: instructor.name, email: instructor.email ?? '', phone: instructor.phone ?? '', specialization: instructor.specialization ?? '', bio: instructor.bio ?? '', imageUrl: instructor.imageUrl ?? '', isActive: instructor.isActive, showOnWebsite: instructor.showOnWebsite, batchesCount, createdAt: instructor.createdAt };
  }

  private mapPublic(instructor: Instructor) {
    return {
      id: instructor.id,
      name: instructor.name,
      specialization: instructor.specialization ?? '',
      bio: instructor.bio ?? '',
      imageUrl: instructor.imageUrl ?? '',
    };
  }

  private async log(actorId: string, action: string, recordId: string, metadata?: Record<string, unknown>) {
    await this.dataSource.getRepository(AuditLog).save({ user: { id: actorId } as User, action, module: 'instructors', recordId, metadata });
  }
}
