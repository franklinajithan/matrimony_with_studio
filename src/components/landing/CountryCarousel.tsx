"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { CountryCard } from "@/components/landing/CountryCard";
import { DIASPORA_COUNTRIES } from "@/data/diaspora-countries";
import { cn } from "@/lib/utils";

function scrollBehavior(): ScrollBehavior {
  if (typeof window === "undefined") return "smooth";
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
}

export function CountryCarousel() {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(0);
  const [pageCount, setPageCount] = useState(1);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(true);

  const measure = useCallback(() => {
    const root = scrollerRef.current;
    if (!root) return { cardSize: 0, visible: 1, maxScroll: 0 };
    const card = root.querySelector<HTMLElement>("[data-country-card]");
    const styles = window.getComputedStyle(root.querySelector(":scope > div") || root);
    const gap = Number.parseFloat(styles.columnGap || styles.gap || "20") || 20;
    const cardSize = (card?.offsetWidth || root.clientWidth) + gap;
    const visible = Math.max(1, Math.round(root.clientWidth / cardSize));
    const maxScroll = Math.max(0, root.scrollWidth - root.clientWidth);
    return { cardSize, visible, maxScroll };
  }, []);

  const sync = useCallback(() => {
    const root = scrollerRef.current;
    if (!root) return;
    const { cardSize, visible, maxScroll } = measure();
    const pages = Math.max(1, Math.ceil(DIASPORA_COUNTRIES.length / visible));
    const current = cardSize > 0 ? Math.round(root.scrollLeft / (cardSize * visible)) : 0;
    setPageCount(pages);
    setPage(Math.min(pages - 1, Math.max(0, current)));
    setCanPrev(root.scrollLeft > 8);
    setCanNext(root.scrollLeft < maxScroll - 8);
  }, [measure]);

  const scrollByPage = useCallback(
    (direction: 1 | -1) => {
      const root = scrollerRef.current;
      if (!root) return;
      const { cardSize, visible } = measure();
      root.scrollBy({ left: direction * cardSize * visible, behavior: scrollBehavior() });
    },
    [measure]
  );

  const goToPage = useCallback(
    (nextPage: number) => {
      const root = scrollerRef.current;
      if (!root) return;
      const { cardSize, visible } = measure();
      root.scrollTo({ left: nextPage * cardSize * visible, behavior: scrollBehavior() });
    },
    [measure]
  );

  useEffect(() => {
    const root = scrollerRef.current;
    if (!root) return;
    sync();
    const frame = () => sync();
    root.addEventListener("scroll", frame, { passive: true });
    window.addEventListener("resize", frame);
    const observer = new ResizeObserver(frame);
    observer.observe(root);
    return () => {
      root.removeEventListener("scroll", frame);
      window.removeEventListener("resize", frame);
      observer.disconnect();
    };
  }, [sync]);

  return (
    <div
      className="relative"
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft") {
          event.preventDefault();
          scrollByPage(-1);
        }
        if (event.key === "ArrowRight") {
          event.preventDefault();
          scrollByPage(1);
        }
      }}
    >
      <div className="flex items-center gap-3 lg:gap-4">
        <button
          type="button"
          onClick={() => scrollByPage(-1)}
          disabled={!canPrev}
          aria-label="Show previous countries"
          className={cn(
            "hidden h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[#E4D4F5] bg-white text-[#7C3AED] shadow-[0_8px_24px_rgba(74,32,110,0.1)] transition-all md:inline-flex lg:h-14 lg:w-14",
            "hover:bg-[#F5F0FF] disabled:cursor-not-allowed disabled:opacity-35"
          )}
        >
          <ChevronLeft className="h-6 w-6" aria-hidden="true" />
        </button>

        <div
          ref={scrollerRef}
          tabIndex={0}
          role="region"
          aria-roledescription="carousel"
          aria-label="Sri Lankan communities by country"
          className="min-w-0 flex-1 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] snap-x snap-mandatory scroll-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C3AED] focus-visible:ring-offset-2 [&::-webkit-scrollbar]:hidden"
        >
          <div className="flex gap-4 sm:gap-5">
            {DIASPORA_COUNTRIES.map((country) => (
              <div
                key={country.id}
                className="w-[86%] shrink-0 snap-start sm:w-[calc((100%-1.25rem)/2)] md:w-[calc((100%-2.5rem)/3)] lg:w-[calc((100%-3.75rem)/4)]"
              >
                <CountryCard country={country} />
              </div>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={() => scrollByPage(1)}
          disabled={!canNext}
          aria-label="Show next countries"
          className={cn(
            "hidden h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[#E4D4F5] bg-white text-[#7C3AED] shadow-[0_8px_24px_rgba(74,32,110,0.1)] transition-all md:inline-flex lg:h-14 lg:w-14",
            "hover:bg-[#F5F0FF] disabled:cursor-not-allowed disabled:opacity-35"
          )}
        >
          <ChevronRight className="h-6 w-6" aria-hidden="true" />
        </button>
      </div>

      <div className="mt-8 flex items-center justify-center gap-2" role="tablist" aria-label="Country carousel pages">
        {Array.from({ length: pageCount }, (_, index) => (
          <button
            key={index}
            type="button"
            role="tab"
            aria-selected={index === page}
            aria-label={`Show countries page ${index + 1}`}
            onClick={() => goToPage(index)}
            className={cn(
              "h-2.5 rounded-full transition-all",
              index === page
                ? "w-7 bg-gradient-to-r from-[#7C3AED] to-[#FB7185]"
                : "w-2.5 bg-[#E4D4F5] hover:bg-[#C4B0E8]"
            )}
          />
        ))}
      </div>
    </div>
  );
}
