import Link from "next/link";

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
  ["visits", "Visits started"],
  ["views", "Page views"],
  ["home_entries", "Homepage entries"],
  ["home_views", "Homepage views"],
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

export function TrafficOverview({ summary }: { summary: TrafficSummary }) {
  const selected = summary.daily.find(day => day.day === summary.selected_day);
  const dayLabel = formatDay(summary.selected_day);
  const columns = metrics.map(([, label]) => label);
  const countCells = (counts: Counts) => metrics.map(([key]) => numbers.format(counts[key]));

  return <section aria-label="Traffic overview" className="space-y-6">
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="text-xl font-semibold">Traffic on {dayLabel}</h2>
        <p className="mt-1 text-sm text-muted-foreground">Homepage entries start on /. Homepage views include arrivals from other pages.</p>
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
      {metrics.map(([key, label]) => <div key={key} className="rounded-xl border bg-card p-4">
        <dt className="text-sm text-muted-foreground">{label}</dt>
        <dd className="mt-1 text-2xl font-semibold tabular-nums">{numbers.format(selected[key])}</dd>
      </div>)}
    </dl>}

    <section className="space-y-2">
      <h3 className="text-lg font-semibold">Traffic by hour</h3>
      <DataTable label={`Hourly traffic on ${dayLabel}`} columns={["Hour (London)", ...columns]}
        rows={summary.hourly.map(hour => ({
          key: hour.hour,
          cells: [hourFormat.format(new Date(hour.hour)), ...countCells(hour)],
        }))} />
    </section>

    <div className="grid gap-6 lg:grid-cols-2">
      <section className="min-w-0 space-y-2">
        <h3 className="text-lg font-semibold">Pages on {dayLabel}</h3>
        <DataTable label="Pages for the selected date" columns={["Page", "Views", "Entries", "Active time"]}
          rows={summary.pages.map(page => ({
            key: page.page,
            cells: [page.page, numbers.format(page.views), numbers.format(page.entries),
              `${Math.floor(page.active_seconds / 60)}m ${page.active_seconds % 60}s`],
          }))} />
      </section>
      <section className="min-w-0 space-y-2">
        <h3 className="text-lg font-semibold">Traffic sources on {dayLabel}</h3>
        <DataTable label="Sources for the selected date" columns={["Source", "Visits started"]}
          rows={summary.sources.map(source => ({
            key: source.source,
            cells: [source.source, numbers.format(source.visits)],
          }))} />
      </section>
    </div>

    <section className="space-y-2">
      <h3 className="text-lg font-semibold">Daily traffic over the last 30 days</h3>
      <DataTable label="Daily traffic" columns={["Date (London)", ...columns]}
        rows={summary.daily.map(day => ({
          key: day.day,
          selected: day.day === summary.selected_day,
          cells: [<Link key={day.day} href={`/admin/analytics?day=${day.day}`}
            aria-current={day.day === summary.selected_day ? "date" : undefined}
            className="text-primary underline">{formatDay(day.day)}</Link>, ...countCells(day)],
        }))} />
    </section>
  </section>;
}
