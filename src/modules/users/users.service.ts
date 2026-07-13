import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { Brackets, DataSource, Repository } from 'typeorm';
import { UserRole } from '../../common/enums/user-role.enum';
import { AuditLog, Batch, Instructor, User } from '../../database/entities';
import { AdminUsersQueryDto } from './dto/admin-users-query.dto';
import { CreateAdminUserDto } from './dto/create-admin-user.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { ResetAdminUserPasswordDto } from './dto/reset-admin-user-password.dto';
import { UpdateAdminUserDto } from './dto/update-admin-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly dataSource: DataSource,
  ) {}

  findByEmail(email: string) {
    return this.usersRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.email = :email', { email: email.toLowerCase().trim() })
      .getOne();
  }

  findById(id: string) {
    return this.usersRepository.findOne({ where: { id } });
  }

  async create(dto: CreateUserDto) {
    const password = await bcrypt.hash(dto.password, 12);
    const user = this.usersRepository.create({
      ...dto,
      password,
      role: dto.role ?? UserRole.Student,
    });

    return this.usersRepository.save(user);
  }

  async touchLastLogin(userId: string) {
    await this.usersRepository.update(userId, { lastLoginAt: new Date() });
  }

  async updatePassword(userId: string, password: string) {
    await this.usersRepository.update(userId, {
      password: await bcrypt.hash(password, 12),
    });
  }

  async findAdminUsers(query: AdminUsersQueryDto) {
    const page = Number(query.page ?? 1);
    const limit = Number(query.limit ?? 20);
    const builder = this.usersRepository.createQueryBuilder('user').orderBy('user.createdAt', 'DESC');

    if (query.search?.trim()) {
      const search = `%${query.search.trim()}%`;
      builder.andWhere(
        new Brackets((where) =>
          where.where('user.name ILIKE :search', { search }).orWhere('user.email ILIKE :search', { search }).orWhere('user.phone ILIKE :search', { search }),
        ),
      );
    }
    if (query.role) builder.andWhere('user.role = :role', { role: query.role });
    if (query.status === 'active') builder.andWhere('user.isActive = true');
    if (query.status === 'inactive') builder.andWhere('user.isActive = false');

    const [users, totalItems] = await builder.skip((page - 1) * limit).take(limit).getManyAndCount();
    const allUsers = await this.usersRepository.find({ select: { id: true, role: true, isActive: true } });
    return {
      summary: {
        total: allUsers.length,
        active: allUsers.filter((user) => user.isActive).length,
        inactive: allUsers.filter((user) => !user.isActive).length,
        super_admin: allUsers.filter((user) => user.role === UserRole.SuperAdmin).length,
        admin: allUsers.filter((user) => user.role === UserRole.Admin).length,
        staff: allUsers.filter((user) => user.role === UserRole.Staff).length,
        student: allUsers.filter((user) => user.role === UserRole.Student).length,
      },
      users: users.map((user) => this.mapAdminUser(user)),
      pagination: { page, limit, totalItems, totalPages: Math.max(1, Math.ceil(totalItems / limit)) },
    };
  }

  async findAdminUser(id: string) {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return this.mapAdminUser(user);
  }

  async createAdminUser(dto: CreateAdminUserDto, actorId: string) {
    if (![UserRole.Admin, UserRole.Staff].includes(dto.role)) {
      throw new BadRequestException('Only admin and staff accounts can be created from this panel');
    }
    const existing = await this.usersRepository.findOne({ where: { email: dto.email.toLowerCase().trim() } });
    if (existing) throw new ConflictException('A user with this email already exists');
    const password = await bcrypt.hash(dto.password, 12);
    const saved = await this.dataSource.transaction(async (manager) => {
      const user = await manager.save(
        User,
        manager.create(User, {
          name: dto.name.trim(),
          email: dto.email.toLowerCase().trim(),
          password,
          role: dto.role,
          phone: dto.phone?.trim() || undefined,
          isActive: dto.isActive ?? true,
        }),
      );
      await manager.save(AuditLog, manager.create(AuditLog, { user: { id: actorId } as User, action: 'create', module: 'users', recordId: user.id, metadata: { email: user.email, role: user.role } }));
      return user;
    });
    return this.mapAdminUser(saved);
  }

  async updateAdminUser(id: string, dto: UpdateAdminUserDto, actorId: string) {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    if (dto.role) this.assertManageableRole(dto.role);
    if (id === actorId && (dto.role || dto.isActive === false)) {
      throw new ForbiddenException('You cannot change your own role or deactivate your own account');
    }
    if (dto.email && dto.email.toLowerCase().trim() !== user.email) {
      const existing = await this.usersRepository.findOne({ where: { email: dto.email.toLowerCase().trim() } });
      if (existing) throw new ConflictException('A user with this email already exists');
      user.email = dto.email.toLowerCase().trim();
    }
    if (dto.name !== undefined) user.name = dto.name.trim();
    if (dto.phone !== undefined) user.phone = dto.phone.trim() || undefined;
    if (dto.role !== undefined) {
      this.assertManageableRole(dto.role);
      user.role = dto.role;
    }
    if (dto.isActive !== undefined) user.isActive = dto.isActive;
    const saved = await this.dataSource.transaction(async (manager) => {
      const updated = await manager.save(User, user);
      await manager.save(AuditLog, manager.create(AuditLog, { user: { id: actorId } as User, action: 'update', module: 'users', recordId: id, metadata: { fields: Object.keys(dto), role: updated.role, isActive: updated.isActive } }));
      return updated;
    });
    return this.mapAdminUser(saved);
  }

  async resetAdminPassword(id: string, dto: ResetAdminUserPasswordDto, actorId: string) {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    if (user.role === UserRole.SuperAdmin) {
      throw new ForbiddenException('Super admin passwords can only be changed on the server');
    }
    user.password = await bcrypt.hash(dto.password, 12);
    await this.dataSource.transaction(async (manager) => {
      await manager.save(User, user);
      await manager.save(AuditLog, manager.create(AuditLog, { user: { id: actorId } as User, action: 'reset_password', module: 'users', recordId: id, metadata: { email: user.email } }));
    });
    return { message: 'Password reset successfully.' };
  }

  async deleteAdminUser(id: string, actorId: string) {
    if (id === actorId) {
      throw new ForbiddenException('You cannot delete your own account');
    }

    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    if (user.role === UserRole.SuperAdmin) {
      throw new ForbiddenException('Super admin accounts cannot be deleted from the panel');
    }
    if (user.role === UserRole.Student) {
      throw new BadRequestException('Delete student accounts from the Students page');
    }

    await this.dataSource.transaction(async (manager) => {
      if (user.role === UserRole.Instructor) {
        const instructor = await manager.findOne(Instructor, {
          where: { user: { id } },
        });
        if (instructor) {
          const batchCount = await manager.count(Batch, {
            where: { instructor: { id: instructor.id } },
          });
          if (batchCount) {
            throw new ConflictException(
              'This instructor is assigned to batches. Deactivate the account instead.',
            );
          }
          await manager.remove(instructor);
        }
      }

      await manager.delete(User, id);
      await manager.save(
        AuditLog,
        manager.create(AuditLog, {
          user: { id: actorId } as User,
          action: 'delete',
          module: 'users',
          recordId: id,
          metadata: { email: user.email, role: user.role },
        }),
      );
    });

    return { message: 'User deleted successfully' };
  }

  private assertManageableRole(role: UserRole) {
    if (![UserRole.Admin, UserRole.Staff].includes(role)) {
      throw new BadRequestException('Only admin and staff roles can be assigned from this panel');
    }
  }

  private mapAdminUser(user: User) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone ?? '',
      avatarUrl: user.avatarUrl ?? '',
      role: user.role,
      isActive: user.isActive,
      lastLoginAt: user.lastLoginAt ?? null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
