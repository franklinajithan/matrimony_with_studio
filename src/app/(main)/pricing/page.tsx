import type { Metadata } from "next";
import { LivePricing } from "@/components/subscriptions/LivePricing";

export const metadata: Metadata = {
  title: "Matrimony Membership Plans and Pricing",
  description: "Compare CupidMatch Free, Plus and Premium matrimony memberships, including current prices and plan benefits.",
  alternates: { canonical: "/pricing" },
};

export default function PricingPage(){return <main className="mx-auto max-w-6xl space-y-8 px-4 py-12"><header className="space-y-3 text-center"><h1 className="text-4xl font-bold">CupidMatch membership plans</h1><p>Compare Free, Plus and Premium matrimonial memberships with current prices and benefits.</p><p className="text-sm text-muted-foreground">Free has no card requirement. Paid membership access begins only after verified payment. Existing introductory offers retain their original end dates.</p></header><LivePricing /></main>;}
