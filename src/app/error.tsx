"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center gap-5 p-6 text-center">
      <h1 className="text-3xl font-bold">We couldn’t load this page</h1>
      <p className="leading-7 text-slate-500">
        Please try again. If the issue continues, contact the CupidMatch team.
      </p>
      <div className="flex gap-3">
        <Button onClick={reset}>Try again</Button>
        <Button variant="outline" asChild>
          <Link href="/contact">Get help</Link>
        </Button>
      </div>
    </main>
  );
}
