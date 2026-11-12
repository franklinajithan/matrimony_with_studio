import Link from "next/link";
import { Activity, ArrowDownRight, ChevronDown, Eye, House } from "lucide-react";

type Counts = { visits: number; views: number; home_entries: number; home_views: number };
export type TrafficSummary = {
  today: string;
  selected_day: string;
  daily: (Counts & { day: string })[];
  hourly: (Counts & { hour: string })[];
  pages: { page: string; views: number; entries: number; active_seconds: number }[];
  sources: { source: string; visits: number }[];
};

const dayFormat = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeZone: "UTC" });
const hourFormat = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZoneName: "short", timeZone: "Europe/London",
});
const numbers = new Intl.NumberFormat("en-GB");
const metrics = [
  ["visits", "Visits started", Activity],
  ["views", "Page views", Eye],
  ["home_entries", "Homepage entries", ArrowDownRight],
  ["home_views", "Homepage views", House],
] as const;

function formatDay(day: string) {
  return dayFormat.format(new Date(day));
}

function DataTable({ label, columns, rows }: {
  label: string;
  columns: readonly string[];
  rows: { key: string; cells: React.ReactNode[]; selected?: boolean }[];
}) {
  return <div className="overflow-x-auto rounded-xl border">
    <table aria-label={label} className="w-full text-left text-sm">
      <thead className="bg-muted"><tr>{columns.map(column =>
        <th key={column} scope="col" className="whitespace-nowrap p-3">{column}</th>)}</tr></thead>
      <tbody>{rows.map(row =>
        <tr key={row.key} className={row.selected ? "border-t bg-muted/50" : "border-t"}>
          <th scope="row" className="whitespace-nowrap p-3 font-medium">{row.cells[0]}</th>
          {row.cells.slice(1).map((cell, index) =>
            <td key={columns[index + 1]} className="whitespace-nowrap p-3 tabular-nums">{cell}</td>)}
        </tr>)}
        {rows.length === 0 && <tr><td colSpan={columns.length} className="p-3">No activity recorded.</td></tr>}
      </tbody>
    </table>
  </div>;
}

function Breakdown({ label, children }: { label: string; children: React.ReactNode }) {
  return <details className="group rounded-lg border bg-background">
    <summary className="flex cursor-pointer list-none items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary [&::-webkit-details-marker]:hidden">
      {label}
      <ChevronDown aria-hidden="true" className="h-4 w-4 group-open:rotate-180" />
    </summary>
    <div className="p-2 pt-0">{children}</div>
  </details>;
}

