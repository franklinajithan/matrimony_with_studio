import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { matrimonyGuidePath, matrimonyGuides } from "@/lib/matrimony-guides";

type Props = { params: Promise<{ guide: string }> };
export const dynamicParams = false;

export function generateStaticParams() {
  return matrimonyGuides.map(({ slug }) => ({ guide: slug }));
}

async function getGuide(params: Props["params"]) {
  const { guide } = await params;
  return matrimonyGuides.find(({ slug }) => slug === guide) ?? notFound();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, title, description } = await getGuide(params);
  const url = matrimonyGuidePath(slug);
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: "article" },
  };
}

export default async function GuidePage({ params }: Props) {
  const guide = await getGuide(params);
  return (
    <article className="mx-auto max-w-3xl space-y-8 px-5 py-12 sm:py-16">
      <header className="space-y-4">
        <Link href="/matrimony-guides" className="text-sm text-primary underline">Matrimony guides</Link>
        <h1 className="font-headline text-4xl font-bold text-primary">{guide.title}</h1>
        <p className="text-lg text-muted-foreground">{guide.intro}</p>
      </header>
      {guide.sections.map(({ title, text }) => (
        <section key={title} className="space-y-3">
          <h2 className="text-2xl font-semibold">{title}</h2>
          <p className="leading-8">{text}</p>
        </section>
      ))}
      <section className="space-y-5" aria-labelledby="guide-questions">
        <h2 id="guide-questions" className="text-2xl font-semibold">Common questions</h2>
        {guide.questions.map(({ question, answer }) => (
          <div key={question} className="space-y-2 rounded-xl border bg-card p-5">
            <h3 className="font-semibold">{question}</h3>
            <p className="leading-7 text-muted-foreground">{answer}</p>
          </div>
        ))}
      </section>
      <div className="flex flex-wrap items-center gap-4">
        <Link href="/signup" className="inline-flex rounded-full bg-primary px-5 py-3 font-semibold text-primary-foreground">Create a free profile</Link>
        <Link href={guide.related.href} className="text-primary underline">{guide.related.label}</Link>
      </div>
    </article>
  );
}
