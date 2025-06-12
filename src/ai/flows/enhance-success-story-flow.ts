
'use server';
/**
 * @fileOverview Provides AI-driven enhancement for success stories.
 *
 * - enhanceSuccessStory - A function that refines a success story text.
 * - EnhanceSuccessStoryInput - The input type for the enhanceSuccessStory function.
 * - EnhanceSuccessStoryOutput - The return type for the enhanceSuccessStory function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const EnhanceSuccessStoryInputSchema = z.object({
  storyText: z.string().describe("The success story text to be enhanced."),
});
export type EnhanceSuccessStoryInput = z.infer<typeof EnhanceSuccessStoryInputSchema>;

const EnhanceSuccessStoryOutputSchema = z.object({
  enhancedStoryText: z.string().describe("The AI-enhanced version of the success story text."),
});
export type EnhanceSuccessStoryOutput = z.infer<typeof EnhanceSuccessStoryOutputSchema>;

export async function enhanceSuccessStory(input: EnhanceSuccessStoryInput): Promise<EnhanceSuccessStoryOutput> {
  return enhanceSuccessStoryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'enhanceSuccessStoryPrompt',
  input: {schema: EnhanceSuccessStoryInputSchema},
  output: {schema: EnhanceSuccessStoryOutputSchema},
  prompt: `You are an expert editor specializing in refining heartwarming success stories for a matchmaking platform.
Review the following story text. Your task is to:
1. Correct any grammatical errors and typos.
2. Improve clarity, flow, and emotional impact.
3. Ensure the language is engaging, positive, and inspiring.
4. Maintain the original core meaning, key events, and authentic voice of the couple.
5. Do NOT add any new factual information or significantly alter the events described.
6. Do NOT change the names of the individuals mentioned.
7. Ensure the tone is appropriate for a public success story on a matrimonial website.
Return only the enhanced story text as the 'enhancedStoryText' field in the JSON output.

Original Story:
{{{storyText}}}
`,
});

const enhanceSuccessStoryFlow = ai.defineFlow(
  {
    name: 'enhanceSuccessStoryFlow',
    inputSchema: EnhanceSuccessStoryInputSchema,
    outputSchema: EnhanceSuccessStoryOutputSchema,
  },
  async (input: EnhanceSuccessStoryInput) => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error("The AI model did not return an enhanced story. Please try again.");
    }
    return output;
  }
);
