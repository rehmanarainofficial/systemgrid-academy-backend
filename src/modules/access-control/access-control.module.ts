import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RolePermission } from '../../database/entities';
import {
  AccessControlController,
  MyAccessController,
} from './access-control.controller';
import { AccessControlService } from './access-control.service';

// Global so every controller can @UseGuards(PermissionsGuard) without
// importing this module explicitly.
@Global()
@Module({
  imports: [TypeOrmModule.forFeature([RolePermission])],
  controllers: [AccessControlController, MyAccessController],
  providers: [AccessControlService, PermissionsGuard],
  exports: [AccessControlService, PermissionsGuard],
})
export class AccessControlModule {}
