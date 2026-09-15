import Link from "next/link";
import { Heart } from "lucide-react";

interface LogoProps {
  className?: string;
  iconSize?: number;
  textSize?: string;
  textColor?: string;
  href?: string;
}

export function Logo({
  className,
  iconSize = 26,
  textSize = "text-xl sm:text-2xl",
  textColor = "text-[#4B164C]",
  href = "/",
}: LogoProps) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-1.5 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4B164C] focus-visible:ring-offset-2 ${className ?? ""}`}
      aria-label="CupidMatch home"
    >
      <span className={`font-headline font-bold tracking-[0.06em] ${textSize} ${textColor}`}>
        CUPID
      </span>
      <Heart
        className="text-[#D6B56D] fill-[#D6B56D]"
        size={iconSize * 0.72}
        aria-hidden="true"
      />
      <span className={`font-headline font-bold tracking-[0.06em] ${textSize} ${textColor}`}>
        MATCH
      </span>
    </Link>
  );
}
