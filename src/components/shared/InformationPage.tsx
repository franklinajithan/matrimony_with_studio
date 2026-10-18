import Link from "next/link";
export function InformationPage({
  title,
  intro,
  sections,
}: {
  title: string;
  intro: string;
  sections: { title: string; text: string }[];
}) {
  return (
    <article className="mx-auto max-w-3xl space-y-8 py-10">
      <header className="border-b pb-8">
        <p className="text-xs font-bold uppercase tracking-widest text-violet-700">
          CupidMatch information
        </p>
        <h1 className="mt-3 text-4xl font-bold">{title}</h1>
        <p className="mt-4 text-lg leading-8 text-slate-600">{intro}</p>
        <p className="mt-4 text-xs text-slate-500">Updated 16 October 2026</p>
      </header>
      {sections.map((s) => (
        <section key={s.title}>
          <h2 className="text-xl font-bold">{s.title}</h2>
          <p className="mt-3 whitespace-pre-wrap leading-8 text-slate-600">
            {s.text}
          </p>
        </section>
      ))}
      <aside className="rounded-2xl border bg-violet-50 p-5">
        <p className="font-semibold">Questions or a concern?</p>
        <Link
          href="/contact"
          className="mt-2 inline-block text-sm text-violet-700 underline"
        >
          Contact and account help
        </Link>
      </aside>
    </article>
  );
}
