import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { UserRole } from '../enums/user-role.enum';

export const ADMIN_SPECIAL_FEE_MIN_MONTHLY = 4500;

export type SpecialFeeAgreementInput = {
  specialFeeEnabled?: boolean;
  agreedMonthlyFee?: number;
  specialFeeReason?: string;
  specialFeeNotes?: string;
};

export type SpecialFeeAgreementDraft = {
  hasSpecialFeeAgreement: boolean;
  standardMonthlyFee?: number;
  agreedMonthlyFee?: number;
  specialFeeDiscountPerMonth: number;
  specialFeeReason?: string;
  specialFeeNotes?: string;
  specialFeeApprovedBy?: { id: string };
  specialFeeApprovedAt?: Date;
};

export function assertSpecialFeePermission(
  actorRole: UserRole,
  agreedMonthlyFee: number,
) {
  if (actorRole === UserRole.SuperAdmin) return;
  if (actorRole === UserRole.Admin && agreedMonthlyFee >= ADMIN_SPECIAL_FEE_MIN_MONTHLY) return;
  throw new ForbiddenException(
    `Only a Super Admin can approve a monthly fee below Rs ${ADMIN_SPECIAL_FEE_MIN_MONTHLY.toLocaleString('en-PK')}.`,
  );
}

export function buildSpecialFeeAgreementDraft(
  input: SpecialFeeAgreementInput | undefined,
  standardMonthlyFee: number,
  actor: { id: string; role: UserRole },
): SpecialFeeAgreementDraft {
  if (!input?.specialFeeEnabled) {
    return {
      hasSpecialFeeAgreement: false,
      specialFeeDiscountPerMonth: 0,
    };
  }

  const agreedMonthlyFee = Number(input.agreedMonthlyFee);
  if (!Number.isFinite(agreedMonthlyFee) || agreedMonthlyFee <= 0) {
    throw new BadRequestException('Enter a valid agreed monthly fee');
  }
  if (agreedMonthlyFee > standardMonthlyFee) {
    throw new BadRequestException('Agreed monthly fee cannot exceed the course standard monthly fee');
  }
  const reason = input.specialFeeReason?.trim();
  if (!reason) {
    throw new BadRequestException('Special fee reason is required');
  }

  assertSpecialFeePermission(actor.role, agreedMonthlyFee);

  return {
    hasSpecialFeeAgreement: true,
    standardMonthlyFee,
    agreedMonthlyFee,
    specialFeeDiscountPerMonth: Math.max(0, standardMonthlyFee - agreedMonthlyFee),
    specialFeeReason: reason,
    specialFeeNotes: input.specialFeeNotes?.trim() || undefined,
    specialFeeApprovedBy: { id: actor.id },
    specialFeeApprovedAt: new Date(),
  };
}
