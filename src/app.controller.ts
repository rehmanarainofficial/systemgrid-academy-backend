import { Controller, Get } from '@nestjs/common';
import { getServerTimePayload } from './common/utils/pakistan-time.util';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('server-time')
  getServerTime() {
    return getServerTimePayload();
  }
}
