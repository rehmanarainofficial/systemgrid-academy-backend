import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLog, Setting } from '../../database/entities';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';

@Module({
  imports: [TypeOrmModule.forFeature([Setting, AuditLog])],
  controllers: [SettingsController],
  providers: [SettingsService],
})
export class SettingsModule {}
