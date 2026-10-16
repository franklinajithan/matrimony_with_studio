import { InformationPage } from "@/components/shared/InformationPage";
export const metadata = { title: "Community guidelines | CupidMatch" };
export default function Page() {
  return (
    <InformationPage
      {...{
        title: "Community guidelines",
        intro: "Help make introductions respectful, authentic and safe.",
        sections: [
          {
            title: "Be yourself",
            text: "Use accurate information and photos you have permission to share. Do not impersonate someone else or mislead people about your identity, age or intentions.",
          },
          {
            title: "Respect boundaries",
            text: "A match or reply does not create an obligation to continue. Accept a decline or block, and do not create another account to bypass someone’s boundary.",
          },
          {
            title: "Keep contact respectful",
            text: "Do not harass, threaten, discriminate against or exploit another person. Do not send unwanted sexual content, spam or financial solicitations.",
          },
          {
            title: "Protect private information",
            text: "Do not publish another person’s contact details, documents or private conversations without permission. Do not ask for passwords, one-time codes or banking credentials.",
          },
          {
            title: "Report concerns",
            text: "Use Report on a member profile to ask the team to investigate. Block a member to stop further interactions. Do not use reports to retaliate against someone for declining an introduction.",
          },
          {
            title: "Get help",
            text: "Contact support for help with your account or an interaction. If there is immediate danger, contact local emergency services. CupidMatch support is not an emergency response service.",
          },
        ],
      }}
    />
  );
}
