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
      <Image
        src="/images/cupidmatch-logo.png"
        alt="CupidMatch"
        width={944}
        height={234}
        sizes={
          resolved === "sm"
            ? "(min-width: 640px) 160px, 144px"
            : resolved === "lg"
              ? "(min-width: 768px) 256px, (min-width: 640px) 224px, 192px"
              : "(min-width: 768px) 208px, (min-width: 640px) 192px, 176px"
        }
        className={cn("h-auto w-full object-contain object-left", onDark && "brightness-0 invert")}
        priority
      />
    </Link>
  );
}
