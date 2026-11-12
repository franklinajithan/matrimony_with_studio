import Link from "next/link";
import { ArrowUpRight, Eye, Globe2, MousePointer2, Search } from "lucide-react";
import type { ReactNode } from "react";
import { requireAdminPage } from "../../guard";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const route = "/admin/analytics/acquisition";
const number = new Intl.NumberFormat("en-GB");
const date = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
const card = "min-w-0 rounded-2xl border bg-card p-4 shadow-sm sm:p-5";
const link = "inline-flex min-h-10 items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary";
const channels = [["all", "All sources"], ["search", "Search engines"], ["referrals", "Referring sites"]] as const;

type Report = {
  start: string;
  end: string;
  totals: { visits: number; search: number; referrals: number; unattributed: number };
  selected_visits: number;
  daily: { day: string; visits: number; search: number; referrals: number }[];
  sources: { name: string; channel: string; visits: number }[];
  landing: { page: string; visits: number; continued: number }[];
  pages: { page: string; views: number; visits: number }[];
  next_pages: { landing: string; next: string; visits: number }[];
};

function formatDay(day: string) {
  return date.format(new Date(day));
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return <section className={card + " space-y-4"}>
    <h2 className="text-lg font-semibold">{title}</h2>
    {children}
  </section>;
}

function Breakdown({ labels, rows, empty }: { labels: string[]; rows: ReactNode[][]; empty: string }) {
  if (!rows.length) return <p className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">{empty}</p>;
  return <div className="overflow-x-auto">
    <table className="w-full text-left text-sm">
      <thead className="bg-muted"><tr>{labels.map(label =>
        <th key={label} scope="col" className="whitespace-nowrap px-3 py-2 font-medium">{label}</th>)}</tr></thead>
      <tbody>{rows.map((row, index) => <tr key={index} className="border-b last:border-0">
        <th scope="row" className="break-all px-3 py-2 font-medium">{row[0]}</th>
        {row.slice(1).map((value, index) => <td key={labels[index + 1]} className="px-3 py-2 tabular-nums">{value}</td>)}
      </tr>)}</tbody>
    </table>
  </div>;
}

function DailyVisits({ daily, total }: { daily: Report["daily"]; total: number }) {
  if (!total) return <p className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">No recorded visits for these filters.</p>;
  const ceiling = Math.max(...daily.map(day => day.visits), 1);
  return <>
    <div aria-hidden="true" className="space-y-2">
      <div className="flex justify-between text-xs text-muted-foreground"><span>Visits per day</span><span>Peak {number.format(ceiling)}</span></div>
      <div className="flex h-40 items-end gap-1 rounded-lg bg-muted/60 px-2 sm:gap-2">
        {daily.map(day => <div key={day.day} className="group flex h-full min-w-0 flex-1 items-end justify-center hover:bg-accent"
          title={`${formatDay(day.day)} · ${number.format(day.visits)} visits`}>
          <span className="w-full max-w-10 rounded-t bg-primary group-hover:bg-primary/75" style={{ height: `${day.visits / ceiling * 100}%` }} />
        </div>)}
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{formatDay(daily[0].day)}</span>
        {daily.length > 1 && <span>{formatDay(daily[daily.length - 1].day)}</span>}
      </div>
    </div>
    <details className="rounded-lg border px-3 py-2">
      <summary className="cursor-pointer text-sm font-semibold text-primary">Daily counts</summary>
      <div className="mt-2"><Breakdown labels={["Date", "Visits", "Search", "Referrals"]} empty="No dates available."
        rows={daily.map(day => [formatDay(day.day), number.format(day.visits), number.format(day.search), number.format(day.referrals)])} /></div>
    </details>
  </>;
}

