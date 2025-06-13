"use client";

import React, { useState } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { analyzeHoroscopeCompatibility, HoroscopeCompatibilityInput, HoroscopeCompatibilityOutput, AstrologicalProfile } from '@/ai/flows/horoscope-compatibility-flow';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Users, Sparkles, BarChartBig } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

// Client-side schema for the form
const AstrologicalProfileClientSchema = z.object({
  name: z.string().optional(),
  sunSign: z.string().min(1, "Sun Sign is required."),
  moonSign: z.string().min(1, "Moon Sign (Rasi) is required."),
  ascendant: z.string().min(1, "Ascendant (Lagna) is required."),
  nakshatra: z.string().min(1, "Nakshatra is required."),
  // planetaryPositions is optional in the flow, so we omit it from the form for simplicity
});

const HoroscopeCompatibilityFormClientSchema = z.object({
  profile1: AstrologicalProfileClientSchema,
  profile2: AstrologicalProfileClientSchema,
  comparisonAspects: z.string().optional().transform(val => val ? val.split(',').map(s => s.trim()).filter(Boolean) : undefined),
});

type FormData = z.infer<typeof HoroscopeCompatibilityFormClientSchema>;

export function HoroscopeCompatibilityForm() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<HoroscopeCompatibilityOutput | null>(null);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(HoroscopeCompatibilityFormClientSchema),
    defaultValues: {
      profile1: { name: "Person 1", sunSign: "Aries", moonSign: "Mesha", ascendant: "Aries Ascendant", nakshatra: "Ashwini Pada 1" },
      profile2: { name: "Person 2", sunSign: "Libra", moonSign: "Tula", ascendant: "Libra Ascendant", nakshatra: "Chitra Pada 3" },
      comparisonAspects: "Guna Milan, Nadi Kuta",
    },
  });

  const renderProfileFields = (profileNumber: 1 | 2) => (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name={`profile${profileNumber}.name`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Name (Optional)</FormLabel>
            <FormControl><Input placeholder={`Name of Person ${profileNumber}`} {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name={`profile${profileNumber}.sunSign`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Sun Sign (Western)</FormLabel>
            <FormControl><Input placeholder="e.g., Aries, Taurus" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name={`profile${profileNumber}.moonSign`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Moon Sign (Vedic Rasi)</FormLabel>
            <FormControl><Input placeholder="e.g., Mesha, Vrishabha" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name={`profile${profileNumber}.ascendant`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Ascendant (Lagna)</FormLabel>
            <FormControl><Input placeholder="e.g., Simha Lagna" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name={`profile${profileNumber}.nakshatra`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Nakshatra (Birth Star)</FormLabel>
            <FormControl><Input placeholder="e.g., Ashwini Pada 1" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );

  async function onSubmit(values: FormData) {
    setIsLoading(true);
    setAnalysisResult(null);
    setError(null);

    const flowInput: HoroscopeCompatibilityInput = {
      profile1: values.profile1 as AstrologicalProfile, // Cast as planetaryPositions is not in form schema
      profile2: values.profile2 as AstrologicalProfile, // Cast as planetaryPositions is not in form schema
      comparisonAspects: values.comparisonAspects,
    };
    
    try {
      const result = await analyzeHoroscopeCompatibility(flowInput);
      setAnalysisResult(result);
      toast({
        title: "Compatibility Analysis Complete!",
        description: "AI has provided insights into the match.",
      });
    } catch (err: any) {
      console.error("Error analyzing compatibility:", err);
      setError(err.message || "Failed to analyze compatibility. Please check the inputs or try again.");
      toast({
        title: "Analysis Failed",
        description: err.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Accordion type="multiple" defaultValue={['profile1', 'profile2']} className="w-full space-y-4">
            <AccordionItem value="profile1">
              <Card>
                <AccordionTrigger className="p-0 hover:no-underline">
                  <CardHeader className="w-full text-left">
                    <CardTitle className="font-headline text-lg">Astrological Profile 1</CardTitle>
                  </CardHeader>
                </AccordionTrigger>
                <AccordionContent>
                  <CardContent className="pt-2">{renderProfileFields(1)}</CardContent>
                </AccordionContent>
              </Card>
            </AccordionItem>

            <AccordionItem value="profile2">
              <Card>
                <AccordionTrigger className="p-0 hover:no-underline">
                  <CardHeader className="w-full text-left">
                    <CardTitle className="font-headline text-lg">Astrological Profile 2</CardTitle>
                  </CardHeader>
                </AccordionTrigger>
                <AccordionContent>
                  <CardContent className="pt-2">{renderProfileFields(2)}</CardContent>
                </AccordionContent>
              </Card>
            </AccordionItem>
          </Accordion>

          <FormField
            control={form.control}
            name="comparisonAspects"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Specific Aspects to Compare (Optional, comma-separated)</FormLabel>
                <FormControl><Textarea placeholder="e.g., Guna Milan, Mangal Dosha, Nadi Kuta" {...field} defaultValue={Array.isArray(field.value) ? field.value.join(', ') : field.value || ""} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" disabled={isLoading} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
            Analyze Compatibility
          </Button>
        </form>
      </Form>

      {isLoading && (
        <div className="mt-6 text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">AI is comparing the stars... please wait.</p>
        </div>
      )}

      {error && (
        <Alert variant="destructive" className="mt-6">
          <AlertTitle>Analysis Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {analysisResult && !isLoading && (
        <Card className="mt-8 shadow-md">
          <CardHeader>
            <CardTitle className="font-headline text-2xl text-primary flex items-center">
              <Users className="mr-2 h-6 w-6" /> AI Compatibility Report
            </CardTitle>
            <CardDescription>Overall Score: <strong className="text-xl">{analysisResult.compatibilityScore}/100</strong></CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div>
              <h4 className="font-semibold mb-1">Relationship Summary:</h4>
              <p className="whitespace-pre-line text-foreground/90">{analysisResult.relationshipSummary}</p>
            </div>
            <div>
              <h4 className="font-semibold mb-1 mt-3 text-green-600">Positive Aspects:</h4>
              <p className="whitespace-pre-line text-foreground/90">{analysisResult.positiveAspects}</p>
            </div>
            <div>
              <h4 className="font-semibold mb-1 mt-3 text-amber-600">Challenging Aspects:</h4>
              <p className="whitespace-pre-line text-foreground/90">{analysisResult.challengingAspects}</p>
            </div>
            {analysisResult.detailedBreakdown && analysisResult.detailedBreakdown.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2 mt-4 flex items-center"><BarChartBig className="mr-2 h-5 w-5"/>Detailed Breakdown:</h4>
                <div className="space-y-3">
                  {analysisResult.detailedBreakdown.map((item, index) => (
                    <div key={index} className="p-3 bg-muted/50 rounded-md">
                      <h5 className="font-semibold">{item.aspectName}{item.score !== undefined ? ` (Score: ${item.score}/10)` : ''}</h5>
                      <p className="text-xs text-foreground/80 whitespace-pre-line">{item.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <p className="text-xs text-muted-foreground">Note: This AI analysis is for informational purposes and should not replace professional astrological consultation or personal judgment.</p>
          </CardFooter>
        </Card>
      )}
    </>
  );
}
