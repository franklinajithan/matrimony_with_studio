import type { DiscoveryFilters } from './preferences';
const lists = { countries: 'country', languages: 'language', religions: 'religion', professions: 'profession', smoking: 'smoking', drinking: 'drinking', maritalStatuses: 'maritalStatus', education: 'education' } as const;
const text = ['gender', 'heightMin', 'heightMax', 'relocation', 'wantsChildren', 'familyInvolvement', 'marriageTimeline'] as const;
export function filtersFromSearch(params: URLSearchParams, defaultGender?: string): DiscoveryFilters {
  const result: DiscoveryFilters = { query: (params.get('q') || '').slice(0, 200), countries: [], languages: [], religions: [], professions: [], smoking: [], drinking: [] };
  for (const [key, name] of Object.entries(lists)) result[key as keyof typeof lists] = params.getAll(name).map(v => v.trim().slice(0, 100)).filter(Boolean).slice(0, 20);
  for (const key of text) { const value = params.get(key)?.trim().slice(0, 100); if (value) result[key] = value; }
  if (!params.has('gender')) result.gender = defaultGender;
  for (const key of ['ageMin', 'ageMax'] as const) { const value = Number(params.get(key)); if (Number.isInteger(value) && value >= 18 && value <= 100) result[key] = value; }
  return result;
}
export function searchFromFilters(filters: DiscoveryFilters): string {
  const params = new URLSearchParams();
  if (filters.query) params.set('q', filters.query);
  for (const key of ['ageMin', 'ageMax'] as const) if (filters[key]) params.set(key, String(filters[key]));
  for (const [key, name] of Object.entries(lists)) for (const value of filters[key as keyof typeof lists] || []) params.append(name, value);
  for (const key of text) if (filters[key]) params.set(key, filters[key]);
  if (!filters.gender) params.set('gender', 'No preference');
  return `/discover?${params}`;
}
export function safeSavedSearch(value: unknown): string | null {
  if (typeof value !== 'string' || value.length > 8000) return null;
  try { const url = new URL(value, 'https://cupidmatch.invalid'); return url.origin === 'https://cupidmatch.invalid' && url.pathname === '/discover' && value.startsWith('/discover') ? searchFromFilters(filtersFromSearch(url.searchParams)) : null; } catch { return null; }
}
