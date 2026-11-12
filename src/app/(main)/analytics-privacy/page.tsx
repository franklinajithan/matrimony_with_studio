import { AnalyticsSettings } from "@/components/analytics/VisitorAnalytics";
import Link from "next/link";

export const metadata = { title: "Visitor analytics privacy", robots: { index: false, follow: true } };

export default function AnalyticsPrivacy() {
  return <article className="mx-auto max-w-3xl space-y-5 px-5 py-12">
    <h1 className="font-headline text-4xl font-bold text-primary">Visitor analytics privacy</h1>
    <p>CupidMatch uses optional visitor analytics to understand which pages people find and use. You can allow or decline analytics below at any time.</p>
    <p>If you allow analytics, CupidMatch records a randomly generated visit identifier, the page or section visited, the date and time, estimated time the page is visible, the browser family, an approximate country and a broad traffic source. When available, it also records campaign tags and whether the visit reached registration, profile publication or a connection request. Campaign links should use public labels. The report excludes IP addresses, account identifiers, search terms, form contents and private messages.</p>
    <p>Your browser remembers your choice for up to 180 days. A visit identifier is stored in the browser tab for the current visit. Authorised CupidMatch administrators can view the reports. Individual analytics records older than 30 days are deleted by a daily job. Anonymous daily traffic totals are kept for up to 90 days for comparisons.</p>
    <p>Declining analytics stops new activity collection in your browser. You can still use CupidMatch.</p>
    <AnalyticsSettings />
    <Link href="/contact" className="text-primary underline">Contact CupidMatch about your information</Link>
  </article>;
}
