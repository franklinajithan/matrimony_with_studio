
"use client";

import React, { useState } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import * as z from "zod";
import { intelligentMatchSuggestions, IntelligentMatchSuggestionsInput, IntelligentMatchSuggestionsOutput } from '@/ai/flows/intelligent-match-suggestions';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Sparkles, Trash2, PlusCircle, School, Cigarette, Droplet, Film, Music } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const stringToArrayTransformer = (val: string | undefined) => val ? val.split(',').map(s => s.trim()).filter(Boolean) : [];

const profileSchema = z.object({
  age: z.coerce.number().min(18).max(100),
  religion: z.string().min(1, "Religion is required"),
  caste: z.string().min(1, "Caste is required"),
  language: z.string().min(1, "Language is required"),
  height: z.coerce.number().min(100).max(250),
  hobbies: z.string().transform(stringToArrayTransformer),
  location: z.string().min(1, "Location is required"),
  profession: z.string().min(1, "Profession is required"),
  horoscope: z.string().optional(),
  favoriteMovies: z.string().optional().transform(stringToArrayTransformer),
  favoriteMusic: z.string().optional().transform(stringToArrayTransformer),
  educationLevel: z.string().optional(),
  smokingHabits: z.string().optional(),
  drinkingHabits: z.string().optional(),
});

const potentialMatchSchema = profileSchema.extend({
  userId: z.string().min(1, "User ID is required"),
});

const formSchema = z.object({
  userProfile: profileSchema,
  userActivity: z.object({
    profilesViewed: z.string().transform(stringToArrayTransformer),
    matchesMade: z.string().transform(stringToArrayTransformer),
  }),
  allPotentialMatches: z.array(potentialMatchSchema).min(1, "At least one potential match is required."),
});

type FormData = z.infer<typeof formSchema>;

const defaultUserProfile: z.input<typeof profileSchema> = {
  age: 30,
  religion: "Hindu",
  caste: "Brahmin",
  language: "English, Hindi",
  height: 170,
  hobbies: "Reading, Trekking, Movies",
  location: "Mumbai, India",
  profession: "Software Engineer",
  horoscope: "Leo",
  favoriteMovies: "Inception, The Dark Knight",
  favoriteMusic: "Rock, Classical",
  educationLevel: "Master's Degree",
  smokingHabits: "Never",
  drinkingHabits: "Socially",
};

const defaultUserActivity: z.input<typeof formSchema>['userActivity'] = {
  profilesViewed: "user002, user005",
  matchesMade: "user003",
};

const defaultPotentialMatches: z.input<typeof potentialMatchSchema>[] = [
  { 
    userId: "match001", 
    age: 28, 
    religion: "Hindu", 
    caste: "Brahmin", 
    language: "English, Marathi", 
    height: 165, 
    hobbies: "Yoga, Cooking, Travel", 
    location: "Pune, India", 
    profession: "Doctor", 
    horoscope: "Cancer",
    favoriteMovies: "The Matrix, Interstellar",
    favoriteMusic: "Pop, Indie",
    educationLevel: "Bachelor's Degree",
    smokingHabits: "Never",
    drinkingHabits: "Never",
  },
];


