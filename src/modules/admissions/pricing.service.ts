import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import {
  Course,
  Offer,
  PricingPlanType,
  ReferralCode,
  Setting,
} from '../../database/entities';

export type PricingBreakdown = {
  courseId: string;
  courseTitle: string;
  courseDurationMonths: number;
  monthlyFee: number;
  pricingPlanType: PricingPlanType;
  grossAmount: number;
  planDiscountAmount: number;
  referralCouponDiscountAmount: number;
  scholarshipDiscountAmount: number;
  walletCreditUsed: number;
  finalPayableAmount: number;
  totalSavings: number;
  referralCode?: ReferralCode;
  notes: string[];
};

@Injectable()
export class PricingService {
  constructor(private readonly dataSource: DataSource) {}

  async calculate(input: {
    courseId: string;
    pricingPlanType: PricingPlanType;
    referralCode?: string;
    scholarshipEligible?: boolean;
    walletBalance?: number;
  }): Promise<PricingBreakdown> {
    const course = await this.dataSource.getRepository(Course).findOne({
      where: { id: input.courseId, isPublished: true },
    });
    if (!course) throw new NotFoundException('Published course not found');

    const courseDurationMonths = this.durationMonths(course);
    this.validatePlanAvailability(input.pricingPlanType, courseDurationMonths);

    const monthlyFee = await this.monthlyFee(course);
    const offers = await this.activeOffers();
    const grossAmount = this.grossAmount(input.pricingPlanType, monthlyFee, courseDurationMonths);
    const planDiscountAmount = this.planDiscount(input.pricingPlanType, grossAmount, offers);
    const scholarshipDiscountAmount =
      input.scholarshipEligible && input.pricingPlanType === 'quarterly'
        ? this.percent(grossAmount, this.offerPercentage(offers, 'scholarship-discount', 50))
        : 0;
    const referral = input.referralCode ? await this.findReferralCode(input.referralCode) : undefined;
    const referralCouponDiscountAmount = referral
      ? this.offerAmount(offers, 'referral-new-student-discount', 500)
      : 0;
    const beforeWallet = Math.max(
      0,
      grossAmount - planDiscountAmount - scholarshipDiscountAmount - referralCouponDiscountAmount,
    );
    const walletCreditUsed = Math.min(Math.max(0, input.walletBalance ?? 0), beforeWallet);
    const finalPayableAmount = Math.max(0, beforeWallet - walletCreditUsed);

    return {
      courseId: course.id,
      courseTitle: course.title,
      courseDurationMonths,
      monthlyFee,
      pricingPlanType: input.pricingPlanType,
      grossAmount,
      planDiscountAmount,
      referralCouponDiscountAmount,
      scholarshipDiscountAmount,
      walletCreditUsed,
      finalPayableAmount,
      totalSavings: planDiscountAmount + referralCouponDiscountAmount + scholarshipDiscountAmount + walletCreditUsed,
      referralCode: referral,
      notes: this.notes(input.pricingPlanType, referralCouponDiscountAmount, scholarshipDiscountAmount, walletCreditUsed),
    };
  }

  durationMonths(course: Course) {
    if (course.durationUnit === 'months') return Math.max(1, Number(course.duration));
    return Math.max(1, Math.ceil(Number(course.duration) / 4));
  }

  validatePlanAvailability(plan: PricingPlanType, durationMonths: number) {
    if (plan === 'quarterly' && durationMonths < 6) {
      throw new BadRequestException('Quarterly plan is available for 6-month or longer courses only');
    }
  }

  private async monthlyFee(course: Course) {
    if (Number(course.monthlyFee) > 0) return Number(course.monthlyFee);
    const setting = await this.dataSource.getRepository(Setting).findOne({ where: { key: 'monthly_fee' } });
    const value = Number(setting?.value ?? 5000);
    return Number.isFinite(value) && value > 0 ? value : 5000;
  }

  private grossAmount(plan: PricingPlanType, monthlyFee: number, durationMonths: number) {
    if (plan === 'monthly') return monthlyFee;
    if (plan === 'quarterly') return monthlyFee * 3;
    return monthlyFee * durationMonths;
  }

  private planDiscount(plan: PricingPlanType, grossAmount: number, offers: Offer[]) {
    if (plan === 'quarterly') return this.percent(grossAmount, this.offerPercentage(offers, 'quarterly-discount', 20));
    if (plan === 'full_course') return this.percent(grossAmount, this.offerPercentage(offers, 'full-course-discount', 35));
    return 0;
  }

  private async activeOffers() {
    return this.dataSource.getRepository(Offer).find({ where: { isActive: true } });
  }

  private offerPercentage(offers: Offer[], slug: string, fallback: number) {
    return Number(offers.find((offer) => offer.slug === slug)?.discountPercentage ?? fallback);
  }

  private offerAmount(offers: Offer[], slug: string, fallback: number) {
    return Number(offers.find((offer) => offer.slug === slug)?.discountAmount ?? fallback);
  }

  private percent(amount: number, percentage: number) {
    return Math.round((amount * percentage) / 100);
  }

  private async findReferralCode(code: string) {
    const referral = await this.dataSource.getRepository(ReferralCode).findOne({
      where: { code: code.trim().toUpperCase(), isActive: true },
      relations: { student: { user: true } },
    });
    if (!referral) throw new BadRequestException('Invalid or inactive referral code');
    return referral;
  }

  private notes(
    plan: PricingPlanType,
    referralDiscount: number,
    scholarshipDiscount: number,
    walletCreditUsed: number,
  ) {
    const notes: string[] = [];
    if (plan === 'quarterly') notes.push('Quarterly discount and full-course discount do not stack.');
    if (referralDiscount > 0) notes.push('Referral coupon discount applies to first payment only.');
    if (scholarshipDiscount > 0) notes.push('Scholarship discount applies to the next quarter only after approval.');
    if (walletCreditUsed > 0) notes.push('Wallet credit is applied after plan, scholarship, and referral discounts.');
    return notes;
  }
}
