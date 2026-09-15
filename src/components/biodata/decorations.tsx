import * as React from "react";
import { cn } from "@/lib/utils";

export type MotifProps = {
  className?: string;
  color?: string;
};

function MotifSvg({
  className,
  color = "currentColor",
  children,
  viewBox = "0 0 64 64",
}: MotifProps & { children: React.ReactNode; viewBox?: string }) {
  return (
    <svg
      viewBox={viewBox}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", className)}
      stroke={color}
      aria-hidden
    >
      {children}
    </svg>
  );
}

/** Stylized elephant-head outline — original line art */
export function MotifGanesha({ className, color = "currentColor" }: MotifProps) {
  return (
    <MotifSvg className={className} color={color}>
      <ellipse cx="32" cy="28" rx="14" ry="16" strokeWidth="1.5" />
      <path
        d="M32 12c-2 0-4 1-5 3M27 15c-6 2-10 8-9 14M37 15c6 2 10 8 9 14"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <path
        d="M32 34c2 4 4 10 3 16M29 44h6"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path d="M22 30c-4 2-8 6-8 10M42 30c4 2 8 6 8 10" strokeWidth="1.3" strokeLinecap="round" />
      <circle cx="26" cy="26" r="1.2" fill={color} stroke="none" />
      <circle cx="38" cy="26" r="1.2" fill={color} stroke="none" />
      <path d="M28 8l4-4 4 4" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </MotifSvg>
  );
}

export function MotifLotus({ className, color = "currentColor" }: MotifProps) {
  return (
    <MotifSvg className={className} color={color}>
      <path
        d="M32 48c0-10 6-18 14-22-4 8-4 16-2 22M32 48c0-10-6-18-14-22 4 8 4 16 2 22"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <path d="M32 48V22" strokeWidth="1.4" strokeLinecap="round" />
      <path
        d="M18 38c4-8 10-12 14-14M46 38c-4-8-10-12-14-14"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      <path
        d="M24 28c2-6 6-10 8-12M40 28c-2-6-6-10-8-12"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      <ellipse cx="32" cy="50" rx="10" ry="2.5" strokeWidth="1.2" opacity="0.6" />
    </MotifSvg>
  );
}

export function MotifBodhi({ className, color = "currentColor" }: MotifProps) {
  return (
    <MotifSvg className={className} color={color}>
      <path
        d="M32 54V28M32 28c-8-2-14-10-12-18 8 2 12 8 12 18M32 28c8-2 14-10 12-18-8 2-12 8-12 18"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M20 22c-4 4-6 10-4 14M44 22c4 4 6 10 4 14"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <path d="M32 12l-2 4h4l-2-4z" strokeWidth="1.2" strokeLinejoin="round" />
    </MotifSvg>
  );
}

export function MotifCross({ className, color = "currentColor" }: MotifProps) {
  return (
    <MotifSvg className={className} color={color}>
      <path d="M32 10v44M18 26h28" strokeWidth="2" strokeLinecap="round" />
      <circle cx="32" cy="26" r="3" strokeWidth="1.2" />
    </MotifSvg>
  );
}

export function MotifCrescent({ className, color = "currentColor" }: MotifProps) {
  return (
    <MotifSvg className={className} color={color}>
      <path
        d="M40 12a20 20 0 1 0 0 40 16 16 0 1 1 0-40z"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M46 22l2 4 4 .5-3 3 .8 4.2L46 31l-3.8 2.7.8-4.2-3-3 4-.5 2-4z"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </MotifSvg>
  );
}

export function MotifFloral({ className, color = "currentColor" }: MotifProps) {
  return (
    <MotifSvg className={className} color={color}>
      <circle cx="32" cy="32" r="4" strokeWidth="1.3" />
      {[0, 60, 120, 180, 240, 300].map((deg) => {
        const rad = (deg * Math.PI) / 180;
        const x = 32 + Math.cos(rad) * 12;
        const y = 32 + Math.sin(rad) * 12;
        return (
          <ellipse
            key={deg}
            cx={x}
            cy={y}
            rx="5"
            ry="8"
            transform={`rotate(${deg + 90} ${x} ${y})`}
            strokeWidth="1.2"
          />
        );
      })}
    </MotifSvg>
  );
}

export function MotifGeometric({ className, color = "currentColor" }: MotifProps) {
  return (
    <MotifSvg className={className} color={color}>
      <rect x="16" y="16" width="32" height="32" strokeWidth="1.4" />
      <path d="M32 8v48M8 32h48" strokeWidth="1.2" />
      <path d="M16 16l32 32M48 16L16 48" strokeWidth="1.1" opacity="0.7" />
      <circle cx="32" cy="32" r="8" strokeWidth="1.2" />
    </MotifSvg>
  );
}

export function MotifWaves({ className, color = "currentColor" }: MotifProps) {
  return (
    <MotifSvg className={className} color={color} viewBox="0 0 96 32">
      <path
        d="M0 16c8-8 16-8 24 0s16 8 24 0 16-8 24 0 16 8 24 0"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M0 24c8-6 16-6 24 0s16 6 24 0 16-6 24 0 16 6 24 0"
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity="0.65"
      />
    </MotifSvg>
  );
}

