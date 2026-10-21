"use client";

import Link from "next/link";
import { useI18n } from "@/components/i18n/I18nProvider";
import { ArrowRight, HelpCircle } from "lucide-react";

const faqCopy = {
 en: { eyebrow:"Questions & answers", title:"Everything you need to know to begin.", intro:"A few helpful answers before you start your CupidMatch journey.", contact:"Still have questions? Contact us", questions:[
 ["How do I get started?","Create an account, complete your profile and add your partner preferences. You can then explore the introductions available to you."],
 ["Can I choose what I look for in a partner?","Yes. CupidMatch includes partner preferences so you can focus on details that matter to you."],
 ["Does CupidMatch support horoscope information?","Horoscope details are part of the CupidMatch profile experience. The availability of advanced comparisons depends on the features enabled for your account."],
 ["How do I manage my privacy?","Review the privacy and profile settings available in your account. For further details, read our privacy and safety pages."],
 ["Where can I see membership options?","Visit the membership page for the current plans and benefits. Available features and pricing are shown there."]]},
 ta: {eyebrow:"கேள்விகளும் பதில்களும்",title:"தொடங்குவதற்கு நீங்கள் அறிய வேண்டியவை.",intro:"CupidMatch பயணத்தைத் தொடங்கும் முன் சில பயனுள்ள பதில்கள்.",contact:"மேலும் கேள்விகள் உள்ளதா? தொடர்புகொள்ளுங்கள்",questions:[
 ["எப்படித் தொடங்குவது?","கணக்கை உருவாக்கி, சுயவிவரத்தையும் துணை விருப்பங்களையும் பூர்த்தி செய்யுங்கள். பின்னர் கிடைக்கும் அறிமுகங்களைப் பார்க்கலாம்."],
 ["துணைக்கான விருப்பங்களைத் தேர்ந்தெடுக்கலாமா?","ஆம். உங்களுக்கு முக்கியமான விவரங்களின் அடிப்படையில் விருப்பங்களை அமைக்கலாம்."],
 ["ஜாதக விவரங்களைச் சேர்க்க முடியுமா?","CupidMatch சுயவிவரத்தில் ஜாதக விவரங்கள் உள்ளன. மேம்பட்ட ஒப்பீட்டு வசதிகள் உங்கள் கணக்கில் இயக்கப்பட்ட அம்சங்களைப் பொறுத்தது."],
 ["தனியுரிமையை எப்படிக் கட்டுப்படுத்துவது?","கணக்கின் தனியுரிமை மற்றும் சுயவிவர அமைப்புகளைப் பாருங்கள். மேலும் அறிய தனியுரிமை மற்றும் பாதுகாப்புப் பக்கங்களைப் படியுங்கள்."],
 ["உறுப்பினர் திட்டங்களை எங்கே பார்க்கலாம்?","தற்போதைய திட்டங்கள், கட்டணங்கள் மற்றும் சலுகைகளை உறுப்பினர் திட்டப் பக்கத்தில் பார்க்கலாம்."]]},
 si: {eyebrow:"ප්‍රශ්න සහ පිළිතුරු",title:"ආරම්භ කිරීමට දැනගත යුතු දේ.",intro:"ඔබේ CupidMatch ගමනට පෙර ප්‍රයෝජනවත් පිළිතුරු කිහිපයක්.",contact:"තවත් ප්‍රශ්න තිබේද? අප අමතන්න",questions:[
 ["ආරම්භ කරන්නේ කෙසේද?","ගිණුමක් සාදා පැතිකඩ සහ සහකරු පිළිබඳ කැමැත්ත සම්පූර්ණ කරන්න. ඉන්පසු හඳුන්වාදීම් ගවේෂණය කළ හැක."],
 ["සහකරුවෙකු සඳහා කැමැත්ත තෝරාගත හැකිද?","ඔව්. ඔබට වැදගත් කරුණු අනුව කැමැත්ත සකස් කළ හැක."],
 ["කේන්දර තොරතුරු ඇතුළත් කළ හැකිද?","CupidMatch පැතිකඩට කේන්දර විස්තර ඇතුළත් කළ හැක. උසස් සැසඳීම් ඔබේ ගිණුමේ සක්‍රීය පහසුකම් මත රඳා පවතී."],
 ["පෞද්ගලිකත්වය පාලනය කරන්නේ කෙසේද?","ඔබේ ගිණුමේ පෞද්ගලිකත්ව සැකසුම් පරීක්ෂා කරන්න. වැඩි විස්තර සඳහා ආරක්ෂාව සහ පෞද්ගලිකත්ව පිටු බලන්න."],
 ["සාමාජිකත්ව විකල්ප කොහේද?","වත්මන් මිල සහ ප්‍රතිලාභ සාමාජිකත්ව පිටුවේ දැකිය හැක."]]},
 fr: {eyebrow:"Questions et réponses",title:"Tout savoir avant de commencer.",intro:"Quelques réponses utiles avant votre aventure CupidMatch.",contact:"D’autres questions ? Contactez-nous",questions:[
 ["Comment commencer ?","Créez un compte, complétez votre profil et indiquez vos préférences pour découvrir des profils."],
 ["Puis-je définir mes préférences ?","Oui, choisissez les critères qui comptent pour vous."],
 ["CupidMatch propose-t-il des informations astrologiques ?","Vous pouvez ajouter ces informations à votre profil. Les comparaisons avancées dépendent des fonctionnalités activées."],
 ["Comment gérer ma confidentialité ?","Consultez les paramètres de votre compte ainsi que nos pages de confidentialité et de sécurité."],
 ["Où consulter les abonnements ?","La page des abonnements présente les offres, les tarifs et les avantages actuels."]]},
 nl: {eyebrow:"Vragen en antwoorden",title:"Alles wat je moet weten om te beginnen.",intro:"Handige antwoorden voordat je aan je CupidMatch-reis begint.",contact:"Nog vragen? Neem contact op",questions:[
 ["Hoe begin ik?","Maak een account, vul je profiel in en geef je partnervoorkeuren op om kennismakingen te ontdekken."],
 ["Kan ik mijn voorkeuren instellen?","Ja, kies de eigenschappen die voor jou belangrijk zijn."],
 ["Ondersteunt CupidMatch horoscoopgegevens?","Je kunt horoscoopgegevens toevoegen. Geavanceerde vergelijkingen hangen af van de ingeschakelde functies."],
 ["Hoe beheer ik mijn privacy?","Bekijk je accountinstellingen en onze pagina's over privacy en veiligheid."],
 ["Waar vind ik lidmaatschappen?","Op de lidmaatschapspagina staan de actuele opties, prijzen en voordelen."]]},
 de: {eyebrow:"Fragen und Antworten",title:"Alles, was du zum Start wissen musst.",intro:"Hilfreiche Antworten vor deinem Start mit CupidMatch.",contact:"Noch Fragen? Kontaktiere uns",questions:[
 ["Wie fange ich an?","Erstelle ein Konto, vervollständige dein Profil und lege deine Partnerwünsche fest."],
 ["Kann ich meine Wünsche festlegen?","Ja, du kannst die Eigenschaften auswählen, die dir wichtig sind."],
 ["Unterstützt CupidMatch Horoskopdaten?","Du kannst Horoskopangaben im Profil ergänzen. Erweiterte Vergleiche hängen von aktivierten Funktionen ab."],
 ["Wie verwalte ich meine Privatsphäre?","Prüfe deine Kontoeinstellungen sowie unsere Datenschutz- und Sicherheitsseiten."],
 ["Wo finde ich Mitgliedschaften?","Auf der Mitgliedschaftsseite findest du aktuelle Angebote, Preise und Vorteile."]]}
} as const;

