import Link from "next/link";
import type { ReactNode } from "react";
import { requireAdminPage } from "../../guard";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { reviewProfileReport } from "./actions";

const path = "/admin/analytics/growth";
const number = new Intl.NumberFormat("en-GB");
const date = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeZone: "Europe/London" });
const card = "min-w-0 space-y-3 rounded-2xl border bg-card p-4 shadow-sm sm:p-5";
const button = "inline-flex rounded-lg border px-3 py-2 text-sm font-semibold text-primary hover:bg-accent focus-visible:outline focus-visible:outline-2";

type Count = number | null;
type Campaign = { channel: string; name: string; visits: number; registrations: number; publications: number };
type GrowthReport = {
  today: string;
  tracking_started: string;
  comparison: Record<string, Count>;
  funnel: { homepage: number; signup: number; account: number; profile: number; request: number };
  campaigns: Campaign[];
  engagement: { returning: number; sent: number; accepted: number; first_replies: number };
  billing: {
    plus_upgrades: number; premium_upgrades: number; cancellations: number;
    mrr: { currency: string; subscriptions: number; minor_units: number }[];
  };
};

const funnelSteps = [
  ["homepage", "Homepage entries"], ["signup", "Signup submitted"], ["account", "Account created"],
  ["profile", "Profile published"], ["request", "Connection request sent"],
] as const;
const metrics = [
  ["visits", "Visits started"], ["page_views", "Page views"],
  ["registrations", "New member records"], ["published", "Profiles first published"],
] as const;

function display(value: Count) {
  return value === null ? "—" : number.format(value);
}

function Cards({ items }: { items: [string, string | number][] }) {
  return <dl className="grid grid-cols-2 gap-3">
    {items.map(([label, value]) => <div key={label} className="rounded-xl border bg-background p-3">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-2xl font-bold tabular-nums">{typeof value === "number" ? number.format(value) : value}</dd>
    </div>)}
  </dl>;
}

