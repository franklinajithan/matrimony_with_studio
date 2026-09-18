export type PlanCode = 'free' | 'premium' | 'premium_plus';
export type BillingTerm = 'monthly' | 'three_months' | 'six_months';

export type PlanEntitlements = {
  profileBrowsing: boolean;
  basicMatching: boolean;
  interestsPerMonth: number | null;
  messagingAfterMatch: boolean;
  fullCompatibility: boolean;
  advancedFilters: boolean;
  seeWhoLikesYou: boolean;
  seeProfileVisitors: boolean;
  familyIntroduction: boolean;
  incognitoMode: boolean;
  profileBoostsPerMonth: number;
  priorityVisibility: boolean;
  premiumBadge: boolean;
  profileSharesPerMonth: number | null;
  biodataTemplates: number | null;
  readReceipts: boolean;
  prioritySupport: boolean;
};

export type PlanDefinition = { code: PlanCode; name: string; pricesPence: Record<BillingTerm, number>; description: string; highlighted?: boolean; entitlements: PlanEntitlements };

export const PLANS: Record<PlanCode, PlanDefinition> = {
  free: { code:'free', name:'Free', pricesPence:{monthly:0,three_months:0,six_months:0}, description:'Create your profile, browse matches and message after a mutual match.', entitlements:{profileBrowsing:true,basicMatching:true,interestsPerMonth:10,messagingAfterMatch:true,fullCompatibility:false,advancedFilters:false,seeWhoLikesYou:false,seeProfileVisitors:false,familyIntroduction:false,incognitoMode:false,profileBoostsPerMonth:0,priorityVisibility:false,premiumBadge:false,profileSharesPerMonth:3,biodataTemplates:3,readReceipts:false,prioritySupport:false}},
  premium: { code:'premium', name:'Premium', pricesPence:{monthly:799,three_months:1999,six_months:3499}, description:'For serious partner searching.', highlighted:true, entitlements:{profileBrowsing:true,basicMatching:true,interestsPerMonth:null,messagingAfterMatch:true,fullCompatibility:true,advancedFilters:true,seeWhoLikesYou:true,seeProfileVisitors:true,familyIntroduction:true,incognitoMode:false,profileBoostsPerMonth:0,priorityVisibility:false,premiumBadge:false,profileSharesPerMonth:20,biodataTemplates:null,readReceipts:true,prioritySupport:false}},
  premium_plus: { code:'premium_plus', name:'Premium+', pricesPence:{monthly:1499,three_months:3499,six_months:5999}, description:'Maximum privacy, visibility and priority tools.', entitlements:{profileBrowsing:true,basicMatching:true,interestsPerMonth:null,messagingAfterMatch:true,fullCompatibility:true,advancedFilters:true,seeWhoLikesYou:true,seeProfileVisitors:true,familyIntroduction:true,incognitoMode:true,profileBoostsPerMonth:4,priorityVisibility:true,premiumBadge:true,profileSharesPerMonth:null,biodataTemplates:null,readReceipts:true,prioritySupport:true}},
};

export const PLAN_FEATURE_MATRIX = [
  { label:'Create/profile browsing', key:'profileBrowsing' }, { label:'Basic matching', key:'basicMatching' }, { label:'Send interests', key:'interestsPerMonth' }, { label:'Messaging after mutual match', key:'messagingAfterMatch' }, { label:'Full compatibility analysis', key:'fullCompatibility' }, { label:'Advanced search', key:'advancedFilters' }, { label:'See who liked/viewed you', key:'seeWhoLikesYou' }, { label:'Family Introduction Mode', key:'familyIntroduction' }, { label:'Incognito/privacy controls', key:'incognitoMode' }, { label:'Profile boost', key:'profileBoostsPerMonth' }, { label:'Priority visibility', key:'priorityVisibility' }, { label:'Premium+ badge', key:'premiumBadge' },
] as const;

export const getPlan = (code?: string | null) => PLANS[(code as PlanCode) in PLANS ? code as PlanCode : 'free'];
export const formatPlanPrice = (pence:number) => pence===0?'Free':`£${(pence/100).toFixed(2)}`;
export const getPlanPrice = (code:PlanCode, term:BillingTerm='monthly') => PLANS[code].pricesPence[term];
