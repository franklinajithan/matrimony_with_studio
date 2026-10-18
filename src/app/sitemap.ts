import type { MetadataRoute } from "next";
import { articles } from "@/lib/content/articles";
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    "/",
    "/about",
    "/features",
    "/faq",
    "/pricing",
    "/blog",
    "/safety",
    "/contact",
    "/success-stories",
    "/privacy",
    "/terms",
    "/community-guidelines",
    "/accessibility",
    ...articles.map((a) => `/blog/${a.slug}`),
  ].map((path) => ({
    url: `https://cupidmatch.co.uk${path}`,
    changeFrequency: path === "/success-stories" ? "weekly" : "monthly",
  }));
}
