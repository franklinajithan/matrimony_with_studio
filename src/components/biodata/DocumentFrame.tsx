"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import type { BiodataTemplateDef } from "@/lib/biodata/types";
import {
  DECORATION_MOTIFS,
  MotifCornerOrnament,
  RELIGIOUS_MOTIFS,
  type MotifProps,
} from "@/components/biodata/decorations";

export type DocumentFrameProps = {
  template: BiodataTemplateDef;
  /** Border / artwork strength from 0–1 */
  intensity?: number;
  showReligiousArt?: boolean;
  accentColor?: string;
  borderColor?: string;
  className?: string;
  children: React.ReactNode;
};

function resolveDecoration(key: string): React.ComponentType<MotifProps> {
  const normalized = key.toLowerCase().replace(/\s+/g, "-");
  return (
    DECORATION_MOTIFS[normalized] ??
    DECORATION_MOTIFS[key] ??
    MotifCornerOrnament
  );
}

export function DocumentFrame({
  template,
  intensity = 0.65,
  showReligiousArt = false,
  accentColor,
  borderColor,
  className,
  children,
}: DocumentFrameProps) {
  const intensityClamped = Math.max(0, Math.min(1, intensity));
  const accent = accentColor ?? template.defaultPalette.accent;
  const border = borderColor ?? template.defaultPalette.border;
  const EdgeMotif = resolveDecoration(template.decoration);
  const motifKey = template.religiousMotif ?? "none";
  const Religious =
    showReligiousArt && template.supportsReligiousArt && motifKey !== "none"
      ? RELIGIOUS_MOTIFS[motifKey]
      : null;

  const borderWidth = Math.max(1, Math.round(2 + intensityClamped * 6));
  const ornamentOpacity = 0.25 + intensityClamped * 0.65;
  const ornamentSize = `${1.75 + intensityClamped * 0.75}rem`;

  return (
    <div
      className={cn("relative h-full w-full overflow-hidden", className)}
      style={{ boxShadow: `inset 0 0 0 ${borderWidth}px ${border}` }}
      data-biodata-frame={template.decoration}
    >
      <span
        className="pointer-events-none absolute left-2 top-2"
        style={{ opacity: ornamentOpacity, width: ornamentSize, height: ornamentSize }}
      >
        <MotifCornerOrnament color={accent} className="h-full w-full" />
      </span>
      <span
        className="pointer-events-none absolute right-2 top-2 origin-center"
        style={{
          opacity: ornamentOpacity,
          width: ornamentSize,
          height: ornamentSize,
          transform: "rotate(90deg)",
        }}
      >
        <MotifCornerOrnament color={accent} className="h-full w-full" />
      </span>
      <span
        className="pointer-events-none absolute bottom-2 left-2"
        style={{
          opacity: ornamentOpacity,
          width: ornamentSize,
          height: ornamentSize,
          transform: "rotate(-90deg)",
        }}
      >
        <MotifCornerOrnament color={accent} className="h-full w-full" />
      </span>
      <span
        className="pointer-events-none absolute bottom-2 right-2"
        style={{
          opacity: ornamentOpacity,
          width: ornamentSize,
          height: ornamentSize,
          transform: "rotate(180deg)",
        }}
      >
        <MotifCornerOrnament color={accent} className="h-full w-full" />
      </span>

      {intensityClamped > 0.08 && (
        <>
          <span
            className="pointer-events-none absolute left-1/2 top-3 -translate-x-1/2"
            style={{
              opacity: ornamentOpacity * 0.9,
              width: ornamentSize,
              height: ornamentSize,
            }}
          >
            <EdgeMotif color={accent} className="h-full w-full" />
          </span>
          <span
            className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2"
            style={{
              opacity: ornamentOpacity * 0.85,
              width: ornamentSize,
              height: ornamentSize,
              transform: "translateX(-50%) rotate(180deg)",
            }}
          >
            <EdgeMotif color={accent} className="h-full w-full" />
          </span>
        </>
      )}

      {Religious && (
        <div
          className="pointer-events-none absolute left-1/2 top-10 z-[1] -translate-x-1/2"
          style={{ opacity: 0.35 + intensityClamped * 0.45 }}
        >
          <Religious color={accent} className="h-10 w-10 md:h-12 md:w-12" />
        </div>
      )}

      <div
        className={cn(
          "relative z-[2] h-full w-full px-6 pb-8 md:px-8",
          Religious ? "pt-16 md:pt-20" : "pt-8"
        )}
      >
        {children}
      </div>
    </div>
  );
}
