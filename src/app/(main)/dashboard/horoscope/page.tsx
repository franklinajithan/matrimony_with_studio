"use client";

import Link from "next/link";
import {
  Edit3,
  Eye,
  FileText,
  HeartHandshake,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
  UploadCloud,
  Users,
  Wand2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { PageFrame, PageHero } from "@/components/dashboard/PageHero";
import { ExtractHoroscopeDetailsForm } from "./components/ExtractHoroscopeDetailsForm";
import { HoroscopeCompatibilityForm } from "./components/HoroscopeCompatibilityForm";

const tools = [
  {
    id: "birth-chart",
    icon: Wand2,
    title: "Create or analyse my horoscope",
    description: "Use your birth details or an existing horoscope PDF/image to build your astrological profile.",
    content: <ExtractHoroscopeDetailsForm />,
  },
  {
    id: "match-compatibility",
    icon: Users,
    title: "Horoscope compatibility",
    description: "Compare two astrological profiles while keeping horoscope separate from CupidMatch relationship matching.",
    content: <HoroscopeCompatibilityForm />,
  },
  {
    id: "manual-details",
    icon: Edit3,
    title: "Saved horoscope details",
    description: "Review Rasi, Nakshatra and other horoscope information stored with your profile.",
    content: (
      <div className="space-y-4">
        <p className="text-sm leading-6 text-muted-foreground">
          Keep your saved details accurate so they remain consistent when you choose to use horoscope matching.
        </p>
        <Button asChild className="rounded-xl">
          <Link href="/dashboard/edit-profile#horoscopeInfo">Edit horoscope details</Link>
        </Button>
      </div>
    ),
  },
  {
    id: "horoscope-document",
    icon: UploadCloud,
    title: "Existing horoscope document",
    description: "Keep an existing chart PDF or image with your profile and replace it whenever you need.",
    content: (
      <div className="space-y-4">
        <p className="text-sm leading-6 text-muted-foreground">
          Uploaded horoscope documents are supporting material. Always review extracted information before using it for a comparison.
        </p>
        <Button asChild variant="outline" className="rounded-xl">
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
        eyebrow="Optional cultural matching"
        title={
          <span className="inline-flex items-center gap-2">
            <Sparkles className="h-7 w-7 text-primary" aria-hidden />
            Horoscope
          </span>
        }
        description="Create, manage and compare horoscope details when they matter to you. Your birth information stays separate from your public profile unless you choose to share it."
        actions={
          <Button asChild variant="outline" className="rounded-xl bg-white/80">
            <Link href="/discover">Browse matches</Link>
          </Button>
        }
      />

      <section className="mb-6 grid gap-3 sm:grid-cols-3" aria-label="Horoscope privacy">
        <div className="rounded-2xl border bg-card p-4 shadow-sm">
          <div className="mb-3 grid h-9 w-9 place-items-center rounded-xl bg-violet-50 text-primary">
            <LockKeyhole className="h-4 w-4" aria-hidden />
          </div>
          <h2 className="font-semibold">Private by default</h2>
          <p className="mt-1 text-sm leading-5 text-muted-foreground">Birth time and horoscope documents are not presented as public profile information.</p>
        </div>
        <div className="rounded-2xl border bg-card p-4 shadow-sm">
          <div className="mb-3 grid h-9 w-9 place-items-center rounded-xl bg-violet-50 text-primary">
            <Eye className="h-4 w-4" aria-hidden />
          </div>
          <h2 className="font-semibold">You control sharing</h2>
          <p className="mt-1 text-sm leading-5 text-muted-foreground">Use horoscope details only when you want to compare or share them with a match or family.</p>
        </div>
        <div className="rounded-2xl border bg-card p-4 shadow-sm">
          <div className="mb-3 grid h-9 w-9 place-items-center rounded-xl bg-violet-50 text-primary">
            <HeartHandshake className="h-4 w-4" aria-hidden />
          </div>
          <h2 className="font-semibold">One part of compatibility</h2>
          <p className="mt-1 text-sm leading-5 text-muted-foreground">Astrology is optional and does not replace values, goals, communication or your own judgment.</p>
        </div>
      </section>

      <div className="mb-6 rounded-2xl border border-violet-100 bg-violet-50/60 p-4 sm:flex sm:items-center sm:justify-between sm:gap-4">
        <div className="flex gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
          <div>
            <p className="font-semibold">Your horoscope preference</p>
            <p className="mt-1 text-sm text-muted-foreground">Choose how important horoscope matching is to you from Partner preferences.</p>
          </div>
        </div>
        <Button asChild variant="outline" className="mt-4 w-full rounded-xl bg-white sm:mt-0 sm:w-auto">
          <Link href="/dashboard/preferences">Set preference</Link>
        </Button>
      </div>

      <Accordion type="multiple" defaultValue={["birth-chart"]} className="space-y-4">
        {tools.map((tool) => {
          const Icon = tool.icon;
          return (
            <AccordionItem key={tool.id} value={tool.id} className="overflow-hidden rounded-2xl border bg-white shadow-sm">
              <AccordionTrigger className="px-4 py-4 hover:no-underline sm:px-6">
                <div className="flex min-w-0 items-start gap-3 text-left">
                  <span className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-violet-50 text-primary">
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-base font-semibold sm:text-lg">{tool.title}</span>
                    <span className="mt-1 block text-sm font-normal leading-5 text-muted-foreground">{tool.description}</span>
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="border-t px-4 pb-5 pt-4 sm:px-6">{tool.content}</AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>

      <div className="mt-6 flex items-start gap-3 rounded-2xl border bg-card p-4 text-sm text-muted-foreground">
        <FileText className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        <p>Horoscope and AI-generated astrological information is provided as an optional cultural feature. Review generated details before sharing or relying on them.</p>
      </div>
    </PageFrame>
  );
}
