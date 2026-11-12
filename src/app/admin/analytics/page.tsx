import Link from "next/link";
import { z } from "zod";
import { requireAdminPage } from "../guard";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { TrafficOverview, type TrafficSummary } from "./traffic-summary";

const dateTime = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium", timeStyle: "medium", timeZone: "Europe/London",
});
const countries = new Intl.DisplayNames(["en-GB"], { type: "region" });

function duration(seconds: number) {
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
}

export default async function AnalyticsPage({ searchParams }: {
  searchParams: Promise<{ page?: string; visit?: string; day?: string }>;
}) {
  await requireAdminPage();
  const query = await searchParams;
  const number = Number(query.page ?? 0);
  const page = Number.isSafeInteger(number) && number >= 0 && number < 10000 ? number : 0;
  const selected = z.string().uuid().safeParse(query.visit);
  const db = createSupabaseAdminClient();
  const day = z.string().date().safeParse(query.day);
  const [visits, detail, traffic] = await Promise.all([
    db.rpc("visitor_visit_list", { p_offset: page * 30 }),
    selected.success ? db.from("visitor_activity").select("page_id, page, opened_at, active_seconds")
      .eq("visit_id", selected.data).gte("opened_at", new Date(Date.now() - 30 * 86400_000).toISOString())
      .order("opened_at").order("page_id") : null,
    db.rpc("visitor_traffic_summary", day.success ? { p_day: day.data } : {}),
  ]);
  const summary = traffic.data as TrafficSummary | null;
  const dayParam = summary ? `&day=${summary.selected_day}` : "";
  return <div className="space-y-6">
    <header className="rounded-2xl border bg-gradient-to-br from-accent via-card to-card p-5 sm:p-7">
      <h1 className="font-headline text-3xl font-bold sm:text-4xl">Visitor analytics</h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">Traffic covers opted-in visits to public and member pages. Visits count sessions. Reports use London time.</p>
      <Link href="#recent-visits" className="mt-4 inline-flex text-sm font-semibold text-primary underline underline-offset-4">Jump to recent visits</Link>
    </header>
    {traffic.error ? <p role="alert">Traffic totals are temporarily unavailable.</p> :
      summary && <TrafficOverview key={summary.selected_day} summary={summary} />}
    <h2 id="recent-visits" className="scroll-mt-52 text-xl font-semibold">Recent visits across all dates</h2>
    <p className="text-sm text-muted-foreground">Select a visit to see its page journey. Active time estimates time with the page visible.</p>
    {visits.error ? <p role="alert">Visitor analytics is temporarily unavailable.</p> :
      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted"><tr>{["Visit started", "Country", "Browser", "Source", "Landing page", "Pages", "Active time"].map(label =>
            <th key={label} scope="col" className="whitespace-nowrap p-3">{label}</th>)}</tr></thead>
          <tbody>
            {visits.data.slice(0, 30).map((visit: {
              visit_id: string; started_at: string; country: string | null; browser: string;
              source: string; landing_page: string; page_views: number; active_seconds: number;
            }) => <tr key={visit.visit_id} className="border-t">
              <td className="whitespace-nowrap p-3"><Link className="font-semibold text-primary underline"
                href={`/admin/analytics?page=${page}${dayParam}&visit=${visit.visit_id}#journey`}>{dateTime.format(new Date(visit.started_at))}</Link></td>
              <td className="p-3">{visit.country ? countries.of(visit.country) : "Unknown"}</td>
              <td className="p-3">{visit.browser}</td><td className="p-3">{visit.source}</td>
              <td className="p-3">{visit.landing_page}</td><td className="p-3">{visit.page_views}</td>
              <td className="whitespace-nowrap p-3">{duration(visit.active_seconds)}</td>
            </tr>)}
            {!visits.data.length && <tr><td colSpan={7} className="p-4">No visits recorded on this page yet.</td></tr>}
          </tbody>
        </table>
      </div>}
    <nav aria-label="Visit pages" className="flex gap-4 text-primary">
      {page > 0 && <Link href={`/admin/analytics?page=${page - 1}${dayParam}`}>Previous</Link>}
      {(visits.data?.length ?? 0) > 30 && <Link href={`/admin/analytics?page=${page + 1}${dayParam}`}>Next</Link>}
    </nav>
    {selected.success && <section id="journey" className="scroll-mt-52 space-y-3 rounded-xl border bg-card p-4">
      <h2 className="text-xl font-semibold">Page journey</h2>
      {detail?.error ? <p role="alert">This journey could not be loaded.</p> : detail?.data?.length ?
        <ol className="space-y-2">{detail.data.map(view => <li key={view.page_id} className="flex flex-wrap gap-x-4 rounded-lg bg-muted p-3">
          <time dateTime={view.opened_at}>{dateTime.format(new Date(view.opened_at))}</time>
          <strong>{view.page}</strong><span>{duration(view.active_seconds)}</span>
        </li>)}</ol> : <p>No pages were found for this visit.</p>}
    </section>}
  </div>;
}
