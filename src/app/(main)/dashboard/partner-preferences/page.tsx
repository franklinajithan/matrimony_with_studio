import { redirect } from "next/navigation";

/**
 * Backwards-compatible route used by existing links and bookmarks.
 * The canonical Partner Preferences editor lives at /dashboard/preferences.
 */
export default function PartnerPreferencesAliasPage() {
  redirect("/dashboard/preferences");
}
