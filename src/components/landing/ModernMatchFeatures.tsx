"use client";

import Link from "next/link";
import { useI18n } from "@/components/i18n/I18nProvider";
import { ArrowRight, BrainCircuit, HeartHandshake, LockKeyhole, SlidersHorizontal, Sparkles, UserRound, Stars, MessageCircle } from "lucide-react";

const features = [
  { title: "Thoughtful partner discovery", description: "Explore introductions guided by the details and preferences that matter to you.", Icon: BrainCircuit, label: "DISCOVER", href: "/discover" },
  { title: "Your story, beautifully told", description: "Build a detailed biodata profile to share your personality, background and intentions.", Icon: UserRound, label: "PROFILE", href: "/signup" },
  { title: "Preferences that feel personal", description: "Focus on the age, location and qualities important in a future partner.", Icon: SlidersHorizontal, label: "PREFERENCES", href: "/signup" },
  { title: "Compatibility with context", description: "Look beyond photographs to explore shared values, life goals and compatibility.", Icon: HeartHandshake, label: "COMPATIBILITY", href: "/signup" },
  { title: "Horoscope profiles", description: "Add your horoscope details as part of a richer personal profile. Availability of comparisons may vary.", Icon: Stars, label: "HOROSCOPE", href: "/signup" },
  { title: "Connect with intention", description: "Express interest and take the next step at a pace that feels comfortable.", Icon: MessageCircle, label: "CONNECTION", href: "/signup" },
] as const;

const localized = {
  en: { eyebrow: "More than a matrimonial profile", title: "A meaningful connection starts with", accent: "understanding.", description: "From your personal story to the qualities you value in a partner, CupidMatch brings the important details together in one thoughtful experience.", explore: "Explore CupidMatch", privacy: "Your journey, your choices.", privacyBody: "Create your profile and explore the experience. Review your account and visibility settings as you go.", join: "Create your profile" },
  ta: { eyebrow: "ஒரு சுயவிவரத்தை விட அதிகம்", title: "அர்த்தமுள்ள உறவு தொடங்குவது", accent: "புரிதலிலிருந்து.", description: "உங்கள் வாழ்க்கைக் கதை முதல் துணையிடம் எதிர்பார்க்கும் பண்புகள் வரை, முக்கியமான விவரங்களை CupidMatch ஒன்றாகக் கொண்டுவருகிறது.", explore: "CupidMatch பற்றி அறிய", privacy: "உங்கள் பயணம், உங்கள் தேர்வு.", privacyBody: "உங்கள் சுயவிவரத்தை உருவாக்கி, கணக்கு மற்றும் தனியுரிமை அமைப்புகளைப் பார்வையிடுங்கள்.", join: "சுயவிவரம் உருவாக்குங்கள்" },
  si: { eyebrow: "සාමාන්‍ය පැතිකඩකට වඩා වැඩි යමක්", title: "අර්ථවත් සබඳතාවක් ආරම්භ වන්නේ", accent: "අවබෝධයෙන්.", description: "ඔබේ ජීවිත කතාවේ සිට සහකරුවෙකුගෙන් බලාපොරොත්තු වන ගුණාංග දක්වා වැදගත් තොරතුරු CupidMatch එකට ගෙන එයි.", explore: "CupidMatch ගවේෂණය කරන්න", privacy: "ඔබේ ගමන, ඔබේ තේරීම.", privacyBody: "ඔබේ පැතිකඩ සාදා ගිණුමේ පෞද්ගලිකත්ව සැකසුම් පරීක්ෂා කරන්න.", join: "පැතිකඩ සාදන්න" },
  fr: { eyebrow: "Bien plus qu’un profil", title: "Une belle rencontre commence par", accent: "la compréhension.", description: "De votre histoire personnelle aux qualités que vous recherchez, CupidMatch réunit l’essentiel.", explore: "Découvrir CupidMatch", privacy: "Votre parcours, vos choix.", privacyBody: "Créez votre profil et consultez vos paramètres de confidentialité.", join: "Créer mon profil" },
  nl: { eyebrow: "Meer dan een profiel", title: "Een betekenisvolle band begint met", accent: "begrip.", description: "Van je persoonlijke verhaal tot wat je zoekt in een partner: CupidMatch brengt het samen.", explore: "Ontdek CupidMatch", privacy: "Jouw reis, jouw keuzes.", privacyBody: "Maak je profiel en bekijk je privacyinstellingen.", join: "Maak je profiel" },
  de: { eyebrow: "Mehr als nur ein Profil", title: "Eine bedeutungsvolle Verbindung beginnt mit", accent: "Verständnis.", description: "Von deiner Geschichte bis zu deinen Wünschen an einen Partner: CupidMatch bringt alles Wichtige zusammen.", explore: "CupidMatch entdecken", privacy: "Dein Weg, deine Entscheidung.", privacyBody: "Erstelle dein Profil und prüfe deine Privatsphäre-Einstellungen.", join: "Profil erstellen" },
} as const;

