import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getServerAuthUser } from "@/lib/supabase/server";
import PhotoVerificationPreview from "@/components/profile/PhotoVerificationPreview";

export const metadata: Metadata = {
  title: "Profile Photo Check",
  robots: { index: false, follow: false },
};

export default async function PhotoVerificationPreviewPage() {
  const user = await getServerAuthUser();
  if (!user) redirect("/login");
  return <PhotoVerificationPreview />;
}
