
'use server';
/**
 * @fileOverview Provides AI-driven bio enhancement.
 *
 * - enhanceBio - A function that refines a user's bio text.
 * - EnhanceBioInput - The input type for the enhanceBio function.
 * - EnhanceBioOutput - The return type for the enhanceBio function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const EnhanceBioInputSchema = z.object({
  bioText: z.string().describe("The user's current bio text to be enhanced."),
});
export type EnhanceBioInput = z.infer<typeof EnhanceBioInputSchema>;

const EnhanceBioOutputSchema = z.object({
  enhancedBioText: z.string().describe("The AI-enhanced version of the bio text."),
});
export type EnhanceBioOutput = z.infer<typeof EnhanceBioOutputSchema>;

export async function enhanceBio(input: EnhanceBioInput): Promise<EnhanceBioOutput> {
  return enhanceBioFlow(input);
}

const prompt = ai.definePrompt({
  name: 'enhanceBioPrompt',
  input: {schema: EnhanceBioInputSchema},
  output: {schema: EnhanceBioOutputSchema},
  prompt: `You are an expert editor specializing in refining personal bios for online profiles, particularly for matchmaking platforms.
Review the following bio text. Your task is to:
1. Correct any grammatical errors and typos.
2. Improve clarity and flow.
3. Rephrase sentences to sound more professional, engaging, and appealing.
4. Maintain the original core meaning, personality, and key information conveyed in the bio.
5. Ensure the tone is positive and inviting.

Do NOT add any new information or fabricate details.
Do NOT make it overly formal or robotic; it should still sound like a person.
Return only the enhanced bio text as the 'enhancedBioText' field in the JSON output.

Original Bio:
{{{bioText}}}
`,
});

const enhanceBioFlow = ai.defineFlow(
  {
    name: 'enhanceBioFlow',
    inputSchema: EnhanceBioInputSchema,
    outputSchema: EnhanceBioOutputSchema,
  },
  async (input: EnhanceBioInput) => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error("The AI model did not return an enhanced bio. Please try again.");
    }
    return output;
  }
);
