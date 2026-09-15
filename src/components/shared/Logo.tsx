import Link from "next/link";
import Image from "next/image";
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
  sm: "h-9 w-auto sm:h-10",
  md: "h-10 w-auto sm:h-11 md:h-12",
  lg: "h-11 w-auto sm:h-12 md:h-14",
};

const SIZE_PX: Record<LogoSize, { width: number; height: number }> = {
  sm: { width: 200, height: 40 },
  md: { width: 260, height: 48 },
  lg: { width: 320, height: 56 },
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
  const dims = SIZE_PX[resolved];

  return (
    <Link
      href={href}
      className={cn(
        "inline-flex shrink-0 items-center rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7B3FA0] focus-visible:ring-offset-2",
        className
      )}
      aria-label="CupidMatch home"
    >
      <Image
        src="/images/cupidmatch-logo.png"
        alt="CupidMatch"
        width={dims.width}
        height={dims.height}
        className={cn(SIZE_CLASS[resolved], "max-w-[min(100%,280px)] object-contain object-left", onDark && "brightness-0 invert")}
        priority
      />
    </Link>
  );
}
