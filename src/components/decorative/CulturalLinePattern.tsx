/**
 * CulturalLinePattern - Decorative SVG component
 * 
 * Subtle geometric patterns inspired by Sri Lankan textile designs.
 * Used as corner or edge decoration to add cultural context.
 * 
 * - Aria-hidden for accessibility
 * - Non-interactive
 * - Lightweight
 * - Respects prefers-reduced-motion
 */

import { cn } from "@/lib/utils";

interface CulturalLinePatternProps {
  className?: string;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  variant?: 'textile' | 'botanical' | 'geometric';
}

export function CulturalLinePattern({ 
  className, 
  position = 'top-right',
  variant = 'textile'
}: CulturalLinePatternProps) {
  const positionClasses = {
    'top-left': 'top-0 left-0',
    'top-right': 'top-0 right-0',
    'bottom-left': 'bottom-0 left-0',
    'bottom-right': 'bottom-0 right-0',
  }[position];

  const rotation = {
    'top-left': 0,
    'top-right': 90,
    'bottom-left': -90,
    'bottom-right': 180,
  }[position];

  return (
    <svg
      width="200"
      height="200"
      className={cn(
        "pointer-events-none absolute opacity-[0.06]",
        positionClasses,
        className
      )}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      aria-hidden="true"
      style={{ transform: `rotate(${rotation}deg)` }}
    >
      {variant === 'textile' && (
        <g stroke="#7027E8" strokeWidth="1.5">
          {/* Concentric squares */}
          <rect x="20" y="20" width="160" height="160" rx="4" />
          <rect x="40" y="40" width="120" height="120" rx="3" />
          <rect x="60" y="60" width="80" height="80" rx="2" />
          
          {/* Corner flourishes */}
          <path d="M20,20 L40,40 M20,180 L40,160 M180,20 L160,40 M180,180 L160,160" />
          
          {/* Decorative crosses */}
          <path d="M100,20 L100,40 M20,100 L40,100 M100,160 L100,180 M160,100 L180,100" />
        </g>
      )}

      {variant === 'botanical' && (
        <g stroke="#7027E8" strokeWidth="1.5">
          {/* Leaf-like patterns */}
          <path d="M100,20 Q120,60 100,100 Q80,60 100,20" />
          <path d="M100,100 Q120,140 100,180 Q80,140 100,100" />
          <path d="M20,100 Q60,120 100,100 Q60,80 20,100" />
          <path d="M100,100 Q140,120 180,100 Q140,80 100,100" />
          
          {/* Center detail */}
          <circle cx="100" cy="100" r="15" />
          <circle cx="100" cy="100" r="8" />
        </g>
      )}

      {variant === 'geometric' && (
        <g stroke="#7027E8" strokeWidth="1.5">
          {/* Geometric diamonds */}
          <path d="M100,20 L140,100 L100,180 L60,100 Z" />
          <path d="M100,40 L130,100 L100,160 L70,100 Z" />
          <path d="M100,60 L120,100 L100,140 L80,100 Z" />
          
          {/* Corner marks */}
          <circle cx="20" cy="20" r="3" />
          <circle cx="180" cy="20" r="3" />
          <circle cx="20" cy="180" r="3" />
          <circle cx="180" cy="180" r="3" />
        </g>
      )}
    </svg>
  );
}