export function ModernMatchFeatures() {
  const { language } = useI18n();
  const copy = localized[language];
  return (
    <section id="features" aria-labelledby="features-heading" className="relative overflow-hidden bg-[#FAF8FC] px-5 py-16 sm:py-20 lg:py-28">
      <div aria-hidden="true" className="pointer-events-none absolute -right-40 top-0 h-96 w-96 rounded-full bg-purple-200/30 blur-3xl" />
      <div className="relative mx-auto max-w-7xl">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/40 bg-white px-4 py-2 text-xs font-bold uppercase tracking-[.15em] text-[#51217B]"><Sparkles className="h-4 w-4" /> {copy.eyebrow}</span>
          <h2 id="features-heading" className="mt-6 font-serif text-4xl font-semibold leading-tight text-[#29133F] sm:text-5xl lg:text-6xl">{copy.title} <span className="text-[#7542A1]">{copy.accent}</span></h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-[#665872] sm:text-lg">From your personal story to the qualities you value in a partner, CupidMatch brings the important details together in one thoughtful experience.</p>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {features.map(({ title, description, Icon, label, href }) => (
            <article key={title} className="group flex min-w-0 flex-col rounded-[1.75rem] border border-[#EDE4F3] bg-white p-6 shadow-[0_12px_35px_rgba(41,19,63,.05)] transition-shadow hover:shadow-[0_18px_48px_rgba(41,19,63,.12)] sm:p-8">
              <div className="flex items-center justify-between">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F3EBF9] text-[#51217B]"><Icon aria-hidden="true" className="h-7 w-7" /></span>
                <span className="text-[10px] font-bold tracking-[.18em] text-[#9D7C40]">{label}</span>
              </div>
              <h3 className="mt-7 font-serif text-2xl font-semibold text-[#29133F]">{title}</h3>
              <p className="mt-3 flex-1 text-sm leading-7 text-[#665872]">{description}</p>
              <Link href={href} className="mt-7 inline-flex w-fit items-center gap-2 rounded-lg py-2 text-sm font-semibold text-[#51217B] underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#51217B]">{copy.explore} <ArrowRight aria-hidden="true" className="h-4 w-4 transition-transform group-hover:translate-x-1" /></Link>
            </article>
          ))}
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-6 rounded-[1.75rem] bg-[#29133F] px-6 py-8 text-center text-white sm:px-10 md:flex-row md:text-left">
          <div className="flex items-start gap-4"><LockKeyhole aria-hidden="true" className="mt-1 h-7 w-7 shrink-0 text-[#D4AF37]" /><div><h3 className="font-serif text-2xl font-semibold">{copy.privacy}</h3><p className="mt-2 max-w-xl text-sm leading-6 text-white/80">{copy.privacyBody}</p></div></div>
          <Link href="/signup" className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-full bg-[#D4AF37] px-7 py-3 text-sm font-bold text-[#29133F] transition hover:bg-[#E8C45A] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">{copy.join} <ArrowRight aria-hidden="true" className="h-4 w-4" /></Link>
        </div>
      </div>
    </section>
  );
}
