import { Body, Controller, Post } from '@nestjs/common';
import { CreateLeadDto } from './dto/create-lead.dto';
import { LeadsService } from './leads.service';

@Controller('public')
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Post('leads')
  createLead(@Body() createLeadDto: CreateLeadDto) {
    return this.leadsService.create({ ...createLeadDto, source: createLeadDto.source ?? 'website' });
  }

  @Post('demo-class')
  createDemoRequest(@Body() createLeadDto: CreateLeadDto) {
    return this.leadsService.create({ ...createLeadDto, source: 'demo_class' });
  }
}
