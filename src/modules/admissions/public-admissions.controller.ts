import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { AdmissionsService } from './admissions.service';
import {
  CreatePaymentIntentDto,
  GatewayCallbackDto,
  StartAdmissionDto,
  SubmitAdmissionDto,
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

  @Post('payments/intents')
  createPaymentIntent(@Body() dto: CreatePaymentIntentDto) {
    return this.admissionsService.createPaymentIntent(dto);
  }

  @Post('payments/callback/jazzcash')
  jazzCashCallback(@Body() dto: GatewayCallbackDto & Record<string, unknown>) {
    return this.admissionsService.handleGatewayCallback('jazzcash', dto, dto);
  }

  @Post('payments/callback/easypaisa')
  easypaisaCallback(@Body() dto: GatewayCallbackDto & Record<string, unknown>) {
    return this.admissionsService.handleGatewayCallback('easypaisa', dto, dto);
  }

  @Get('payments/intents/:id')
  paymentIntent(@Param('id') id: string) {
    return { id, message: 'Use backend callback verification to finalize this payment intent.' };
  }
}
