import { redirect } from "next/navigation";
import { getServerAuthUser } from "@/lib/supabase/server";

export default async function MyProfilePage() {
  const user = await getServerAuthUser();
  if (!user) {
    redirect("/login?next=/profile");
  }
  redirect(`/profile/${user.id}`);
}
