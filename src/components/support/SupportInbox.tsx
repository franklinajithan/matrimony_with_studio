"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  useAdminResource,
  adminMutation,
} from "@/components/admin/use-admin-resource";
import { ResourceState, Pager } from "@/components/admin/workspace-ui";
type Ticket = {
  id: string;
  subject: string;
  category: string;
  status: string;
  updated_at: string;
  member_name: string | null;
  message_count: number;
};
export function SupportInbox({ staff = false }: { staff?: boolean }) {
  const router = useRouter();
  const prefix = staff ? "/api/admin/support" : "/api/support",
    path = staff ? "/admin/support" : "/support";
  const [status, setStatus] = useState("all"),
    [search, setSearch] = useState(""),
    [query, setQuery] = useState(""),
    [page, setPage] = useState(1);
  const [category, setCategory] = useState("account"),
    [subject, setSubject] = useState(""),
    [body, setBody] = useState(""),
    [requestId, setRequestId] = useState(() => crypto.randomUUID()),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  const { data, error, loading, refresh } = useAdminResource<{
    tickets: Ticket[];
    total: number;
  }>(
    `${prefix}?status=${status}&search=${encodeURIComponent(query)}&page=${page}`,
  );
  async function create(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const payload = await adminMutation("/api/support", {
        category,
        subject,
        body,
        requestId,
      });
      router.push(`/support/${payload.id}`);
    } catch (e) {
      setMessage(
        e instanceof Error ? e.message : "Unable to create your request.",
      );
      setBusy(false);
    }
  }
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-violet-700">
            CupidMatch support
          </p>
          <h1 className="mt-2 text-3xl font-bold">
            {staff ? "Member support inbox" : "How can we help?"}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            {staff
              ? "Manage member requests, record decisions and reply securely inside CupidMatch."
              : "Send a private request to our team, track replies and keep the conversation in one place."}
          </p>
        </div>
        <Button variant="outline" onClick={() => void refresh()}>
          Refresh
        </Button>
      </div>
      {!staff && (
        <form
          onSubmit={create}
          className="space-y-4 rounded-2xl border bg-white p-5"
        >
          <h2 className="text-lg font-bold">New support request</h2>
          <p className="text-xs leading-5 text-slate-500">
            Do not include passwords, one-time codes or bank details. You can
            create up to 3 new requests per day. For an existing issue, reply to
            its conversation below.
          </p>
          <fieldset disabled={busy} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm">
                Category
                <select
                  value={category}
                  onChange={(e) => {
                    setCategory(e.target.value);
                    setRequestId(crypto.randomUUID());
                  }}
                  className="mt-2 h-10 w-full rounded-md border bg-white px-3"
                >
                  {[
                    "account",
                    "profile",
                    "billing",
                    "safety",
                    "feedback",
                    "other",
                  ].map((c) => (
                    <option key={c} value={c}>
                      {c[0].toUpperCase() + c.slice(1)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm">
                Subject
                <Input
                  required
                  minLength={5}
                  maxLength={150}
                  value={subject}
                  onChange={(e) => {
                    setSubject(e.target.value);
                    setRequestId(crypto.randomUUID());
                  }}
                  className="mt-2"
                />
              </label>
            </div>
            <label className="block text-sm">
              How can we help?
              <Textarea
                required
                minLength={10}
                maxLength={4000}
                rows={5}
                value={body}
                onChange={(e) => {
                  setBody(e.target.value);
                  setRequestId(crypto.randomUUID());
                }}
                className="mt-2"
              />
            </label>
            <Button>{busy ? "Submitting…" : "Create support request"}</Button>
          </fieldset>
          {message && (
            <p role="alert" className="text-sm text-red-700">
              {message}
            </p>
          )}
        </form>
      )}
      <section className="space-y-4">
        <h2 className="text-xl font-bold">
          {staff ? "Requests" : "Your requests"}
        </h2>
        <div className="flex flex-wrap gap-3">
          <label className="text-sm">
            Status
            <select
              className="ml-2 h-10 rounded-md border bg-white px-3"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
            >
              {[
                "all",
                "open",
                "in_progress",
                "waiting_on_member",
                "resolved",
              ].map((s) => (
                <option key={s} value={s}>
                  {s.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          </label>
          <form
            className="flex flex-1 gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              setQuery(search.trim());
              setPage(1);
            }}
          >
            <Input
              aria-label="Search support requests"
              value={search}
              maxLength={100}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={
                staff ? "Subject, member name or email" : "Search subject"
              }
            />
            <Button variant="outline">Search</Button>
          </form>
        </div>
        <ResourceState
          loading={loading}
          error={error}
          empty={!data?.tickets.length}
        />
        {!loading && !error && (
          <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {data?.tickets.map((t) => (
                <Link
                  href={`${path}/${t.id}`}
                  key={t.id}
                  className="space-y-3 rounded-2xl border bg-white p-5 transition hover:border-violet-300"
                >
                  <p className="text-xs font-semibold capitalize text-violet-700">
                    {t.status.replaceAll("_", " ")} · {t.category}
                  </p>
                  <h3 className="break-words font-bold">{t.subject}</h3>
                  {staff && (
                    <p className="text-sm text-slate-500">
                      {t.member_name || "Member"}
                    </p>
                  )}
                  <p className="text-xs text-slate-500">
                    {t.message_count} messages · Updated{" "}
                    {new Date(t.updated_at).toLocaleString("en-GB")}
                  </p>
                  <p className="text-sm font-semibold text-violet-700">
                    Open conversation →
                  </p>
                </Link>
              ))}
            </div>
            <Pager
              page={page}
              total={data?.total ?? 0}
              size={20}
              onPage={setPage}
            />
          </>
        )}
      </section>
    </div>
  );
}
