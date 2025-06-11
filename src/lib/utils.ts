
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const getCompositeId = (uid1: string, uid2: string): string => {
  if (!uid1 || !uid2) {
    console.warn("getCompositeId received undefined or null UID");
    // Fallback or throw error, depending on desired strictness
    // For now, returning a non-functional ID to prevent further errors down the line
    return "invalid_composite_id"; 
  }
  return uid1 < uid2 ? `${uid1}_${uid2}` : `${uid2}_${uid1}`;
};

export const calculateAge = (dobString?: string): number | undefined => {
  if (!dobString) return undefined;
  try {
    const birthDate = new Date(dobString);
    if (isNaN(birthDate.getTime())) { // Check for invalid date
      // console.warn("Invalid date string provided to calculateAge:", dobString);
      return undefined;
    }
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age > 0 ? age : undefined;
  } catch (e) {
    console.error("Error calculating age:", e);
    return undefined;
  }
};
