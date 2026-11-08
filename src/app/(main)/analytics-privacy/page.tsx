import Link from "next/link";

export const metadata = { title: "Visitor analytics privacy", robots: { index: false, follow: true } };

export default function AnalyticsPrivacy() {
  return <article className="mx-auto max-w-3xl space-y-5 px-5 py-12">
    <h1 className="font-headline text-4xl font-bold text-primary">Visitor analytics privacy</h1>
    <p>CupidMatch uses optional visitor analytics to understand which pages people find and use. You can allow or decline analytics in Analytics settings at any time.</p>
    <p>If you allow analytics, CupidMatch records a randomly generated visit identifier, the page or section visited, the date and time, estimated time the page is visible, the browser family, an approximate country and a broad traffic source. The report excludes IP addresses, account identifiers, search terms, form contents and private messages.</p>
    <p>Your browser remembers your choice for up to 180 days. A visit identifier is stored in the browser tab for the current visit. Authorised CupidMatch administrators can view the reports. Records older than 30 days are deleted by a daily job.</p>
    <p>Declining analytics stops new activity collection in your browser. You can still use CupidMatch.</p>
    <Link href="/contact" className="text-primary underline">Contact CupidMatch about your information</Link>
  </article>;
}
