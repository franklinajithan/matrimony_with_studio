import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { company } from "@/lib/company";

export const metadata: Metadata = {
  title: "Contact and Company Details | CupidMatch",
  description: "Company information for CupidMatch, a digital product operated by Arulvexa Technologies Ltd, company number 17563017.",
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-12 sm:py-16">
      <header className="space-y-4">
        <h1 className="font-headline text-4xl font-bold text-primary sm:text-5xl">Contact and Company Details</h1>
        <p className="text-lg leading-8 text-muted-foreground">CupidMatch is a digital product operated by {company.name}.</p>
      </header>
      <Card>
        <CardHeader><CardTitle className="font-headline text-2xl">About the company</CardTitle></CardHeader>
        <CardContent className="space-y-6">
          <p className="leading-7 text-muted-foreground">{company.name} develops and operates software and online platforms, including the CupidMatch matrimonial platform.</p>
          <dl className="grid gap-5 sm:grid-cols-2">
            <div><dt className="font-semibold">Company name</dt><dd className="mt-1 text-muted-foreground">{company.name}</dd></div>
            <div><dt className="font-semibold">Company number</dt><dd className="mt-1 text-muted-foreground">{company.number}</dd></div>
            <div><dt className="font-semibold">Registered office</dt><dd className="mt-1 leading-7 text-muted-foreground"><address className="not-italic">{company.registeredOffice}</address></dd></div>
            <div><dt className="font-semibold">Incorporated on</dt><dd className="mt-1 text-muted-foreground">{company.incorporatedOn}</dd></div>
          </dl>
          <a href={company.registerUrl} className="inline-flex min-h-11 items-center font-semibold text-primary underline underline-offset-4">View the Companies House record</a>
        </CardContent>
      </Card>
      <nav aria-label="Support information" className="flex flex-wrap gap-6">
        <Link href="/feedback" className="inline-flex min-h-11 items-center text-primary underline underline-offset-4">Feedback &amp; support</Link>
        <Link href="/safety" className="inline-flex min-h-11 items-center text-primary underline underline-offset-4">Safety guidance</Link>
        <Link href="/privacy" className="inline-flex min-h-11 items-center text-primary underline underline-offset-4">Privacy policy</Link>
      </nav>
    </div>
  );
}
