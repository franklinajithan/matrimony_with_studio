'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const BiodataAssistInputSchema = z.object({
  instruction: z.string().trim().min(1).max(500),
  text: z.string().trim().min(1).max(8000),
});

const BiodataAssistOutputSchema = z.object({
  proposedText: z.string(),
});

const prompt = ai.definePrompt({
  name: 'biodataAssistPrompt',
  input: { schema: BiodataAssistInputSchema },
  output: { schema: BiodataAssistOutputSchema },
  prompt: `You rewrite biodata introduction text for a matchmaking platform.

Rules:
- NEVER invent facts, names, places, ages, jobs, or details not present in the original.
- Only rewrite, polish, shorten, change tone, or translate as instructed.
- Keep the writer's personality and meaning.
- Return only the rewritten text in proposedText.

Instruction:
{{{instruction}}}

Original text:
{{{text}}}
`,
});

const flow = ai.defineFlow(
  {
    name: 'biodataAssistFlow',
    inputSchema: BiodataAssistInputSchema,
    outputSchema: BiodataAssistOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output?.proposedText) {
      throw new Error('The AI model did not return rewritten text.');
    }
    return output;
  }
);

export async function rewriteBiodataText(input: {
  instruction: string;
  text: string;
}): Promise<{ proposedText: string }> {
  // This exported server action is callable independently of the HTTP route.
  // No durable, per-member AI quota exists yet, so block provider execution
  // until a database-enforced quota and abuse limit are implemented.
  const { getServerAuthUser } = await import('@/lib/supabase/server');
  const user = await getServerAuthUser();
  if (!user) throw new Error('Authentication required.');
  BiodataAssistInputSchema.parse(input);
  throw new Error('AI biodata assistance is temporarily unavailable.');
}
