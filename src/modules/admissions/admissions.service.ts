import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { createHmac, randomBytes } from 'crypto';
import { Brackets, DataSource, EntityManager } from 'typeorm';
import { UserRole } from '../../common/enums/user-role.enum';
import {
  AdmissionApplication,
  AdmissionApplicationStatus,
  AuditLog,
  Batch,
  Course,
  Enrollment,
  FeePlan,
  Invoice,
  Notification,
  Offer,
  Payment,
  PaymentGateway,
  PaymentIntent,
  ReferralCode,
  ReferralRedemption,
  StudentProfile,
  StudentWallet,
  User,
  WalletLedger,
} from '../../database/entities';
import {
  CreatePaymentIntentDto,
  GatewayCallbackDto,
  StartAdmissionDto,
  SubmitAdmissionDto,
  VerifyAdmissionEmailDto,
} from './dto/admission.dto';
import { PricingCalculateDto } from './dto/pricing.dto';
import { AdmissionEmailService } from './email.service';
import { PricingService } from './pricing.service';

@Injectable()
export class AdmissionsService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly pricingService: PricingService,
    private readonly emailService: AdmissionEmailService,
    private readonly configService: ConfigService,
  ) {}

  async calculatePricing(dto: PricingCalculateDto) {
    const result = await this.pricingService.calculate(dto);
    return this.mapPricing(result);
  }

  async sendEmailOtp(dto: StartAdmissionDto) {
    const email = dto.email.trim().toLowerCase();
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const otpHash = await bcrypt.hash(otp, 10);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 15 * 60 * 1000);

    const application = await this.dataSource.transaction(async (manager) => {
      let current = await manager.findOne(AdmissionApplication, {
        where: { email, status: 'email_pending' },
        select: ['id', 'email', 'emailOtpSentAt'] as any,
      });

      if (current?.emailOtpSentAt && now.getTime() - current.emailOtpSentAt.getTime() < 60_000) {
        throw new BadRequestException('Please wait 60 seconds before requesting another OTP');
      }

      if (!current) {
        current = manager.create(AdmissionApplication, {
          email,
          status: 'email_pending',
          emailVerified: false,
        });
      }

      current.emailOtpHash = otpHash;
      current.emailOtpExpiresAt = expiresAt;
      current.emailOtpSentAt = now;
      current.emailOtpAttempts = 0;
      return manager.save(current);
    });

    await this.emailService.sendEmailVerificationOtp(email, otp);
    return {
      applicationId: application.id,
      message: 'Verification code sent successfully',
      expiresAt,
      devOtp: this.configService.get('NODE_ENV') === 'production' ? undefined : otp,
    };
  }

  async verifyEmailOtp(dto: VerifyAdmissionEmailDto) {
    const email = dto.email.trim().toLowerCase();
    const application = await this.dataSource.getRepository(AdmissionApplication).findOne({
      where: { email, status: 'email_pending' },
      select: ['id', 'email', 'emailOtpHash', 'emailOtpExpiresAt', 'emailOtpAttempts', 'status', 'emailVerified'] as any,
    });
    if (!application?.emailOtpHash || !application.emailOtpExpiresAt) {
      throw new BadRequestException('Request a fresh verification code first');
    }
    if (application.emailOtpExpiresAt.getTime() < Date.now()) {
      throw new BadRequestException('Verification code has expired');
    }
    if (application.emailOtpAttempts >= 5) {
      throw new BadRequestException('Too many OTP attempts. Request a new code');
    }
    const valid = await bcrypt.compare(dto.otp, application.emailOtpHash);
    if (!valid) {
      application.emailOtpAttempts += 1;
      await this.dataSource.getRepository(AdmissionApplication).save(application);
      throw new BadRequestException('Invalid verification code');
    }
    application.emailVerified = true;
    application.emailVerifiedAt = new Date();
    application.status = 'verified';
    application.emailOtpHash = undefined;
    await this.dataSource.getRepository(AdmissionApplication).save(application);
    return { applicationId: application.id, message: 'Email verified successfully' };
  }

  async submit(dto: SubmitAdmissionDto) {
    const email = dto.email.trim().toLowerCase();
    const application = await this.dataSource.getRepository(AdmissionApplication).findOne({
      where: { email, status: 'verified' },
      relations: { invoices: true },
    });
    if (!application?.emailVerified) throw new BadRequestException('Please verify your email before submitting admission');
    if (await this.dataSource.getRepository(User).findOne({ where: { email } })) {
      throw new ConflictException('An account with this email already exists. Please login or contact support');
    }

    const course = await this.dataSource.getRepository(Course).findOne({
      where: { id: dto.courseId, isPublished: true },
    });
    if (!course) throw new BadRequestException('Selected course is not available for admission');
    const batch = dto.batchId ? await this.resolveBatch(dto.batchId, dto.courseId) : undefined;
    if (batch && batch.capacity > 0) {
      const enrolledCount = await this.dataSource.getRepository(Enrollment).count({
        where: { batch: { id: batch.id }, status: 'active' },
      });
      if (enrolledCount >= batch.capacity) {
        application.status = 'waitlisted';
        await this.dataSource.getRepository(AdmissionApplication).save(application);
        return { applicationId: application.id, status: 'waitlisted', message: 'This batch is currently full. Our team will contact you with the next available batch.' };
      }
    }

    const pricing = await this.pricingService.calculate({
      courseId: dto.courseId,
      pricingPlanType: dto.pricingPlanType,
      referralCode: dto.referralCode,
    });
    if (pricing.referralCode?.student?.user?.email?.toLowerCase() === email) {
      throw new BadRequestException('Self-referral is not allowed');
    }

    let invoiceId = '';
    await this.dataSource.transaction(async (manager) => {
      manager.merge(AdmissionApplication, application, {
        name: dto.name.trim(),
        email,
        phone: dto.phone,
        guardianName: dto.guardianName.trim(),
        guardianPhone: dto.guardianPhone,
        city: dto.city.trim(),
        address: dto.address.trim(),
        dateOfBirth: dto.dateOfBirth,
        gender: dto.gender,
        educationLevel: dto.educationLevel.trim(),
        course,
        batch,
        preferredMode: dto.preferredMode,
        preferredTiming: dto.preferredTiming,
        preferredDays: dto.preferredDays?.trim() || undefined,
        pricingPlanType: dto.pricingPlanType,
        referralCodeApplied: pricing.referralCode?.code,
        referralDiscountAmount: pricing.referralCouponDiscountAmount,
        grossAmount: pricing.grossAmount,
        planDiscountAmount: pricing.planDiscountAmount,
        scholarshipDiscountAmount: pricing.scholarshipDiscountAmount,
        finalPayableAmount: pricing.finalPayableAmount,
        message: dto.message?.trim() || undefined,
        status: 'payment_pending',
      });
      await manager.save(application);

      const invoice = await manager.save(Invoice, manager.create(Invoice, {
        admissionApplication: application,
        invoiceNumber: await this.nextInvoiceNumber(manager),
        pricingPlanType: dto.pricingPlanType,
        amount: pricing.finalPayableAmount,
        grossAmount: pricing.grossAmount,
        planDiscountAmount: pricing.planDiscountAmount,
        referralCouponDiscountAmount: pricing.referralCouponDiscountAmount,
        scholarshipDiscountAmount: pricing.scholarshipDiscountAmount,
        walletCreditUsed: 0,
        payableAmount: pricing.finalPayableAmount,
        paidAmount: 0,
        pendingAmount: pricing.finalPayableAmount,
        status: 'unpaid',
      }));
      invoiceId = invoice.id;

      if (pricing.referralCode) {
        pricing.referralCode.totalUses += 1;
        await manager.save(pricing.referralCode);
        await manager.save(ReferralRedemption, manager.create(ReferralRedemption, {
          referralCode: pricing.referralCode,
          referrerStudent: pricing.referralCode.student,
          referredApplication: application,
          status: 'payment_pending',
          referredStudentDiscountAmount: pricing.referralCouponDiscountAmount,
          referrerCreditAmount: 1000,
        }));
      }
      await manager.save(AuditLog, manager.create(AuditLog, {
        action: 'submit_application',
        module: 'admissions',
        recordId: application.id,
        metadata: { invoiceId, pricingPlanType: dto.pricingPlanType, finalPayableAmount: pricing.finalPayableAmount },
      }));
    });

    return {
      applicationId: application.id,
      invoiceId,
      status: 'payment_pending',
      pricing: this.mapPricing(pricing),
      message: 'Admission application submitted. Continue to secure payment.',
    };
  }

  async createPaymentIntent(dto: CreatePaymentIntentDto) {
    const application = await this.dataSource.getRepository(AdmissionApplication).findOne({
      where: { id: dto.admissionApplicationId },
      relations: { course: true, invoices: true },
    });
    if (!application) throw new NotFoundException('Admission application not found');
    if (application.status !== 'payment_pending') throw new BadRequestException('Application is not ready for payment');
    const invoice = application.invoices?.find((item) => item.status === 'unpaid');
    if (!invoice) throw new BadRequestException('Unpaid invoice not found for this application');

    const merchantTransactionId = `SGA-${Date.now()}-${randomBytes(3).toString('hex').toUpperCase()}`;
    const redirectUrl = this.gatewayRedirectUrl(dto.gateway, merchantTransactionId);
    const intent = await this.dataSource.getRepository(PaymentIntent).save({
      admissionApplication: application,
      invoice,
      gateway: dto.gateway,
      amount: Number(invoice.payableAmount || invoice.amount),
      currency: 'PKR',
      status: 'pending',
      merchantTransactionId,
      redirectUrl,
    });
    await this.emailService.sendPaymentLinkEmail(application.email, application.course?.title ?? 'Selected course', Number(invoice.payableAmount || invoice.amount), `${this.frontendUrl()}/payment/checkout/${intent.id}`);
    return this.mapIntent(intent);
  }

  async handleGatewayCallback(gateway: PaymentGateway, dto: GatewayCallbackDto, payload: Record<string, unknown>) {
    const verifiedStatus = ['verified', 'success', 'paid', 'completed'].includes(dto.status.toLowerCase());
    const intent = await this.dataSource.getRepository(PaymentIntent).findOne({
      where: { merchantTransactionId: dto.merchantTransactionId, gateway },
      relations: { admissionApplication: { course: true, batch: true }, invoice: true },
    });
    if (!intent) throw new NotFoundException('Payment intent not found');

    if (intent.status === 'verified') {
      return { message: 'Payment callback already processed', paymentIntentId: intent.id, status: 'verified' };
    }
    if (!this.verifyGatewaySignature(gateway, dto, intent, payload)) {
      throw new BadRequestException('Invalid payment callback signature');
    }
    if (!verifiedStatus) {
      intent.status = 'failed';
      intent.callbackPayload = payload;
      intent.gatewayReference = dto.gatewayReference;
      intent.admissionApplication.status = 'payment_failed';
      await this.dataSource.getRepository(PaymentIntent).save(intent);
      await this.dataSource.getRepository(AdmissionApplication).save(intent.admissionApplication);
      return { message: 'Payment marked as failed', paymentIntentId: intent.id, status: 'failed' };
    }

    await this.dataSource.transaction(async (manager) => {
      const lockedIntent = await manager
        .getRepository(PaymentIntent)
        .createQueryBuilder('intent')
        .setLock('pessimistic_write')
        .leftJoinAndSelect('intent.admissionApplication', 'application')
        .leftJoinAndSelect('application.course', 'course')
        .leftJoinAndSelect('application.batch', 'batch')
        .leftJoinAndSelect('intent.invoice', 'invoice')
        .where('intent.id = :id', { id: intent.id })
        .getOne();
      if (!lockedIntent) throw new NotFoundException('Payment intent not found');
      if (lockedIntent.status === 'verified') return;
      await this.enrollAfterVerifiedPayment(manager, lockedIntent, dto, payload);
    });

    return { message: 'Payment verified and student enrollment activated', paymentIntentId: intent.id, status: 'verified' };
  }

  async listAdmin(query: { search?: string; status?: string }) {
    const builder = this.dataSource.getRepository(AdmissionApplication)
      .createQueryBuilder('application')
      .leftJoinAndSelect('application.course', 'course')
      .leftJoinAndSelect('application.batch', 'batch')
      .orderBy('application.createdAt', 'DESC');
    if (query.search?.trim()) {
      const search = `%${query.search.trim()}%`;
      builder.andWhere(new Brackets((where) => where
        .where('application.name ILIKE :search', { search })
        .orWhere('application.email ILIKE :search', { search })
        .orWhere('application.phone ILIKE :search', { search })));
    }
    if (query.status && query.status !== 'all') builder.andWhere('application.status = :status', { status: query.status });
    const applications = await builder.take(100).getMany();
    return {
      applications: applications.map((item) => ({
        id: item.id,
        name: item.name ?? '',
        email: item.email,
        phone: item.phone ?? '',
        courseTitle: item.course?.title ?? '',
        batchTitle: item.batch?.title ?? '',
        pricingPlanType: item.pricingPlanType ?? '',
        finalPayableAmount: Number(item.finalPayableAmount),
        status: item.status,
        emailVerified: item.emailVerified,
        createdAt: item.createdAt,
      })),
    };
  }

  async listOffers() {
    const rows = await this.dataSource.getRepository(Offer).find({ order: { createdAt: 'ASC' } });
    return {
      offers: rows.map((offer: any) => ({
        id: offer.id,
        name: offer.name,
        slug: offer.slug,
        description: offer.description ?? '',
        type: offer.type,
        discountPercentage: Number(offer.discountPercentage ?? 0),
        discountAmount: Number(offer.discountAmount ?? 0),
        appliesTo: offer.appliesTo ?? '',
        minCourseDurationMonths: offer.minCourseDurationMonths ?? null,
        isActive: offer.isActive,
      })),
    };
  }

  async updateOffer(id: string, body: { isActive?: boolean; discountPercentage?: number; discountAmount?: number }, actorId: string) {
    const offer = await this.dataSource.getRepository(Offer).findOne({ where: { id } });
    if (!offer) throw new NotFoundException('Offer not found');
    if (body.isActive !== undefined) offer.isActive = body.isActive;
    if (body.discountPercentage !== undefined) offer.discountPercentage = Math.max(0, Number(body.discountPercentage));
    if (body.discountAmount !== undefined) offer.discountAmount = Math.max(0, Number(body.discountAmount));
    await this.dataSource.getRepository(Offer).save(offer);
    await this.dataSource.getRepository(AuditLog).save({
      user: { id: actorId } as User,
      action: 'update_offer',
      module: 'offers',
      recordId: id,
      metadata: body,
    });
    return { message: 'Offer updated successfully', offer };
  }

  async listReferrals() {
    const redemptions = await this.dataSource.getRepository(ReferralRedemption).find({
      relations: {
        referralCode: true,
        referrerStudent: { user: true },
        referredApplication: true,
        referredStudent: { user: true },
      },
      order: { createdAt: 'DESC' },
      take: 100,
    });
    return {
      referrals: redemptions.map((item) => ({
        id: item.id,
        code: item.referralCode.code,
        referrerName: item.referrerStudent.user.name,
        referredName: item.referredStudent?.user?.name ?? item.referredApplication.name ?? item.referredApplication.email,
        status: item.status,
        referredStudentDiscountAmount: Number(item.referredStudentDiscountAmount),
        referrerCreditAmount: Number(item.referrerCreditAmount),
        verifiedAt: item.verifiedAt ?? null,
        createdAt: item.createdAt,
      })),
    };
  }

  private async enrollAfterVerifiedPayment(
    manager: EntityManager,
    intent: PaymentIntent,
    dto: GatewayCallbackDto,
    payload: Record<string, unknown>,
  ) {
    const application = intent.admissionApplication;
    const invoice = intent.invoice;
    if (!application.course) throw new BadRequestException('Application course is missing');
    if (await manager.findOne(User, { where: { email: application.email } })) {
      throw new ConflictException('Student account already exists for this email');
    }

    const passwordSeed = randomBytes(32).toString('base64url');
    const user = await manager.save(User, manager.create(User, {
      name: application.name ?? application.email,
      email: application.email,
      phone: application.phone,
      password: await bcrypt.hash(passwordSeed, 12),
      role: UserRole.Student,
      isActive: true,
    }));
    const student = await manager.save(StudentProfile, manager.create(StudentProfile, {
      user,
      guardianName: application.guardianName,
      guardianPhone: application.guardianPhone,
      dateOfBirth: application.dateOfBirth,
      gender: application.gender,
      educationLevel: application.educationLevel,
      address: application.address,
      city: application.city,
      courseInterest: application.course.title,
      preferredMode: application.preferredMode,
      preferredTiming: application.preferredTiming,
      preferredDays: application.preferredDays,
      admissionMessage: application.message,
      source: application.referralCodeApplied ? 'referral' : 'website',
      status: 'active',
    }));
    const enrollment = await manager.save(Enrollment, manager.create(Enrollment, {
      student,
      course: application.course,
      batch: application.batch,
      status: 'active',
      progressPercentage: 0,
    }));
    const plan = await manager.save(FeePlan, manager.create(FeePlan, {
      enrollment,
      student,
      course: application.course,
      pricingType: application.pricingPlanType,
      billingCycle: application.pricingPlanType,
      courseDurationMonths: this.pricingService.durationMonths(application.course),
      baseMonthlyFee: Number(application.course.monthlyFee || 5000),
      totalAmount: Number(application.grossAmount),
      discountPercentage: this.discountPercentage(application),
      discountAmount: Number(application.planDiscountAmount) + Number(application.referralDiscountAmount) + Number(application.scholarshipDiscountAmount),
      referralCouponDiscountAmount: Number(application.referralDiscountAmount),
      scholarshipDiscountAmount: Number(application.scholarshipDiscountAmount),
      walletCreditUsed: 0,
      payableAmount: Number(application.finalPayableAmount),
      paidAmount: Number(application.finalPayableAmount),
      pendingAmount: 0,
      installmentType: application.pricingPlanType === 'monthly' ? 'monthly' : 'full',
      status: 'paid',
    }));

    invoice.student = student;
    invoice.enrollment = enrollment;
    invoice.feePlan = plan;
    invoice.paidAmount = Number(application.finalPayableAmount);
    invoice.pendingAmount = 0;
    invoice.status = 'paid';
    invoice.paidAt = new Date();
    await manager.save(invoice);

    const payment = await manager.save(Payment, manager.create(Payment, {
      student,
      enrollment,
      feePlan: plan,
      invoiceRecord: invoice,
      paymentIntent: intent,
      amount: Number(application.finalPayableAmount),
      method: intent.gateway,
      gateway: intent.gateway,
      transactionId: dto.gatewayReference ?? intent.merchantTransactionId,
      gatewayReference: dto.gatewayReference,
      paymentDate: new Date().toISOString().slice(0, 10),
      status: 'verified',
      notes: 'Automated online admission payment',
      rawGatewayResponse: payload,
    }));

    intent.student = student;
    intent.feePlan = plan;
    intent.status = 'verified';
    intent.gatewayReference = dto.gatewayReference;
    intent.callbackPayload = payload;
    intent.verifiedAt = new Date();
    await manager.save(intent);

    application.status = 'enrolled';
    await manager.save(application);
    await this.createWalletIfMissing(manager, student);
    await this.generateReferralCode(manager, student, user.name);
    await this.verifyReferralReward(manager, application, student);

    await manager.save(Notification, manager.create(Notification, {
      user,
      title: 'Payment verified',
      message: 'Your enrollment is active. Welcome to SystemGrid Academy.',
      type: 'payment',
      actionUrl: '/student/dashboard',
    }));
    await manager.save(AuditLog, manager.create(AuditLog, {
      action: 'payment_verified_enroll_student',
      module: 'admissions',
      recordId: application.id,
      metadata: { paymentIntentId: intent.id, paymentId: payment.id, studentId: student.id, enrollmentId: enrollment.id },
    }));
    await this.emailService.sendWelcomeEmail(user.email);
  }

  private async verifyReferralReward(manager: EntityManager, application: AdmissionApplication, referredStudent: StudentProfile) {
    const redemption = await manager.findOne(ReferralRedemption, {
      where: { referredApplication: { id: application.id } },
      relations: { referrerStudent: { user: true }, referralCode: true },
    });
    if (!redemption || redemption.status === 'verified') return;
    redemption.status = 'verified';
    redemption.referredStudent = referredStudent;
    redemption.verifiedAt = new Date();
    await manager.save(redemption);
    redemption.referralCode.totalVerifiedUses += 1;
    redemption.referralCode.totalCreditEarned = Number(redemption.referralCode.totalCreditEarned) + Number(redemption.referrerCreditAmount);
    await manager.save(redemption.referralCode);
    const wallet = await this.createWalletIfMissing(manager, redemption.referrerStudent);
    wallet.balance = Number(wallet.balance) + Number(redemption.referrerCreditAmount);
    wallet.totalEarned = Number(wallet.totalEarned) + Number(redemption.referrerCreditAmount);
    await manager.save(wallet);
    await manager.save(WalletLedger, manager.create(WalletLedger, {
      student: redemption.referrerStudent,
      type: 'credit',
      source: 'referral_reward',
      amount: redemption.referrerCreditAmount,
      balanceAfter: wallet.balance,
      referenceId: redemption.id,
      description: 'Referral reward after verified admission payment',
    }));
    await manager.save(Notification, manager.create(Notification, {
      user: redemption.referrerStudent.user,
      title: 'Referral reward added',
      message: 'PKR 1,000 credit has been added to your wallet.',
      type: 'referral',
      actionUrl: '/student/referrals',
    }));
    await this.emailService.sendReferralRewardEmail(redemption.referrerStudent.user.email);
  }

  private async createWalletIfMissing(manager: EntityManager, student: StudentProfile) {
    const existing = await manager.findOne(StudentWallet, { where: { student: { id: student.id } } });
    if (existing) return existing;
    return manager.save(StudentWallet, manager.create(StudentWallet, { student, balance: 0, totalEarned: 0, totalUsed: 0 }));
  }

  private async generateReferralCode(manager: EntityManager, student: StudentProfile, name: string) {
    const existing = await manager.findOne(ReferralCode, { where: { student: { id: student.id }, isActive: true } });
    if (existing) return existing;
    const prefix = (name.split(/\s+/)[0] || 'SGA').replace(/[^a-z]/gi, '').slice(0, 8).toUpperCase() || 'SGA';
    let code = `${prefix}-SGA-${Math.floor(1000 + Math.random() * 9000)}`;
    while (await manager.findOne(ReferralCode, { where: { code } })) {
      code = `${prefix}-SGA-${Math.floor(1000 + Math.random() * 9000)}`;
    }
    return manager.save(ReferralCode, manager.create(ReferralCode, { student, code }));
  }

  private async resolveBatch(batchId: string, courseId: string) {
    const batch = await this.dataSource.getRepository(Batch).findOne({ where: { id: batchId }, relations: { course: true } });
    if (!batch || batch.course.id !== courseId) throw new BadRequestException('Batch does not belong to selected course');
    if (batch.status === 'cancelled' || batch.status === 'completed') throw new BadRequestException('Selected batch is not open for admission');
    return batch;
  }

  private async nextInvoiceNumber(manager: EntityManager) {
    return `SGA-INV-${new Date().getFullYear()}-${String((await manager.count(Invoice)) + 1).padStart(5, '0')}`;
  }

  private gatewayRedirectUrl(gateway: PaymentGateway, merchantTransactionId: string) {
    return `${this.frontendUrl()}/payment/pending?gateway=${gateway}&transaction=${merchantTransactionId}`;
  }

  private frontendUrl() {
    return this.configService.get<string>('FRONTEND_URL') ?? 'http://localhost:3000';
  }

  private verifyGatewaySignature(gateway: PaymentGateway, dto: GatewayCallbackDto, intent: PaymentIntent, payload: Record<string, unknown>) {
    const secret = gateway === 'jazzcash'
      ? this.configService.get<string>('JAZZCASH_INTEGRITY_SALT')
      : this.configService.get<string>('EASYPAISA_HASH_KEY');
    if (!secret || !dto.secureHash) return this.configService.get('NODE_ENV') !== 'production';
    const base = `${dto.merchantTransactionId}|${dto.status}|${Number(intent.amount).toFixed(2)}`;
    const expected = createHmac('sha256', secret).update(base).digest('hex');
    return expected.toLowerCase() === dto.secureHash.toLowerCase() || String(payload.secureHash).toLowerCase() === expected.toLowerCase();
  }

  private discountPercentage(application: AdmissionApplication) {
    if (!application.grossAmount) return 0;
    return Math.round((Number(application.planDiscountAmount) / Number(application.grossAmount)) * 100);
  }

  private mapPricing(result: Awaited<ReturnType<PricingService['calculate']>>) {
    const { referralCode: _referralCode, ...safe } = result;
    return safe;
  }

  private mapIntent(intent: PaymentIntent) {
    return {
      id: intent.id,
      admissionApplicationId: intent.admissionApplication?.id,
      invoiceId: intent.invoice?.id,
      gateway: intent.gateway,
      amount: Number(intent.amount),
      currency: intent.currency,
      status: intent.status,
      merchantTransactionId: intent.merchantTransactionId,
      redirectUrl: intent.redirectUrl,
      createdAt: intent.createdAt,
    };
  }
}
