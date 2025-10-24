'use server';

/**
 * @fileOverview AI-powered drill suggestion based on match statistics.
 *
 * - suggestDrills - A function that suggests training exercises and futsal drills based on match statistics.
 * - AIDrillSuggestionInput - The input type for the suggestDrills function.
 * - AIDrillSuggestionOutput - The return type for the suggestDrills function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AIDrillSuggestionInputSchema = z.object({
  matchStatistics: z
    .string()
    .describe(
      'Detailed match statistics, including goals, assists, shots on target, possession, and other relevant data.'
    ),
  teamNeeds: z
    .string()
    .describe(
      'Description of the team weaknesses that need improvement, e.g., poor defense, weak attack, lack of coordination.'
    ),
});
export type AIDrillSuggestionInput = z.infer<typeof AIDrillSuggestionInputSchema>;

const AIDrillSuggestionOutputSchema = z.object({
  suggestedDrills: z
    .string()
    .describe(
      'A list of suggested training exercises and futsal drills to improve team performance, based on the provided match statistics and team needs.'
    ),
  explanation: z
    .string()
    .describe(
      'Explanation of why the suggested drills are relevant to the provided match statistics and team needs.'
    ),
});
export type AIDrillSuggestionOutput = z.infer<typeof AIDrillSuggestionOutputSchema>;

export async function suggestDrills(
  input: AIDrillSuggestionInput
): Promise<AIDrillSuggestionOutput> {
  return suggestDrillsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiDrillSuggestionPrompt',
  input: {schema: AIDrillSuggestionInputSchema},
  output: {schema: AIDrillSuggestionOutputSchema},
  prompt: `You are an expert futsal coach, skilled at analyzing match statistics and recommending effective training exercises.

Analyze the following match statistics and team needs to suggest specific drills to improve performance.

Match Statistics: {{{matchStatistics}}}

Team Needs: {{{teamNeeds}}}

Provide a detailed list of drills and explain why each drill is relevant to the identified needs.

Format your response as follows:

Suggested Drills:
- [Drill Name]: [Explanation of how it addresses the team needs and match statistics].
`,
});

const suggestDrillsFlow = ai.defineFlow(
  {
    name: 'suggestDrillsFlow',
    inputSchema: AIDrillSuggestionInputSchema,
    outputSchema: AIDrillSuggestionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
