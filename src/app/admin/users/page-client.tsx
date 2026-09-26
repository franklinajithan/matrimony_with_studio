"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { subscribeToProfiles } from "@/lib/supabase/profiles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Users, ShieldCheck, ShieldAlert, UserCog, ArrowUpDown, RefreshCw, LayoutGrid, ExternalLink, ChevronLeft, ChevronRight, ClipboardList } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Member {
  id: string;
  displayName?: string;
  email?: string;
  isAdmin?: boolean;
  isVerified?: boolean;
  isPublished?: boolean;
  createdAt?: unknown;
  photoURL?: string;
}
type Filter = "all" | "verified" | "unverified" | "admins" | "published" | "unpublished";
type Sort = "newest" | "oldest" | "name";
const PAGE_SIZE = 12;

function memberDate(value: unknown): number {
  if (!value) return 0;
  if (typeof value === "object" && value !== null && "toDate" in value && typeof value.toDate === "function")
    return (value.toDate as () => Date)().getTime();
  if (typeof value === "string" || typeof value === "number") return new Date(value).getTime() || 0;
  return 0;
}

export default function UserManagementPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<Sort>("newest");
  const [page, setPage] = useState(1);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = subscribeToProfiles(
      profiles => {
        setMembers(profiles.map(p => ({
          id: p.id, displayName: p.displayName, email: p.email || undefined,
          isAdmin: p.isAdmin, isVerified: p.isVerified, isPublished: p.isPublished,
          createdAt: p.createdAt, photoURL: p.photoURL,
        })));
        setLoading(false);
      },
      () => {
        setLoading(false);
        toast({ title: "Unable to load members", description: "Please refresh and try again.", variant: "destructive" });
      },
    );
    return () => unsubscribe();
  }, [toast]);

  const counts = useMemo(() => ({
    all: members.length,
    verified: members.filter(m => m.isVerified).length,
    unverified: members.filter(m => !m.isVerified).length,
    admins: members.filter(m => m.isAdmin).length,
    published: members.filter(m => m.isPublished).length,
    unpublished: members.filter(m => !m.isPublished).length,
  }), [members]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return members.filter(m => {
      if (term && ![m.id, m.displayName, m.email].some(v => v?.toLowerCase().includes(term))) return false;
      if (filter === "verified") return !!m.isVerified;
      if (filter === "unverified") return !m.isVerified;
      if (filter === "admins") return !!m.isAdmin;
      if (filter === "published") return !!m.isPublished;
      if (filter === "unpublished") return !m.isPublished;
      return true;
    }).sort((a, b) => sort === "name" ? (a.displayName || "").localeCompare(b.displayName || "") :
      sort === "oldest" ? memberDate(a.createdAt) - memberDate(b.createdAt) : memberDate(b.createdAt) - memberDate(a.createdAt));
  }, [members, search, filter, sort]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pages);
  const visible = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const filters: { value: Filter; label: string }[] = [
    { value: "all", label: "All members" }, { value: "verified", label: "Verified" },
    { value: "unverified", label: "Unverified" }, { value: "published", label: "Published" },
    { value: "unpublished", label: "Unpublished" }, { value: "admins", label: "Administrators" },
  ];
  const chooseFilter = (next: Filter) => { setFilter(next); setPage(1); };

  return <div className="space-y-7 pb-12" data-testid="admin-member-management">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-violet-700"><LayoutGrid className="h-4 w-4" /> MEMBER OPERATIONS</div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Member management</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-500">Search, filter and review CupidMatch accounts in one place.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" asChild><Link href="/admin/verifications"><ClipboardList className="mr-2 h-4 w-4" />Verification queue</Link></Button>
        <Button variant="outline" onClick={() => window.location.reload()}><RefreshCw className="mr-2 h-4 w-4" />Refresh</Button>
      </div>
    </div>

    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {([
        { label: "Total members", count: counts.all, icon: Users, target: "all" },
        { label: "Verified", count: counts.verified, icon: ShieldCheck, target: "verified" },
        { label: "Unverified", count: counts.unverified, icon: ShieldAlert, target: "unverified" },
        { label: "Administrators", count: counts.admins, icon: UserCog, target: "admins" },
      ] as const).map(stat => <button key={stat.label} onClick={() => chooseFilter(stat.target)}
        className="rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-violet-300 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-600">
        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-700"><stat.icon className="h-5 w-5" /></div>
        <p className="text-xs font-medium text-slate-500">{stat.label}</p>
        <p className="mt-1 text-3xl font-bold text-slate-900">{loading ? "—" : stat.count.toLocaleString()}</p>
      </button>)}
    </div>

    <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative min-w-0 flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input aria-label="Search members" data-testid="admin-member-search" value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search name, email or member ID" className="h-11 rounded-xl border-slate-200 pl-10" />
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-600"><ArrowUpDown className="h-4 w-4" />Sort
          <select aria-label="Sort members" value={sort} onChange={e => { setSort(e.target.value as Sort); setPage(1); }}
            className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-slate-800">
            <option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="name">Name A–Z</option>
          </select>
        </label>
      </div>
      <div className="flex flex-wrap gap-2" aria-label="Filter members">
        {filters.map(item => <button key={item.value} onClick={() => chooseFilter(item.value)}
          aria-pressed={filter === item.value}
          className={`rounded-full border px-3 py-2 text-xs font-semibold transition sm:text-sm ${filter === item.value ? "border-violet-700 bg-violet-700 text-white" : "border-slate-200 bg-white text-slate-600 hover:border-violet-300"}`}>
          {item.label} <span className="ml-1 opacity-70">{counts[item.value]}</span>
        </button>)}
      </div>
      <p className="text-xs text-slate-500">{loading ? "Loading members…" : `Showing ${filtered.length.toLocaleString()} of ${members.length.toLocaleString()} loaded members`}</p>
    </section>

    {loading ? <div className="rounded-2xl border bg-white p-12 text-center text-slate-500" role="status">Loading member directory…</div> :
      visible.length === 0 ? <div className="rounded-2xl border bg-white p-12 text-center"><Users className="mx-auto mb-3 h-8 w-8 text-slate-400" /><h2 className="font-semibold">No matching members</h2><p className="mt-2 text-sm text-slate-500">Try another search or filter.</p><Button className="mt-4" variant="outline" onClick={() => { setSearch(""); chooseFilter("all"); }}>Clear filters</Button></div> :
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" data-testid="admin-member-grid">
        {visible.map(member => <article key={member.id} className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
          <div className="flex items-start gap-3">
            <Avatar className="h-14 w-14 border border-slate-100"><AvatarImage src={member.photoURL || undefined} alt="" /><AvatarFallback className="bg-violet-100 font-bold text-violet-700">{(member.displayName || member.email || "M").slice(0, 2).toUpperCase()}</AvatarFallback></Avatar>
            <div className="min-w-0 flex-1">
              <h2 className="truncate font-bold text-slate-900" title={member.displayName}>{member.displayName || "Unnamed member"}</h2>
              <p className="mt-1 truncate text-xs text-slate-500" title={member.email}>{member.email || "No email available"}</p>
              <p className="mt-1 truncate font-mono text-[11px] text-slate-400" title={member.id}>ID: {member.id}</p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge variant="outline" className={member.isVerified ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700"}>{member.isVerified ? "Verified" : "Unverified"}</Badge>
            <Badge variant="outline" className={member.isPublished ? "border-sky-200 bg-sky-50 text-sky-700" : "border-slate-200 text-slate-600"}>{member.isPublished ? "Published" : "Unpublished"}</Badge>
            {member.isAdmin && <Badge className="bg-violet-700 text-white">Admin</Badge>}
          </div>
          <div className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-500">Joined: {memberDate(member.createdAt) ? new Date(memberDate(member.createdAt)).toLocaleDateString("en-GB") : "Not available"}</div>
          <div className="mt-4 flex gap-2">
            <Button className="flex-1 rounded-xl" asChild><Link href={`/admin/users/edit/${member.id}`}>Manage member</Link></Button>
            <Button variant="outline" size="icon" className="rounded-xl" asChild><Link href={`/profile/${member.id}`} aria-label={`Open profile for ${member.displayName || member.id}`}><ExternalLink className="h-4 w-4" /></Link></Button>
          </div>
        </article>)}
      </div>}

    {!loading && filtered.length > PAGE_SIZE && <div className="flex flex-wrap items-center justify-center gap-3">
      <Button variant="outline" disabled={currentPage <= 1} onClick={() => setPage(currentPage - 1)}><ChevronLeft className="mr-1 h-4 w-4" />Previous</Button>
      <span className="text-sm text-slate-600">Page {currentPage} of {pages}</span>
      <Button variant="outline" disabled={currentPage >= pages} onClick={() => setPage(currentPage + 1)}>Next<ChevronRight className="ml-1 h-4 w-4" /></Button>
    </div>}
    <p className="text-xs text-slate-500">Account restrictions, role changes and subscription grants require separate secure, audited admin actions. Directory counts reflect currently loaded profiles.</p>
  </div>;
}
