import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ALLOW_PORTAL_SUSPENDED_KEY } from '../decorators/allow-portal-suspended.decorator';
import { StudentProfile, User } from '../../database/entities';

type AuthenticatedRequest = { user?: User };

@Injectable()
export class StudentPortalAccessGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @InjectRepository(StudentProfile)
    private readonly studentsRepository: Repository<StudentProfile>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const allowSuspended = this.reflector.getAllAndOverride<boolean>(
      ALLOW_PORTAL_SUSPENDED_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (allowSuspended) return true;

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const userId = request.user?.id;
    if (!userId) return true;

    const student = await this.studentsRepository.findOne({
      where: { user: { id: userId } },
    });
    if (student?.portalAccessSuspended) {
      throw new ForbiddenException(
        student.portalSuspendedReason ??
          'Portal access is temporarily suspended. Contact admin to restore access.',
      );
    }

    return true;
  }
}
