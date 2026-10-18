import { InformationPage } from "@/components/shared/InformationPage";
export const metadata = { title: "Accessibility | CupidMatch" };
export default function Page() {
  return (
    <InformationPage
      {...{
        title: "Accessibility",
        intro:
          "We want CupidMatch to be usable across devices and input methods.",
        sections: [
          {
            title: "Navigation and forms",
            text: "The site provides labelled form fields, keyboard-operable controls and responsive layouts. You can use your browser’s zoom and device text settings. Form errors and loading states are shown in the interface.",
          },
          {
            title: "Images and motion",
            text: "Profile images have text alternatives where their meaning is needed. Decorative images may use empty alternatives. Some parts of the website include motion; your browser and device may offer reduced-motion preferences.",
          },
          {
            title: "Report an accessibility problem",
            text: "Use the support centre to describe the page, what you were trying to do, the issue you encountered, and the device or assistive technology you use. Avoid including passwords or verification codes. If sign-in is the problem, use the contact page’s account-recovery options.",
          },
          {
            title: "Ongoing improvements",
            text: "Accessibility is an ongoing part of development. This page does not claim an independent accessibility certification or guarantee that every assistive-technology combination has been tested.",
          },
        ],
      }}
    />
  );
}
