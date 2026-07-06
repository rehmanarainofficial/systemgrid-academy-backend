import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { Access } from '../../common/decorators/access.decorator';
import { ActiveUserGuard } from '../../common/guards/active-user.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { AuditLogsService } from './audit-logs.service';
import { AdminAuditLogsQueryDto } from './dto/admin-audit-logs-query.dto';

@UseGuards(JwtAuthGuard, ActiveUserGuard, PermissionsGuard)
@Access('audit-logs')
@Controller('admin/audit-logs')
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @Get()
  findAll(@Query() query: AdminAuditLogsQueryDto) {
    return this.auditLogsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.auditLogsService.findOne(id);
  }
}
