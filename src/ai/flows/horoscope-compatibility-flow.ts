
'use server';
/**
 * @fileOverview Provides AI-driven horoscope compatibility analysis between two profiles.
 *
 * - analyzeHoroscopeCompatibility - A function that analyzes compatibility between two astrological profiles.
 * - HoroscopeCompatibilityInput - The input type for the analyzeHoroscopeCompatibility function.
 * - HoroscopeCompatibilityOutput - The return type for the analyzeHoroscopeCompatibility function.
 */

import {ai} from '@/ai/genkit';
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
  return horoscopeCompatibilityFlow(input);
}

const prompt = ai.definePrompt({
  name: 'horoscopeCompatibilityPrompt',
  input: {schema: HoroscopeCompatibilityInputSchema},
  output: {schema: HoroscopeCompatibilityOutputSchema},
  prompt: `You are an expert Vedic Astrologer specializing in relationship compatibility analysis (Synastry).
Analyze the provided astrological data for two individuals (Profile 1 and Profile 2) to determine their compatibility.

Profile 1 Astrological Details:
Name: {{{profile1.name}}}
Sun Sign: {{{profile1.sunSign}}}
Moon Sign (Rasi): {{{profile1.moonSign}}}
Ascendant (Lagna): {{{profile1.ascendant}}}
Nakshatra: {{{profile1.nakshatra}}}
{{#if profile1.planetaryPositions}}
Planetary Positions for Profile 1:
{{#each profile1.planetaryPositions}}
- {{planet}} in {{sign}}{{#if house}} (House {{house}}){{/if}}
{{/each}}
{{/if}}

Profile 2 Astrological Details:
Name: {{{profile2.name}}}
Sun Sign: {{{profile2.sunSign}}}
Moon Sign (Rasi): {{{profile2.moonSign}}}
Ascendant (Lagna): {{{profile2.ascendant}}}
Nakshatra: {{{profile2.nakshatra}}}
{{#if profile2.planetaryPositions}}
Planetary Positions for Profile 2:
{{#each profile2.planetaryPositions}}
- {{planet}} in {{sign}}{{#if house}} (House {{house}}){{/if}}
{{/each}}
{{/if}}

{{#if comparisonAspects}}
Please pay special attention to the following requested aspects if possible:
{{#each comparisonAspects}}
- {{{this}}}
{{/each}}
Otherwise, perform a general Vedic compatibility analysis.
{{/if}}

Based on your analysis, provide:
1.  An overall compatibility score (0-100).
2.  A summary of positive aspects and strengths.
3.  A summary of challenging aspects and potential friction points.
4.  An overall relationship summary.
5.  (Optional) A detailed breakdown of specific compatibility points you considered (e.g., Moon sign harmony, Nakshatra compatibility (like Kuta system concepts if possible - e.g., Nadi, Bhakoot), benefic/malefic planetary aspects between charts, Ascendant compatibility).

Focus on providing practical insights that could help the individuals understand their relationship dynamics.
If crucial information (like detailed planetary degrees or specific divisional charts) is missing for a very precise traditional Kuta analysis, acknowledge this limitation and provide the best possible analysis based on the given data.
Output your analysis in the specified JSON format.
`,
});

const horoscopeCompatibilityFlow = ai.defineFlow(
  {
    name: 'horoscopeCompatibilityFlow',
    inputSchema: HoroscopeCompatibilityInputSchema,
    outputSchema: HoroscopeCompatibilityOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error("The AI model did not return a compatibility analysis. Please check the input or try again.");
    }
    return output;
  }
);

