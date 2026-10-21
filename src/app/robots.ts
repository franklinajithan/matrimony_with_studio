import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard", "/admin", "/messages", "/api/", "/settings", "/onboarding", "/checkout", "/account", "/auth/"],
    },
    sitemap: "https://cupidmatch.co.uk/sitemap.xml",
  };
}
