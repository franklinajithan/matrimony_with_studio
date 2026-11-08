import type { MetadataRoute } from "next";
import { searchPages } from "@/lib/analytics/pages";

const siteUrl = "https://cupidmatch.co.uk";

export default function sitemap(): MetadataRoute.Sitemap {
  return searchPages.map(path => ({ url: new URL(path, siteUrl).href }));
}