export function SuggestionForm() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<IntelligentMatchSuggestionsOutput | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      userProfile: defaultUserProfile,
      userActivity: {
        profilesViewed: defaultUserActivity.profilesViewed,
        matchesMade: defaultUserActivity.matchesMade,
      },
      allPotentialMatches: defaultPotentialMatches,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "allPotentialMatches",
  });

  async function onSubmit(values: FormData) {
    setIsLoading(true);
    setSuggestions(null);
    try {
      // Zod transform handles string to array for hobbies, movies, music, profilesViewed, matchesMade
      const formattedValues: IntelligentMatchSuggestionsInput = {
        userProfile: {
            ...values.userProfile,
        },
        userActivity: {
            ...values.userActivity,
        },
        allPotentialMatches: values.allPotentialMatches.map(pm => ({
            ...pm,
        }))
      };
      const result = await intelligentMatchSuggestions(formattedValues);
      setSuggestions(result);
      toast({
        title: "Suggestions Generated!",
        description: "AI has provided match suggestions below.",
        variant: "default",
      });
    } catch (error) {
      console.error("Error generating suggestions:", error);
      toast({
        title: "Error",
        description: "Failed to generate suggestions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  const renderProfileFields = (fieldNamePrefix: string) => (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField control={form.control} name={`${fieldNamePrefix}.age` as any} render={({ field }) => (
          <FormItem><FormLabel>Age</FormLabel><FormControl><Input type="number" placeholder="e.g., 30" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name={`${fieldNamePrefix}.height` as any} render={({ field }) => (
          <FormItem><FormLabel>Height (cm)</FormLabel><FormControl><Input type="number" placeholder="e.g., 170" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
      </div>
      <FormField control={form.control} name={`${fieldNamePrefix}.religion` as any} render={({ field }) => (
        <FormItem><FormLabel>Religion</FormLabel><FormControl><Input placeholder="e.g., Hindu" {...field} /></FormControl><FormMessage /></FormItem>
      )} />
      <FormField control={form.control} name={`${fieldNamePrefix}.caste` as any} render={({ field }) => (
        <FormItem><FormLabel>Caste</FormLabel><FormControl><Input placeholder="e.g., Brahmin" {...field} /></FormControl><FormMessage /></FormItem>
      )} />
      <FormField control={form.control} name={`${fieldNamePrefix}.language` as any} render={({ field }) => (
        <FormItem><FormLabel>Language(s)</FormLabel><FormControl><Input placeholder="e.g., English, Hindi" {...field} /></FormControl><FormMessage /></FormItem>
      )} />
      <FormField control={form.control} name={`${fieldNamePrefix}.hobbies` as any} render={({ field }) => (
        <FormItem><FormLabel>Hobbies (comma-separated)</FormLabel><FormControl><Textarea placeholder="e.g., Reading, Trekking, Movies" {...field} /></FormControl><FormMessage /></FormItem>
      )} />
      <FormField control={form.control} name={`${fieldNamePrefix}.location` as any} render={({ field }) => (
        <FormItem><FormLabel>Location</FormLabel><FormControl><Input placeholder="e.g., Mumbai, India" {...field} /></FormControl><FormMessage /></FormItem>
      )} />
      <FormField control={form.control} name={`${fieldNamePrefix}.profession` as any} render={({ field }) => (
        <FormItem><FormLabel>Profession</FormLabel><FormControl><Input placeholder="e.g., Software Engineer" {...field} /></FormControl><FormMessage /></FormItem>
      )} />
      <FormField control={form.control} name={`${fieldNamePrefix}.horoscope` as any} render={({ field }) => (
        <FormItem><FormLabel>Horoscope (Optional)</FormLabel><FormControl><Input placeholder="e.g., Leo" {...field} /></FormControl><FormMessage /></FormItem>
      )} />
       <FormField control={form.control} name={`${fieldNamePrefix}.favoriteMovies` as any} render={({ field }) => (
        <FormItem><FormLabel className="flex items-center"><Film className="mr-2 h-4 w-4 text-muted-foreground" />Favorite Movies (comma-separated)</FormLabel><FormControl><Textarea placeholder="e.g., Inception, The Dark Knight" {...field} /></FormControl><FormMessage /></FormItem>
      )} />
      <FormField control={form.control} name={`${fieldNamePrefix}.favoriteMusic` as any} render={({ field }) => (
        <FormItem><FormLabel className="flex items-center"><Music className="mr-2 h-4 w-4 text-muted-foreground" />Favorite Music (comma-separated)</FormLabel><FormControl><Textarea placeholder="e.g., Rock, Classical" {...field} /></FormControl><FormMessage /></FormItem>
      )} />
       <FormField control={form.control} name={`${fieldNamePrefix}.educationLevel` as any} render={({ field }) => (
        <FormItem><FormLabel className="flex items-center"><School className="mr-2 h-4 w-4 text-muted-foreground" />Education Level</FormLabel>
          <Select onValueChange={field.onChange} defaultValue={field.value}>
            <FormControl><SelectTrigger><SelectValue placeholder="Select Education" /></SelectTrigger></FormControl>
            <SelectContent>
              <SelectItem value="High School">High School</SelectItem>
              <SelectItem value="Associate Degree">Associate Degree</SelectItem>
              <SelectItem value="Bachelor's Degree">Bachelor&apos;s Degree</SelectItem>
              <SelectItem value="Master's Degree">Master&apos;s Degree</SelectItem>
              <SelectItem value="Doctorate">Doctorate</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
        <FormMessage /></FormItem>
      )} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField control={form.control} name={`${fieldNamePrefix}.smokingHabits` as any} render={({ field }) => (
          <FormItem><FormLabel className="flex items-center"><Cigarette className="mr-2 h-4 w-4 text-muted-foreground" />Smoking Habits</FormLabel>
           <Select onValueChange={field.onChange} defaultValue={field.value}>
            <FormControl><SelectTrigger><SelectValue placeholder="Select Smoking Habits" /></SelectTrigger></FormControl>
            <SelectContent>
                <SelectItem value="Never">Never</SelectItem>
                <SelectItem value="Occasionally/Socially">Occasionally/Socially</SelectItem>
                <SelectItem value="Regularly">Regularly</SelectItem>
                <SelectItem value="Prefer not to say">Prefer not to say</SelectItem>
            </SelectContent>
          </Select>
          <FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name={`${fieldNamePrefix}.drinkingHabits` as any} render={({ field }) => (
          <FormItem><FormLabel className="flex items-center"><Droplet className="mr-2 h-4 w-4 text-muted-foreground" />Drinking Habits</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl><SelectTrigger><SelectValue placeholder="Select Drinking Habits" /></SelectTrigger></FormControl>
                <SelectContent>
                    <SelectItem value="Never">Never</SelectItem>
                    <SelectItem value="Occasionally/Socially">Occasionally/Socially</SelectItem>
                    <SelectItem value="Regularly">Regularly</SelectItem>
                    <SelectItem value="Prefer not to say">Prefer not to say</SelectItem>
                </SelectContent>
            </Select>
          <FormMessage /></FormItem>
        )} />
      </div>
    </>
  );


  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Accordion type="multiple" defaultValue={['user-profile', 'potential-match-0']} className="w-full">
            <AccordionItem value="user-profile">
              <AccordionTrigger className="font-headline text-xl">Your Profile</AccordionTrigger>
              <AccordionContent className="space-y-4 pt-4">
                {renderProfileFields("userProfile")}
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="user-activity">
              <AccordionTrigger className="font-headline text-xl">Your Activity</AccordionTrigger>
              <AccordionContent className="space-y-4 pt-4">
                <FormField control={form.control} name="userActivity.profilesViewed" render={({ field }) => (
                  <FormItem><FormLabel>Profiles Viewed (User IDs, comma-separated)</FormLabel><FormControl><Input placeholder="e.g., user002, user005" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="userActivity.matchesMade" render={({ field }) => (
                  <FormItem><FormLabel>Matches Made (User IDs, comma-separated)</FormLabel><FormControl><Input placeholder="e.g., user003" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="potential-matches">
                <AccordionTrigger className="font-headline text-xl">Potential Matches ({fields.length})</AccordionTrigger>
                <AccordionContent className="space-y-6 pt-4">
                    {fields.map((field, index) => (
                        <Card key={field.id} className="pt-2">
                             <CardHeader className="flex flex-row items-center justify-between py-2">
                                <CardTitle className="text-lg">Potential Match {index + 1}</CardTitle>
                                <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="text-destructive hover:bg-destructive/10">
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <FormField control={form.control} name={`allPotentialMatches.${index}.userId`} render={({ field: f }) => (
                                    <FormItem><FormLabel>User ID</FormLabel><FormControl><Input placeholder="e.g., match001" {...f} /></FormControl><FormMessage /></FormItem>
                                )} />
                                {renderProfileFields(`allPotentialMatches.${index}`)}
                            </CardContent>
                        </Card>
                    ))}
                     <Button type="button" variant="outline" onClick={() => {
                        const newMatchDefault = { ...defaultPotentialMatches[0]};
                        // Ensure hobbies, movies, music are strings for the form's defaultValues
                        newMatchDefault.userId = `match00${fields.length + 1}`;
                        newMatchDefault.hobbies = defaultPotentialMatches[0].hobbies || "";
                        newMatchDefault.favoriteMovies = defaultPotentialMatches[0].favoriteMovies || "";
                        newMatchDefault.favoriteMusic = defaultPotentialMatches[0].favoriteMusic || "";
                        append(newMatchDefault);
                     }} className="w-full">
                        <PlusCircle className="mr-2 h-4 w-4" /> Add Potential Match
                    </Button>
                     {form.formState.errors.allPotentialMatches && !form.formState.errors.allPotentialMatches.root && (
                        <p className="text-sm font-medium text-destructive">{form.formState.errors.allPotentialMatches.message}</p>
                    )}
                     {form.formState.errors.allPotentialMatches?.root && (
                        <p className="text-sm font-medium text-destructive">{form.formState.errors.allPotentialMatches.root.message}</p>
                    )}
                </AccordionContent>
            </AccordionItem>
          </Accordion>

          <Button type="submit" disabled={isLoading} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-lg py-6">
            {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Sparkles className="mr-2 h-5 w-5" />}
            Get AI Match Suggestions
          </Button>
        </form>
      </Form>

      {suggestions && suggestions.length > 0 && (
        <div className="mt-12 space-y-6">
          <h2 className="font-headline text-3xl text-center text-primary">AI Match Suggestions</h2>
          {suggestions.map((suggestion, index) => (
            <Card key={index} className="shadow-lg">
              <CardHeader>
                <CardTitle className="font-headline text-xl">Suggested Match: {suggestion.userId}</CardTitle>
                <CardDescription>Compatibility Score: <strong className="text-primary">{suggestion.compatibilityScore}/100</strong></CardDescription>
              </CardHeader>
              <CardContent>
                <h4 className="font-semibold mb-1">Reasoning:</h4>
                <p className="text-sm text-foreground/80 whitespace-pre-line">{suggestion.reasoning}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      {suggestions && suggestions.length === 0 && !isLoading && (
        <div className="mt-12 text-center text-muted-foreground">
            <p>No specific suggestions found based on the provided data. Try adjusting the profiles.</p>
        </div>
      )}
    </>
  );
}

