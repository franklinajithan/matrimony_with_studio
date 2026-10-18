import { InformationPage } from "@/components/shared/InformationPage";
export const metadata = { title: "Terms of service | CupidMatch" };
export default function Page() {
  return (
    <InformationPage
      {...{
        title: "Terms of service",
        intro:
          "The service rules for using CupidMatch and interacting with its community.",
        sections: [
          {
            title: "Eligibility and your account",
            text: "CupidMatch is for adults aged 18 or older seeking personal introductions. Provide accurate account information, keep your sign-in credentials private and use only an account you are authorized to control. Do not impersonate another person or create deceptive profiles.",
          },
          {
            title: "Respectful participation",
            text: "Use the service respectfully. Harassment, threats, scams, sexual exploitation, hateful conduct, spam and requests for money under false pretences are not permitted. Follow the community guidelines and respect another member’s decision to decline, stop a conversation or block contact.",
          },
          {
            title: "Your content and privacy choices",
            text: "Share content that you have permission to use. Review your profile and photo visibility settings before publishing, and obtain permission before sharing another person’s information. You can update or unpublish your profile. A recipient may retain information you deliberately share with them.",
          },
          {
            title: "Introductions and verification",
            text: "You decide whom to contact and whether to continue an introduction. Matching suggestions, compatibility information and horoscope interpretations do not guarantee relationship outcomes. Profile-review approval is not government identity verification, and a badge is not a guarantee of a person’s conduct.",
          },
          {
            title: "Membership features",
            text: "Available features depend on your current membership and any eligible introductory offer. The plan page explains current features and limits. Paid checkout is not active until the payment integration is enabled; the app does not currently collect a new payment or provide an active billing portal through these pages.",
          },
          {
            title: "Moderation and support",
            text: "The team may review reports, remove inappropriate content, unpublish a profile or suspend an account when investigating misuse or protecting the community. Contact support if you need help or want a moderation decision reviewed. Support conversations are recorded in your account.",
          },
          {
            title: "Availability and account requests",
            text: "Features can change or be temporarily unavailable. Planned features are identified separately from available tools. For account closure, privacy requests or a question about these service rules, use the contact and support pages.",
          },
        ],
      }}
    />
  );
}
