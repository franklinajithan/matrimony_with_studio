/**
 * ConnectionPaths - Decorative SVG component
 * 
 * Flowing paths representing connections across cultures and distances.
 * Used as a subtle background decoration in hero and featured sections.
 * 
 * - Aria-hidden for accessibility
 * - Non-interactive
 * - Lightweight
 * - Respects prefers-reduced-motion
 */

import { cn } from "@/lib/utils";

interface ConnectionPathsProps {
  className?: string;
  variant?: 'default' | 'subtle' | 'vibrant';
  animate?: boolean;
}

export function ConnectionPaths({ 
  className, 
  variant = 'default',
  animate = true 
}: ConnectionPathsProps) {
  const opacity = {
    default: '0.15',
    subtle: '0.08',
    vibrant: '0.25',
  }[variant];

  const strokeColor = {
    default: '#7027E8', // Violet
    subtle: '#6F6979', // Muted gray
    vibrant: '#FF6F72', // Coral
  }[variant];

  return (
    <svg
      className={cn(
        "pointer-events-none absolute inset-0 h-full w-full",
        className
      )}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      aria-hidden="true"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <linearGradient id="connection-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: strokeColor, stopOpacity: opacity }} />
          <stop offset="50%" style={{ stopColor: strokeColor, stopOpacity: Number(opacity) * 1.5 }} />
          <stop offset="100%" style={{ stopColor: strokeColor, stopOpacity: opacity }} />
        </linearGradient>
      </defs>

      {/* Flowing connection paths */}
      <path
        d="M-50,200 Q150,50 350,200 T750,200"
        stroke="url(#connection-gradient)"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
        className={animate ? "cupid-path-float" : ""}
        style={{ animationDelay: '0s' }}
      />
      
      <path
        d="M100,400 Q300,250 500,400 T900,400"
        stroke="url(#connection-gradient)"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
        className={animate ? "cupid-path-float" : ""}
        style={{ animationDelay: '2s' }}
      />

      <path
        d="M-100,600 Q200,450 500,600 T1100,600"
        stroke="url(#connection-gradient)"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
        className={animate ? "cupid-path-float" : ""}
        style={{ animationDelay: '4s' }}
      />

      {/* Connection nodes */}
      <circle cx="350" cy="200" r="4" fill={strokeColor} opacity={opacity} />
      <circle cx="500" cy="400" r="4" fill={strokeColor} opacity={opacity} />
      <circle cx="500" cy="600" r="3" fill={strokeColor} opacity={opacity} />
    </svg>
  );
}
