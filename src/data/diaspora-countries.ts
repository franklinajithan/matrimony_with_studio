export type DiasporaCountryId =
  | "uk"
  | "canada"
  | "australia"
  | "france"
  | "germany"
  | "switzerland"
  | "italy"
  | "norway"
  | "netherlands"
  | "usa"
  | "new-zealand"
  | "singapore"
  | "uae"
  | "qatar"
  | "sri-lanka";

export type DiasporaCountry = {
  id: DiasporaCountryId;
  name: string;
  landmark: string;
};

export const DIASPORA_COUNTRIES: readonly DiasporaCountry[] = [
  { id: "uk", name: "United Kingdom", landmark: "Big Ben" },
  { id: "canada", name: "Canada", landmark: "CN Tower" },
  { id: "australia", name: "Australia", landmark: "Sydney Opera House" },
  { id: "france", name: "France", landmark: "Eiffel Tower" },
  { id: "germany", name: "Germany", landmark: "Brandenburg Gate" },
  { id: "switzerland", name: "Switzerland", landmark: "Matterhorn" },
  { id: "italy", name: "Italy", landmark: "Colosseum" },
  { id: "norway", name: "Norway", landmark: "Norwegian fjord" },
  { id: "netherlands", name: "Netherlands", landmark: "Dutch windmill" },
  { id: "usa", name: "United States", landmark: "Statue of Liberty" },
  { id: "new-zealand", name: "New Zealand", landmark: "Auckland Sky Tower" },
  { id: "singapore", name: "Singapore", landmark: "Marina Bay Sands" },
  { id: "uae", name: "United Arab Emirates", landmark: "Burj Khalifa" },
  { id: "qatar", name: "Qatar", landmark: "Museum of Islamic Art" },
  { id: "sri-lanka", name: "Sri Lanka", landmark: "Sigiriya Rock Fortress" },
] as const;

export const DIASPORA_COUNTRY_NAMES = DIASPORA_COUNTRIES.map((country) => country.name);

export function discoverCountryHref(country: string): string {
  return `/discover?country=${encodeURIComponent(country)}`;
}
