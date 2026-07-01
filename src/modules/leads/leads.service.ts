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
    const {
      city,
      educationLevel,
      preferredMode,
      preferredTiming,
      selectedCourse,
      ...leadData
    } = createLeadDto;
    const admissionContext = [
      city ? `City: ${city}` : null,
      educationLevel ? `Education: ${educationLevel}` : null,
      preferredMode ? `Preferred mode: ${preferredMode}` : null,
      preferredTiming ? `Preferred timing: ${preferredTiming}` : null,
    ].filter((value): value is string => Boolean(value));
    const message = [leadData.message, ...admissionContext]
      .filter((value): value is string => Boolean(value))
      .join('\n');

    const lead = this.leadsRepository.create({
      ...leadData,
      courseInterest: selectedCourse ?? leadData.courseInterest,
      message: message || undefined,
      source: leadData.source ?? 'website',
      status: 'new',
    });

    return this.leadsRepository.save(lead);
  }
}
