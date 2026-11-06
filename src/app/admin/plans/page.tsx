import { requireAdminPage } from "@/app/admin/guard";
import { AdminPricingEditor } from "@/components/subscriptions/AdminPricingEditor";
import { CountryPricingEditor } from "@/components/subscriptions/CountryPricingEditor";
export const dynamic = "force-dynamic";
export default async function AdminPlansPage(){
 await requireAdminPage();
 return <main className="space-y-6">
  <div><p className="text-xs font-semibold uppercase tracking-widest text-primary">Membership operations</p>
   <h1 className="mt-2 text-3xl font-bold">Plans, pricing & features</h1>
   <p className="mt-2 max-w-3xl text-sm text-muted-foreground">Manage UK base pricing and each supported country market in one place. These values power the member pricing pages and onboarding. Price and benefit edits are audited, with protection against conflicting admin changes.</p>
  </div>
  <AdminPricingEditor />
  <CountryPricingEditor />
 </main>;
}
