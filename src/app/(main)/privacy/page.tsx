import { InformationPage } from "@/components/shared/InformationPage";
export const metadata = { title: "Privacy and data use | CupidMatch" };
export default function Page() {
  return (
    <InformationPage
      {...{
        title: "Privacy and data use",
        intro:
          "Understand the information you share and the controls available in your account.",
        sections: [
          {
            title: "Information in your account",
            text: "CupidMatch stores your sign-in email and the profile information you provide, such as your name, age, photos, location, interests, cultural preferences and relationship intentions. The service also stores connections, messages, reports, blocks, support requests, membership records and administrative activity needed to operate these features.",
          },
          {
            title: "What other people can see",
            text: "Publishing makes your member profile available in discovery. Photo visibility can be set to members, accepted connections or hidden. Your email and private support conversations are not part of the discovery profile. If you create a profile or biodata share link, information included in that link may be viewed by its recipients until the link expires or is revoked.",
          },
          {
            title: "Messages, support and safety review",
            text: "Messages are available to the participants in their conversation. Authorized staff can access member records and support or moderation information within their assigned permissions. Reporting does not reveal the reporter’s identity to the reported member. Blocking prevents future interactions and removes existing connections; historical messages are retained.",
          },
          {
            title: "Profile activity and browser preferences",
            text: "Recent profile visitors are available to eligible members. Private browsing with an active Premium+ membership prevents future visits from being recorded in visitor lists. Earlier visits are unchanged. Sign-in cookies and browser storage keep your session and preferences, including language. Clearing that storage can sign you out or reset preferences.",
          },
          {
            title: "Services used to operate CupidMatch",
            text: "The application is hosted on Vercel and uses Supabase for accounts, database records and uploaded media. Optional Stripe test billing and Identity verification use Stripe when configured. Identity documents and selfies are collected by Stripe Identity; CupidMatch stores the session reference and status. Optional email notifications use the configured email provider and your preferences. Calls use WebRTC and a configured TURN service; the app does not record call media. If you choose a social sign-in provider, that provider handles its sign-in step. If you use optional AI writing assistance, the text you submit is processed by the configured AI service to provide the requested result.",
          },
          {
            title: "Keeping and correcting information",
            text: "You can edit your profile and preferences or unpublish your profile in Privacy and safety. Visitor lists cover the last 90 days. Other account, conversation, support and moderation records do not currently have a single automatic deletion period in the app. Account settings lets you export account information, pause matching, or request deletion. A request pauses your account immediately; erasure requires authorised processing and applicable retention review. The app does not claim your data is erased when a request is submitted.",
          },
          {
            title: "Your choices",
            text: "Share only information you are comfortable providing, and avoid putting identity documents, passwords, verification codes or financial details in your biography or messages. Use the support centre for questions or requests about your information. You may also contact the relevant data protection authority about a privacy concern.",
          },
        ],
      }}
    />
  );
}
