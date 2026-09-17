import { redirect } from "next/navigation";

/**
 * Legacy dashboard URL kept for existing bookmarks and old notifications.
 * Interests now has one canonical route so there is a single implementation
 * of receive/accept/decline/withdraw behaviour.
 */
export default function LegacyDashboardInterestsPage() {
  redirect("/interests");
}
