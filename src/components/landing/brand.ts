export const brand = {
  plum: "#4B164C",
  plumDark: "#30122A",
  plumSecondary: "#742158",
  rose: "#A52A68",
  gold: "#D6B56D",
  goldBright: "#F2C96D",
  ivory: "#FFFDF9",
  cream: "#FBF5F1",
  roseSurface: "#F8EAF1",
  text: "#271624",
  muted: "#725E6D",
  white: "#FFFFFF",
  border: "#EADFD6",
} as const;

export const HERO_SLIDES = [
  "/images/hero-slide-1.png?v=1",
  "/images/hero-slide-2.png?v=1",
] as const;

/** @deprecated Prefer HERO_SLIDES — kept for any remaining single-image usages */
export const HERO_IMAGE = HERO_SLIDES[0];

export const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4B164C] focus-visible:ring-offset-2";

export const focusRingOnDark =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F2C96D] focus-visible:ring-offset-2 focus-visible:ring-offset-[#30122A]";
