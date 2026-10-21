import type { MetadataRoute } from "next";

const baseUrl = "https://cupidmatch.co.uk";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ["", "/about", "/discover", "/pricing", "/safety", "/contact", "/privacy", "/terms", "/accessibility", "/community-guidelines"];
  return pages.map((path) => ({
    url: `${baseUrl}${path}`,
    changeFrequency: path === "" ? "weekly" : "monthly",
    priority: path === "" ? 1 : path === "/discover" ? 0.8 : 0.5,
  }));
}
