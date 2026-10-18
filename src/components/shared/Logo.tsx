import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

/** Single canonical CupidMatch brand mark, used across public, member and admin pages. */
export const CUPIDMATCH_LOGO = "/images/cupidmatch-logo-new.png";
type LogoSize = "sm" | "md" | "lg";
interface LogoProps { className?: string; size?: LogoSize; iconSize?: number; textSize?: string; textColor?: string; href?: string; invert?: boolean; }
const SIZE_CLASS: Record<LogoSize, string> = {
  sm: "w-36 sm:w-40",
  md: "w-44 sm:w-48 md:w-[13rem]",
  lg: "w-48 sm:w-56 md:w-64",
};
export function Logo({ className, size, iconSize, href = "/" }: LogoProps) {
  const resolved: LogoSize = size ?? (typeof iconSize === "number" && iconSize <= 24 ? "sm" : typeof iconSize === "number" && iconSize >= 40 ? "lg" : "md");
  return (
    <Link href={href} aria-label="CupidMatch home" className={cn("relative inline-flex max-w-full shrink-0 items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C3AED] focus-visible:ring-offset-2", SIZE_CLASS[resolved], className)}>
      <Image src={CUPIDMATCH_LOGO} alt="CupidMatch" width={320} height={90} sizes="(min-width:768px) 256px, 192px" className="h-auto w-full object-contain object-left" />
    </Link>
  );
}
