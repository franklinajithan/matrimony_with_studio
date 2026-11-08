import type { Metadata } from "next";
import { LivePricing } from "@/components/subscriptions/LivePricing";
import { PricingIntroduction } from "@/components/subscriptions/PricingIntroduction";

export const metadata: Metadata = {
  title: "Matrimony Membership Plans and Pricing",
  description: "Compare CupidMatch Free, Plus and Premium matrimony memberships, including current prices and plan benefits.",
  alternates: { canonical: "/pricing" },
};

export default function PricingPage() {
  return (
    <main className="mx-auto max-w-6xl space-y-8 px-4 py-12">
      <PricingIntroduction />
      <LivePricing />
    </main>
  );
}