function TrafficChart({ points }: {
  points: { label: string; tick?: string; counts: Counts }[];
}) {
  const maximum = Math.max(0, ...points.map(({ counts }) => Math.max(counts.views, counts.visits)));
  if (!maximum) return <p className="grid h-48 place-items-center rounded-lg bg-muted/50 p-4 text-center text-sm text-muted-foreground">No traffic recorded for this period.</p>;

  const step = Math.ceil(maximum / 4);
  const ceiling = step * 4;
  return <div aria-hidden="true" className="space-y-3">
    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-medium text-muted-foreground">
      <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-primary" />Page views</span>
      <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-primary/50" />Visits started</span>
    </div>
    <div className="grid grid-cols-[max-content_minmax(0,1fr)] gap-x-2">
      <div className="flex h-40 flex-col justify-between text-right text-[10px] leading-none tabular-nums text-muted-foreground">
        {[4, 3, 2, 1, 0].map(level => <span key={level}>{numbers.format(level * step)}</span>)}
      </div>
      <div className="min-w-0">
        <div className="relative flex h-40 border-b border-border">
          <div className="pointer-events-none absolute inset-0 flex flex-col justify-between">
            {[4, 3, 2, 1].map(level => <span key={level} className="border-t border-border/80" />)}
            <span />
          </div>
          {points.map(({ label, counts }) => <div key={label}
            title={`${label} · ${numbers.format(counts.views)} page views · ${numbers.format(counts.visits)} visits started`}
            className="relative flex min-w-0 flex-1 items-end justify-center gap-px hover:bg-accent">
            <span className="w-2/5 max-w-3 rounded-t-sm bg-primary" style={{ height: `${counts.views / ceiling * 100}%` }} />
            <span className="w-2/5 max-w-3 rounded-t-sm bg-primary/50" style={{ height: `${counts.visits / ceiling * 100}%` }} />
          </div>)}
        </div>
        <div className="mt-2 flex h-4 text-[10px] tabular-nums text-muted-foreground">
          {points.map(({ label, tick }) => <span key={label} className="relative min-w-0 flex-1">
            {tick && <span className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap">{tick}</span>}
          </span>)}
        </div>
      </div>
    </div>
  </div>;
}

function Ranking({ items, metric }: { items: { label: string; count: number }[]; metric: string }) {
  const ranked = items.filter(item => item.count > 0).sort((a, b) => b.count - a.count).slice(0, 5);
  const maximum = ranked[0]?.count;
  if (!maximum) return <p className="rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground">No activity recorded.</p>;

  return <ol aria-label={`Top five by ${metric}`} className="space-y-3">
    {ranked.map(({ label, count }) => <li key={label}>
      <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
        <span className="min-w-0 break-all">{label}</span>
        <span className="shrink-0 font-semibold tabular-nums">{numbers.format(count)}</span>
      </div>
      <div aria-hidden="true" className="h-1.5 rounded-full bg-accent">
        <div className="h-full rounded-full bg-primary" style={{ width: `${count / maximum * 100}%` }} />
      </div>
    </li>)}
  </ol>;
}

export function TrafficOverview({ summary }: { summary: TrafficSummary }) {
  const selected = summary.daily.find(day => day.day === summary.selected_day);
  const dayLabel = formatDay(summary.selected_day);
  const columns = metrics.map(([, label]) => label);
  const countCells = (counts: Counts) => metrics.map(([key]) => numbers.format(counts[key]));

  return <section aria-label="Traffic overview" className="space-y-6">
    <div className="flex flex-wrap items-end justify-between gap-4 rounded-2xl border bg-card p-4 sm:p-5">
      <div>
        <h2 className="text-xl font-semibold">Traffic on {dayLabel}</h2>
        <p className="mt-1 text-sm text-muted-foreground">Homepage entries are visits that start on the homepage. Homepage views count every recorded view of that page.</p>
      </div>
      <form action="/admin/analytics" className="flex flex-wrap items-end gap-2">
        <label className="grid gap-1 text-sm font-medium">
          Reporting date
          <input type="date" name="day" defaultValue={summary.selected_day}
            min={summary.daily.at(-1)?.day} max={summary.today} required
            className="rounded-md border bg-background px-3 py-2" />
        </label>
        <button type="submit" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">View date</button>
      </form>
    </div>

    {selected && <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {metrics.map(([key, label, Icon]) => <div key={key} className="rounded-2xl border bg-card p-4 shadow-sm sm:p-5">
        <dt className="flex flex-wrap items-center gap-2 text-sm font-medium text-muted-foreground">
          <span className="rounded-lg bg-accent p-2 text-primary"><Icon aria-hidden="true" className="h-4 w-4" /></span>
          {label}
        </dt>
        <dd className="mt-3 text-3xl font-bold tabular-nums">{numbers.format(selected[key])}</dd>
      </div>)}
    </dl>}

    <div className="grid items-start gap-4 xl:grid-cols-2">
      <section className="min-w-0 space-y-4 rounded-2xl border bg-card p-4 shadow-sm sm:p-5">
        <div>
          <h3 className="text-lg font-semibold">Traffic by hour</h3>
          <p className="text-sm text-muted-foreground">{dayLabel} · London time</p>
        </div>
        <TrafficChart points={summary.hourly.map((counts, index) => {
          const label = hourFormat.format(new Date(counts.hour));
          return { label, tick: index > 0 && index % 6 === 0 ? label.slice(0, 5) : undefined, counts };
        })} />
        <Breakdown label="Hourly breakdown">
          <DataTable label={`Hourly traffic on ${dayLabel}`} columns={["Hour (London)", ...columns]}
            rows={summary.hourly.map(hour => ({
              key: hour.hour,
              cells: [hourFormat.format(new Date(hour.hour)), ...countCells(hour)],
            }))} />
        </Breakdown>
      </section>

      <section className="min-w-0 space-y-4 rounded-2xl border bg-card p-4 shadow-sm sm:p-5">
        <div>
          <h3 className="text-lg font-semibold">Daily traffic</h3>
          <p className="text-sm text-muted-foreground">Last 30 days · Select a date in the breakdown</p>
        </div>
        <TrafficChart points={[...summary.daily].reverse().map((counts, index) => ({
          label: formatDay(counts.day),
          tick: index > 0 && index % 7 === 0 ? counts.day.slice(-2) : undefined,
          counts,
        }))} />
        <Breakdown label="Daily breakdown">
          <DataTable label="Daily traffic" columns={["Date (London)", ...columns]}
            rows={summary.daily.map(day => ({
              key: day.day,
              selected: day.day === summary.selected_day,
              cells: [<Link key={day.day} href={`/admin/analytics?day=${day.day}`}
                aria-current={day.day === summary.selected_day ? "date" : undefined}
                className="text-primary underline">{formatDay(day.day)}</Link>, ...countCells(day)],
            }))} />
        </Breakdown>
      </section>
    </div>

    <div className="grid items-start gap-4 lg:grid-cols-2">
      <section className="min-w-0 space-y-4 rounded-2xl border bg-card p-4 shadow-sm sm:p-5">
        <div>
          <h3 className="text-lg font-semibold">Top pages</h3>
          <p className="text-sm text-muted-foreground">Page views · {dayLabel}</p>
        </div>
        <Ranking items={summary.pages.map(page => ({ label: page.page, count: page.views }))} metric="page views" />
        <Breakdown label="Page breakdown">
          <DataTable label="Pages for the selected date" columns={["Page", "Views", "Entries", "Active time"]}
            rows={summary.pages.map(page => ({
              key: page.page,
              cells: [page.page, numbers.format(page.views), numbers.format(page.entries),
                `${Math.floor(page.active_seconds / 60)}m ${page.active_seconds % 60}s`],
            }))} />
        </Breakdown>
      </section>
      <section className="min-w-0 space-y-4 rounded-2xl border bg-card p-4 shadow-sm sm:p-5">
        <div>
          <h3 className="text-lg font-semibold">Traffic sources</h3>
          <p className="text-sm text-muted-foreground">Visits started · {dayLabel}</p>
        </div>
        <Ranking items={summary.sources.map(source => ({ label: source.source, count: source.visits }))} metric="visits started" />
        <Breakdown label="Source breakdown">
          <DataTable label="Sources for the selected date" columns={["Source", "Visits started"]}
            rows={summary.sources.map(source => ({
              key: source.source,
              cells: [source.source, numbers.format(source.visits)],
            }))} />
        </Breakdown>
      </section>
    </div>
  </section>;
}
