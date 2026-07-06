import {
  Body,
  Controller,
  Get,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { Access } from '../../common/decorators/access.decorator';
import { ActiveUserGuard } from '../../common/guards/active-user.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import type { User } from '../../database/entities';
import { AccessControlService } from './access-control.service';
import { UpdateAccessControlDto } from './dto/update-access-control.dto';

type AuthedRequest = Request & { user: User };

// Any authenticated admin-console user can read their own effective
// permissions (used purely for nav filtering on the frontend).
@UseGuards(JwtAuthGuard, ActiveUserGuard)
@Controller('admin/my-access')
export class MyAccessController {
  constructor(private readonly service: AccessControlService) {}

  @Get()
  me(@Req() req: AuthedRequest) {
    return this.service.getPermissionsForRole(req.user.role);
  }
}

// SuperAdmin-only: only SuperAdmin has access-control:full (defaults deny
// everyone else, and PermissionsGuard bypasses only for SuperAdmin).
@UseGuards(JwtAuthGuard, ActiveUserGuard, PermissionsGuard)
@Access('access-control')
@Controller('admin/access-control')
export class AccessControlController {
  constructor(private readonly service: AccessControlService) {}

  @Get()
  getMatrix() {
    return this.service.getMatrix();
  }

  @Put()
  update(@Body() dto: UpdateAccessControlDto) {
    return this.service.update(dto);
  }

  @Post('reset')
  reset() {
    return this.service.resetDefaults();
  }
}
