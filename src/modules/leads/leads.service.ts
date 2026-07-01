import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Lead } from '../../database/entities';
import { CreateLeadDto } from './dto/create-lead.dto';

@Injectable()
export class LeadsService {
  constructor(
    @InjectRepository(Lead)
    private readonly leadsRepository: Repository<Lead>,
  ) {}

  create(createLeadDto: CreateLeadDto) {
    const lead = this.leadsRepository.create({
      ...createLeadDto,
      source: createLeadDto.source ?? 'website',
      status: 'new',
    });

    return this.leadsRepository.save(lead);
  }
}
