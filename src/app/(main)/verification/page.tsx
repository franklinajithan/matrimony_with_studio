import { redirect } from "next/navigation";
import { getServerAuthUser } from "@/lib/supabase/server";
import { IdentityVerification } from "@/components/account/IdentityVerification";
import VerificationRequestClient from "./request-client";

export const dynamic = "force-dynamic";

export default async function VerificationPage() {
  const user = await getServerAuthUser();
  if (!user) redirect("/login?next=/verification");
  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4">
      <IdentityVerification />
      <VerificationRequestClient />
    </div>
  );
}
