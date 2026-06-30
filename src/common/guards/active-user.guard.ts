import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

@Injectable()
export class ActiveUserGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    return Boolean(request.user?.isActive ?? true);
  }
}
