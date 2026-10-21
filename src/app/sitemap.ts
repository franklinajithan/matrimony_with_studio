import type { MetadataRoute } from "next";

const baseUrl = "https://cupidmatch.co.uk";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ["", "/about", "/discover", "/pricing", "/safety", "/contact", "/privacy", "/terms", "/accessibility", "/community-guidelines", "/how-it-works", "/sri-lankan-matrimony-uk", "/tamil-matrimony-uk", "/sinhala-matrimony", "/horoscope-matching"];
  return pages.map((path) => ({
    url: `${baseUrl}${path}`,
    changeFrequency: path === "" ? "weekly" : "monthly",
    priority: path === "" ? 1 : path === "/discover" ? 0.8 : 0.5,
  }));
}
