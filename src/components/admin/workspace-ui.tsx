import { Button } from "@/components/ui/button";
export function WorkspaceHeading({
  title,
  description,
  refresh,
}: {
  title: string;
  description: string;
  refresh: () => void;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-violet-700">
          CupidMatch workspace
        </p>
        <h1 className="mt-2 text-3xl font-bold text-slate-950">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
          {description}
        </p>
      </div>
      <Button variant="outline" onClick={refresh}>
        Refresh
      </Button>
    </div>
  );
}
export function ResourceState({
  loading,
  error,
  empty,
}: {
  loading: boolean;
  error: string;
  empty: boolean;
}) {
  return loading ? (
    <p role="status" className="rounded-2xl border bg-white p-8">
      Loading records…
    </p>
  ) : error ? (
    <p
      role="alert"
      className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-800"
    >
      {error}
    </p>
  ) : empty ? (
    <p className="rounded-2xl border bg-white p-8 text-slate-500">
      No matching records.
    </p>
  ) : null;
}
export function Pager({
  page,
  total,
  size = 24,
  onPage,
}: {
  page: number;
  total: number;
  size?: number;
  onPage: (page: number) => void;
}) {
  const pages = Math.max(1, Math.ceil(total / size));
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500">
      <span>
        {total.toLocaleString()} records · Page {page} of {pages}
      </span>
      <div className="flex gap-2">
        <Button
          variant="outline"
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          disabled={page >= pages}
          onClick={() => onPage(page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
