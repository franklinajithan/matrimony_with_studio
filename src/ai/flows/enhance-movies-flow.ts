
'use server';
/**
 * @fileOverview Provides AI-driven enhancement for a list of favorite movies.
 *
 * - enhanceMovies - A function that refines a comma-separated list of movie titles.
 * - EnhanceMoviesInput - The input type for the enhanceMovies function.
 * - EnhanceMoviesOutput - The return type for the enhanceMovies function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const EnhanceMoviesInputSchema = z.object({
  moviesText: z.string().describe("The user's current comma-separated list of favorite movies."),
});
export type EnhanceMoviesInput = z.infer<typeof EnhanceMoviesInputSchema>;

const EnhanceMoviesOutputSchema = z.object({
  enhancedMoviesText: z.string().describe("The AI-enhanced comma-separated list of favorite movies."),
});
export type EnhanceMoviesOutput = z.infer<typeof EnhanceMoviesOutputSchema>;

export async function enhanceMovies(input: EnhanceMoviesInput): Promise<EnhanceMoviesOutput> {
  return enhanceMoviesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'enhanceMoviesPrompt',
  input: {schema: EnhanceMoviesInputSchema},
  output: {schema: EnhanceMoviesOutputSchema},
  prompt: `You are an expert editor specializing in refining lists of favorite movies for online profiles.
Review the following comma-separated list of movie titles. Your task is to:
1. Correct any typos in movie titles.
2. Ensure consistent capitalization (e.g., Title Case for each movie title, respecting original casing for acronyms or specific stylizations if clear).
3. Ensure items are clearly separated by a comma and a single space (e.g., "The Shawshank Redemption, Inception, Pulp Fiction").
4. Maintain the original list of movies. Do NOT add new movies unless it's to correct an obvious and significant typo of an existing one.
Return only the enhanced list as a comma-separated string in the 'enhancedMoviesText' field.

Original Movies List:
{{{moviesText}}}
`,
});

const enhanceMoviesFlow = ai.defineFlow(
  {
    name: 'enhanceMoviesFlow',
    inputSchema: EnhanceMoviesInputSchema,
    outputSchema: EnhanceMoviesOutputSchema,
  },
  async (input: EnhanceMoviesInput) => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error("The AI model did not return an enhanced movies list. Please try again.");
    }
    return output;
  }
);
