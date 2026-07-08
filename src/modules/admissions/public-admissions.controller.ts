import { Body, Controller, Get, Param, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AdmissionsService } from './admissions.service';
import type { UploadedFileData } from '../uploads/uploads.service';
import {
  StartAdmissionDto,
  SubmitAdmissionDto,
  SubmitPaymentProofDto,
  ValidateReferralDto,
  VerifyAdmissionEmailDto,
} from './dto/admission.dto';
import { PricingCalculateDto } from './dto/pricing.dto';

@Controller()
export class PublicAdmissionsController {
  constructor(private readonly admissionsService: AdmissionsService) {}

  @Post('public/pricing/calculate')
  calculatePricing(@Body() dto: PricingCalculateDto) {
    return this.admissionsService.calculatePricing(dto);
  }

  @Post('public/referral/validate')
  validateReferral(@Body() dto: ValidateReferralDto) {
    return this.admissionsService.validateReferralCode(dto.code);
  }

  @Get('public/courses/:courseId/batches')
  courseBatches(@Param('courseId') courseId: string) {
    return this.admissionsService.getOpenBatchesForCourse(courseId);
  }

  @Post('public/admissions/send-email-otp')
  sendEmailOtp(@Body() dto: StartAdmissionDto) {
    return this.admissionsService.sendEmailOtp(dto);
  }

  @Post('public/admissions/start')
  start(@Body() dto: StartAdmissionDto) {
    return this.admissionsService.sendEmailOtp(dto);
  }

  @Post('public/admissions/verify-email-otp')
  verifyEmailOtp(@Body() dto: VerifyAdmissionEmailDto) {
    return this.admissionsService.verifyEmailOtp(dto);
  }

  @Post('public/admissions/submit')
  submit(@Body() dto: SubmitAdmissionDto) {
    return this.admissionsService.submit(dto);
  }

  @Post('public/admissions/payment-proof')
  @UseInterceptors(FileInterceptor('proof', { limits: { fileSize: 10 * 1024 * 1024 } }))
  submitPaymentProof(@UploadedFile() file: UploadedFileData, @Body() dto: SubmitPaymentProofDto) {
    return this.admissionsService.submitPaymentProof(dto, file);
  }
}
