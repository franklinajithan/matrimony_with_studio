-- Final launch membership matrix. Stripe remains intentionally out of scope.
update public.subscription_plans set entitlements = case code
when 'free' then '{"profileBrowsing":true,"basicMatching":true,"interestsPerMonth":10,"messagingAfterMatch":true,"fullCompatibility":false,"advancedFilters":false,"seeWhoLikesYou":false,"seeProfileVisitors":false,"familyIntroduction":false,"incognitoMode":false,"profileBoostsPerMonth":0,"priorityVisibility":false,"premiumBadge":false,"profileSharesPerMonth":3,"biodataTemplates":3,"readReceipts":false,"prioritySupport":false}'::jsonb
when 'premium' then '{"profileBrowsing":true,"basicMatching":true,"interestsPerMonth":null,"messagingAfterMatch":true,"fullCompatibility":true,"advancedFilters":true,"seeWhoLikesYou":true,"seeProfileVisitors":true,"familyIntroduction":true,"incognitoMode":false,"profileBoostsPerMonth":0,"priorityVisibility":false,"premiumBadge":false,"profileSharesPerMonth":20,"biodataTemplates":null,"readReceipts":true,"prioritySupport":false}'::jsonb
when 'premium_plus' then '{"profileBrowsing":true,"basicMatching":true,"interestsPerMonth":null,"messagingAfterMatch":true,"fullCompatibility":true,"advancedFilters":true,"seeWhoLikesYou":true,"seeProfileVisitors":true,"familyIntroduction":true,"incognitoMode":true,"profileBoostsPerMonth":4,"priorityVisibility":true,"premiumBadge":true,"profileSharesPerMonth":null,"biodataTemplates":null,"readReceipts":true,"prioritySupport":true}'::jsonb
else entitlements end,
monthly_price_pence = case code when 'premium' then 799 when 'premium_plus' then 1499 else 0 end,
three_month_price_pence = case code when 'premium' then 1999 when 'premium_plus' then 3499 else 0 end,
six_month_price_pence = case code when 'premium' then 3499 when 'premium_plus' then 5999 else 0 end,
updated_at = now()
where code in ('free','premium','premium_plus');
