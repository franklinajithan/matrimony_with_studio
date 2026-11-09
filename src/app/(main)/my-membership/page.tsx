import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MONTHLY_ALLOWANCES } from "@/lib/subscriptions/catalogue-data";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Allowance = { used: number; limit: number | null; remaining: number | null };
type MembershipSnapshot = {
  plan: string;
  resetsAt: string;
  allowances: Record<keyof typeof MONTHLY_ALLOWANCES, Allowance>;
  advancedFilters: boolean;
  profileHighlighting: boolean;
  searchPlacement: number;
};

export default async function MyMembershipPage() {
  const db = await createSupabaseServerClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) redirect("/login?next=%2Fmy-membership");

  const { data, error } = await db.rpc("my_membership_allowances");
  const membership = data as MembershipSnapshot | null;

  return (
    <main className="mx-auto max-w-3xl space-y-5 px-4 py-8">
      <h1 className="text-3xl font-bold text-primary">My Membership</h1>
      {error || !membership ? <p role="alert">Membership allowances are temporarily unavailable.</p> : (
        <Card>
          <CardHeader>
            <CardTitle className="capitalize">{membership.plan} membership</CardTitle>
            <p className="text-sm text-muted-foreground">
              Allowances reset on {new Intl.DateTimeFormat("en-GB", { dateStyle: "long", timeZone: "UTC" }).format(new Date(membership.resetsAt))} at midnight UTC.
            </p>
          </CardHeader>
          <CardContent className="space-y-5">
            {(Object.keys(MONTHLY_ALLOWANCES) as Array<keyof typeof MONTHLY_ALLOWANCES>).map(key => {
              const { used, limit, remaining } = membership.allowances[key];
              return <section key={key} className="space-y-1">
                <h2 className="font-semibold">{MONTHLY_ALLOWANCES[key].label}</h2>
                <p className="text-sm">{limit === null ? `${used} used · Unlimited` : `${used} of ${limit} used · ${remaining} remaining`}</p>
                {limit !== null && limit > 0 && <progress aria-label={MONTHLY_ALLOWANCES[key].label} className="w-full accent-primary" max={limit} value={Math.min(used, limit)} />}
                {remaining === 0 && <p className="text-sm text-muted-foreground">Your current allowance is exhausted. Compare plans for more access.</p>}
              </section>;
            })}
            <p className="text-sm text-muted-foreground">A profile counts once per calendar month. Changing plans keeps the usage already recorded for that month.</p>
            <ul className="space-y-1 text-sm">
              <li>Advanced search · {membership.advancedFilters ? "Enabled" : "Disabled"}</li>
              <li>Profile highlighting · {membership.profileHighlighting ? "Enabled" : "Disabled"}</li>
              <li>Search placement · {membership.searchPlacement ? `Top ${membership.searchPlacement} preference` : "Normal"}</li>
            </ul>
          </CardContent>
        </Card>
      )}
      <Button asChild><Link href="/pricing">Compare and manage plans</Link></Button>
    </main>
  );
}
