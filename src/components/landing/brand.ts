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
  "/images/hero-slides/028CF202-38C0-475D-9910-42F2272C73BB.png",
  "/images/hero-slides/0C455ABF-9792-47D2-A3B9-097091847790.png",
  "/images/hero-slides/3B4CDE76-FF26-4424-BD5C-0879ACB029C5.png",
  "/images/hero-slides/90D02582-5026-4E4D-B948-DDE7477B9BF3.png",
  "/images/hero-slides/90E6FFB2-B158-420D-ADF7-7FDF09F62A11.png",
  "/images/hero-slides/94291311-30E8-4924-9AA2-AEA81B9A2497.png",
  "/images/hero-slides/A8DB1EFC-0773-4617-AB21-FC956FB093E9.png",
  "/images/hero-slides/C73BE9FB-EB74-4DA7-BF2D-FCC9836825C6.png",
] as const;

/** @deprecated Prefer HERO_SLIDES — kept for any remaining single-image usages */
export const HERO_IMAGE = HERO_SLIDES[0];

export const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4B164C] focus-visible:ring-offset-2";

export const focusRingOnDark =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F2C96D] focus-visible:ring-offset-2 focus-visible:ring-offset-[#30122A]";
