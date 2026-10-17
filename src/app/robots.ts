import type { MetadataRoute } from "next";
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: [
        "/",
        "/about",
        "/features",
        "/pricing",
        "/blog",
        "/safety",
        "/contact",
        "/success-stories",
      ],
      disallow: [
        "/admin",
        "/api",
        "/dashboard",
        "/profile",
        "/messages",
        "/support",
        "/future-map",
        "/family-circle",
        "/notifications",
        "/share",
        "/biodata",
        "/onboarding",
        "/settings",
      ],
    },
    sitemap: "https://cupidmatch.co.uk/sitemap.xml",
  };
}
