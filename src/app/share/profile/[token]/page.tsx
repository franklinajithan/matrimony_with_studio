import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, MapPin, Briefcase } from "lucide-react";
import { resolveSharedProfile } from "@/lib/supabase/profile-share";
import { Button } from "@/components/ui/button";

export const robots = { index: false, follow: false };
export const dynamic = "force-dynamic";

const SHARE_CARD_VERSION = "1";
const GENERIC_TITLE = "Shared profile | CupidMatch";
const EXPIRED_DESCRIPTION = "This shared profile link has expired.";

type PageProps = {
  params: Promise<{ token: string }>;
};

function firstName(displayName: string): string {
  const part = displayName.trim().split(/\s+/)[0];
  return part || "Member";
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { token } = await params;
  const shared = await resolveSharedProfile(token);

  if (!shared) {
    const imageUrl = `/share/profile/${encodeURIComponent(token)}/opengraph-image?v=${SHARE_CARD_VERSION}`;
    return {
      title: GENERIC_TITLE,
      description: EXPIRED_DESCRIPTION,
      robots,
      openGraph: {
        type: "website",
        title: GENERIC_TITLE,
        description: EXPIRED_DESCRIPTION,
        images: [{ url: imageUrl, width: 1200, height: 630, alt: "CupidMatch" }],
      },
      twitter: {
        card: "summary_large_image",
        title: GENERIC_TITLE,
        description: EXPIRED_DESCRIPTION,
        images: [imageUrl],
      },
    };
  }

  const name = firstName(shared.displayName);
  const title = `${name} on CupidMatch`;
  const bits = [
    shared.age ? `${shared.age}` : null,
    shared.profession,
    shared.location,
  ].filter(Boolean);
  const description =
    bits.length > 0
      ? `${bits.join(" · ")} — shared temporarily on CupidMatch.`
      : "A member profile shared temporarily on CupidMatch.";
  const imageUrl = `/share/profile/${encodeURIComponent(token)}/opengraph-image?v=${SHARE_CARD_VERSION}`;
  const canonical = `/share/profile/${encodeURIComponent(token)}`;

  return {
    title,
    description,
    robots,
    alternates: { canonical },
    openGraph: {
      type: "website",
      url: canonical,
      title,
      description,
      images: [{ url: imageUrl, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
  };
}

function ExpiredSharePage() {
  return (
    <main className="mx-auto flex min-h-[100svh] max-w-lg flex-col items-center justify-center px-6 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8d5b84]">CupidMatch</p>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight text-[#351532]">
        This shared profile link has expired.
      </h1>
      <p className="mt-3 text-sm leading-6 text-[#745d70]">
        Temporary profile links last 24 hours and cannot be refreshed. Ask the member to share a new
        link, or visit CupidMatch to explore.
      </p>
      <Button asChild className="mt-8 rounded-xl px-6">
        <Link href="/">Visit CupidMatch</Link>
      </Button>
    </main>
  );
}

export default async function SharedProfilePage({ params }: PageProps) {
  const { token } = await params;
  const shared = await resolveSharedProfile(token);

  if (!shared) {
    return <ExpiredSharePage />;
  }

  const name = firstName(shared.displayName);
  const initials = name.slice(0, 2).toUpperCase();

  return (
    <main className="min-h-[100svh] bg-[linear-gradient(180deg,#fffaf4_0%,#f8eef7_45%,#fff_100%)]">
      <div className="mx-auto flex max-w-md flex-col gap-6 px-4 py-10 sm:py-14">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8d5b84]">
            CupidMatch
          </p>
          <h1 className="mt-2 text-sm font-medium text-[#745d70]">Shared profile</h1>
        </div>

        <article className="overflow-hidden rounded-[28px] border border-[#eadce5] bg-white shadow-[0_14px_40px_rgba(67,31,61,0.08)]">
          <div className="bg-[radial-gradient(circle_at_80%_0%,rgba(184,113,172,0.18),transparent_42%),linear-gradient(135deg,#fffaf4,#f8eef7)] px-6 pb-6 pt-8 text-center">
            <div className="mx-auto h-28 w-28 overflow-hidden rounded-full border-4 border-white shadow-md">
              {shared.photoURL ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={shared.photoURL}
                  alt=""
                  className="h-full w-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-[#f1ecff] text-2xl font-semibold text-[#713c78]">
                  {initials}
                </div>
              )}
            </div>
            <h2 className="mt-4 flex items-center justify-center gap-1.5 text-2xl font-semibold text-[#351532]">
              {name}
              {shared.age != null ? (
                <span className="font-normal text-[#745d70]">, {shared.age}</span>
              ) : null}
              {shared.isVerified ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-600" aria-label="Verified" />
              ) : null}
            </h2>
            <div className="mt-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-sm text-[#745d70]">
              {shared.profession ? (
                <span className="inline-flex items-center gap-1">
                  <Briefcase className="h-3.5 w-3.5" aria-hidden />
                  {shared.profession}
                </span>
              ) : null}
              {shared.location ? (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" aria-hidden />
                  {shared.location}
                </span>
              ) : null}
            </div>
          </div>

          {shared.bio ? (
            <div className="border-t border-[#f0e8ee] px-6 py-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#9b668f]">About</p>
              <p className="mt-2 text-sm leading-6 text-[#4a3a48]">{shared.bio}</p>
            </div>
          ) : null}

          <div className="border-t border-[#f0e8ee] px-6 py-5">
            <p className="text-center text-xs text-[#9b668f]">
              This temporary link expires{" "}
              <time dateTime={shared.expiresAt}>
                {new Date(shared.expiresAt).toLocaleString(undefined, {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </time>
              .
            </p>
            <Button asChild className="mt-4 w-full rounded-xl">
              <Link href="/signup">View on CupidMatch</Link>
            </Button>
            <Button asChild variant="ghost" className="mt-2 w-full rounded-xl text-[#745d70]">
              <Link href="/">Learn more</Link>
            </Button>
          </div>
        </article>
      </div>
    </main>
  );
}
