export const searchPages = [
  "/", "/about", "/pricing", "/safety", "/contact", "/matrimony-guides",
  "/how-it-works", "/international-matrimony",
  "/sri-lankan-matrimony-uk", "/indian-matrimony-uk", "/tamil-matrimony-uk",
  "/sinhala-matrimony", "/horoscope-matching", "/family-assisted-matrimony",
  "/sri-lankan-matrimony-sri-lanka", "/sri-lankan-matrimony-canada",
  "/sri-lankan-matrimony-australia", "/sri-lankan-matrimony-france",
  "/sri-lankan-matrimony-germany", "/sri-lankan-matrimony-switzerland", "/success-stories",
];

const sections = [
  "/discover", "/feedback", "/signup", "/login", "/dashboard", "/onboarding",
  "/profile", "/messages", "/connections", "/interests", "/search", "/suggestions",
  "/membership", "/checkout", "/settings", "/profile-setup", "/verification",
];

export function activityPage(path: string) {
  const normalized = path.replace(/\/$/, "") || "/";
  if (searchPages.includes(normalized)) return normalized;
  return sections.find(section => normalized === section || normalized.startsWith(section + "/"));
}
