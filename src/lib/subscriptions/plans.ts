export type PlanCode = 'free' | 'premium' | 'premium_plus';
export type BillingTerm = 'monthly' | 'three_months' | 'six_months';

export type PlanEntitlements = {
  interestsPerMonth: number | null;
  profileSharesPerMonth: number | null;
  biodataTemplates: number | null;
  profileBoostsPerMonth: number;
  advancedFilters: boolean;
  fullCompatibility: boolean;
  seeWhoLikesYou: boolean;
  seeProfileVisitors: boolean;
  messagingAfterMatch: boolean;
  readReceipts: boolean;
  familyIntroduction: boolean;
  incognitoMode: boolean;
  priorityVisibility: boolean;
  premiumBadge: boolean;
  prioritySupport: boolean;
};

export type PlanDefinition = {
  code: PlanCode;
  name: string;
  pricesPence: Record<BillingTerm, number>;
  description: string;
  highlighted?: boolean;
  entitlements: PlanEntitlements;
};

export const PLANS: Record<PlanCode, PlanDefinition> = {
  free: {
    code: 'free', name: 'Free', pricesPence: { monthly: 0, three_months: 0, six_months: 0 },
    description: 'Create your profile, browse matches and start genuine conversations after a mutual match.',
    entitlements: { interestsPerMonth: 10, profileSharesPerMonth: 3, biodataTemplates: 3, profileBoostsPerMonth: 0, advancedFilters: false, fullCompatibility: false, seeWhoLikesYou: false, seeProfileVisitors: false, messagingAfterMatch: true, readReceipts: false, familyIntroduction: false, incognitoMode: false, priorityVisibility: false, premiumBadge: false, prioritySupport: false },
  },
  premium: {
    code: 'premium', name: 'Premium', pricesPence: { monthly: 799, three_months: 1999, six_months: 3499 }, highlighted: true,
    description: 'For serious partner searching with deeper compatibility and discovery tools.',
    entitlements: { interestsPerMonth: null, profileSharesPerMonth: 20, biodataTemplates: null, profileBoostsPerMonth: 0, advancedFilters: true, fullCompatibility: true, seeWhoLikesYou: true, seeProfileVisitors: true, messagingAfterMatch: true, readReceipts: true, familyIntroduction: true, incognitoMode: false, priorityVisibility: false, premiumBadge: false, prioritySupport: false },
  },
  premium_plus: {
    code: 'premium_plus', name: 'Premium+', pricesPence: { monthly: 1499, three_months: 3499, six_months: 5999 },
    description: 'Maximum privacy, visibility and priority tools for members actively searching.',
    entitlements: { interestsPerMonth: null, profileSharesPerMonth: null, biodataTemplates: null, profileBoostsPerMonth: 4, advancedFilters: true, fullCompatibility: true, seeWhoLikesYou: true, seeProfileVisitors: true, messagingAfterMatch: true, readReceipts: true, familyIntroduction: true, incognitoMode: true, priorityVisibility: true, premiumBadge: true, prioritySupport: true },
  },
};

export const getPlan = (code?: string | null) => PLANS[(code as PlanCode) in PLANS ? code as PlanCode : 'free'];
export const formatPlanPrice = (pence: number) => pence === 0 ? 'Free' : `£${(pence / 100).toFixed(2)}`;
export const getPlanPrice = (code: PlanCode, term: BillingTerm = 'monthly') => PLANS[code].pricesPence[term];
