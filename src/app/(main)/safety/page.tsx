import { PrivacySection } from "@/components/landing/LandingSections";

export default function SafetyPage() {
  return (
    <div className="bg-[#FBF8F4]">
      <div className="mx-auto max-w-3xl px-4 pb-4 pt-12 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8B6B9A]">Safety</p>
        <h1 className="mt-3 font-serif text-4xl font-semibold text-[#2A1845]">Stay in control while you connect</h1>
        <p className="mt-4 text-base leading-7 text-[#5C4A66]">
          CupidMatch gives you tools to choose what you share, recognise verification status, and
          report or block behaviour that does not feel right. These controls are part of the product —
          we do not claim protection that is not implemented.
        </p>
      </div>
      <PrivacySection />
    </div>
  );
}
