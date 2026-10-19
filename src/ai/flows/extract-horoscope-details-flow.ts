
'use server';
/**
 * @fileOverview Provides AI-driven horoscope detail extraction from birth data and an optional PDF or image file.
 *
 * - extractHoroscopeDetails - A function that extracts detailed horoscope information.
 * - ExtractHoroscopeDetailsInput - The input type for the extractHoroscopeDetails function.
 * - ExtractHoroscopeDetailsOutput - The return type for the extractHoroscopeDetails function.
 */

import {z} from 'genkit';

const ExtractHoroscopeDetailsInputSchema = z.object({
  dateOfBirth: z.string().describe("Date of birth in YYYY-MM-DD format."),
  timeOfBirth: z.string().describe("Time of birth in HH:MM AM/PM format (e.g., 02:30 PM). Ensure timezone context if known, or specify it is local time."),
  placeOfBirth: z.string().describe("Place of birth (City, Country)."),
  horoscopeFileDataUri: z.string().optional().describe("Optional. A horoscope chart document (PDF or image like JPG, PNG, WebP), as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."),
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
  void input;
  throw new Error('This legacy AI tool is retired. Use the private Horoscope Studio.');
}
