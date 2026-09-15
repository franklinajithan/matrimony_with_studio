"use client";

import Link from "next/link";
import { useState } from "react";
import { Logo } from "@/components/shared/Logo";
import { Globe } from "lucide-react";

const linkClass =
  "text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

const headingClass = "text-sm font-semibold uppercase tracking-wider text-foreground";

export function Footer() {
  const [language, setLanguage] = useState<'en' | 'si' | 'ta'>('en');

  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-5">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <Logo textSize="text-xl" />
            <p className="mt-4 max-w-sm text-sm leading-6 text-muted-foreground">
              Meet someone who understands where you come from — and where you're going.
            </p>
            <p className="mt-3 text-sm font-medium text-foreground">
              Modern relationship intelligence, shaped for Sri Lankan lives around the world.
            </p>
            
            {/* Language Selector in Footer */}
            <div className="mt-6">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Language
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setLanguage('en')}
                  className={`flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm transition-colors ${
                    language === 'en'
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-background hover:bg-accent'
                  }`}
                >
                  <Globe className="h-3.5 w-3.5" />
                  English
                </button>
                <button
                  onClick={() => setLanguage('si')}
                  className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
                    language === 'si'
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-background hover:bg-accent'
                  }`}
                >
                  සිංහල
                </button>
                <button
                  onClick={() => setLanguage('ta')}
                  className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
                    language === 'ta'
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-background hover:bg-accent'
                  }`}
                >
                  தமிழ்
                </button>
              </div>
            </div>
          </div>

          {/* CupidMatch Links */}
          <div>
            <h2 className={headingClass}>CupidMatch</h2>
            <ul className="mt-4 space-y-3">
              <li>
                <Link href="/about" className={linkClass}>
                  About
                </Link>
              </li>
              <li>
                <Link href="/discover" className={linkClass}>
                  Discover
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

          {/* Support & Legal */}
          <div>
            <h2 className={headingClass}>Support</h2>
            <ul className="mt-4 space-y-3">
              <li>
                <Link href="/contact" className={linkClass}>
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/safety" className={linkClass}>
                  Safety
                </Link>
              </li>
              <li>
                <Link href="/#faq" className={linkClass}>
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/accessibility" className={linkClass}>
                  Accessibility
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h2 className={headingClass}>Legal</h2>
            <ul className="mt-4 space-y-3">
              <li>
                <Link href="/privacy" className={linkClass}>
                  Privacy
                </Link>
              </li>
              <li>
                <Link href="/terms" className={linkClass}>
                  Terms
                </Link>
              </li>
              <li>
                <Link href="/community-guidelines" className={linkClass}>
                  Community Guidelines
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 border-t border-border pt-8">
          <div className="flex flex-col gap-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <p>&copy; {currentYear} CupidMatch. All rights reserved.</p>
            <p className="font-medium text-foreground">Connect with clarity and confidence.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