export default async function AcquisitionPage({ searchParams }: { searchParams: Promise<{ days?: string; channel?: string }> }) {
  await requireAdminPage();
  const query = await searchParams;
  const days = query.days === "1" ? 1 : query.days === "28" ? 28 : 7;
  const channel = query.channel === "search" || query.channel === "referrals" ? query.channel : "all";
  const { data, error } = await createSupabaseAdminClient().rpc("visitor_acquisition_report", { p_days: days, p_channel: channel });
  const report = data as Report | null;

  return <div className="space-y-5">
    <header className="space-y-4 rounded-2xl border bg-gradient-to-br from-accent via-card to-card p-5 sm:p-7">
      <nav aria-label="Analytics views" className="flex flex-wrap gap-2">
        <Link href="/admin/analytics" className={link + " hover:bg-accent"}>Overview</Link>
        <Link href={route} aria-current="page" className={link + " bg-primary text-primary-foreground"}>Search &amp; referrals</Link>
        <Link href="/admin/analytics/growth" className={link + " hover:bg-accent"}>Growth and operations</Link>
      </nav>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-headline text-3xl font-bold sm:text-4xl">Search &amp; referrals</h1>
          <p className="mt-2 text-sm text-muted-foreground">See where opted-in visitors came from and which CupidMatch pages they opened.</p>
        </div>
        <nav aria-label="Reporting period" className="flex flex-wrap gap-2">
          {[[1, "Today"], [7, "7 days"], [28, "28 days"]].map(([period, label]) =>
            <Link key={period} href={`${route}?days=${period}&channel=${channel}`} aria-current={period === days ? "true" : undefined}
              className={link + (period === days ? " bg-primary text-primary-foreground" : " border hover:bg-accent")}>{label}</Link>)}
        </nav>
      </div>
    </header>
    {error || !report ? <p className={card} role="alert">Acquisition statistics are temporarily unavailable.</p> : <>
      <p className="text-sm text-muted-foreground">{formatDay(report.start)}{report.start !== report.end ? ` to ${formatDay(report.end)}` : ""} · London time · Includes today</p>
      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {([
          ["Tracked visits", report.totals.visits, Eye], ["Search visits", report.totals.search, Search],
          ["Referral visits", report.totals.referrals, Globe2], ["Direct or unattributed", report.totals.unattributed, MousePointer2],
        ] as const).map(([label, value, Icon]) => <div key={label} className={card}>
          <dt className="flex items-center gap-2 text-sm text-muted-foreground"><Icon aria-hidden="true" className="h-4 w-4 shrink-0 text-primary" />{label}</dt>
          <dd className="mt-2 text-3xl font-bold tabular-nums">{number.format(value)}</dd>
        </div>)}
      </dl>

      <nav aria-label="Traffic channel" className="flex flex-wrap gap-2 border-b pb-2">
        {channels.map(([key, label]) =>
          <Link key={key} href={`${route}?days=${days}&channel=${key}`} aria-current={channel === key ? "true" : undefined}
            className={link + (channel === key ? " bg-accent text-primary" : " hover:bg-accent")}>{label}</Link>)}
      </nav>

      <div className="grid items-start gap-4 xl:grid-cols-2">
        <Panel title="Traffic trend"><DailyVisits daily={report.daily} total={report.selected_visits} /></Panel>
        <Panel title="Top traffic sources">
          {report.sources.length ? <ol className="space-y-3">
            {report.sources.map(source => <li key={`${source.channel}/${source.name}`}>
              <div className="mb-1 flex justify-between gap-3 text-sm">
                <span className="min-w-0 break-all">{source.name}</span><strong className="tabular-nums">{number.format(source.visits)}</strong>
              </div>
              <div aria-hidden="true" className="h-1.5 rounded-full bg-accent">
                <div className="h-full rounded-full bg-primary" style={{ width: `${source.visits / report.selected_visits * 100}%` }} />
              </div>
            </li>)}
          </ol> : <p className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">No sources recorded for these filters.</p>}
          <p className="text-xs text-muted-foreground">Older visits may show a broad source. Browsers can hide the referring site.</p>
        </Panel>
      </div>
      <div className="grid items-start gap-4 xl:grid-cols-2">
        <Panel title="Landing pages">
          <Breakdown labels={["First page", "Visits", "Continued"]} empty="No landing pages recorded."
            rows={report.landing.map(page => [page.page, number.format(page.visits), number.format(page.continued)])} />
        </Panel>
        <Panel title="Most viewed CupidMatch pages">
          <Breakdown labels={["Page", "Views", "Visits"]} empty="No page views recorded."
            rows={report.pages.map(page => [page.page, number.format(page.views), number.format(page.visits)])} />
        </Panel>
      </div>
      <Panel title="Common first-to-next page journeys">
        <Breakdown labels={["Landing page", "Next recorded page", "Visits"]} empty="No visits opened a second tracked page in this period."
          rows={report.next_pages.map(journey => [journey.landing, journey.next, number.format(journey.visits)])} />
        <Link href="/admin/analytics#recent-visits" className="text-sm font-semibold text-primary underline underline-offset-4">Open individual visit journeys</Link>
      </Panel>
    </>}
    <Panel title="Google search queries">
      <p className="text-sm text-muted-foreground">Use Google Search Console to see the queries that showed CupidMatch in search results, with clicks, impressions, and average position.</p>
      <a href="https://search.google.com/search-console" target="_blank" rel="noreferrer" className={link + " border text-primary hover:bg-accent"}>
        Open Google Search Console <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
      </a>
    </Panel>
  </div>;
}
