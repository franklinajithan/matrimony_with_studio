import Link from "next/link";
import { Logo } from "@/components/shared/Logo";

const linkClass =
  "text-sm text-[#725E6D] transition hover:text-[#4B164C] focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4B164C] focus-visible:ring-offset-2";

export function Footer() {
  return (
    <footer className="border-t border-[#EADFD6] bg-[#FFFDF9]">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-1">
          <Logo textSize="text-xl" />
          <p className="mt-4 max-w-xs text-sm leading-6 text-[#725E6D]">
            A thoughtful matrimony platform for Indian and Sri Lankan communities
            seeking commitment, culture and long-term partnership.
          </p>
        </div>

        <div>
          <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#4B164C]">
            CupidMatch
          </h2>
          <ul className="mt-4 space-y-2.5">
            <li>
              <Link href="/about" className={linkClass}>
                About Us
              </Link>
            </li>
            <li>
              <Link href="/success-stories" className={linkClass}>
                Success Stories
              </Link>
            </li>
            <li>
              <Link href="/pricing" className={linkClass}>
                Pricing
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#4B164C]">
            Support
          </h2>
          <ul className="mt-4 space-y-2.5">
            <li>
              <Link href="/contact" className={linkClass}>
                Contact Us
              </Link>
            </li>
            <li>
              <Link href="/#faq" className={linkClass}>
                FAQ
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#4B164C]">
            Account
          </h2>
          <ul className="mt-4 space-y-2.5">
            <li>
              <Link href="/login" className={linkClass}>
                Log In
              </Link>
            </li>
            <li>
              <Link href="/signup" className={linkClass}>
                Sign Up
              </Link>
            </li>
            <li>
              <Link href="/admin" className={linkClass}>
                Admin Panel
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-[#EADFD6]">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 text-sm text-[#725E6D] sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>&copy; {new Date().getFullYear()} CupidMatch. All rights reserved.</p>
          <p>Crafted for meaningful introductions.</p>
        </div>
      </div>
    </footer>
  );
}
