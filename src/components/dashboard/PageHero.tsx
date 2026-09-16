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
  title: React.ReactNode;
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
        "bg-[radial-gradient(circle_at_88%_12%,rgba(184,113,172,0.20),transparent_34%),linear-gradient(135deg,#fffaf4_0%,#fff_45%,#f8eef7_100%)]",
        "p-5 shadow-[0_14px_45px_rgba(67,31,61,0.08)] sm:p-7",
        className
      )}
    >
      <div
        className="absolute -right-12 -top-14 h-40 w-40 rounded-full border border-[#dcb8d4]/50"
        aria-hidden
      />
      <div className="relative flex w-full flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 w-full flex-1 flex-col gap-5 sm:flex-row sm:items-center">
          {leading}
          <div className="min-w-0 w-full flex-1">
            {eyebrow ? (
              <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#8d5b84]">
                {eyebrow}
              </p>
            ) : null}
            <h1 className="text-2xl font-semibold tracking-tight text-[#351532] sm:text-3xl">
              {title}
            </h1>
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
