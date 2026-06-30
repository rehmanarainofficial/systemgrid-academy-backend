import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import { UserRole } from '../../common/enums/user-role.enum';
import { User } from '../../database/entities';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  findByEmail(email: string) {
    return this.usersRepository.findOne({ where: { email } });
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
}
