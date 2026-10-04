import Link from "next/link";
import { cn } from "@/lib/utils";

type LogoSize = "sm" | "md" | "lg";

interface LogoProps {
  className?: string;
  /** Visual scale — responsive across breakpoints. */
  size?: LogoSize;
  /** @deprecated Prefer `size`. Maps roughly to sm/md/lg. */
  iconSize?: number;
  /** @deprecated Ignored — wordmark is in the image. */
  textSize?: string;
  /** When set to a white text color, logo is inverted for dark backgrounds. */
  textColor?: string;
  href?: string;
  invert?: boolean;
}

function resolveSize(size: LogoSize | undefined, iconSize: number | undefined): LogoSize {
  if (size) return size;
  if (typeof iconSize === "number") {
    if (iconSize <= 24) return "sm";
    if (iconSize >= 40) return "lg";
  }
  return "md";
}

const SIZE_CLASS: Record<LogoSize, string> = {
  sm: "w-36 sm:w-40",
  md: "w-44 sm:w-48 md:w-[13rem]",
  lg: "w-48 sm:w-56 md:w-64",
};

export function Logo({
  className,
  size,
  iconSize,
  textColor,
  href = "/",
  invert = false,
}: LogoProps) {
  const resolved = resolveSize(size, iconSize);
  const onDark = invert || Boolean(textColor?.includes("white"));

  return (
    <Link
      href={href}
      className={cn(
        "inline-flex max-w-full shrink-0 items-center rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7B3FA0] focus-visible:ring-offset-2",
        SIZE_CLASS[resolved],
        className
      )}
      aria-label="CupidMatch home"
    >
      <svg viewBox="0 0 420 108" role="img" aria-label="CupidMatch Matrimony" className={cn("h-auto w-full overflow-visible", onDark && "brightness-0 invert")}>
        <defs><linearGradient id="cmGold" x1="0" x2="1"><stop stopColor="#B97816"/><stop offset=".48" stopColor="#F1C45C"/><stop offset="1" stopColor="#B97816"/></linearGradient><linearGradient id="cmPurple" x1="0" x2="1"><stop stopColor="#3B1768"/><stop offset="1" stopColor="#7C3AED"/></linearGradient></defs>
        <g transform="translate(4 7)">
          <path d="M48 24c-17-18-38-5-34 15 4 20 29 32 34 36 5-4 30-16 34-36 4-20-17-33-34-15Z" fill="url(#cmPurple)"/>
          <path d="M20 29C3 18 5 3 23 5c-7 5-9 11-7 18C7 17 3 8 11 2c13-8 27 4 28 17" fill="url(#cmGold)"/>
          <circle cx="47" cy="14" r="8" fill="url(#cmGold)"/><path d="M46 21c-12 5-18 15-20 29M45 25c10 4 17 11 22 22" fill="none" stroke="url(#cmGold)" strokeWidth="6" strokeLinecap="round"/>
          <path d="M58 29c18-13 27-4 31 6M88 35c-2 10-8 18-18 23" fill="none" stroke="url(#cmGold)" strokeWidth="3"/><path d="M66 35l25-8-7 8 8 3Z" fill="#C99532"/>
        </g>
        <text x="95" y="58" fontFamily="Georgia,serif" fontSize="48" fontWeight="700" fill="#3B1768">Cupid</text><text x="230" y="58" fontFamily="Georgia,serif" fontSize="48" fontWeight="700" fill="url(#cmGold)">Match</text>
        <path d="M96 70H363" stroke="#C99532" strokeWidth="1.5"/><text x="178" y="91" fontFamily="Georgia,serif" fontSize="13" fontWeight="700" letterSpacing="5" fill="#6B214E">MATRIMONY</text>
      </svg>
    </Link>
  );
}
