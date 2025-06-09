
'use server';
/**
 * @fileOverview Provides AI-driven enhancement for a list of hobbies and interests.
 *
 * - enhanceHobbies - A function that refines a comma-separated list of hobbies.
 * - EnhanceHobbiesInput - The input type for the enhanceHobbies function.
 * - EnhanceHobbiesOutput - The return type for the enhanceHobbies function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const EnhanceHobbiesInputSchema = z.object({
  hobbiesText: z.string().describe("The user's current comma-separated list of hobbies and interests."),
});
export type EnhanceHobbiesInput = z.infer<typeof EnhanceHobbiesInputSchema>;

const EnhanceHobbiesOutputSchema = z.object({
  enhancedHobbiesText: z.string().describe("The AI-enhanced comma-separated list of hobbies and interests."),
});
export type EnhanceHobbiesOutput = z.infer<typeof EnhanceHobbiesOutputSchema>;

export async function enhanceHobbies(input: EnhanceHobbiesInput): Promise<EnhanceHobbiesOutput> {
  return enhanceHobbiesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'enhanceHobbiesPrompt',
  input: {schema: EnhanceHobbiesInputSchema},
  output: {schema: EnhanceHobbiesOutputSchema},
  prompt: `You are an expert editor specializing in refining lists of hobbies and interests for online profiles.
Review the following comma-separated list of hobbies. Your task is to:
1. Correct any grammatical errors and typos.
2. Ensure consistent capitalization (e.g., Title Case for each hobby).
3. Ensure items are clearly separated by a comma and a single space (e.g., "Reading, Cooking, Hiking").
4. Maintain the original core meaning and key interests.
5. If appropriate, and the list is short (e.g., less than 3 items), you may suggest 1-2 very popular and highly related hobbies to add. However, prioritize refining what's given. Do not add many new hobbies or change the core set significantly.
Return only the enhanced list as a comma-separated string in the 'enhancedHobbiesText' field.

Original Hobbies List:
{{{hobbiesText}}}
`,
});

const enhanceHobbiesFlow = ai.defineFlow(
  {
    name: 'enhanceHobbiesFlow',
    inputSchema: EnhanceHobbiesInputSchema,
    outputSchema: EnhanceHobbiesOutputSchema,
  },
  async (input: EnhanceHobbiesInput) => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error("The AI model did not return an enhanced hobbies list. Please try again.");
    }
    return output;
  }
);
