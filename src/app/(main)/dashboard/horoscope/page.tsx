"use client";

import Link from "next/link";
import { Edit3, Sparkles, UploadCloud, Users, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { PageFrame, PageHero } from "@/components/dashboard/PageHero";
import { ExtractHoroscopeDetailsForm } from "./components/ExtractHoroscopeDetailsForm";
import { HoroscopeCompatibilityForm } from "./components/HoroscopeCompatibilityForm";

const tools = [
  {
    id: "ai-analysis",
    icon: Wand2,
    title: "AI horoscope analysis",
    description: "Get detailed insights from your birth data or a PDF/image chart.",
    content: <ExtractHoroscopeDetailsForm />,
  },
  {
    id: "match-compatibility",
    icon: Users,
    title: "AI compatibility",
    description: "See how your chart aligns with a potential match.",
    content: <HoroscopeCompatibilityForm />,
  },
  {
    id: "manual-details",
    icon: Edit3,
    title: "Your horoscope details",
    description: "Keep Rasi, Nakshatra and related notes accurate in your profile.",
    content: (
      <div className="space-y-4">
        <p className="text-sm leading-6 text-[#745d70]">
          Your horoscope details help with compatibility suggestions. Manage them in your profile so
          matches stay consistent across Discover and messaging.
        </p>
        <Button asChild className="rounded-xl">
          <Link href="/dashboard/edit-profile#horoscopeInfo">Edit horoscope in profile</Link>
        </Button>
      </div>
    ),
  },
  {
    id: "horoscope-document",
    icon: UploadCloud,
    title: "Horoscope document",
    description: "Upload or update your chart PDF or image for analysis and sharing.",
    content: (
      <div className="space-y-4">
        <p className="text-sm leading-6 text-[#745d70]">
          A clear chart file helps AI analysis and lets you share details when you choose. Upload it
          from your profile.
        </p>
        <Button asChild variant="outline" className="rounded-xl border-[#dcc9d8]">
          <Link href="/dashboard/edit-profile#horoscopeFile-input">Upload or change document</Link>
        </Button>
      </div>
    ),
  },
];

export default function HoroscopePage() {
  return (
    <PageFrame>
      <PageHero
        eyebrow="Stars & compatibility"
        title={
          <span className="inline-flex items-center gap-2">
            <Sparkles className="h-7 w-7 text-primary" aria-hidden />
            Horoscope studio
          </span>
        }
        description="Analyse your chart, compare compatibility, and keep your details aligned with the rest of your CupidMatch profile."
        actions={
          <Button asChild variant="outline" className="rounded-xl border-[#dcc9d8] bg-white/80">
            <Link href="/discover">Browse matches</Link>
          </Button>
        }
      />

      <Accordion type="multiple" defaultValue={["ai-analysis"]} className="space-y-4">
        {tools.map((tool) => {
          const Icon = tool.icon;
          return (
            <AccordionItem
              key={tool.id}
              value={tool.id}
              className="overflow-hidden rounded-2xl border border-[#eadde7] bg-white shadow-[0_10px_28px_rgba(75,32,67,0.06)]"
            >
              <AccordionTrigger className="px-5 py-4 hover:no-underline sm:px-6">
                <div className="flex items-start gap-3 text-left">
                  <span className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#F1ECFF] text-primary">
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <span>
                    <span className="block text-lg font-semibold text-[#351532]">{tool.title}</span>
                    <span className="mt-0.5 block text-sm font-normal text-[#745d70]">
                      {tool.description}
                    </span>
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="border-t border-[#f0e8ee] px-5 pb-5 pt-4 sm:px-6">
                {tool.content}
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </PageFrame>
  );
}
