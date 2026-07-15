import { EntityManager } from 'typeorm';
import {
  Offer,
  ReferralCode,
  StudentProfile,
  StudentWallet,
} from '../../database/entities';

// Default referrer reward (PKR) when no configurable offer row is present.
export const DEFAULT_REFERRER_CREDIT = 1000;

// Every student owns exactly one wallet and one active referral code. This is
// created the moment a student exists (admin-created or admission-enrolled) so
// the referral system works regardless of how the account was created.
export async function ensureWalletAndReferralCode(
  manager: EntityManager,
  student: StudentProfile,
  name: string,
): Promise<ReferralCode> {
  const existingWallet = await manager.findOne(StudentWallet, {
    where: { student: { id: student.id } },
  });
  if (!existingWallet) {
    await manager.save(
      manager.create(StudentWallet, {
        student,
        balance: 0,
        totalEarned: 0,
        totalUsed: 0,
      }),
    );
  }

  const existingCode = await manager.findOne(ReferralCode, {
    where: { student: { id: student.id }, isActive: true },
  });
  if (existingCode) return existingCode;

  const prefix =
    (name.split(/\s+/)[0] || 'SGA').replace(/[^a-z]/gi, '').slice(0, 8).toUpperCase() ||
    'SGA';
  let code = `${prefix}-SGA-${Math.floor(1000 + Math.random() * 9000)}`;
  while (await manager.findOne(ReferralCode, { where: { code } })) {
    code = `${prefix}-SGA-${Math.floor(1000 + Math.random() * 9000)}`;
  }
  return manager.save(manager.create(ReferralCode, { student, code }));
}

// Referrer reward amount is configurable through the offers table (slug
// `referral-reward`) so admins can change it without a code deploy.
export async function resolveReferrerCreditAmount(
  manager: EntityManager,
  fallback: number = DEFAULT_REFERRER_CREDIT,
): Promise<number> {
  const offer = await manager.findOne(Offer, {
    where: { slug: 'referral-reward' },
  });
  if (offer && !offer.isActive) return 0;
  const amount = Number(offer?.discountAmount ?? fallback);
  return Number.isFinite(amount) && amount >= 0 ? amount : fallback;
}
