import Link from "next/link";
import { notFound } from "next/navigation";
import { articles } from "@/lib/content/articles";
type Props = { params: Promise<{ slug: string }> };
export function generateStaticParams() {
  return articles.map((a) => ({ slug: a.slug }));
}
export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const article = articles.find((a) => a.slug === slug);
  return article
    ? {
        title: `${article.title} | CupidMatch`,
        description: article.description,
      }
    : { title: "Guide not found | CupidMatch" };
}
export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const a = articles.find((a) => a.slug === slug);
  if (!a) notFound();
  return (
    <article className="mx-auto max-w-3xl space-y-8 py-10">
      <Link href="/blog" className="text-sm font-semibold text-violet-700">
        ← All guides
      </Link>
      <header className="border-b pb-8">
        <p className="text-xs font-bold uppercase tracking-widest text-violet-700">
          {a.category}
        </p>
        <h1 className="mt-4 text-3xl font-bold leading-tight sm:text-5xl">
          {a.title}
        </h1>
        <p className="mt-5 text-lg leading-8 text-slate-500">{a.description}</p>
        <p className="mt-5 text-xs text-slate-500">CupidMatch guides</p>
      </header>
      {a.sections.map((s) => (
        <section key={s.heading}>
          <h2 className="text-xl font-bold">{s.heading}</h2>
          <p className="mt-3 leading-8 text-slate-600">{s.body}</p>
        </section>
      ))}
      <aside className="rounded-2xl border bg-violet-50 p-6">
        <p className="font-semibold">Need help with your account?</p>
        <Link
          href="/contact"
          className="mt-2 inline-block text-sm text-violet-700 underline"
        >
          Visit the help centre
        </Link>
      </aside>
    </article>
  );
}
