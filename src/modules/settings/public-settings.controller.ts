import { Controller, Get } from '@nestjs/common';
import { SettingsService } from './settings.service';

@Controller('public/settings')
export class PublicSettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  getPublicSettings() {
    return this.settingsService.getPublicSettings();
  }
}
