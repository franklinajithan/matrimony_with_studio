"use client";

import Link from "next/link";
import { useI18n } from "@/components/i18n/I18nProvider";
import { ArrowRight, BrainCircuit, HeartHandshake, LockKeyhole, SlidersHorizontal, Sparkles, UserRound, Star, MessageCircle } from "lucide-react";

const features = [
  { title: "Thoughtful partner discovery", description: "Explore introductions guided by the details and preferences that matter to you.", Icon: BrainCircuit, label: "DISCOVER", href: "/discover" },
  { title: "Your story, beautifully told", description: "Build a detailed biodata profile to share your personality, background and intentions.", Icon: UserRound, label: "PROFILE", href: "/signup" },
  { title: "Preferences that feel personal", description: "Focus on the age, location and qualities important in a future partner.", Icon: SlidersHorizontal, label: "PREFERENCES", href: "/signup" },
  { title: "Compatibility with context", description: "Look beyond photographs to explore shared values, life goals and compatibility.", Icon: HeartHandshake, label: "COMPATIBILITY", href: "/signup" },
  { title: "Horoscope profiles", description: "Add your horoscope details as part of a richer personal profile. Availability of comparisons may vary.", Icon: Star, label: "HOROSCOPE", href: "/signup" },
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


const featureTranslations = {
  en: [
    ["Thoughtful partner discovery","Explore introductions guided by the details and preferences that matter to you."],
    ["Your story, beautifully told","Build a detailed biodata profile to share your personality, background and intentions."],
    ["Preferences that feel personal","Focus on the age, location and qualities important in a future partner."],
    ["Compatibility with context","Look beyond photographs to explore shared values, life goals and compatibility."],
    ["Horoscope profiles","Add your horoscope details as part of a richer personal profile. Availability of comparisons may vary."],
    ["Connect with intention","Express interest and take the next step at a pace that feels comfortable."]
  ],
  ta: [
    ["உங்களுக்கேற்ற துணையைத் தேடுங்கள்","உங்களுக்கு முக்கியமான விவரங்கள் மற்றும் விருப்பங்களின் அடிப்படையில் அறிமுகங்களைப் பாருங்கள்."],
    ["உங்கள் வாழ்க்கைக் கதை","உங்கள் பின்னணி, ஆளுமை மற்றும் நோக்கங்களைப் பகிர விரிவான சுயவிவரத்தை உருவாக்குங்கள்."],
    ["தனிப்பட்ட விருப்பங்கள்","வயது, இருப்பிடம் மற்றும் துணையிடம் எதிர்பார்க்கும் பண்புகளைத் தேர்ந்தெடுங்கள்."],
    ["பொருத்தத்தைப் புரிந்துகொள்ளுங்கள்","புகைப்படங்களைத் தாண்டி மதிப்புகள் மற்றும் வாழ்க்கை இலக்குகளை அறிந்துகொள்ளுங்கள்."],
    ["ஜாதக விவரங்கள்","உங்கள் சுயவிவரத்தில் ஜாதக விவரங்களைச் சேர்க்கலாம். ஒப்பீட்டு வசதிகள் மாறுபடலாம்."],
    ["அர்த்தமுள்ள தொடர்பு","விருப்பத்தைத் தெரிவித்து உங்களுக்கு ஏற்ற வேகத்தில் அடுத்த படியை எடுங்கள்."]
  ],
  si: [
    ["ඔබට ගැළපෙන සහකරුවෙකු සොයන්න","ඔබට වැදගත් තොරතුරු සහ කැමැත්ත අනුව හඳුන්වාදීම් ගවේෂණය කරන්න."],
    ["ඔබේ ජීවිත කතාව","ඔබේ පසුබිම සහ අරමුණු බෙදා ගැනීමට විස්තරාත්මක පැතිකඩක් සාදන්න."],
    ["පෞද්ගලික කැමැත්ත","වයස, ස්ථානය සහ ඔබට වැදගත් ගුණාංග තෝරාගන්න."],
    ["ගැළපීම තේරුම් ගන්න","ඡායාරූපවලින් ඔබ්බට ගොස් පොදු වටිනාකම් සහ අරමුණු සොයා බලන්න."],
    ["කේන්දර විස්තර","ඔබේ පැතිකඩට කේන්දර තොරතුරු එක් කරන්න. සැසඳීමේ පහසුකම් වෙනස් විය හැක."],
    ["අර්ථවත් සම්බන්ධතා","කැමැත්ත පළ කර ඔබට පහසු වේගයෙන් ඉදිරියට යන්න."]
  ],
  fr: [
    ["Découvrir des partenaires","Explorez des profils selon vos préférences et vos priorités."],
    ["Racontez votre histoire","Créez un profil détaillé pour partager votre personnalité et vos intentions."],
    ["Des préférences personnelles","Choisissez l’âge, le lieu et les qualités qui comptent pour vous."],
    ["Comprendre la compatibilité","Découvrez les valeurs et les projets de vie au-delà des photos."],
    ["Profils astrologiques","Ajoutez vos informations astrologiques. Les comparaisons peuvent varier."],
    ["Créer des liens sincères","Exprimez votre intérêt et avancez à votre rythme."]
  ],
  nl: [
    ["Bewust partners ontdekken","Ontdek kennismakingen op basis van wat voor jou belangrijk is."],
    ["Vertel jouw verhaal","Maak een uitgebreid profiel met je achtergrond en intenties."],
    ["Persoonlijke voorkeuren","Kies leeftijd, locatie en eigenschappen die jij belangrijk vindt."],
    ["Compatibiliteit begrijpen","Kijk verder dan foto's en ontdek gedeelde waarden en doelen."],
    ["Horoscoopprofielen","Voeg horoscoopgegevens toe. Vergelijkingsfuncties kunnen verschillen."],
    ["Met aandacht verbinden","Toon interesse en zet de volgende stap op jouw tempo."]
  ],
  de: [
    ["Passende Partner entdecken","Entdecke Menschen anhand deiner persönlichen Wünsche."],
    ["Erzähle deine Geschichte","Erstelle ein ausführliches Profil mit deinem Hintergrund und deinen Zielen."],
    ["Persönliche Präferenzen","Wähle Alter, Ort und Eigenschaften, die dir wichtig sind."],
    ["Kompatibilität verstehen","Entdecke gemeinsame Werte und Lebensziele jenseits von Fotos."],
    ["Horoskopprofile","Ergänze Horoskopdaten. Vergleichsfunktionen können variieren."],
    ["Bewusst Kontakte knüpfen","Zeige Interesse und gehe in deinem eigenen Tempo weiter."]
  ],
} as const;

export function ModernMatchFeatures() {
  const { language } = useI18n();
  const copy = localized[language];
  const translatedFeatures = featureTranslations[language];
  return (
    <section id="features" aria-labelledby="features-heading" className="relative overflow-hidden bg-background px-5 py-16 sm:py-20 lg:py-28">
      <div aria-hidden="true" className="pointer-events-none absolute -right-40 top-0 h-96 w-96 rounded-full bg-accent/30 blur-3xl" />
      <div className="relative mx-auto max-w-7xl">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-card px-4 py-2 text-xs font-bold uppercase tracking-[.15em] text-primary-dark"><Sparkles className="h-4 w-4" /> {copy.eyebrow}</span>
          <h2 id="features-heading" className="mt-6 font-serif text-4xl font-semibold leading-tight text-primary-dark sm:text-5xl lg:text-6xl">{copy.title} <span className="text-primary">{copy.accent}</span></h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-muted-foreground sm:text-lg">{copy.description}</p>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {features.map(({ title, Icon, label, href }, index) => (
            <article key={label} className="group flex min-w-0 flex-col rounded-[1.75rem] border border-accent bg-card p-6 shadow-[0_12px_35px_rgba(41,19,63,.05)] transition-shadow hover:shadow-[0_18px_48px_rgba(41,19,63,.12)] sm:p-8">
              <div className="flex items-center justify-between">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent text-primary-dark"><Icon aria-hidden="true" className="h-7 w-7" /></span>
                <span className="text-[10px] font-bold tracking-[.18em] text-gold-foreground">{label}</span>
              </div>
              <h3 className="mt-7 font-serif text-2xl font-semibold text-primary-dark">{translatedFeatures[index][0]}</h3>
              <p className="mt-3 flex-1 text-sm leading-7 text-muted-foreground">{translatedFeatures[index][1]}</p>
              <Link href={href} className="mt-7 inline-flex w-fit items-center gap-2 rounded-lg py-2 text-sm font-semibold text-primary-dark underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary-dark">{copy.explore} <ArrowRight aria-hidden="true" className="h-4 w-4 transition-transform group-hover:translate-x-1" /></Link>
            </article>
          ))}
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-6 rounded-[1.75rem] bg-primary-dark px-6 py-8 text-center text-white sm:px-10 md:flex-row md:text-left">
          <div className="flex items-start gap-4"><LockKeyhole aria-hidden="true" className="mt-1 h-7 w-7 shrink-0 text-gold-foreground" /><div><h3 className="font-serif text-2xl font-semibold">{copy.privacy}</h3><p className="mt-2 max-w-xl text-sm leading-6 text-white/80">{copy.privacyBody}</p></div></div>
          <Link href="/signup" className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-full bg-gold px-7 py-3 text-sm font-bold text-primary-dark transition hover:bg-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">{copy.join} <ArrowRight aria-hidden="true" className="h-4 w-4" /></Link>
        </div>
      </div>
    </section>
  );
}
