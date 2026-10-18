import Link from "next/link";
import { articles } from "@/lib/content/articles";
export const metadata = {
  title: "Guides | CupidMatch",
  description:
    "Practical guides to profiles, cultural preferences and thoughtful introductions.",
};
export default function Blog() {
  return (
    <div className="space-y-8 py-10">
      <header className="rounded-3xl border border-violet-100 bg-violet-50 p-8 sm:p-12">
        <p className="text-xs font-bold uppercase tracking-widest text-violet-700">
          CupidMatch guides
        </p>
        <h1 className="mt-3 text-4xl font-bold">
          A little clarity for your next step
        </h1>
        <p className="mt-4 max-w-2xl leading-7 text-slate-600">
          Practical ideas for creating your profile, talking about what matters
          and getting to know someone at your own pace.
        </p>
      </header>
      <section className="grid gap-5 md:grid-cols-3">
        {articles.map((a) => (
          <article
            key={a.slug}
            className="flex flex-col rounded-2xl border bg-white p-6"
          >
            <p className="text-xs font-semibold uppercase text-violet-700">
              {a.category}
            </p>
            <h2 className="mt-4 text-xl font-bold">
              <Link href={`/blog/${a.slug}`}>{a.title}</Link>
            </h2>
            <p className="my-4 text-sm leading-6 text-slate-500">
              {a.description}
            </p>
            <Link
              href={`/blog/${a.slug}`}
              className="mt-auto text-sm font-semibold text-violet-700"
            >
              Read guide →
            </Link>
          </article>
        ))}
      </section>
    </div>
  );
}
