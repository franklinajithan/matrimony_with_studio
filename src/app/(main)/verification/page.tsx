import { redirect } from "next/navigation";
import { getServerAuthUser } from "@/lib/supabase/server";
import VerificationRequestClient from "./request-client";

export const dynamic = "force-dynamic";

export default async function VerificationPage() {
  const user = await getServerAuthUser();
  if (!user) redirect("/login?next=/verification");
  return <VerificationRequestClient />;
}
