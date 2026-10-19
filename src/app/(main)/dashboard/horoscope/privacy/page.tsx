import Link from "next/link";
export default function Page() {
  return (
    <article className="mx-auto max-w-3xl space-y-5 p-5 pb-28 sm:p-8">
      <h1 className="font-headline text-3xl text-purple-950">
        Horoscope information & your choices
      </h1>
      <p>
        Birth date, time, location and chart documents are personal information.
        Only provide your own information or information you are authorised to
        provide. This feature is optional.
      </p>
      <h2 className="text-xl font-semibold">Visibility</h2>
      <p>
        New records are private. If you share a horoscope, select each field
        permitted for eligible members or approved connections. Source files,
        original values and extraction provenance are never shared with other
        members. Blocking and account suspension override access.
      </p>
      <h2 className="text-xl font-semibold">Optional AI processing</h2>
      <p>
        OCR sends the selected source document to Google Gemini only after you
        confirm processing consent for that session. AI explanations require
        both members’ saved AI consent and comparison permission. Only selected
        shared chart fields are sent for explanations. Model confidence is not a
        measured accuracy rate. No automatic chart calculation or traditional
        score is enabled.
      </p>
      <h2 className="text-xl font-semibold">Storage and deletion</h2>
      <p>
        Source documents use private storage and temporary links valid for 60
        seconds. Access ends at the retention date displayed beside each
        document. Deleting a source removes that source and its extraction
        records; confirmed horoscope values remain until edited or deleted.
        Delete horoscope removes the private horoscope and its documents.
        Reports expire after one day and become inaccessible when data or
        permissions change. Previously downloaded copies cannot be recalled.
        Minimal activity counts are retained for up to 90 days.
      </p>
      <h2 className="text-xl font-semibold">Before public rollout</h2>
      <p>
        The site operator must confirm its UK GDPR lawful basis, controller
        contact, rights-request process, international transfer safeguards,
        provider retention terms and any required data protection assessment. AI
        processing remains disabled until these checks are completed. This
        information page does not assert that those operational checks have been
        completed.
      </p>
      <Link
        className="inline-block text-purple-800 underline"
        href="/dashboard/horoscope"
      >
        Back to My Horoscope
      </Link>
    </article>
  );
}
