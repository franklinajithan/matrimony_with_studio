import Link from "next/link";
export function CommunityStories() {
  return (
    <section
      className="bg-[#FBF8F4] px-5 py-12 lg:py-20"
      aria-labelledby="community-stories-heading"
    >
      <div className="mx-auto max-w-3xl rounded-3xl border border-violet-100 bg-white p-8 text-center shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-widest text-violet-700">
          Stories shared with permission
        </p>
        <h2
          id="community-stories-heading"
          className="mt-3 font-serif text-4xl font-semibold text-[#2A1845]"
        >
          Community stories
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-[#6B5A78]">
          Read member-submitted stories that have been approved for publication.
          Stories appear only when members choose to share them.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link
            href="/success-stories"
            className="rounded-full bg-violet-700 px-6 py-3 font-semibold text-white"
          >
            Read approved stories
          </Link>
          <Link
            href="/success-stories/submit"
            className="rounded-full border border-violet-200 px-6 py-3 font-semibold text-violet-800"
          >
            Share your story
          </Link>
        </div>
      </div>
    </section>
  );
}
