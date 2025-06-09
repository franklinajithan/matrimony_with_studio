
// use server'
'use server';
/**
 * @fileOverview Provides intelligent match suggestions based on user profile data and activity.
 *
 * - intelligentMatchSuggestions - A function that suggests potential matches.
 * - IntelligentMatchSuggestionsInput - The input type for the intelligentMatchSuggestions function.
 * - IntelligentMatchSuggestionsOutput - The return type for the intelligentMatchSuggestions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const UserProfileSchema = z.object({
  age: z.number().describe('The user\'s age.'),
  religion: z.string().describe('The user\'s religion.'),
  caste: z.string().describe('The user\'s caste.'),
  language: z.string().describe('The user\'s language.'),
  height: z.number().describe('The user\'s height in centimeters.'),
  hobbies: z.array(z.string()).describe('The user\'s hobbies and interests.'),
  location: z.string().describe('The user\'s location.'),
  profession: z.string().describe('The user\'s profession.'),
  horoscope: z.string().optional().describe('Horoscope information of the user.'),
  favoriteMovies: z.array(z.string()).optional().describe('The user\'s favorite movies.'),
  favoriteMusic: z.array(z.string()).optional().describe('The user\'s favorite music genres or artists.'),
  educationLevel: z.string().optional().describe('The user\'s education level.'),
  smokingHabits: z.string().optional().describe('The user\'s smoking habits (e.g., Never, Socially, Regularly).'),
  drinkingHabits: z.string().optional().describe('The user\'s drinking habits (e.g., Never, Socially, Regularly).'),
});

const PotentialMatchProfileSchema = UserProfileSchema.extend({
  userId: z.string().describe('The potential match user ID'),
});

const IntelligentMatchSuggestionsInputSchema = z.object({
  userProfile: UserProfileSchema.describe('The user profile data.'),
  userActivity: z.object({
    profilesViewed: z.array(z.string()).describe('List of user IDs of profiles viewed by the user.'),
    matchesMade: z.array(z.string()).describe('List of user IDs of matches made by the user.'),
  }).describe('The user activity data.'),
  allPotentialMatches: z.array(PotentialMatchProfileSchema).describe('A list of potential match user profiles.'),
});

export type IntelligentMatchSuggestionsInput = z.infer<typeof IntelligentMatchSuggestionsInputSchema>;

const IntelligentMatchSuggestionsOutputSchema = z.array(z.object({
  userId: z.string().describe('The user ID of the suggested match.'),
  compatibilityScore: z.number().describe('A score indicating the compatibility between the user and the suggested match.'),
  reasoning: z.string().describe('The reasoning behind the match suggestion and compatibility score.'),
}));

export type IntelligentMatchSuggestionsOutput = z.infer<typeof IntelligentMatchSuggestionsOutputSchema>;

export async function intelligentMatchSuggestions(input: IntelligentMatchSuggestionsInput): Promise<IntelligentMatchSuggestionsOutput> {
  return intelligentMatchSuggestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'intelligentMatchSuggestionsPrompt',
  input: {schema: IntelligentMatchSuggestionsInputSchema},
  output: {schema: IntelligentMatchSuggestionsOutputSchema},
  prompt: `You are an AI matchmaker, skilled at suggesting compatible matches based on user profiles and activity.

Given the following information about a user and a list of potential matches, analyze their profiles and activity to determine the best matches.

User Profile:
Age: {{{userProfile.age}}}
Religion: {{{userProfile.religion}}}
Caste: {{{userProfile.caste}}}
Language: {{{userProfile.language}}}
Height: {{{userProfile.height}}} cm
Hobbies: {{#each userProfile.hobbies}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}
Location: {{{userProfile.location}}}
Profession: {{{userProfile.profession}}}
{{#if userProfile.horoscope}}Horoscope: {{{userProfile.horoscope}}}{{/if}}
{{#if userProfile.educationLevel}}Education: {{{userProfile.educationLevel}}}{{/if}}
{{#if userProfile.favoriteMovies}}Favorite Movies: {{#each userProfile.favoriteMovies}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}{{/if}}
{{#if userProfile.favoriteMusic}}Favorite Music: {{#each userProfile.favoriteMusic}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}{{/if}}
{{#if userProfile.smokingHabits}}Smoking Habits: {{{userProfile.smokingHabits}}}{{/if}}
{{#if userProfile.drinkingHabits}}Drinking Habits: {{{userProfile.drinkingHabits}}}{{/if}}

User Activity:
Profiles Viewed: {{#each userActivity.profilesViewed}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}
Matches Made: {{#each userActivity.matchesMade}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}

Potential Matches:
{{#each allPotentialMatches}}
Match User ID: {{{userId}}}
Age: {{{age}}}
Religion: {{{religion}}}
Caste: {{{caste}}}
Language: {{{language}}}
Height: {{{height}}} cm
Hobbies: {{#each hobbies}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}
Location: {{{location}}}
Profession: {{{profession}}}
{{#if horoscope}}Horoscope: {{{horoscope}}}{{/if}}
{{#if educationLevel}}Education: {{{educationLevel}}}{{/if}}
{{#if favoriteMovies}}Favorite Movies: {{#each favoriteMovies}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}{{/if}}
{{#if favoriteMusic}}Favorite Music: {{#each favoriteMusic}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}{{/if}}
{{#if smokingHabits}}Smoking Habits: {{{smokingHabits}}}{{/if}}
{{#if drinkingHabits}}Drinking Habits: {{{drinkingHabits}}}{{/if}}

{{/each}}

For each potential match, provide a compatibility score (0-100) and reasoning based on the user's profile, activity, and the potential match's profile. Consider shared hobbies, lifestyle preferences (deduced from smoking/drinking habits), education, cultural background (religion, caste, language), and implicit compatibility based on user activity. The output should be a JSON array.

Output:`, 
});

const intelligentMatchSuggestionsFlow = ai.defineFlow(
  {
    name: 'intelligentMatchSuggestionsFlow',
    inputSchema: IntelligentMatchSuggestionsInputSchema,
    outputSchema: IntelligentMatchSuggestionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

