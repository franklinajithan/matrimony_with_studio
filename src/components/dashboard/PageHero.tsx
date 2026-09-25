import * as React from "react";
import { cn } from "@/lib/utils";

/** Shared page frame — one content width for every dashboard screen. */
export function PageFrame({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
  /** @deprecated Kept for call-site compatibility; all pages use the same width. */
  width?: "default" | "narrow" | "wide";
}) {
  return (
    <div className={cn("mx-auto w-full max-w-6xl space-y-7 pb-8", className)}>
      {children}
    </div>
  );
}

type PageHeroProps = {
  eyebrow?: string;
  title?: React.ReactNode;
  /** Hide the repeated in-card title when the app chrome already names the page. */
  showTitle?: boolean;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  leading?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
};

/** Soft gradient page header — full width of PageFrame. */
export function PageHero({
  eyebrow,
  title,
  showTitle = false,
  description,
  actions,
  leading,
  children,
  className,
}: PageHeroProps) {
  return (
    <section
      className={cn(
        "relative w-full overflow-hidden rounded-[30px] border border-[#eadce5]",
        "bg-[linear-gradient(135deg,#fffaf4_0%,#fff_48%,#f8eef7_100%)]",
        "p-5 shadow-[0_14px_45px_rgba(67,31,61,0.08)] sm:p-7",
        "[&_input]:min-w-0 [&_input]:rounded-xl [&_input]:border [&_input]:border-[#dfcfdb] [&_input]:bg-white/90 [&_input]:px-3 [&_input]:py-2 [&_input]:shadow-sm",
        "[&_input]:transition-colors [&_input]:placeholder:text-[#9a8495] [&_input:focus]:border-[#8b2be2] [&_input:focus]:bg-white",
        className
      )}
    >
      <div className="pointer-events-none absolute inset-0 opacity-60" aria-hidden>
        <div className="absolute -right-8 -top-10 h-32 w-32 rotate-12 rounded-[28px] border border-[#dcb8d4]/45" />
        <div className="absolute right-8 top-5 h-16 w-16 rotate-45 rounded-2xl border border-[#ead4e5]/55" />
        <div className="absolute bottom-5 right-24 h-2 w-2 rounded-full bg-[#cba3c5]/35 shadow-[24px_-18px_0_rgba(203,163,197,0.22),48px_4px_0_rgba(203,163,197,0.18)]" />
      </div>
      <div className="relative flex w-full flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 w-full flex-1 flex-col gap-5 sm:flex-row sm:items-center">
          {leading}
          <div className="min-w-0 w-full flex-1">
            {eyebrow ? (
              <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#8d5b84]">
                {eyebrow}
              </p>
            ) : null}
            {showTitle && title ? (
              <h1 className="text-2xl font-semibold tracking-tight text-[#351532] sm:text-3xl">
                {title}
              </h1>
            ) : null}
            {description ? (
              <div className="mt-1.5 max-w-2xl text-sm text-[#745d70] sm:text-base">
                {description}
              </div>
            ) : null}
            {children}
          </div>
        </div>
        {actions ? (
          <div className="flex w-full shrink-0 flex-wrap items-center gap-3 md:w-auto">
            {actions}
          </div>
        ) : null}
      </div>
    </section>
  );
}
