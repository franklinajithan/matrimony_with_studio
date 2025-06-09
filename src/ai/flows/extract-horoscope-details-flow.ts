
'use server';
/**
 * @fileOverview Provides AI-driven horoscope detail extraction.
 *
 * - extractHoroscopeDetails - A function that extracts detailed horoscope information.
 * - ExtractHoroscopeDetailsInput - The input type for the extractHoroscopeDetails function.
 * - ExtractHoroscopeDetailsOutput - The return type for the extractHoroscopeDetails function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExtractHoroscopeDetailsInputSchema = z.object({
  dateOfBirth: z.string().describe("Date of birth in YYYY-MM-DD format."),
  timeOfBirth: z.string().describe("Time of birth in HH:MM AM/PM format (e.g., 02:30 PM). Ensure timezone context if known, or specify it is local time."),
  placeOfBirth: z.string().describe("Place of birth (City, Country)."),
  horoscopePdfDataUri: z.string().optional().describe("Optional. A horoscope chart PDF document, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:application/pdf;base64,<encoded_data>'."),
});
export type ExtractHoroscopeDetailsInput = z.infer<typeof ExtractHoroscopeDetailsInputSchema>;

const ExtractHoroscopeDetailsOutputSchema = z.object({
  sunSign: z.string().describe("The user's Western Sun Sign (e.g., Aries, Taurus)."),
  moonSign: z.string().describe("The user's Vedic Moon Sign or Rasi (e.g., Mesha, Vrishabha)."),
  ascendant: z.string().describe("The user's Ascendant or Lagna (e.g., Aries Ascendant, Simha Lagna)."),
  nakshatra: z.string().describe("The user's birth star (Nakshatra) and its Pada (quarter), if determinable (e.g., Ashwini Pada 1)."),
  planetaryPositions: z.array(z.object({ 
    planet: z.string().describe("Name of the planet (e.g., Sun, Moon, Mars)."), 
    sign: z.string().describe("Sign the planet is in (e.g., Aries, Leo)."), 
    house: z.number().optional().describe("House the planet is in, if determinable.") 
  })).describe("Key planetary positions relevant to Vedic astrology."),
  keyInsights: z.string().describe("A summary of key personality traits, strengths, and weaknesses based on the Vedic horoscope details."),
  careerOutlook: z.string().optional().describe("Brief general outlook for career based on the horoscope."),
  relationshipOutlook: z.string().optional().describe("Brief general outlook for relationships based on the horoscope."),
  healthOutlook: z.string().optional().describe("Brief general outlook for health based on the horoscope."),
});
export type ExtractHoroscopeDetailsOutput = z.infer<typeof ExtractHoroscopeDetailsOutputSchema>;

export async function extractHoroscopeDetails(input: ExtractHoroscopeDetailsInput): Promise<ExtractHoroscopeDetailsOutput> {
  return extractHoroscopeDetailsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'extractHoroscopeDetailsPrompt',
  input: {schema: ExtractHoroscopeDetailsInputSchema},
  output: {schema: ExtractHoroscopeDetailsOutputSchema},
  prompt: `You are an expert Vedic Astrologer. Based on the provided Date of Birth, Time of Birth, and Place of Birth, generate a detailed horoscope analysis according to Vedic astrology principles.

Date of Birth: {{{dateOfBirth}}}
Time of Birth: {{{timeOfBirth}}}
Place of Birth: {{{placeOfBirth}}}

{{#if horoscopePdfDataUri}}
You have also been provided with a PDF document which might contain a pre-generated horoscope chart or details. 
Prioritize calculations based on the birth data (DOB, TOB, POB). Use the PDF document to corroborate or supplement your findings if it contains relevant textual information that you can parse.
Do not attempt to interpret images directly from the PDF if it's purely graphical; focus on any extractable text.
Horoscope Document: {{media url=horoscopePdfDataUri}}
{{/if}}

Provide the analysis in the specified JSON format. Ensure all fields in the output schema are addressed to the best of your ability.
If some specific details (like planetary house positions) cannot be accurately determined without complex calculations or a visual chart you cannot interpret, state that clearly in the relevant output field or omit the optional field.
Focus on providing accurate Vedic astrological insights. For 'sunSign', provide the Western astrology sun sign. For 'moonSign', 'ascendant', 'nakshatra', and 'planetaryPositions', provide Vedic astrology details.
`,
});

const extractHoroscopeDetailsFlow = ai.defineFlow(
  {
    name: 'extractHoroscopeDetailsFlow',
    inputSchema: ExtractHoroscopeDetailsInputSchema,
    outputSchema: ExtractHoroscopeDetailsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error("The AI model did not return an output. Please check the input or try again.");
    }
    return output;
  }
);
