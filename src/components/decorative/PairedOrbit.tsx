/**
 * PairedOrbit - Decorative SVG component
 * 
 * Circular orbits representing two people coming together.
 * Used as a subtle background decoration for relationship-focused sections.
 * 
 * - Aria-hidden for accessibility
 * - Non-interactive
 * - Lightweight
 * - Respects prefers-reduced-motion
 */

import { cn } from "@/lib/utils";

interface PairedOrbitProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  animate?: boolean;
}

export function PairedOrbit({ 
  className, 
  size = 'md',
  animate = true 
}: PairedOrbitProps) {
  const dimensions = {
    sm: { width: 200, height: 200, r1: 60, r2: 40 },
    md: { width: 300, height: 300, r1: 90, r2: 60 },
    lg: { width: 400, height: 400, r1: 120, r2: 80 },
  }[size];

  const { width, height, r1, r2 } = dimensions;
  const cx = width / 2;
  const cy = height / 2;

  return (
    <svg
      width={width}
      height={height}
      className={cn(
        "pointer-events-none",
        className
      )}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="orbit-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#7027E8', stopOpacity: 0.15 }} />
          <stop offset="100%" style={{ stopColor: '#FF6F72', stopOpacity: 0.15 }} />
        </linearGradient>
      </defs>

      {/* Outer orbit */}
      <circle
        cx={cx}
        cy={cy}
        r={r1}
        stroke="url(#orbit-gradient)"
        strokeWidth="1.5"
        fill="none"
        strokeDasharray="5 10"
        className={animate ? "cupid-orbit-rotate-slow" : ""}
      />

      {/* Inner orbit */}
      <circle
        cx={cx}
        cy={cy}
        r={r2}
        stroke="url(#orbit-gradient)"
        strokeWidth="1"
        fill="none"
        strokeDasharray="3 8"
        className={animate ? "cupid-orbit-rotate-reverse" : ""}
      />

      {/* Center connection point */}
      <circle
        cx={cx}
        cy={cy}
        r="3"
        fill="#7027E8"
        opacity="0.3"
      />

      {/* Orbit markers */}
      <circle
        cx={cx + r1 * 0.7}
        cy={cy}
        r="2"
        fill="#FF6F72"
        opacity="0.4"
        className={animate ? "cupid-orbit-pulse" : ""}
      />
      <circle
        cx={cx}
        cy={cy - r2 * 0.7}
        r="2"
        fill="#7027E8"
        opacity="0.4"
        className={animate ? "cupid-orbit-pulse" : ""}
        style={{ animationDelay: '1s' }}
      />
    </svg>
  );
}
