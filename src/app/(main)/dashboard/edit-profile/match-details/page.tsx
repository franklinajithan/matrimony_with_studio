import { MatchDetailsEditor } from "@/components/profile/MatchDetailsEditor";
import { PageFrame, PageHero } from "@/components/dashboard/PageHero";

export default function MatchProfileDetailsPage() {
  return <PageFrame>
    <PageHero eyebrow="My profile" title="Match profile" description="Complete the relationship details CupidMatch compares with other members' Partner Preferences. This makes your preference-match score more accurate." />
    <MatchDetailsEditor />
  </PageFrame>;
}