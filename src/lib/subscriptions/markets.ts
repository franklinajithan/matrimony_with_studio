export type MarketCode = 'GB' | 'LK' | 'CA' | 'AU' | 'EU';
export type CurrencyCode = 'GBP' | 'LKR' | 'CAD' | 'AUD' | 'EUR';

export const MARKETS: Record<MarketCode, { name: string; currency: CurrencyCode; locale: string }> = {
  GB: { name: 'United Kingdom', currency: 'GBP', locale: 'en-GB' },
  LK: { name: 'Sri Lanka', currency: 'LKR', locale: 'en-LK' },
  CA: { name: 'Canada', currency: 'CAD', locale: 'en-CA' },
  AU: { name: 'Australia', currency: 'AUD', locale: 'en-AU' },
  EU: { name: 'Europe', currency: 'EUR', locale: 'en-IE' },
};

// Fixed launch prices by market. These are product prices, not live FX conversions.
export const MARKET_PRICES: Record<MarketCode, Record<'free' | 'premium' | 'premium_plus', { monthly: number; three_months: number; six_months: number }>> = {
  GB: { free:{monthly:0,three_months:0,six_months:0}, premium:{monthly:7.99,three_months:19.99,six_months:34.99}, premium_plus:{monthly:14.99,three_months:34.99,six_months:59.99} },
  LK: { free:{monthly:0,three_months:0,six_months:0}, premium:{monthly:3200,three_months:8000,six_months:14000}, premium_plus:{monthly:6000,three_months:14000,six_months:24000} },
  CA: { free:{monthly:0,three_months:0,six_months:0}, premium:{monthly:14.99,three_months:36.99,six_months:64.99}, premium_plus:{monthly:27.99,three_months:64.99,six_months:109.99} },
  AU: { free:{monthly:0,three_months:0,six_months:0}, premium:{monthly:15.99,three_months:39.99,six_months:69.99}, premium_plus:{monthly:29.99,three_months:69.99,six_months:119.99} },
  EU: { free:{monthly:0,three_months:0,six_months:0}, premium:{monthly:9.49,three_months:23.99,six_months:41.99}, premium_plus:{monthly:17.99,three_months:41.99,six_months:71.99} },
};

export function formatMarketPrice(market: MarketCode, amount: number) {
  if (amount === 0) return 'Free';
  const config = MARKETS[market];
  return new Intl.NumberFormat(config.locale, { style: 'currency', currency: config.currency, maximumFractionDigits: Number.isInteger(amount) ? 0 : 2 }).format(amount);
}
