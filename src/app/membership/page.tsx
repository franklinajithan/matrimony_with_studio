import { BillingActions } from "@/components/account/BillingActions";
import { BillingHistory } from "@/components/account/BillingHistory";
import { CheckoutResult } from "@/components/account/CheckoutResult";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getServerSubscription } from "@/lib/subscriptions/server";
export default async function MembershipPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const db = await createSupabaseServerClient();
  const { data: auth } = await db.auth.getUser();
  if (!auth.user) {
    const query = await searchParams;
    const chosen = query?.plan;
    const next =
      chosen === "premium" || chosen === "premium_plus"
        ? `/membership?plan=${chosen}`
        : "/membership";
    redirect(`/login?next=${encodeURIComponent(next)}`);
  }
  const { plan, trial, subscription } = await getServerSubscription();
  const ends = trial ? new Date(trial.ends_at) : null;
  const remaining = ends
    ? Math.max(0, Math.ceil((ends.getTime() - Date.now()) / 86400000))
    : 0;
  const active = !!trial && !!ends && remaining > 0;
  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-10">
      <div>
        <p className="text-sm font-semibold text-violet-700">
          Your CupidMatch membership
        </p>
        <h1 className="mt-1 text-3xl font-bold text-slate-900">
          Membership & billing
        </h1>
        <p className="mt-2 text-slate-600">
          See your introductory offer and available membership options. Billing
          availability is shown below.
        </p>
      </div>
      <CheckoutResult />
      <section className="rounded-3xl border border-violet-100 bg-gradient-to-br from-violet-50 to-white p-7 shadow-sm">
        <p className="text-sm font-semibold text-violet-700">Current access</p>
        <h2 className="mt-2 text-3xl font-bold text-slate-900">{plan.name}</h2>
        {active && trial ? (
          <>
            <p className="mt-3 text-2xl font-semibold text-violet-700">
              {remaining} {remaining === 1 ? "day" : "days"} remaining
            </p>
            <p className="mt-2 text-slate-600">
              {trial.duration_months}-month introductory offer · Ends{" "}
              {ends?.toLocaleDateString("en-GB", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
            <p className="mt-3 text-sm text-slate-500">
              {trial.promo_code_id
                ? "Special invitation offer applied"
                : "Standard launch offer applied"}
            </p>
          </>
        ) : trial ? (
          <p className="mt-3 text-slate-600">
            Your introductory period ended on{" "}
            {ends?.toLocaleDateString("en-GB")}. Your account remains accessible
            under the available Free plan.
          </p>
        ) : (
          <p className="mt-3 text-slate-600">
            No introductory offer is active. Phone verification is deferred and
            is not required to use your account.
          </p>
        )}
      </section>
      {subscription && (
        <section className="space-y-2 rounded-xl border p-5">
          <h2 className="font-semibold">Subscription status</h2>
          <p>
            {subscription.status.replaceAll("_", " ")}
            {subscription.cancel_at_period_end ? " · Renewal cancelled" : ""}
          </p>
          {subscription.current_period_end && (
            <p>
              Current period ends{" "}
              {new Date(subscription.current_period_end).toLocaleDateString(
                "en-GB",
              )}
            </p>
          )}
          {subscription.status === "past_due" && (
            <p role="alert">
              Your payment needs attention. Update your payment method in the
              billing portal.
            </p>
          )}
        </section>
      )}
      <BillingActions
        hasProvider={!!subscription?.provider_customer_id}
        cancelling={!!subscription?.cancel_at_period_end}
        hasSubscription={
          !!subscription &&
          ["active", "trialing", "past_due"].includes(subscription.status)
        }
      />
      {!!subscription?.provider_customer_id && <BillingHistory />}
      <div className="grid gap-3 sm:grid-cols-2">
        <Link
          className="rounded-xl border bg-white p-4 font-semibold text-violet-700 hover:bg-violet-50"
          href="/launch-pricing"
        >
          Explore membership plans →
        </Link>
        <Link
          className="rounded-xl border bg-white p-4 font-semibold text-violet-700 hover:bg-violet-50"
          href="/dashboard"
        >
          Back to dashboard →
        </Link>
      </div>
      <p className="text-sm text-slate-500">
        Stripe checkout is restricted to authorised test accounts. No live
        payments or payouts are available. Subscriptions recur for the selected
        period until renewal is cancelled.
      </p>
    </main>
  );
}
