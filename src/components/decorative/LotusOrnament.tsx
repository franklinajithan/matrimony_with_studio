import { cn } from "@/lib/utils";

export function LotusOrnament({
  className,
  side = "left",
}: {
  className?: string;
  side?: "left" | "right";
}) {
  return (
    <svg
      viewBox="0 0 220 240"
      className={cn(
        "pointer-events-none absolute h-[240px] w-[220px] text-[#E6C7A4]",
        side === "left" ? "-left-2 top-4 sm:left-6" : "-right-2 top-4 sm:right-6",
        className
      )}
      fill="none"
      aria-hidden="true"
    >
      <g
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.85"
        transform={side === "right" ? "scale(-1,1) translate(-220,0)" : undefined}
      >
        <path d="M110 132 C110 132 98 78 110 42 C122 78 110 132 110 132" />
        <path d="M110 132 C110 132 78 92 58 58 C88 92 110 132 110 132" />
        <path d="M110 132 C110 132 142 92 162 58 C132 92 110 132 110 132" />
        <path d="M110 132 C110 132 62 108 36 78 C74 108 110 132 110 132" />
        <path d="M110 132 C110 132 158 108 184 78 C146 108 110 132 110 132" />
        <path d="M110 132 C110 132 70 128 42 118 C78 128 110 132 110 132" />
        <path d="M110 132 C110 132 150 128 178 118 C142 128 110 132 110 132" />
        <path d="M110 136 C86 162 62 188 74 214" />
        <path d="M110 136 C134 162 158 188 146 214" />
        <path d="M110 136 C96 170 88 198 110 222 C132 198 124 170 110 136" />
        <path d="M110 148 C110 148 96 168 110 186 C124 168 110 148 110 148" />
        <circle cx="110" cy="128" r="5" />
        <circle cx="110" cy="128" r="2.2" />
      </g>
    </svg>
  );
}
