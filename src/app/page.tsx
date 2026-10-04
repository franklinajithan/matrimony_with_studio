import { redirect } from "next/navigation";
import { HeritageLandingPage } from "@/components/landing/HeritageLandingPage";
import { getServerAuthUser } from "@/lib/supabase/server";

export default async function HomePage() {
  const user = await getServerAuthUser();
  if (user) redirect("/dashboard");

  return <HeritageLandingPage />;
}
