export type PlanCode = 'free' | 'plus' | 'premium';

export type PlanEntitlements = {
  interestsPerMonth: number | null;
  profileSharesPerMonth: number | null;
  biodataTemplates: number | null;
  profileBoostsPerMonth: number;
  advancedFilters: boolean;
  seeWhoLikesYou: boolean;
  unlimitedMessaging: boolean;
  readReceipts: boolean;
  familyIntroduction: boolean;
  fullHoroscope: boolean;
  premiumBadge: boolean;
  prioritySupport: boolean;
};

export type PlanDefinition = {
  code: PlanCode;
  name: string;
  monthlyPricePence: number;
  description: string;
  highlighted?: boolean;
  entitlements: PlanEntitlements;
};

export const PLANS: Record<PlanCode, PlanDefinition> = {
  free: {
    code: 'free', name: 'Free', monthlyPricePence: 0,
    description: 'Create your profile and start finding compatible matches.',
    entitlements: { interestsPerMonth: 10, profileSharesPerMonth: 3, biodataTemplates: 3, profileBoostsPerMonth: 0, advancedFilters: false, seeWhoLikesYou: false, unlimitedMessaging: false, readReceipts: false, familyIntroduction: false, fullHoroscope: false, premiumBadge: false, prioritySupport: false },
  },
  plus: {
    code: 'plus', name: 'Plus', monthlyPricePence: 999, highlighted: true,
    description: 'More ways to connect, communicate and find the right person.',
    entitlements: { interestsPerMonth: null, profileSharesPerMonth: 20, biodataTemplates: null, profileBoostsPerMonth: 1, advancedFilters: true, seeWhoLikesYou: true, unlimitedMessaging: true, readReceipts: true, familyIntroduction: true, fullHoroscope: true, premiumBadge: false, prioritySupport: false },
  },
  premium: {
    code: 'premium', name: 'Premium', monthlyPricePence: 1999,
    description: 'Maximum visibility and all CupidMatch relationship tools.',
    entitlements: { interestsPerMonth: null, profileSharesPerMonth: null, biodataTemplates: null, profileBoostsPerMonth: 4, advancedFilters: true, seeWhoLikesYou: true, unlimitedMessaging: true, readReceipts: true, familyIntroduction: true, fullHoroscope: true, premiumBadge: true, prioritySupport: true },
  },
};

export const getPlan = (code?: string | null) => PLANS[(code as PlanCode) in PLANS ? code as PlanCode : 'free'];
export const formatPlanPrice = (pence: number) => pence === 0 ? 'Free' : `£${(pence / 100).toFixed(2)}`;
