
'use server';
/**
 * @fileOverview Provides AI-driven horoscope compatibility analysis between two profiles.
 *
 * - analyzeHoroscopeCompatibility - A function that analyzes compatibility between two astrological profiles.
 * - HoroscopeCompatibilityInput - The input type for the analyzeHoroscopeCompatibility function.
 * - HoroscopeCompatibilityOutput - The return type for the analyzeHoroscopeCompatibility function.
 */

import {z} from 'genkit';

// Define a schema for an individual's astrological profile
const AstrologicalProfileSchema = z.object({
  name: z.string().optional().describe("Name of the individual (optional)."),
  sunSign: z.string().describe("The individual's Western Sun Sign (e.g., Aries, Taurus)."),
  moonSign: z.string().describe("The individual's Vedic Moon Sign or Rasi (e.g., Mesha, Vrishabha)."),
  ascendant: z.string().describe("The individual's Ascendant or Lagna (e.g., Aries Ascendant, Simha Lagna)."),
  nakshatra: z.string().describe("The individual's birth star (Nakshatra) and its Pada (quarter), if determinable (e.g., Ashwini Pada 1)."),
  planetaryPositions: z.array(z.object({ 
    planet: z.string().describe("Name of the planet (e.g., Sun, Moon, Mars)."), 
    sign: z.string().describe("Sign the planet is in (e.g., Aries, Leo)."), 
    house: z.number().optional().describe("House the planet is in, if determinable.") 
  })).optional().describe("Key planetary positions relevant to Vedic astrology."),
  // Add any other fields from ExtractHoroscopeDetailsOutput that are relevant for compatibility
  // For example, if 'keyInsights' from individual analysis is useful, it could be added.
});
export type AstrologicalProfile = z.infer<typeof AstrologicalProfileSchema>;

const HoroscopeCompatibilityInputSchema = z.object({
  profile1: AstrologicalProfileSchema.describe("Astrological profile of the first individual."),
  profile2: AstrologicalProfileSchema.describe("Astrological profile of the second individual."),
  comparisonAspects: z.array(z.string()).optional().describe("Specific astrological aspects to focus on (e.g., 'Guna Milan', 'Mangal Dosha', 'Nadi Kuta'). AI will attempt to cover these if provided.")
});
export type HoroscopeCompatibilityInput = z.infer<typeof HoroscopeCompatibilityInputSchema>;

const HoroscopeCompatibilityOutputSchema = z.object({
  compatibilityScore: z.number().min(0).max(100).describe("An overall compatibility score from 0 to 100, where 100 is highly compatible."),
  positiveAspects: z.string().describe("A summary of positive astrological aspects and strengths in the relationship."),
  challengingAspects: z.string().describe("A summary of challenging astrological aspects and potential areas of friction."),
  relationshipSummary: z.string().describe("An overall summary of the relationship potential, considering both strengths and challenges."),
  detailedBreakdown: z.array(
    z.object({
      aspectName: z.string().describe("Name of the astrological aspect being compared (e.g., 'Moon Sign Compatibility', 'Mars-Venus Synastry', 'Nakshatra Porutham')."),
      description: z.string().describe("Detailed description of this specific compatibility aspect."),
      score: z.number().min(0).max(10).optional().describe("Score for this specific aspect (if applicable)."),
    })
  ).optional().describe("Optional detailed breakdown of specific compatibility points."),
});
export type HoroscopeCompatibilityOutput = z.infer<typeof HoroscopeCompatibilityOutputSchema>;

export async function analyzeHoroscopeCompatibility(input: HoroscopeCompatibilityInput): Promise<HoroscopeCompatibilityOutput> {
  void input;
  throw new Error('This legacy AI tool is retired. Use the private Horoscope Studio.');
}
