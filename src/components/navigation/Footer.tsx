"use client";

import Link from "next/link";

import { Logo } from "@/components/shared/Logo";
import { Globe } from "lucide-react";
import { LANGUAGES, useI18n, type LanguageCode } from "@/components/i18n/I18nProvider";

const linkClass =
  "text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

const headingClass = "text-sm font-semibold uppercase tracking-wider text-foreground";

export function Footer() {
  const { language, setLanguage } = useI18n();
  const copy = {
    en:{tag:"{copy.tag}",sub:"{copy.sub}",language:"Language",about:"About",discover:"Discover",stories:"Success Stories",pricing:"Pricing",support:"Support",contact:"Contact",safety:"Safety",access:"Accessibility",legal:"Legal",privacy:"Privacy",terms:"Terms",guidelines:"Community Guidelines",rights:"All rights reserved.",confidence:"Connect with clarity and confidence."},
    ta:{tag:"நீங்கள் எங்கிருந்து வருகிறீர்கள், எங்கு செல்கிறீர்கள் என்பதைப் புரிந்துகொள்ளும் ஒருவரை சந்தியுங்கள்.",sub:"உலகம் முழுவதும் வாழும் இலங்கையர்களுக்காக வடிவமைக்கப்பட்ட நவீன உறவு நுண்ணறிவு.",language:"மொழி",about:"எங்களைப் பற்றி",discover:"தேடல்",stories:"வெற்றிக் கதைகள்",pricing:"விலைத் திட்டங்கள்",support:"உதவி",contact:"தொடர்பு",safety:"பாதுகாப்பு",access:"அணுகல்தன்மை",legal:"சட்டம்",privacy:"தனியுரிமை",terms:"விதிமுறைகள்",guidelines:"சமூக வழிகாட்டுதல்கள்",rights:"அனைத்து உரிமைகளும் பாதுகாக்கப்பட்டவை.",confidence:"தெளிவுடனும் நம்பிக்கையுடனும் இணையுங்கள்."},
    si:{tag:"ඔබ පැමිණි තැනත් යන තැනත් තේරුම් ගන්නා කෙනෙකු හමුවන්න.",sub:"ලොව පුරා ශ්‍රී ලාංකික ජීවිත සඳහා නිර්මාණය කළ නවීන සබඳතා අවබෝධය.",language:"භාෂාව",about:"අප ගැන",discover:"සොයන්න",stories:"සාර්ථක කතා",pricing:"මිල සැලසුම්",support:"සහාය",contact:"සම්බන්ධ වන්න",safety:"ආරක්ෂාව",access:"ප්‍රවේශතාව",legal:"නීතිමය",privacy:"පෞද්ගලිකත්වය",terms:"කොන්දේසි",guidelines:"ප්‍රජා මාර්ගෝපදේශ",rights:"සියලු හිමිකම් ඇවිරිණි.",confidence:"පැහැදිලිව සහ විශ්වාසයෙන් සම්බන්ධ වන්න."},
    fr:{tag:"Rencontrez une personne qui comprend d’où vous venez et où vous allez.",sub:"Une approche moderne des relations, pensée pour les Sri-Lankais du monde entier.",language:"Langue",about:"À propos",discover:"Découvrir",stories:"Histoires de réussite",pricing:"Tarifs",support:"Assistance",contact:"Contact",safety:"Sécurité",access:"Accessibilité",legal:"Mentions légales",privacy:"Confidentialité",terms:"Conditions",guidelines:"Règles de la communauté",rights:"Tous droits réservés.",confidence:"Connectez-vous avec clarté et confiance."},
    nl:{tag:"Ontmoet iemand die begrijpt waar je vandaan komt en waar je naartoe wilt.",sub:"Moderne relatie-inzichten, ontworpen voor Sri Lankanen wereldwijd.",language:"Taal",about:"Over ons",discover:"Ontdekken",stories:"Succesverhalen",pricing:"Prijzen",support:"Ondersteuning",contact:"Contact",safety:"Veiligheid",access:"Toegankelijkheid",legal:"Juridisch",privacy:"Privacy",terms:"Voorwaarden",guidelines:"Communityrichtlijnen",rights:"Alle rechten voorbehouden.",confidence:"Maak contact met duidelijkheid en vertrouwen."}
  }[language];

  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-5">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <Logo textSize="text-xl" />
            <p className="mt-4 max-w-sm text-sm leading-6 text-muted-foreground">
              Meet someone who understands where you come from — and where you're going.
            </p>
            <p className="mt-3 text-sm font-medium text-foreground">
              Modern relationship intelligence, shaped for Sri Lankan lives around the world.
            </p>
            
            {/* Language Selector in Footer */}
            <div className="mt-6">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {copy.language}
              </p>
              <div className="flex flex-wrap gap-2">{(Object.entries(LANGUAGES) as [LanguageCode,string][]).map(([code,name])=><button key={code} onClick={()=>setLanguage(code)} className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${language===code?"border-primary bg-primary text-primary-foreground":"border-border bg-background hover:bg-accent"}`}>{code==="en"&&<Globe className="mr-1.5 inline h-3.5 w-3.5"/>}{name}</button>)}</div>
            </div>
          </div>

          {/* CupidMatch Links */}
          <div>
            <h2 className={headingClass}>CupidMatch</h2>
            <ul className="mt-4 space-y-3">
              <li>
                <Link href="/about" className={linkClass}>
                  About
                </Link>
              </li>
              <li>
                <Link href="/discover" className={linkClass}>
                  Discover
                </Link>
              </li>
              <li>
                <Link href="/success-stories" className={linkClass}>
                  Success Stories
                </Link>
              </li>
              <li>
                <Link href="/pricing" className={linkClass}>
                  Pricing
                </Link>
              </li>
            </ul>
          </div>

          {/* Support & Legal */}
          <div>
            <h2 className={headingClass}>{copy.support}</h2>
            <ul className="mt-4 space-y-3">
              <li>
                <Link href="/contact" className={linkClass}>
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/safety" className={linkClass}>
                  Safety
                </Link>
              </li>
              <li>
                <Link href="/#faq" className={linkClass}>
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/accessibility" className={linkClass}>
                  Accessibility
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h2 className={headingClass}>{copy.legal}</h2>
            <ul className="mt-4 space-y-3">
              <li>
                <Link href="/privacy" className={linkClass}>
                  Privacy
                </Link>
              </li>
              <li>
                <Link href="/terms" className={linkClass}>
                  Terms
                </Link>
              </li>
              <li>
                <Link href="/community-guidelines" className={linkClass}>
                  Community Guidelines
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 border-t border-border pt-8">
          <div className="flex flex-col gap-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <p>&copy; {currentYear} CupidMatch. {copy.rights}</p>
            <p className="font-medium text-foreground">{copy.confidence}</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
