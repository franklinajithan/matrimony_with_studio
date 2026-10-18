import { FaqSection } from "@/components/landing/LandingSections";
export const metadata = {
  title: "Frequently asked questions | CupidMatch",
  description:
    "Help with CupidMatch profiles, matching, privacy, membership and verification.",
};
export default function FaqPage() {
  return (
    <div>
      <h1 className="sr-only">
        CupidMatch help and frequently asked questions
      </h1>
      <FaqSection />
    </div>
  );
}
