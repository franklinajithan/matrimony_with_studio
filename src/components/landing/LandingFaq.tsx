import Link from "next/link";
import { ArrowRight, HelpCircle } from "lucide-react";

const questions = [
  { question: "How do I get started?", answer: "Create an account, complete your profile and add your partner preferences. You can then explore the introductions available to you." },
  { question: "Can I choose what I look for in a partner?", answer: "Yes. CupidMatch includes partner preferences so you can focus on details that matter to you." },
  { question: "Does CupidMatch support horoscope information?", answer: "Horoscope details are part of the CupidMatch profile experience. The availability of advanced comparisons depends on the features enabled for your account." },
  { question: "How do I manage my privacy?", answer: "Review the privacy and profile settings available in your account. For further details, read our privacy and safety pages." },
  { question: "Where can I see membership options?", answer: "Visit the membership page for the current plans and benefits. Available features and pricing are shown there." },
] as const;

export function LandingFaq() {
  return (
    <section id="faq" aria-labelledby="faq-heading" className="scroll-mt-24 bg-[#FFFDFB] px-5 py-16 sm:py-20 lg:py-24">
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[.8fr_1.2fr] lg:gap-16">
        <div>
          <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[.18em] text-[#8556A3]"><HelpCircle aria-hidden="true" className="h-4 w-4" /> Questions & answers</span>
          <h2 id="faq-heading" className="mt-4 font-serif text-4xl font-semibold leading-tight text-[#29133F] sm:text-5xl">Everything you need to know to begin.</h2>
          <p className="mt-5 max-w-md text-base leading-7 text-[#665872]">A few helpful answers before you start your CupidMatch journey.</p>
          <Link href="/contact" className="mt-6 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[#51217B] underline-offset-4 hover:underline">Still have questions? Contact us <ArrowRight aria-hidden="true" className="h-4 w-4" /></Link>
        </div>
        <div className="space-y-3">
          {questions.map(({question,answer}) => (
            <details key={question} className="group rounded-2xl border border-[#EDE4F3] bg-white px-5 py-4 shadow-sm open:border-[#D8BCEB] sm:px-6">
              <summary className="flex min-h-8 cursor-pointer list-none items-center justify-between gap-4 font-semibold text-[#29133F] focus-visible:rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#51217B] [&::-webkit-details-marker]:hidden">{question}<span aria-hidden="true" className="shrink-0 text-xl text-[#8556A3] group-open:rotate-45">+</span></summary>
              <p className="mt-3 pr-6 text-sm leading-7 text-[#665872]">{answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
