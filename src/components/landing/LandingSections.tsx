"use client";
import {
  ArrowRight,
  BadgeCheck,
  Eye,
  Filter,
  Globe2,
  Heart,
  Languages,
  Lock,
  MessageCircle,
  MoonStar,
  Shield,
  Smartphone,
  Sparkles,
  UserRound,
  Users,
  Wand2,
  Map,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { focusRing } from "@/components/landing/brand";
import { LotusOrnament } from "@/components/decorative";
import { CountryCarousel } from "@/components/landing/CountryCarousel";
import { useI18n } from "@/components/i18n/I18nProvider";


const HOME_COPY: Record<string, Record<string,string>> = {
 en:{members:"Members",world:"Sri Lanka • Worldwide",verified:"Verified & Authentic",serious:"Serious People • Real Intentions",story:"{t.story}",values:"Same Values.",future:"A Brighter Future.",join:"{t.join}",shared:"Shared Values",sharedSub:"More than surface compatibility",sharedDesc:"Match based on life goals, communication style, and what truly matters to you both.",goals:"Life Goals",goalsSub:"Plan your future together",goalsDesc:"Understand relocation openness, career flexibility, and where you both want to settle.",communication:"Communication Preferences",communicationSub:"How you connect matters",communicationDesc:"Discover how you both handle disagreements and build understanding.",family:"Family Expectations",familySub:"Respect and boundaries",familyDesc:"Define involvement levels, living arrangements, and responsibilities that work for you.",lifestyle:"Lifestyle",lifestyleSub:"Day-to-day compatibility",lifestyleDesc:"Explore daily routines, social preferences, and practical lifestyle alignment.",culture:"Cultural Preferences",cultureSub:"Optional and self-described",cultureDesc:"Language, traditions and festivals — share what is meaningful while staying flexible."},
 ta:{members:"உறுப்பினர்கள்",world:"இலங்கை • உலகம் முழுவதும்",verified:"சரிபார்க்கப்பட்ட மற்றும் நம்பகமான",serious:"தீவிரமானவர்கள் • உண்மையான நோக்கங்கள்",story:"உங்கள் கதை முக்கியமானது",values:"ஒரே மதிப்புகள்.",future:"ஒளிமயமான எதிர்காலம்.",join:"CupidMatch மூலம் காதல், நட்பு மற்றும் வாழ்நாள் துணையை கண்டவர்களுடன் இணையுங்கள்.",shared:"பகிர்ந்த மதிப்புகள்",sharedSub:"வெளிப்புற பொருத்தத்தைத் தாண்டி",sharedDesc:"வாழ்க்கை இலக்குகள், தொடர்பு முறை மற்றும் இருவருக்கும் உண்மையில் முக்கியமானவற்றின் அடிப்படையில் பொருத்துங்கள்.",goals:"வாழ்க்கை இலக்குகள்",goalsSub:"உங்கள் எதிர்காலத்தை ஒன்றாக திட்டமிடுங்கள்",goalsDesc:"இடமாற்றம், தொழில் நெகிழ்வு மற்றும் எங்கு குடியேற விரும்புகிறீர்கள் என்பதை புரிந்துகொள்ளுங்கள்.",communication:"தொடர்பு விருப்பங்கள்",communicationSub:"நீங்கள் எவ்வாறு இணைகிறீர்கள் என்பது முக்கியம்",communicationDesc:"கருத்து வேறுபாடுகளை எவ்வாறு கையாளுகிறீர்கள் மற்றும் புரிதலை உருவாக்குகிறீர்கள் என்பதை அறியுங்கள்.",family:"குடும்ப எதிர்பார்ப்புகள்",familySub:"மரியாதையும் எல்லைகளும்",familyDesc:"குடும்ப ஈடுபாடு, வாழும் ஏற்பாடுகள் மற்றும் பொறுப்புகளை தெளிவுபடுத்துங்கள்.",lifestyle:"வாழ்க்கை முறை",lifestyleSub:"தினசரி பொருத்தம்",lifestyleDesc:"தினசரி பழக்கங்கள், சமூக விருப்பங்கள் மற்றும் வாழ்க்கைமுறை பொருத்தத்தை ஆராயுங்கள்.",culture:"கலாச்சார விருப்பங்கள்",cultureSub:"விருப்பமானதும் தனிப்பட்டதும்",cultureDesc:"மொழி, மரபுகள் மற்றும் விழாக்களில் உங்களுக்கு முக்கியமானவற்றைப் பகிருங்கள்."},
 si:{members:"සාමාජිකයින්",world:"ශ්‍රී ලංකාව • ලොව පුරා",verified:"තහවුරු කළ සහ විශ්වාසදායක",serious:"ගැඹුරු අරමුණු ඇති අය",story:"ඔබගේ කතාව වැදගත්",values:"එකම වටිනාකම්.",future:"දීප්තිමත් අනාගතයක්.",join:"CupidMatch හරහා ආදරය, මිත්‍රත්වය සහ ජීවිත සහකරු සොයාගත් අය සමඟ එක්වන්න.",shared:"හවුල් වටිනාකම්",sharedSub:"පෙනුමට එහා ගිය ගැළපීම",sharedDesc:"ජීවිත ඉලක්ක, සන්නිවේදන රටාව සහ දෙදෙනාටම වැදගත් දේ අනුව ගැළපෙන්න.",goals:"ජීවිත ඉලක්ක",goalsSub:"අනාගතය එක්ව සැලසුම් කරන්න",goalsDesc:"ස්ථාන මාරුව, වෘත්තීය නම්‍යශීලීත්වය සහ පදිංචි වීමට කැමති ස්ථානය තේරුම් ගන්න.",communication:"සන්නිවේදන මනාප",communicationSub:"ඔබ සම්බන්ධ වන ආකාරය වැදගත්",communicationDesc:"මතභේද හසුරුවන සහ අවබෝධය ගොඩනගන ආකාරය දැනගන්න.",family:"පවුල් අපේක්ෂා",familySub:"ගෞරවය සහ සීමා",familyDesc:"පවුලේ සහභාගීත්වය, ජීවන සැලසුම් සහ වගකීම් පැහැදිලි කරන්න.",lifestyle:"ජීවන රටාව",lifestyleSub:"දෛනික ගැළපීම",lifestyleDesc:"දෛනික පුරුදු සහ ජීවන රටා ගැළපීම සොයන්න.",culture:"සංස්කෘතික මනාප",cultureSub:"විකල්ප සහ ස්වයං විස්තරිත",cultureDesc:"භාෂාව, සම්ප්‍රදායන් සහ උත්සව අතර ඔබට වැදගත් දේ බෙදාගන්න."},
 fr:{members:"Membres",world:"Sri Lanka • Monde entier",verified:"Vérifiés et authentiques",serious:"Personnes sérieuses • Intentions réelles",story:"Votre histoire compte",values:"Mêmes valeurs.",future:"Un avenir plus lumineux.",join:"Rejoignez celles et ceux qui recherchent l'amour, l'amitié et un partenaire de vie sur CupidMatch.",shared:"Valeurs communes",sharedSub:"Au-delà de la compatibilité superficielle",sharedDesc:"Trouvez des profils selon vos objectifs de vie, votre communication et ce qui compte vraiment.",goals:"Objectifs de vie",goalsSub:"Planifiez votre avenir ensemble",goalsDesc:"Comprenez l'ouverture au déménagement, la flexibilité professionnelle et vos projets d'installation.",communication:"Préférences de communication",communicationSub:"La façon de communiquer compte",communicationDesc:"Découvrez comment vous gérez les désaccords et construisez la compréhension.",family:"Attentes familiales",familySub:"Respect et limites",familyDesc:"Définissez l'implication familiale, le mode de vie et les responsabilités.",lifestyle:"Mode de vie",lifestyleSub:"Compatibilité au quotidien",lifestyleDesc:"Explorez les habitudes quotidiennes, les préférences sociales et la compatibilité pratique.",culture:"Préférences culturelles",cultureSub:"Facultatives et personnelles",cultureDesc:"Langues, traditions et fêtes : partagez ce qui compte pour vous."},
 nl:{members:"Leden",world:"Sri Lanka • Wereldwijd",verified:"Geverifieerd en authentiek",serious:"Serieuze mensen • Echte intenties",story:"Jouw verhaal telt",values:"Dezelfde waarden.",future:"Een mooiere toekomst.",join:"Sluit je aan bij mensen die via CupidMatch liefde, vriendschap en een levenspartner zoeken.",shared:"Gedeelde waarden",sharedSub:"Meer dan oppervlakkige compatibiliteit",sharedDesc:"Match op levensdoelen, communicatiestijl en wat voor jullie echt belangrijk is.",goals:"Levensdoelen",goalsSub:"Plan samen jullie toekomst",goalsDesc:"Begrijp verhuisbereidheid, carrièreflexibiliteit en waar jullie willen wonen.",communication:"Communicatievoorkeuren",communicationSub:"Hoe je contact maakt telt",communicationDesc:"Ontdek hoe jullie omgaan met meningsverschillen en begrip opbouwen.",family:"Familieverwachtingen",familySub:"Respect en grenzen",familyDesc:"Stem familiebetrokkenheid, wonen en verantwoordelijkheden op elkaar af.",lifestyle:"Leefstijl",lifestyleSub:"Compatibiliteit van dag tot dag",lifestyleDesc:"Vergelijk dagelijkse routines, sociale voorkeuren en praktische leefstijl.",culture:"Culturele voorkeuren",cultureSub:"Optioneel en zelf omschreven",cultureDesc:"Deel wat taal, tradities en feesten voor jou betekenen."}
};
function useHomeCopy(){const {language}=useI18n();return HOME_COPY[language]||HOME_COPY.en;}

export function TrustStrip() {
  const t=useHomeCopy();
  const items = [
    { icon: Users, lines: ["10,000+", t.members] },
    { icon: Globe2, lines: ["UK • Canada • Australia", t.world] },
    { icon: Shield, lines: [t.verified] },
    { icon: Heart, lines: [t.serious] },
  ];

  return (
    <section className="relative z-20 -mt-12 px-4 pb-2 sm:-mt-16 sm:px-6 lg:-mt-[4.25rem]" aria-label="Community highlights">
      <div className="mx-auto max-w-[1100px] rounded-[1.75rem] border border-[#F0E8F6] bg-white px-3 py-5 shadow-[0_18px_50px_rgba(74,32,110,0.08)] sm:px-6 sm:py-6">
        <ul className="grid grid-cols-2 gap-y-6 lg:grid-cols-4 lg:gap-0 lg:divide-x lg:divide-[#EEE4F4]">
          {items.map((item) => (
            <li key={item.lines.join(" ")} className="flex items-center gap-3 px-3 lg:justify-center lg:px-5">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#F3E8FF] text-[#7C3AED]">
                <item.icon className="h-5 w-5 stroke-[1.7]" aria-hidden="true" />
              </span>
              <span className="text-[13px] font-semibold leading-5 text-[#2A1845] sm:text-sm">
                {item.lines.map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function WhyCupidMatch() {
  const t=useHomeCopy();
  const features = [
    {
      image: "/images/values/shared.jpg?v=3",
      title: t.shared,
      subtitle: t.sharedSub,
      description: t.sharedDesc,
    },
    {
      image: "/images/values/goals.jpg?v=3",
      title: t.goals,
      subtitle: t.goalsSub,
      description: t.goalsDesc,
    },
    {
      image: "/images/values/communication.jpg?v=3",
      title: t.communication,
      subtitle: t.communicationSub,
      description: t.communicationDesc,
    },
    {
      image: "/images/values/family.jpg?v=3",
      title: t.family,
      subtitle: t.familySub,
      description: t.familyDesc,
    },
    {
      image: "/images/values/lifestyle.jpg?v=3",
      title: t.lifestyle,
      subtitle: t.lifestyleSub,
      description: t.lifestyleDesc,
    },
    {
      image: "/images/values/culture.jpg?v=3",
      title: t.culture,
      subtitle: t.cultureSub,
      description: t.cultureDesc,
    },
  ];

  return (
    <section className="relative overflow-hidden bg-[#FBF8F4] px-4 pb-20 pt-16 sm:px-6 sm:pt-20" aria-labelledby="why-heading">
      <LotusOrnament side="left" className="opacity-80" />
      <LotusOrnament side="right" className="opacity-80" />
      <div className="mx-auto max-w-7xl">
        <div className="relative mb-16 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#C4A574]">
            Your story matters
          </p>
          <h2 id="why-heading" className="mt-3 font-serif text-3xl font-semibold text-[#2A1845] sm:text-[2.5rem] sm:leading-tight">
            {t.values} <span className="text-[#C026D3]">{t.future}</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base text-[#5C4A66] sm:text-lg">
            Join thousands who found love, friendship and lifelong partners on CupidMatch.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <article
              key={feature.title}
              className="group overflow-hidden rounded-3xl border border-[#EDE4F5] bg-[#FFFDF9] shadow-[0_10px_30px_rgba(74,32,110,0.06)] transition-all hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(74,32,110,0.12)]"
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                <Image
                  src={feature.image}
                  alt={`${feature.title}: ${feature.subtitle}`}
                  fill
                  quality={90}
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 360px"
                  className="object-cover object-center transition-transform duration-500 group-hover:scale-[1.04]"
                />
              </div>
              <div className="p-6">
                <h3 className="text-lg font-bold text-[#2A1845]">{feature.title}</h3>
                <p className="mt-1 text-sm font-medium text-[#7C3AED]">{feature.subtitle}</p>
                <p className="mt-3 text-sm leading-relaxed text-[#6B5A78]">{feature.description}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function HowItWorks() {
  const steps = [
    {
      number: "1",
      icon: "📝",
      title: "Tell us what matters",
      description: "Build your profile with your values, lifestyle, future plans, and what you're looking for in a partner.",
    },
    {
      number: "2",
      icon: "💡",
      title: "Understand each introduction",
      description: "See clear explanations for every match — why this person was suggested and what you have in common.",
    },
    {
      number: "3",
      icon: "💬",
      title: "Connect at your own pace",
      description: "Send interest, start conversations, and take things forward when it feels right for both of you.",
    },
  ];

  return (
    <section className="bg-gradient-to-br from-accent/20 to-background px-4 py-20 sm:px-6" aria-labelledby="how-heading">
      <div className="mx-auto max-w-7xl">
        <div className="mb-16 text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">
            Getting Started
          </p>
          <h2 id="how-heading" className="mt-2 text-3xl font-bold text-foreground sm:text-4xl">
            How it works
          </h2>
        </div>

        <ol className="grid gap-8 md:grid-cols-3">
          {steps.map((step, index) => (
            <li key={step.number} className="relative">
              <div className="rounded-3xl border border-border bg-card p-8 shadow-sm transition-all hover:shadow-md">
                <div className="mb-5 flex items-center justify-between">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground">
                    {step.number}
                  </span>
                  <span className="text-4xl">{step.icon}</span>
                </div>
                <h3 className="mb-3 text-xl font-bold text-foreground">{step.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{step.description}</p>
              </div>
              {index < steps.length - 1 && (
                <div className="absolute -right-4 top-1/2 hidden -translate-y-1/2 lg:block">
                  <ArrowRight className="h-8 w-8 text-border" aria-hidden="true" />
                </div>
              )}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function FeatureGrid() {
  const features = [
    {
      icon: Wand2,
      title: "AI Profile Studio",
      description: "Get help crafting your biography and prompts. Translate approved text between languages.",
      status: "Coming soon" as const,
    },
    {
      icon: Map,
      title: "Future Map",
      description: "Compare current location, future plans, relocation openness, and career flexibility.",
      status: "Coming soon" as const,
    },
    {
      icon: Sparkles,
      title: "Culture Preferences",
      description: "Express language, festivals, food, and traditions with granular importance levels.",
      status: "Coming soon" as const,
    },
    {
      icon: Users,
      title: "Family Circle",
      description: "Invite family with member-controlled permissions. View, suggest, or comment with boundaries.",
      status: "Coming soon" as const,
    },
    {
      icon: CheckCircle2,
      title: "Verification",
      description: "Optional identity and liveness checks. Know exactly what each badge means.",
      status: "Coming soon" as const,
    },
    {
      icon: MessageCircle,
      title: "Guided Conversations",
      description: "Meaningful prompts and optional AI assistance to help start important conversations.",
      status: "Available" as const,
    },
  ];

  return (
    <section className="bg-[#FBF8F4] px-4 py-20 sm:px-6" aria-labelledby="features-heading">
      <div className="mx-auto max-w-7xl">
        <div className="mb-16 text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-[#7C3AED]">
            Platform Features
          </p>
          <h2 id="features-heading" className="mt-2 text-3xl font-bold text-[#2A1845] sm:text-4xl">
            Built for meaningful connections
          </h2>
          <p className="mx-auto mt-4 max-w-3xl text-lg text-[#5C4A66]">
            Tools designed to help you understand compatibility and build confidence in your decisions
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <article
              key={feature.title}
              className="relative rounded-3xl border border-[#EDE4F5] bg-white p-8 shadow-sm"
            >
              {feature.status === "Coming soon" && (
                <div className="absolute right-4 top-4 rounded-full bg-[#F3E8FF] px-3 py-1 text-xs font-medium text-[#6D28D9]">
                  Coming soon
                </div>
              )}
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#F3E8FF] text-[#7C3AED]">
                <feature.icon className="h-6 w-6" aria-hidden="true" />
              </div>
              <h3 className="mb-3 text-lg font-bold text-[#2A1845]">{feature.title}</h3>
              <p className="text-sm leading-relaxed text-[#6B5A78]">{feature.description}</p>
            </article>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-sm text-[#6B5A78]">
            Features marked &quot;Coming soon&quot; are in development. Only implemented features are shown in member-facing flows.
          </p>
        </div>
      </div>
    </section>
  );
}

export function ProductPreview() {
  return (
    <section className="bg-[#FBF5F1] px-4 py-16 sm:px-6 sm:py-20" aria-labelledby="preview-heading">
      <div className="mx-auto max-w-6xl">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#A52A68]">
            Product experience
          </p>
          <h2 id="preview-heading" className="mt-3 font-serif text-3xl font-semibold text-[#271624] sm:text-4xl">
            Designed for considered introductions
          </h2>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <aside
            className="rounded-[1.75rem] border border-[#EADFD6] bg-white p-5 shadow-[0_16px_40px_rgba(48,18,42,0.08)] sm:p-6"
            aria-label="Sample profile preview"
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <p className="rounded-full bg-[#F8EAF1] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#4B164C]">
                Sample profile
              </p>
              <span className="inline-flex items-center gap-1 text-xs font-medium text-[#3F6B54]">
                <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
                Verified
              </span>
            </div>

            <div className="overflow-hidden rounded-2xl border border-[#EADFD6] bg-[#FFFDF9]">
              <div className="flex items-center gap-4 border-b border-[#EADFD6] p-5">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#D6B56D]/35 font-serif text-xl font-semibold text-[#4B164C]">
                  CM
                </div>
                <div>
                  <p className="font-semibold text-[#271624]">Member preview</p>
                  <p className="text-sm text-[#725E6D]">Colombo · Tamil · Professionally settled</p>
                </div>
              </div>

              <div className="space-y-4 p-5">
                <div className="flex flex-wrap gap-2">
                  {["Family-minded", "Values-led", "Open to relocate"].map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-[#EADFD6] bg-white px-3 py-1 text-xs font-medium text-[#4B164C]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="rounded-xl border border-[#EADFD6] bg-white p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#D6B56D]">
                      Profile readiness
                    </p>
                    <p className="text-xs font-medium text-[#725E6D]">Thoughtfully completed</p>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#F8EAF1]">
                    <div className="h-full w-[82%] rounded-full bg-[#4B164C]" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Button
                    asChild
                    variant="outline"
                    className={`h-11 rounded-xl border-[#EADFD6] text-[#271624] hover:bg-[#FBF5F1] ${focusRing}`}
                  >
                    <Link href="/signup">View Profile</Link>
                  </Button>
                  <Button asChild className={`h-11 rounded-xl bg-[#4B164C] text-white hover:bg-[#742158] ${focusRing}`}>
                    <Link href="/signup">Connect</Link>
                  </Button>
                </div>

                <p className="text-xs leading-5 text-[#725E6D]">
                  Illustrative sample only. This is not a real member profile.
                </p>
              </div>
            </div>
          </aside>

          <div className="grid gap-5 content-start">
            <article className="rounded-2xl border border-[#EADFD6] bg-white p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F8EAF1] text-[#4B164C]">
                <MessageCircle className="h-5 w-5" aria-hidden="true" />
              </div>
              <h3 className="mt-4 font-semibold text-[#271624]">Secure conversation</h3>
              <p className="mt-2 text-sm leading-6 text-[#725E6D]">
                Get to know each other inside CupidMatch before sharing contact details.
              </p>
            </article>
            <article className="rounded-2xl border border-[#EADFD6] bg-white p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F8EAF1] text-[#4B164C]">
                <Sparkles className="h-5 w-5" aria-hidden="true" />
              </div>
              <h3 className="mt-4 font-semibold text-[#271624]">Thoughtful compatibility</h3>
              <p className="mt-2 text-sm leading-6 text-[#725E6D]">
                Review values, preferences and optional horoscope information in one place.
              </p>
            </article>
          </div>
        </div>
      </div>
    </section>
  );
}

export function PrivacySection() {
  const points = [
    "Choose who can view your personal details",
    "Control photo and contact-information visibility",
    "Understand verification signals clearly",
    "Block or report inappropriate behavior",
    "Chat securely before sharing contact information",
    "Pause or delete your account anytime",
  ];

  return (
    <section className="bg-background px-4 py-16 sm:px-6 sm:py-20" aria-labelledby="privacy-heading">
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-2 lg:items-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">
            Safety Centre
          </p>
          <h2 id="privacy-heading" className="mt-3 text-3xl font-bold text-foreground sm:text-4xl">
            Take your time. Stay in control.
          </h2>
          <p className="mt-4 text-base leading-7 text-muted-foreground">
            A matrimony profile contains personal information. CupidMatch is designed to help you
            share thoughtfully, connect securely, and move forward at your own pace.
          </p>
        </div>
        <ul className="space-y-3 rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-7">
          {points.map((point) => (
            <li key={point} className="flex gap-3 text-sm leading-6 text-foreground">
              <Shield className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              <span>{point}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function InternationalRelationships() {
  return (
    <section
      className="overflow-x-hidden bg-[#FBF8F4] px-4 py-20 sm:px-6"
      aria-labelledby="international-heading"
    >
      <div className="mx-auto max-w-7xl text-center">
        <h2
          id="international-heading"
          className="font-serif text-3xl font-semibold text-[#2A1845] sm:text-4xl"
        >
          Built for life between countries
        </h2>
        <p className="mx-auto mt-4 max-w-3xl text-base text-[#5C4A66] sm:text-lg">
          Connect with Sri Lankans around the world. Discover people across the countries where Sri
          Lankan communities live, work and build their future.
        </p>

        <div className="mt-14 text-left">
          <CountryCarousel />
        </div>

        <p className="mx-auto mt-10 max-w-2xl text-sm leading-6 text-[#6B5A78] sm:text-base">
          From Colombo to London, Toronto to Melbourne — find meaningful connections wherever life
          takes you.
        </p>
      </div>
    </section>
  );
}

// Legacy export for compatibility
export const GlobalLocationsSection = InternationalRelationships;

export function CommunitySection() {
  const chips = [
    "Indian communities",
    "Sri Lankan communities",
    "Tamil",
    "Sinhala",
    "English",
    "UK & diaspora",
    "London",
    "Chennai",
    "Colombo",
    "Toronto",
    "Sydney",
  ];

  return (
    <section className="bg-[#F8EAF1] px-4 py-16 sm:px-6 sm:py-20" aria-labelledby="community-heading">
      <div className="mx-auto max-w-6xl text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white text-[#4B164C]">
          <Globe2 className="h-5 w-5" aria-hidden="true" />
        </div>
        <h2
          id="community-heading"
          className="mt-5 font-serif text-3xl font-semibold text-[#271624] sm:text-4xl"
        >
          Made for communities that cross borders
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-[#725E6D]">
          CupidMatch is built for Indian and Sri Lankan communities—with Tamil, Sinhala and English
          preferences—whether you live locally or across the UK and the wider diaspora.
        </p>
        <ul className="mx-auto mt-8 flex max-w-3xl flex-wrap justify-center gap-2.5">
          {chips.map((chip) => (
            <li
              key={chip}
              className="rounded-full border border-[#4B164C]/15 bg-white px-3.5 py-1.5 text-sm text-[#4B164C]"
            >
              {chip}
            </li>
          ))}
        </ul>
        <p className="mx-auto mt-5 max-w-xl text-xs leading-5 text-[#725E6D]">
          Location labels reflect communities we design for, not claims about current member
          activity in each city.
        </p>
      </div>
    </section>
  );
}

export function DiscoveryPreview() {
  const demoProfiles = [
    {
      name: "Sample Profile A",
      location: "London",
      image: "👩🏽",
      interests: ["Travel", "Reading", "Yoga"],
    },
    {
      name: "Sample Profile B",
      location: "Toronto",
      image: "👨🏾",
      interests: ["Photography", "Hiking", "Cooking"],
    },
    {
      name: "Sample Profile C",
      location: "Melbourne",
      image: "👩🏻",
      interests: ["Fitness", "Tech", "Food"],
    },
  ];

  return (
    <section className="bg-background px-4 py-20 sm:px-6" aria-labelledby="discovery-heading">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">
            Discovery
          </p>
          <h2 id="discovery-heading" className="mt-2 text-3xl font-bold text-foreground sm:text-4xl">
            Find compatible matches
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            See clearly labelled sample profiles below
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {demoProfiles.map((profile, index) => (
            <div
              key={index}
              className="group overflow-hidden rounded-3xl border border-border bg-card shadow-sm transition-all hover:shadow-md"
            >
              {/* Demo Label */}
              <div className="border-b border-border bg-accent/50 px-4 py-2">
                <p className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <Eye className="h-3 w-3" aria-hidden="true" />
                  Sample Profile Preview
                </p>
              </div>

              <div className="relative h-48 bg-gradient-to-br from-accent/30 to-accent/10">
                <div className="flex h-full items-center justify-center text-7xl">{profile.image}</div>
              </div>
              
              <div className="p-6">
                <div className="mb-3">
                  <h3 className="text-lg font-bold text-foreground">{profile.name}</h3>
                  <p className="text-sm text-muted-foreground">{profile.location}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {profile.interests.map((interest) => (
                    <span
                      key={interest}
                      className="rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground"
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        <p className="mt-10 text-center text-sm text-muted-foreground">
          These are illustrative sample profiles. Real member profiles are only visible to signed-in members with mutual consent.
        </p>
      </div>
    </section>
  );
}

// Legacy export for compatibility
export const MemberShowcase = DiscoveryPreview;

export function FamilyCirclePreview() {
  return (
    <section className="bg-gradient-to-br from-accent/20 to-background px-4 py-20 sm:px-6" aria-labelledby="family-circle-heading">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">
            Coming Soon
          </p>
          <h2 id="family-circle-heading" className="mt-2 text-3xl font-bold text-foreground sm:text-4xl">
            Family Circle
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Invite family members to join your journey — on your terms, with granular permissions you control.
          </p>
        </div>

        <div className="mx-auto mt-12 max-w-4xl">
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Users className="h-6 w-6 text-primary" aria-hidden="true" />
              </div>
              <h3 className="text-lg font-bold text-foreground">Member-owned invitations</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                You decide who to invite, when, and what they can see. Revoke access anytime.
              </p>
            </div>

            <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Shield className="h-6 w-6 text-primary" aria-hidden="true" />
              </div>
              <h3 className="text-lg font-bold text-foreground">Granular permissions</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Control exactly what family members can view, comment on, or help decide. Full audit trail included.
              </p>
            </div>
          </div>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            This feature is in development. It supports cultural respect for family involvement while keeping you in full control.
          </p>
        </div>
      </div>
    </section>
  );
}

export function SuccessStoriesPreview() {
  return (
    <section className="bg-background px-4 py-16 sm:px-6 sm:py-20" aria-labelledby="stories-heading">
      <div className="mx-auto max-w-6xl">
        <div className="max-w-2xl">
          <h2 id="stories-heading" className="text-3xl font-bold text-foreground sm:text-4xl">
            Stories that began with an introduction
          </h2>
          <p className="mt-4 text-base leading-7 text-muted-foreground">
            We are carefully gathering real journeys from couples who met through CupidMatch. Until
            verified stories are ready to share, you can browse the success stories space or submit
            your own.
          </p>
        </div>

        <div className="mt-8 rounded-3xl border border-border bg-accent/30 p-8 sm:p-10">
          <div className="flex items-start gap-3">
            <Heart className="mt-1 h-6 w-6 text-primary" aria-hidden="true" />
            <div className="flex-1">
              <p className="text-2xl font-bold text-foreground">
                Real stories. Shared with care.
              </p>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                Success stories will appear here once couples choose to share them. We do not publish
                invented testimonials or fabricated couples.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Button asChild className="rounded-full bg-primary px-6 text-primary-foreground hover:bg-primary/90">
                  <Link href="/success-stories">View success stories</Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="rounded-full border-2 px-6"
                >
                  <Link href="/success-stories/submit">Share your story</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function FeaturesOverview() {
  const features = [
    { icon: Sparkles, label: "Smart match suggestions" },
    { icon: MoonStar, label: "Horoscope matching" },
    { icon: Filter, label: "Preference filters" },
    { icon: BadgeCheck, label: "Verified-profile signals" },
    { icon: Eye, label: "Private photo controls" },
    { icon: MessageCircle, label: "Secure messaging" },
    { icon: Languages, label: "Tamil, Sinhala & English" },
    { icon: Smartphone, label: "Responsive mobile experience" },
  ];

  return (
    <section className="bg-[#FBF5F1] px-4 py-16 sm:px-6 sm:py-20" aria-labelledby="features-heading">
      <div className="mx-auto max-w-6xl">
        <h2 id="features-heading" className="font-serif text-3xl font-semibold text-[#271624] sm:text-4xl">
          Everything you need to begin thoughtfully
        </h2>
        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <li
              key={feature.label}
              className="flex items-center gap-3 rounded-2xl border border-[#EADFD6] bg-white px-4 py-4 text-sm font-medium text-[#271624]"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F8EAF1] text-[#4B164C]">
                <feature.icon className="h-4 w-4" aria-hidden="true" />
              </span>
              {feature.label}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function PricingTeaser() {
  return (
    <section className="bg-background px-4 py-20 sm:px-6" aria-labelledby="pricing-heading">
      <div className="mx-auto max-w-5xl text-center">
        <p className="text-sm font-semibold uppercase tracking-wider text-primary">Pricing</p>
        <h2 id="pricing-heading" className="mt-2 text-3xl font-bold text-foreground sm:text-4xl">
          Start free. Upgrade when you need more.
        </h2>
        <p className="mx-auto mt-4 max-w-3xl text-lg text-muted-foreground">
          CupidMatch uses one membership catalogue. Prices are shown for your selected country and currency on the pricing page.
        </p>
        <div className="mx-auto mt-8 grid max-w-3xl gap-3 sm:grid-cols-3">
          {[
            ["Free", "Create your profile and start matching"],
            ["Premium", "Deeper compatibility and discovery"],
            ["Premium+", "More privacy, visibility and priority tools"],
          ].map(([name, description]) => (
            <div key={name} className="rounded-2xl border bg-card p-5 text-left shadow-sm">
              <p className="font-semibold text-foreground">{name}</p>
              <p className="mt-1 text-sm text-muted-foreground">{description}</p>
            </div>
          ))}
        </div>
        <Button asChild className="mt-8 rounded-full px-8">
          <Link href="/pricing">View plans & local pricing</Link>
        </Button>
      </div>
    </section>
  );
}

export function FaqSection() {
  const faqs = [
    {
      q: "Who is CupidMatch for?",
      a: "CupidMatch is for Sri Lankan adults worldwide seeking marriage. We serve never-married, divorced, and widowed members aged 18+ in the UK, Canada, Australia, and other countries, as well as people in Sri Lanka open to international relationships.",
    },
    {
      q: "How do international matches work?",
      a: "Our Future Map feature (coming soon) helps you compare current location, future settlement plans, relocation openness, and long-distance tolerance. You can express where you are now and where you want to be.",
    },
    {
      q: "What verification is available?",
      a: "We offer optional identity and liveness checks. Each verification badge states exactly what was checked — we never imply that verification guarantees safety or honesty. Email and phone verification are also available.",
    },
    {
      q: "How does family involvement work?",
      a: "Family Circle (coming soon) allows member-controlled invitations with granular permissions. You decide who can view your profile, suggest matches, or comment privately. Family helpers cannot impersonate you or accept matches on your behalf.",
    },
    {
      q: "What privacy controls do I have?",
      a: "You control profile visibility, photo reveal requests, and who can contact you. Privacy defaults minimize exposure. You can block or report members, and pause your account at any time.",
    },
    {
      q: "How do AI recommendations work?",
      a: "Our matching algorithm is deterministic and explainable. You'll see clear evidence-based reasons for each suggestion, like shared settlement preferences or aligned family expectations. AI doesn't decide who is eligible — you do.",
    },
    {
      q: "Can I cancel my subscription?",
      a: "Yes. You can cancel anytime through your account settings or billing portal. Core safety features remain available to everyone, regardless of subscription status.",
    },
  ];

  return (
    <section id="faq" className="scroll-mt-24 bg-accent/10 px-4 py-16 sm:px-6 sm:py-20" aria-labelledby="faq-heading">
      <div className="mx-auto max-w-3xl">
        <h2 id="faq-heading" className="text-3xl font-bold text-foreground sm:text-4xl">
          Frequently asked questions
        </h2>
        <Accordion type="single" collapsible className="mt-10 space-y-4">
          {faqs.map((item, index) => (
            <AccordionItem 
              key={item.q} 
              value={`item-${index}`} 
              className="rounded-2xl border border-border bg-card px-6 shadow-sm"
            >
              <AccordionTrigger className="text-left font-semibold text-foreground hover:no-underline hover:text-primary">
                {item.q}
              </AccordionTrigger>
              <AccordionContent className="leading-relaxed text-muted-foreground">{item.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}

export function FinalCta() {
  return (
    <section className="px-4 pb-20 sm:px-6 sm:pb-24" aria-labelledby="cta-heading">
      <div className="mx-auto max-w-6xl overflow-hidden rounded-[2rem] bg-gradient-to-br from-primary to-primary/90 px-6 py-14 text-center text-primary-foreground shadow-xl sm:px-12 sm:py-16">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-card/20 text-card">
          <Heart className="h-5 w-5 fill-current" aria-hidden="true" />
        </div>
        <h2
          id="cta-heading"
          className="mx-auto mt-5 max-w-3xl text-3xl font-bold tracking-tight sm:text-4xl"
        >
          Connect with clarity and confidence
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 opacity-90 sm:text-base">
          Create your profile, set your preferences, and meet people who understand where you come from — and where you're going.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button
            asChild
            size="lg"
            className="h-12 rounded-full bg-card px-8 font-semibold text-primary shadow-md hover:bg-card/90"
          >
            <Link href="/signup">Build my profile</Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="h-12 rounded-full border-2 border-card/40 bg-transparent px-8 font-semibold text-card hover:bg-card/10"
          >
            <Link href="/success-stories">Success stories</Link>
          </Button>
        </div>
        <p className="mt-6 text-sm opacity-80">Free to join · Privacy controls built in</p>
      </div>
    </section>
  );
}
