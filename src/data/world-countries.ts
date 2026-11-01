import { DIASPORA_COUNTRIES } from "./diaspora-countries";

/**
 * ISO 3166-1 alpha-2 countries and territories.
 * Use display names for legacy profile/filter compatibility until the
 * country-code backfill described in issue #53 is deployed.
 */
export const ISO_COUNTRY_CODES = `
AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW`.trim().split(/\s+/);

const legacyNames = new Map<string, string>([
  ["GB", "United Kingdom"], ["US", "United States"],
  ["AE", "United Arab Emirates"], ["LK", "Sri Lanka"],
  ["NZ", "New Zealand"],
]);
const displayNames = new Intl.DisplayNames(["en"], { type: "region" });

export const WORLD_COUNTRIES = ISO_COUNTRY_CODES.map((code) => ({
  code,
  name: legacyNames.get(code) || displayNames.of(code) || code,
})).sort((a, b) => a.name.localeCompare(b.name, "en"));

/** Keep existing diaspora names accepted by the discovery filter. */
export const WORLD_COUNTRY_NAMES = Array.from(new Set([
  ...WORLD_COUNTRIES.map((country) => country.name),
  ...DIASPORA_COUNTRIES.map((country) => country.name),
])).sort((a, b) => a.localeCompare(b, "en"));

const normalized = (value: string) => value.trim().normalize('NFKC').toLowerCase().replace(/\s+/g, ' ');
const countryCodes = new Set(ISO_COUNTRY_CODES);
const byName = new Map(WORLD_COUNTRIES.map(country => [normalized(country.name), country.code]));
const aliases: Record<string, string> = {
  uk: 'GB', 'u.k.': 'GB', britain: 'GB', 'great britain': 'GB',
  usa: 'US', 'u.s.a.': 'US', 'united states of america': 'US',
  uae: 'AE', 'u.a.e.': 'AE', czechia: 'CZ', 'czech republic': 'CZ',
  turkey: 'TR', 'türkiye': 'TR', 'ivory coast': 'CI', 'côte d’ivoire': 'CI',
};

/** Read codes and historical names without rewriting a saved profile or draft. */
export function countryCodeForName(value: string): string | undefined {
  const input = normalized(value);
  const code = input.toUpperCase();
  return countryCodes.has(code) ? code : aliases[input] || byName.get(input);
}

export function countriesMatch(first: string, second: string): boolean {
  const a = normalized(first), b = normalized(second);
  if (!a || !b) return false;
  const firstCode = countryCodeForName(first), secondCode = countryCodeForName(second);
  return firstCode && secondCode ? firstCode === secondCode : a === b;
}

/** Keep unknown historical country labels selectable until an explicit edit. */
export function countryOptionsWithLegacy(values: readonly (string | undefined)[]): string[] {
  return [...new Set([...WORLD_COUNTRY_NAMES, ...values.filter((value): value is string => Boolean(value?.trim()))])]
    .sort((a, b) => a.localeCompare(b, 'en'));
}
