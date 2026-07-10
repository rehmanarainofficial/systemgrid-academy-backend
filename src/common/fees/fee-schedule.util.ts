import type { PricingPlanType } from '../../database/entities';

export const FEE_PAYMENT_WINDOW_DAYS = 5;

export type FeeScheduleInput = {
  anchorDate: Date;
  billingCycle: PricingPlanType;
  courseDurationMonths: number;
  installmentsPaid: number;
  pendingAmount: number;
  installmentAmount: number;
  hasPendingPayment: boolean;
  portalAccessSuspended?: boolean;
  now?: Date;
};

export type FeeScheduleState = {
  billingCycle: PricingPlanType;
  installmentLabel: string;
  periodStart: string;
  periodEnd: string;
  windowOpensAt: string;
  windowClosesAt: string;
  isWindowOpen: boolean;
  isReminderDay: boolean;
  isOverdue: boolean;
  canPay: boolean;
  disabledReason: string | null;
  installmentAmount: number;
  installmentsPaid: number;
  totalInstallments: number;
  hasPendingPayment: boolean;
};

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addMonths(date: Date, months: number) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}

function toDateString(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function resolveBillingCycle(plan: {
  billingCycle?: PricingPlanType | null;
  pricingType?: PricingPlanType | null;
  installmentType?: string;
}): PricingPlanType {
  if (plan.billingCycle) return plan.billingCycle;
  if (plan.pricingType) return plan.pricingType;
  return plan.installmentType === 'monthly' ? 'monthly' : 'full_course';
}

export function monthsPerPeriod(cycle: PricingPlanType) {
  if (cycle === 'quarterly') return 3;
  if (cycle === 'monthly') return 1;
  return 0;
}

export function totalInstallmentCount(cycle: PricingPlanType, courseDurationMonths: number) {
  if (cycle === 'full_course') return 1;
  const periodMonths = monthsPerPeriod(cycle);
  return Math.max(1, Math.ceil(courseDurationMonths / periodMonths));
}

export function resolveRecurringBalances(plan: {
  billingCycle?: PricingPlanType | null;
  pricingType?: PricingPlanType | null;
  installmentType?: string;
  baseMonthlyFee: number;
  courseDurationMonths: number;
  payableAmount: number;
  paidAmount: number;
  pendingAmount: number;
  discountAmount?: number;
  installmentsPaid?: number;
}) {
  const cycle = resolveBillingCycle(plan);
  const totalInstallments = totalInstallmentCount(cycle, plan.courseDurationMonths);
  const installmentsPaid = Number(plan.installmentsPaid ?? 1);

  if (cycle === 'full_course') {
    return {
      billingCycle: cycle,
      totalInstallments,
      installmentsPaid,
      effectivePayable: Number(plan.payableAmount),
      effectivePending: Number(plan.pendingAmount),
      hasUpcomingInstallment: false,
    };
  }

  const expectedGross = Number(plan.baseMonthlyFee) * plan.courseDurationMonths;
  const expectedPayable = Math.max(
    Number(plan.payableAmount),
    expectedGross - Number(plan.discountAmount ?? 0),
  );
  const effectivePending = Math.max(0, expectedPayable - Number(plan.paidAmount));
  const hasUpcomingInstallment = installmentsPaid < totalInstallments;

  return {
    billingCycle: cycle,
    totalInstallments,
    installmentsPaid,
    effectivePayable: expectedPayable,
    effectivePending,
    hasUpcomingInstallment,
  };
}

export function getInstallmentAmount(plan: {
  billingCycle?: PricingPlanType | null;
  pricingType?: PricingPlanType | null;
  installmentType?: string;
  baseMonthlyFee: number;
  payableAmount: number;
  pendingAmount: number;
  courseDurationMonths: number;
  enrollment?: { course?: { monthlyFee?: number } };
}) {
  const cycle = resolveBillingCycle(plan);
  const monthlyFee = Number(plan.baseMonthlyFee ?? plan.enrollment?.course?.monthlyFee ?? 5000);
  if (cycle === 'monthly') return monthlyFee;
  if (cycle === 'quarterly') return monthlyFee * 3;
  return Number(plan.pendingAmount);
}

export function buildFeeSchedule(input: FeeScheduleInput): FeeScheduleState {
  const now = startOfDay(input.now ?? new Date());
  const cycle = input.billingCycle;
  const totalInstallments = totalInstallmentCount(cycle, input.courseDurationMonths);
  const installmentsRemaining = input.installmentsPaid < totalInstallments;

  if (
    cycle === 'full_course' ||
    (!installmentsRemaining && input.pendingAmount <= 0)
  ) {
    return {
      billingCycle: cycle,
      installmentLabel: cycle === 'full_course' ? 'Full course' : 'Completed',
      periodStart: toDateString(input.anchorDate),
      periodEnd: toDateString(input.anchorDate),
      windowOpensAt: '',
      windowClosesAt: '',
      isWindowOpen: false,
      isReminderDay: false,
      isOverdue: false,
      canPay: false,
      disabledReason:
        input.pendingAmount <= 0 || input.installmentsPaid >= totalInstallments
          ? 'Course fee is fully paid.'
          : 'Full-course students do not have recurring installments.',
      installmentAmount: input.installmentAmount,
      installmentsPaid: input.installmentsPaid,
      totalInstallments,
      hasPendingPayment: input.hasPendingPayment,
    };
  }

  const periodStart = addMonths(input.anchorDate, (input.installmentsPaid - 1) * monthsPerPeriod(cycle));
  const periodEnd = addMonths(input.anchorDate, input.installmentsPaid * monthsPerPeriod(cycle));
  periodEnd.setDate(periodEnd.getDate() - 1);

  const windowOpens = new Date(periodEnd);
  windowOpens.setDate(windowOpens.getDate() - 1);
  const windowCloses = new Date(windowOpens);
  windowCloses.setDate(windowCloses.getDate() + FEE_PAYMENT_WINDOW_DAYS);

  const windowOpensDay = startOfDay(windowOpens);
  const windowClosesDay = startOfDay(windowCloses);
  const isWindowOpen = now >= windowOpensDay && now <= windowClosesDay;
  const isReminderDay = now.getTime() === windowOpensDay.getTime();
  const isOverdue = now > windowClosesDay;

  let canPay = isWindowOpen && !input.hasPendingPayment && input.pendingAmount > 0 && !input.portalAccessSuspended;
  let disabledReason: string | null = null;

  if (input.portalAccessSuspended) {
    disabledReason = 'Portal access is temporarily suspended. Contact admin to restore access.';
    canPay = false;
  } else if (input.hasPendingPayment) {
    disabledReason = 'A payment is already awaiting admin verification.';
    canPay = false;
  } else if (now < windowOpensDay) {
    disabledReason = `Payment opens on ${toDateString(windowOpens)} (1 day before your current billing period ends).`;
    canPay = false;
  } else if (isOverdue) {
    disabledReason = 'Payment window expired. Contact admin to restore portal access.';
    canPay = false;
  } else if (!canPay) {
    disabledReason = 'Payment is not available right now.';
  }

  const nextInstallmentNumber = input.installmentsPaid + 1;
  const installmentLabel =
    cycle === 'quarterly'
      ? `Quarter ${Math.ceil(nextInstallmentNumber / 1)}`
      : `Month ${nextInstallmentNumber}`;

  return {
    billingCycle: cycle,
    installmentLabel,
    periodStart: toDateString(periodStart),
    periodEnd: toDateString(periodEnd),
    windowOpensAt: toDateString(windowOpens),
    windowClosesAt: toDateString(windowCloses),
    isWindowOpen,
    isReminderDay,
    isOverdue,
    canPay,
    disabledReason,
    installmentAmount: input.installmentAmount,
    installmentsPaid: input.installmentsPaid,
    totalInstallments,
    hasPendingPayment: input.hasPendingPayment,
  };
}
