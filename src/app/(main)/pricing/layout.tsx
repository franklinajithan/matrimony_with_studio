import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "CupidMatch Plans & Pricing | Sri Lankan Matrimony Worldwide",
  description: "Explore CupidMatch membership plans for Sri Lankan community matrimony worldwide. Choose the plan that suits you wherever you live.",
  alternates: { canonical: "https://cupidmatch.co.uk/pricing" },
  openGraph: {
    type: "website",
    url: "https://cupidmatch.co.uk/pricing",
    title: "CupidMatch Plans & Pricing | Sri Lankan Matrimony Worldwide",
    description: "Membership options for Sri Lankan community connections worldwide.",
  },
};

export default function PricingLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
