import HoroscopeStudio from "@/components/horoscope/HoroscopeStudio";
export default function HoroscopePage() {
  return (
    <>
      <p className="mb-4 rounded-xl border bg-card p-4 text-sm text-muted-foreground">
        Horoscope matching is optional guidance. You can find matches and connect with members without adding birth details.
      </p>
      <HoroscopeStudio />
    </>
  );
}