export function LandingFaq() {
  const { language } = useI18n();
  const copy = faqCopy[language];
  return (
    <section id="faq" aria-labelledby="faq-heading" className="scroll-mt-24 bg-background px-5 py-16 sm:py-20 lg:py-24">
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[.8fr_1.2fr] lg:gap-16">
        <div>
          <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[.18em] text-gold-foreground"><HelpCircle aria-hidden="true" className="h-4 w-4" /> {copy.eyebrow}</span>
          <h2 id="faq-heading" className="mt-4 font-serif text-4xl font-semibold leading-tight text-primary-dark sm:text-5xl">{copy.title}</h2>
          <p className="mt-5 max-w-md text-base leading-7 text-muted-foreground">{copy.intro}</p>
          <Link href="/contact" className="mt-6 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-primary-dark underline-offset-4 hover:underline">{copy.contact} <ArrowRight aria-hidden="true" className="h-4 w-4" /></Link>
        </div>
        <div className="space-y-3">
          {copy.questions.map(([question,answer]) => (
            <details key={question} className="group rounded-2xl border border-accent bg-card px-5 py-4 shadow-sm open:border-gold-light sm:px-6">
              <summary className="flex min-h-8 cursor-pointer list-none items-center justify-between gap-4 font-semibold text-primary-dark focus-visible:rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-dark [&::-webkit-details-marker]:hidden">{question}<span aria-hidden="true" className="shrink-0 text-xl text-gold-foreground group-open:rotate-45">+</span></summary>
              <p className="mt-3 pr-6 text-sm leading-7 text-muted-foreground">{answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
