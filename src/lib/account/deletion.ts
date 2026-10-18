import "server-only";
import type { serviceClient } from "@/lib/supabase/service";
import { getStripe, isProviderTestMember } from "@/lib/providers/stripe";
type Job = { id: string; member_id: string; lease: string };
export async function eraseApprovedAccount(db: ReturnType<typeof serviceClient>, job: Job) {
  async function step(stage: string) {
    const result = await db.rpc("account_deletion_step", { p_id: job.id, p_lease: job.lease, p_stage: stage });
    if (result.error) throw result.error; return result.data;
  }
  const inventory = await step("inventory") as { customers: string[]; identities: string[] };
  if (inventory.customers.length || inventory.identities.length) {
    if (!isProviderTestMember(job.member_id)) throw new Error("Live provider cleanup requires a separately reviewed procedure");
    const stripe = getStripe();
    for (const id of inventory.customers) {
      const customer = await stripe.customers.retrieve(id);
      if (customer.deleted) continue;
      if (customer.livemode) throw new Error("Live customer cleanup is disabled");
      await stripe.customers.del(id, {}, { idempotencyKey: `account-delete:${job.id}:${id}` });
    }
    for (const id of inventory.identities) {
      const session = await stripe.identity.verificationSessions.retrieve(id);
      if (session.livemode || (session.client_reference_id !== job.member_id && session.metadata?.member_id !== job.member_id)) throw new Error("Identity owner mismatch");
      if (session.redaction?.status === "redacted") continue;
      if (session.redaction?.status !== "processing") await stripe.identity.verificationSessions.redact(id);
      throw new Error("Waiting for provider identity redaction");
    }
  }
  const banned = await db.auth.admin.updateUserById(job.member_id, { ban_duration: "876000h" });
  if (banned.error && banned.error.status !== 404) throw banned.error;
  for (let batch = 0; batch < 20; batch++) {
    const files = await step("files") as { bucket: string; path: string }[];
    if (!files.length) break;
    const buckets = new Map<string, string[]>();
    for (const file of files) {
      if (!file.bucket || !file.path || /[\u0000-\u001f]/.test(file.bucket + file.path)) throw new Error("Invalid storage reference");
      buckets.set(file.bucket, [...(buckets.get(file.bucket) || []), file.path]);
    }
    for (const [bucket, paths] of buckets) { const removed = await db.storage.from(bucket).remove(paths); if (removed.error) throw removed.error; }
    if (batch === 19) throw new Error("More storage cleanup required; retry job");
  }
  await step("records");
  const deleted = await db.auth.admin.deleteUser(job.member_id);
  if (deleted.error && deleted.error.status !== 404) throw deleted.error;
  await step("complete");
}
