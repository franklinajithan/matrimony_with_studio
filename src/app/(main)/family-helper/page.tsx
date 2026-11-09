import { redirect } from "next/navigation";
import { FamilyHelperAccess } from "@/components/dashboard/FamilyHelper";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function FamilyHelperPage() {
  const db = await createSupabaseServerClient();
  const { data } = await db.auth.getUser();
  if (!data.user) redirect("/login?next=/family-helper");
  return <FamilyHelperAccess />;
}