function Section({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return <section className={card}>
    <h2 className="text-xl font-semibold">{title}</h2>
    <p className="text-sm text-muted-foreground">{description}</p>
    {children}
  </section>;
}

function change(current: Count, previous: Count) {
  if (current === null || previous === null) return "—";
  if (previous === 0) return current === 0 ? "0%" : "New";
  return new Intl.NumberFormat("en-GB", { style: "percent", signDisplay: "exceptZero", maximumFractionDigits: 1 })
    .format((current - previous) / previous);
}

function Money({ currency, minorUnits }: { currency: string; minorUnits: number }) {
  if (!/^[A-Z]{3}$/.test(currency)) return <>{number.format(minorUnits)} minor units</>;
  const formatter = new Intl.NumberFormat("en-GB", { style: "currency", currency, currencyDisplay: "code" });
  return <>{formatter.format(minorUnits / 10 ** (formatter.resolvedOptions().maximumFractionDigits ?? 2))}</>;
}

export default async function GrowthPage({ searchParams }: {
  searchParams: Promise<{ days?: string; review?: string }>;
}) {
  await requireAdminPage();
  const query = await searchParams;
  const days = query.days === "30" ? 30 : 7;
  const db = createSupabaseAdminClient();
  const [result, verifications, feedback, reports] = await Promise.all([
    db.rpc("admin_growth_report", { p_days: days }),
    db.from("verification_requests").select("id, member_id, created_at", { count: "exact" })
      .eq("status", "pending").order("created_at").order("id").limit(5),
    db.from("feedback_threads").select("id, subject, updated_at", { count: "exact" })
      .eq("awaiting_support", true).order("updated_at").order("id").limit(5),
    db.from("reports").select("id, reported_id, reason, description, created_at", { count: "exact" })
      .in("status", ["pending", "reviewing"]).order("created_at").order("id").limit(20),
  ]);
  const report = result.data as GrowthReport | null;
  const notice = query.review === "saved" ? "Report review saved."
    : query.review === "closed" ? "This report was already closed."
    : query.review === "error" ? "The report review could not be saved." : null;

  return <div className="space-y-5">
    <header className="space-y-4 rounded-2xl border bg-gradient-to-br from-accent via-card to-card p-5 sm:p-7">
      <Link href="/admin/analytics" className="text-sm font-semibold text-primary underline underline-offset-4">Visitor analytics</Link>
      <h1 className="font-headline text-3xl font-bold sm:text-4xl">Growth and operations</h1>
      <p className="text-sm text-muted-foreground">Completed days in London time. The action queue and recurring revenue estimate reflect the current state.</p>
      <div className="flex flex-wrap items-center gap-2">
        <nav aria-label="Growth reporting period" className="flex flex-wrap gap-2">
          {[7, 30].map(period => <Link key={period} href={`${path}?days=${period}`}
            aria-current={period === days ? "page" : undefined}
            className={period === days ? "rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground" : button}>
            Last {period} days
          </Link>)}
        </nav>
        <a href="#action-queue" className="px-2 text-sm font-semibold text-primary underline">Action queue</a>
      </div>
    </header>

    {result.error || !report ? <p role="alert" className={card}>Growth metrics are temporarily unavailable.</p> : <>
      <div className="grid items-start gap-4 xl:grid-cols-2">
        <Section title="Registration funnel" description={`Opted-in homepage sessions tracked since ${date.format(new Date(report.tracking_started))}. Steps follow the same visit through email signup, publication and a request.`}>
          <ol className="space-y-3">
            {funnelSteps.map(([key, label], index) => {
              const count = report.funnel[key];
              const previous = index ? report.funnel[funnelSteps[index - 1][0]] : 0;
              return <li key={key}>
                <div className="flex flex-wrap items-baseline justify-between gap-x-3 text-sm">
                  <span>{label}</span><strong className="tabular-nums">{number.format(count)}</strong>
                </div>
                <div className="mt-1 h-2 rounded-full bg-accent" aria-hidden="true">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${report.funnel.homepage ? count / report.funnel.homepage * 100 : 0}%` }} />
                </div>
                {previous > 0 && <p className="mt-1 text-xs text-muted-foreground">{number.format(previous - count)} dropped off from previous step</p>}
              </li>;
            })}
          </ol>
        </Section>
        <Section title="Date comparison" description={`Last ${days} completed days versus the ${days} before them. A dash means the report lacks data for that period.`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted"><tr>{["Metric", "Current", "Previous", "Change"].map(label => <th key={label} scope="col" className="p-2">{label}</th>)}</tr></thead>
              <tbody>{metrics.map(([key, label]) => {
                const current = report.comparison[key];
                const previous = report.comparison[`previous_${key}`];
                return <tr key={key} className="border-b">
                  <th scope="row" className="p-2 font-medium">{label}</th>
                  <td className="p-2 tabular-nums">{display(current)}</td>
                  <td className="p-2 tabular-nums">{display(previous)}</td>
                  <td className="p-2 tabular-nums">{change(current, previous)}</td>
                </tr>;
              })}</tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground">Publication counts begin on {date.format(new Date(report.tracking_started))}. The first period can be partial.</p>
        </Section>
      </div>

      <Section title="Campaign performance" description="Opted-in visits and same-visit conversions from links tagged with utm_source and utm_campaign.">
        {report.campaigns.length ? <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted"><tr>{["Channel", "Campaign", "Visits", "Accounts", "Profiles published"].map(label => <th key={label} scope="col" className="whitespace-nowrap p-2">{label}</th>)}</tr></thead>
            <tbody>{report.campaigns.map(campaign => <tr key={`${campaign.channel}/${campaign.name}`} className="border-b">
              <td className="p-2 capitalize">{campaign.channel}</td><th scope="row" className="p-2 font-medium">{campaign.name}</th>
              <td className="p-2 tabular-nums">{number.format(campaign.visits)}</td>
              <td className="p-2 tabular-nums">{number.format(campaign.registrations)}</td>
              <td className="p-2 tabular-nums">{number.format(campaign.publications)}</td>
            </tr>)}</tbody>
          </table>
        </div> : <p className="rounded-lg bg-muted p-3 text-sm">No tagged campaign visits in this period.</p>}
        <p className="break-all text-xs text-muted-foreground">Example tag <code>?utm_source=instagram&amp;utm_campaign=uk-launch</code></p>
      </Section>

      <div className="grid items-start gap-4 lg:grid-cols-2">
        <Section title="Member engagement" description="Returning engaged members sent a request, joined a connection or sent a message on at least two days in this period.">
          <Cards items={[["Returning engaged members", report.engagement.returning], ["New requests sent", report.engagement.sent],
            ["Connections accepted", report.engagement.accepted], ["Conversations with a first reply", report.engagement.first_replies]]} />
        </Section>
        <Section title="Membership performance" description="First verified Stripe payments by plan, cancellation requests or immediate cancellations recorded since tracking began, and estimated monthly recurring revenue by currency.">
          <Cards items={[["First Plus payments", report.billing.plus_upgrades], ["First Premium payments", report.billing.premium_upgrades], ["Cancellations", report.billing.cancellations]]} />
          {report.billing.mrr.length ? <ul className="divide-y rounded-lg border px-3">
            {report.billing.mrr.map(entry => <li key={entry.currency} className="flex flex-wrap justify-between gap-2 py-2 text-sm">
              <span>{number.format(entry.subscriptions)} active paid subscriptions</span>
              <strong><Money currency={entry.currency} minorUnits={entry.minor_units} /> / month</strong>
            </li>)}
          </ul> : <p className="text-sm text-muted-foreground">No active verified paid subscriptions with a recorded price.</p>}
          <Link href="/admin/subscriptions" className="inline-flex text-sm font-semibold text-primary underline">Open subscriptions</Link>
        </Section>
      </div>
    </>}

    <section id="action-queue" className="scroll-mt-56 space-y-3">
      <h2 className="text-2xl font-semibold">Admin action queue</h2>
      {notice && <p role={query.review === "error" ? "alert" : "status"} className="rounded-lg border bg-card p-3 text-sm">{notice}</p>}
      <div className="grid items-start gap-4 lg:grid-cols-2">
        <Section title={`Pending verifications · ${display(verifications.count)}`} description="Oldest submitted verification requests first.">
          {verifications.error ? <p role="alert">Verification requests could not load.</p>
            : verifications.data.length ? <ul className="divide-y text-sm">{verifications.data.map(item =>
              <li key={item.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <time dateTime={item.created_at}>{date.format(new Date(item.created_at))}</time>
                <Link className={button} href={`/admin/users/edit/${item.member_id}`}>Review member</Link>
              </li>)}</ul> : <p className="text-sm text-muted-foreground">No pending requests.</p>}
          <Link className={button} href="/admin/verifications">Open verification queue</Link>
        </Section>
        <Section title={`Feedback awaiting reply · ${display(feedback.count)}`} description="Oldest threads awaiting a support response first.">
          {feedback.error ? <p role="alert">Feedback could not load.</p>
            : feedback.data.length ? <ul className="divide-y text-sm">{feedback.data.map(item =>
              <li key={item.id} className="py-2"><Link className="break-words font-medium text-primary underline" href={`/admin/feedback?thread=${item.id}`}>{item.subject}</Link></li>)}</ul>
            : <p className="text-sm text-muted-foreground">No feedback awaiting a reply.</p>}
          <Link className={button} href="/admin/feedback">Open feedback inbox</Link>
        </Section>
      </div>

      <Section title={`Flagged profiles · ${display(reports.count)}`} description="Up to 20 open member reports, oldest first. Review the profile before closing a report.">
        {reports.error ? <p role="alert">Profile reports could not load.</p>
          : reports.data.length ? <ul className="divide-y">{reports.data.map(item => <li key={item.id} className="space-y-2 py-3">
            <p className="text-sm"><span className="font-semibold capitalize">{item.reason.replaceAll("_", " ")}</span> · <time dateTime={item.created_at}>{date.format(new Date(item.created_at))}</time></p>
            {item.description && <p className="whitespace-pre-wrap break-words text-sm text-muted-foreground">{item.description}</p>}
            <div className="flex flex-wrap items-center gap-2">
              <Link className={button} href={`/admin/users/edit/${item.reported_id}`}>Review profile</Link>
              <form action={reviewProfileReport} className="flex flex-wrap gap-2">
                <input type="hidden" name="id" value={item.id} /><input type="hidden" name="days" value={days} />
                <button className={button} type="submit" name="decision" value="resolved">Mark resolved</button>
                <button className={button} type="submit" name="decision" value="dismissed">Dismiss report</button>
              </form>
            </div>
          </li>)}</ul> : <p className="text-sm text-muted-foreground">No open profile reports.</p>}
      </Section>
    </section>
  </div>;
}
