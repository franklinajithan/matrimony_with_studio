import Link from "next/link";
import { Button } from "@/components/ui/button";
export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center gap-5 p-6 text-center">
      <p className="font-semibold text-violet-700">CupidMatch</p>
      <h1 className="text-4xl font-bold">Page not found</h1>
      <p className="leading-7 text-slate-500">
        This link may have changed or the page may no longer be available.
      </p>
      <div className="flex gap-3">
        <Button asChild>
          <Link href="/">Go home</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/contact">Get help</Link>
        </Button>
      </div>
    </main>
  );
}
