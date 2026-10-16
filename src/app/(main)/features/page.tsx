import Link from "next/link";
import { Button } from "@/components/ui/button";
const features = [
  [
    "Profiles and preferences",
    "Share your background, interests, cultural preferences and future plans. Update your profile as your priorities change.",
    "/signup",
  ],
  [
    "Discover members",
    "Browse published profiles and filter by the preferences that matter to you. Some advanced discovery features require an active Premium membership.",
    "/discover",
  ],
  [
    "Mutual connections and messages",
    "Send an interest and start a conversation after a mutual connection. Blocking and suspension prevent further interaction.",
    "/connections",
  ],
  [
    "Biodata Studio",
    "Create and customize a biodata document, preview it and share or export it. AI writing assistance depends on service availability.",
    "/biodata",
  ],
  [
    "Photo privacy and safety",
    "Choose member, connection-only or hidden photo visibility. Report inappropriate behaviour and manage your blocked members.",
    "/dashboard/privacy",
  ],
  [
    "Profile visitors",
    "Members with an active Premium plan or introductory trial can see recent profile visits. Premium+ private browsing keeps future visits out of visitor lists.",
    "/dashboard/profile-views",
  ],
  [
    "Member support",
    "Create a private support request, follow replies and continue the conversation in your account.",
    "/support",
  ],
  [
    "Membership and introductory offers",
    "Compare plan features and eligible introductory offers. Paid checkout remains unavailable until the payment integration is activated.",
    "/pricing",
  ],
  [
    "Profile review",
    "Submit a profile-review request for the team to review. Profile review is separate from government identity-document verification.",
    "/verification",
  ],
];
export const metadata = {
  title: "Features | CupidMatch",
  description:
    "Profiles, discovery, connections, messages, biodata, privacy and member support.",
};
export default function Features() {
  return (
    <div className="space-y-8 py-10">
      <header className="rounded-3xl border border-violet-100 bg-violet-50 p-8 sm:p-12">
        <p className="text-xs font-bold uppercase tracking-widest text-violet-700">
          Your CupidMatch tools
        </p>
        <h1 className="mt-3 text-4xl font-bold">
          Meet people with more clarity
        </h1>
        <p className="mt-4 max-w-2xl leading-7 text-slate-600">
          Build your profile, explore introductions and choose what to share at
          each step.
        </p>
      </header>
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {features.map(([title, text, href]) => (
          <article
            key={title}
            className="flex flex-col rounded-2xl border bg-white p-6"
          >
            <h2 className="text-xl font-bold">{title}</h2>
            <p className="my-4 text-sm leading-7 text-slate-500">{text}</p>
            <Button asChild variant="outline" className="mt-auto">
              <Link href={href}>Explore</Link>
            </Button>
          </article>
        ))}
      </section>
    </div>
  );
}
