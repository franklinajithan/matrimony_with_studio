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
import { Loader2, Sparkles, Trash2, PlusCircle } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const profileSchema = z.object({
  age: z.coerce.number().min(18).max(100),
  religion: z.string().min(1, "Religion is required"),
  caste: z.string().min(1, "Caste is required"),
  language: z.string().min(1, "Language is required"),
  height: z.coerce.number().min(100).max(250),
  interests: z.string().transform(val => val.split(',').map(s => s.trim()).filter(Boolean)), // Comma-separated string to array
  location: z.string().min(1, "Location is required"),
  profession: z.string().min(1, "Profession is required"),
  horoscope: z.string().optional(),
});

const potentialMatchSchema = profileSchema.extend({
  userId: z.string().min(1, "User ID is required"),
});

const formSchema = z.object({
  userProfile: profileSchema,
  userActivity: z.object({
    profilesViewed: z.string().transform(val => val.split(',').map(s => s.trim()).filter(Boolean)),
    matchesMade: z.string().transform(val => val.split(',').map(s => s.trim()).filter(Boolean)),
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
  interests: "Reading, Trekking, Movies",
  location: "Mumbai, India",
  profession: "Software Engineer",
  horoscope: "Leo",
};

const defaultUserActivity: z.input<typeof formSchema>['userActivity'] = {
  profilesViewed: "user002, user005",
  matchesMade: "user003",
};

const defaultPotentialMatches: z.input<typeof potentialMatchSchema>[] = [
  { userId: "match001", age: 28, religion: "Hindu", caste: "Brahmin", language: "English, Marathi", height: 165, interests: "Yoga, Cooking, Travel", location: "Pune, India", profession: "Doctor", horoscope: "Cancer" },
];


export function SuggestionForm() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<IntelligentMatchSuggestionsOutput | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      userProfile: {
        ...defaultUserProfile,
        interests: defaultUserProfile.interests.join(', ') // Convert array to string for input
      },
      userActivity: {
        profilesViewed: defaultUserActivity.profilesViewed.join(', '),
        matchesMade: defaultUserActivity.matchesMade.join(', '),
      },
      allPotentialMatches: defaultPotentialMatches.map(pm => ({ ...pm, interests: pm.interests.join(', ') })),
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
      const formattedValues: IntelligentMatchSuggestionsInput = {
        ...values,
        userProfile: {
            ...values.userProfile,
            interests: values.userProfile.interests as unknown as string[] // Already transformed by Zod
        },
        userActivity: {
            profilesViewed: values.userActivity.profilesViewed as unknown as string[],
            matchesMade: values.userActivity.matchesMade as unknown as string[],
        },
        allPotentialMatches: values.allPotentialMatches.map(pm => ({
            ...pm,
            interests: pm.interests as unknown as string[]
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
      <FormField control={form.control} name={`${fieldNamePrefix}.interests` as any} render={({ field }) => (
        <FormItem><FormLabel>Interests (comma-separated)</FormLabel><FormControl><Textarea placeholder="e.g., Reading, Trekking, Movies" {...field} /></FormControl><FormMessage /></FormItem>
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
                     <Button type="button" variant="outline" onClick={() => append({ ...defaultPotentialMatches[0], userId: `match00${fields.length + 1}`, interests: defaultPotentialMatches[0].interests.join(', ') })} className="w-full">
                        <PlusCircle className="mr-2 h-4 w-4" /> Add Potential Match
                    </Button>
                     {form.formState.errors.allPotentialMatches && !form.formState.errors.allPotentialMatches.root && (
                        <p className="text-sm font-medium text-destructive">{form.formState.errors.allPotentialMatches.message}</p>
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
