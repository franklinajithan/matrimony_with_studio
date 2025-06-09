
'use server';
/**
 * @fileOverview Provides AI-driven enhancement for a list of favorite music preferences.
 *
 * - enhanceMusic - A function that refines a comma-separated list of music preferences (artists/genres).
 * - EnhanceMusicInput - The input type for the enhanceMusic function.
 * - EnhanceMusicOutput - The return type for the enhanceMusic function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const EnhanceMusicInputSchema = z.object({
  musicText: z.string().describe("The user's current comma-separated list of favorite music (artists/genres)."),
});
export type EnhanceMusicInput = z.infer<typeof EnhanceMusicInputSchema>;

const EnhanceMusicOutputSchema = z.object({
  enhancedMusicText: z.string().describe("The AI-enhanced comma-separated list of favorite music preferences."),
});
export type EnhanceMusicOutput = z.infer<typeof EnhanceMusicOutputSchema>;

export async function enhanceMusic(input: EnhanceMusicInput): Promise<EnhanceMusicOutput> {
  return enhanceMusicFlow(input);
}

const prompt = ai.definePrompt({
  name: 'enhanceMusicPrompt',
  input: {schema: EnhanceMusicInputSchema},
  output: {schema: EnhanceMusicOutputSchema},
  prompt: `You are an expert editor specializing in refining lists of favorite music (artists, genres) for online profiles.
Review the following comma-separated list of music preferences. Your task is to:
1. Correct any typos in artist names or genres.
2. Ensure consistent capitalization (e.g., Title Case for each item).
3. Ensure items are clearly separated by a comma and a single space (e.g., "A.R. Rahman, Classical, Pop, Indie Folk").
4. Maintain the original list of preferences. Do NOT add new artists or genres unless it's to correct an obvious and significant typo of an existing one.
Return only the enhanced list as a comma-separated string in the 'enhancedMusicText' field.

Original Music List:
{{{musicText}}}
`,
});

const enhanceMusicFlow = ai.defineFlow(
  {
    name: 'enhanceMusicFlow',
    inputSchema: EnhanceMusicInputSchema,
    outputSchema: EnhanceMusicOutputSchema,
  },
  async (input: EnhanceMusicInput) => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error("The AI model did not return an enhanced music list. Please try again.");
    }
    return output;
  }
);
