import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { CUPIDMATCH_LOGO, CUPIDMATCH_LOGO_WIDTH, CUPIDMATCH_LOGO_HEIGHT } from "@/lib/brand";

export { CUPIDMATCH_LOGO } from "@/lib/brand";
type LogoSize = "sm" | "md" | "lg";
// Legacy styling props remain accepted; the approved artwork always keeps its colours.
interface LogoProps { className?: string; size?: LogoSize; iconSize?: number; textSize?: string; textColor?: string; href?: string; invert?: boolean; priority?: boolean; }
const SIZE_CLASS: Record<LogoSize, string> = {
  sm: "w-[120px]",
  md: "w-36",
  lg: "w-56",
};
export function Logo({ className, size, iconSize, href = "/", priority = false }: LogoProps) {
  const resolved: LogoSize = size ?? (typeof iconSize === "number" && iconSize <= 24 ? "sm" : typeof iconSize === "number" && iconSize >= 40 ? "lg" : "md");
  return (
    <Link href={href} aria-label="CupidMatch home" className={cn("inline-flex max-w-full shrink-0 items-center rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2", SIZE_CLASS[resolved], className)}>
      <Image src={CUPIDMATCH_LOGO} alt="CupidMatch" width={CUPIDMATCH_LOGO_WIDTH} height={CUPIDMATCH_LOGO_HEIGHT} priority={priority} sizes="(min-width:1024px) 224px, 144px" className="h-auto w-full object-contain" />
    </Link>
  );
}