export function MotifLeaves({ className, color = "currentColor" }: MotifProps) {
  return (
    <MotifSvg className={className} color={color}>
      <path
        d="M32 52c0-16 10-28 22-34-6 14-6 26-2 34M32 52c0-16-10-28-22-34 6 14 6 26 2 34"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <path d="M32 52V18" strokeWidth="1.3" strokeLinecap="round" />
      <path
        d="M24 30c4-2 8-2 12 0M22 40c5-2 10-2 16 0"
        strokeWidth="1.1"
        strokeLinecap="round"
      />
    </MotifSvg>
  );
}

export function MotifFrost({ className, color = "currentColor" }: MotifProps) {
  return (
    <MotifSvg className={className} color={color}>
      <path d="M32 8v48M14 20l36 24M50 20L14 44" strokeWidth="1.4" strokeLinecap="round" />
      <path
        d="M32 16l-4 4 4 4 4-4-4-4zM32 40l-4 4 4 4 4-4-4-4z"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <path
        d="M20 28h8M36 28h8M22 36l6 2M36 34l6 2"
        strokeWidth="1.1"
        strokeLinecap="round"
      />
    </MotifSvg>
  );
}

export function MotifRain({ className, color = "currentColor" }: MotifProps) {
  return (
    <MotifSvg className={className} color={color}>
      <path
        d="M20 14c0-6 5-10 12-10s12 4 12 10c6 0 10 4 10 10H10c0-6 4-10 10-10z"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path
        d="M22 40l-2 8M32 38l-2 10M42 40l-2 8M27 44l-1 6M37 44l-1 6"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </MotifSvg>
  );
}

export function MotifTextile({ className, color = "currentColor" }: MotifProps) {
  return (
    <MotifSvg className={className} color={color}>
      {[12, 20, 28, 36, 44, 52].map((y) => (
        <path key={y} d={`M8 ${y}h48`} strokeWidth="1.1" opacity={y % 16 === 0 ? 1 : 0.55} />
      ))}
      {[16, 32, 48].map((x) => (
        <path key={x} d={`M${x} 8v48`} strokeWidth="1.1" opacity="0.7" />
      ))}
      <rect x="10" y="10" width="44" height="44" strokeWidth="1.3" />
    </MotifSvg>
  );
}

export function MotifBotanical({ className, color = "currentColor" }: MotifProps) {
  return (
    <MotifSvg className={className} color={color}>
      <path d="M32 56V20" strokeWidth="1.4" strokeLinecap="round" />
      <path
        d="M32 36c-10-2-16-10-14-18 10 2 14 10 14 18M32 28c10-2 16-10 14-18-10 2-14 10-14 18"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      <path
        d="M32 48c-8 0-12-6-10-12 8 0 10 6 10 12M32 44c8 0 12-6 10-12-8 0-10 6-10 12"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <circle cx="32" cy="16" r="3" strokeWidth="1.2" />
    </MotifSvg>
  );
}

export function MotifConnectionLines({ className, color = "currentColor" }: MotifProps) {
  return (
    <MotifSvg className={className} color={color}>
      <circle cx="16" cy="32" r="5" strokeWidth="1.4" />
      <circle cx="48" cy="32" r="5" strokeWidth="1.4" />
      <circle cx="32" cy="16" r="4" strokeWidth="1.3" />
      <circle cx="32" cy="48" r="4" strokeWidth="1.3" />
      <path
        d="M20 29l8-10M36 19l8 10M44 35l-8 10M28 45l-8-10M21 32h22"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </MotifSvg>
  );
}

export function MotifCornerOrnament({ className, color = "currentColor" }: MotifProps) {
  return (
    <MotifSvg className={className} color={color} viewBox="0 0 48 48">
      <path
        d="M4 4h16M4 4v16M4 12h10M12 4v10"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M20 4c4 4 4 12 0 16M4 20c4 4 12 4 16 0"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      <circle cx="14" cy="14" r="2" fill={color} stroke="none" />
    </MotifSvg>
  );
}

export const RELIGIOUS_MOTIFS = {
  ganesha: MotifGanesha,
  lotus: MotifLotus,
  bodhi: MotifBodhi,
  cross: MotifCross,
  crescent: MotifCrescent,
  none: null,
} as const;

export const DECORATION_MOTIFS: Record<
  string,
  React.ComponentType<MotifProps>
> = {
  floral: MotifFloral,
  geometric: MotifGeometric,
  waves: MotifWaves,
  leaves: MotifLeaves,
  frost: MotifFrost,
  rain: MotifRain,
  textile: MotifTextile,
  botanical: MotifBotanical,
  connection: MotifConnectionLines,
  "connection-lines": MotifConnectionLines,
  lotus: MotifLotus,
  bodhi: MotifBodhi,
  ganesha: MotifGanesha,
  crescent: MotifCrescent,
  cross: MotifCross,
  corner: MotifCornerOrnament,
  "corner-ornament": MotifCornerOrnament,
  heritage: MotifTextile,
  coastal: MotifWaves,
  garden: MotifBotanical,
  serene: MotifLotus,
  spring: MotifFloral,
  autumn: MotifLeaves,
  winter: MotifFrost,
  monsoon: MotifRain,
  modern: MotifConnectionLines,
  minimal: MotifGeometric,
  temple: MotifLotus,
  chapel: MotifFloral,
  islamic: MotifGeometric,
  pearl: MotifFrost,
  blossom: MotifFloral,
  violet: MotifConnectionLines,
  classic: MotifCornerOrnament,
  portrait: MotifBotanical,
  formal: MotifCornerOrnament,
  none: MotifCornerOrnament,
};
