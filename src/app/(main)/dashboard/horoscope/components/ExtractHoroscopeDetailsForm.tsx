
"use client";

import React, { useState } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { extractHoroscopeDetails, ExtractHoroscopeDetailsInput, ExtractHoroscopeDetailsOutput } from '@/ai/flows/extract-horoscope-details-flow';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Sparkles, Telescope, FileText } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Schema must match the input schema used by the AI flow
const ExtractHoroscopeDetailsFormSchema = z.object({
  dateOfBirth: z.string().min(1, { message: "Date of birth is required."}).regex(/^\d{4}-\d{2}-\d{2}$/, "Date of birth must be in YYYY-MM-DD format."),
  timeOfBirth: z.string().min(1, { message: "Time of birth is required."}), // Basic validation, specific format (HH:MM AM/PM) is harder with native input type="time"
  placeOfBirth: z.string().min(1, { message: "Place of birth is required."}),
  horoscopePdfDataUri: z.string().optional(),
});

type FormData = z.infer<typeof ExtractHoroscopeDetailsFormSchema>;

export function ExtractHoroscopeDetailsForm() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<ExtractHoroscopeDetailsOutput | null>(null);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(ExtractHoroscopeDetailsFormSchema),
    defaultValues: {
      dateOfBirth: "1990-01-01",
      timeOfBirth: "12:00", // HTML time input expects HH:MM (24-hour) or HH:MM:SS
      placeOfBirth: "Delhi, India",
      horoscopePdfDataUri: undefined,
    },
  });

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>, fieldChange: (value: string | undefined) => void) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== "application/pdf") {
        form.setError("horoscopePdfDataUri", { type: "manual", message: "Please upload a PDF file." });
        fieldChange(undefined);
        return;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        form.setError("horoscopePdfDataUri", { type: "manual", message: "PDF file size should not exceed 5MB." });
        fieldChange(undefined);
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        fieldChange(reader.result as string);
        form.clearErrors("horoscopePdfDataUri");
      };
      reader.onerror = () => {
        toast({ title: "File Read Error", description: "Could not read the selected file.", variant: "destructive" });
        fieldChange(undefined);
      };
      reader.readAsDataURL(file);
    } else {
      fieldChange(undefined);
      form.clearErrors("horoscopePdfDataUri");
    }
  };

  async function onSubmit(values: FormData) {
    setIsLoading(true);
    setAnalysisResult(null);
    setError(null);

    // The AI flow expects time in HH:MM AM/PM format for its description,
    // but HTML time input gives HH:MM. We need to ensure it's compatible.
    // For simplicity, we'll pass it as is, the Genkit flow prompt mentions "e.g., 02:30 PM"
    // but also says "Time of birth in HH:MM AM/PM format".
    // A more robust solution might involve a custom time input or parsing and reformatting.
    // For now, let's assume the model can handle HH:MM as well or the user types it with AM/PM if using text input.
    // The default value "12:00 PM" in the flow matches the form's "12:00" if user doesn't change.
    
    // The flow expects ExtractHoroscopeDetailsInput, ensure values match this type.
    const flowInput: ExtractHoroscopeDetailsInput = {
        ...values,
        timeOfBirth: values.timeOfBirth, // Pass as is, user/model needs to handle format.
    };
    
    try {
      const result = await extractHoroscopeDetails(flowInput);
      setAnalysisResult(result);
      toast({
        title: "Horoscope Analysis Complete!",
        description: "AI has provided detailed insights below.",
      });
    } catch (err: any) {
      console.error("Error extracting horoscope details:", err);
      setError(err.message || "Failed to extract horoscope details. Please check the inputs or try again.");
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
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="dateOfBirth"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date of Birth</FormLabel>
                <FormControl><Input type="date" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="timeOfBirth"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Time of Birth (Local)</FormLabel>
                {/* Using type="text" for AM/PM flexibility, or type="time" and model handles 24hr */}
                <FormControl><Input type="text" placeholder="e.g., 12:00 PM or 14:30" {...field} /></FormControl>
                 <FormDescription>Enter local time of birth (e.g., 02:30 PM or 14:30).</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="placeOfBirth"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Place of Birth</FormLabel>
                <FormControl><Input placeholder="e.g., City, Country" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="horoscopePdfDataUri"
            render={({ field }) => ( // field.value will be the data URI string or undefined
              <FormItem>
                <FormLabel className="flex items-center">
                  <FileText className="mr-2 h-4 w-4 text-muted-foreground" />
                  Upload Horoscope PDF (Optional)
                </FormLabel>
                <FormControl>
                  <Input 
                    type="file" 
                    accept=".pdf" 
                    // We don't pass field.onChange directly to input type="file"
                    // because field.onChange expects the final value (data URI string), not the File object.
                    onChange={(e) => handleFileChange(e, field.onChange)}
                    className="text-sm"
                  />
                </FormControl>
                {field.value && <FormDescription className="text-xs">PDF selected. Will be used to supplement analysis.</FormDescription>}
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" disabled={isLoading} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
            Analyze Horoscope
          </Button>
        </form>
      </Form>

      {isLoading && (
        <div className="mt-6 text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">AI is analyzing the stars... please wait.</p>
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
              <Telescope className="mr-2 h-6 w-6" /> AI Astrological Insights
            </CardTitle>
            <CardDescription>Detailed analysis based on your provided information.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div><strong>Sun Sign:</strong> {analysisResult.sunSign}</div>
            <div><strong>Moon Sign (Rasi):</strong> {analysisResult.moonSign}</div>
            <div><strong>Ascendant (Lagna):</strong> {analysisResult.ascendant}</div>
            <div><strong>Nakshatra:</strong> {analysisResult.nakshatra}</div>
            
            {analysisResult.planetaryPositions && analysisResult.planetaryPositions.length > 0 && (
              <div>
                <h4 className="font-semibold mb-1 mt-3">Planetary Positions:</h4>
                <ul className="list-disc list-inside pl-2 space-y-1">
                  {analysisResult.planetaryPositions.map((p, i) => (
                    <li key={i}>{p.planet} in {p.sign}{p.house ? ` (House ${p.house})` : ''}</li>
                  ))}
                </ul>
              </div>
            )}
            
            <div className="pt-2">
              <h4 className="font-semibold mb-1">Key Insights:</h4>
              <p className="whitespace-pre-line text-foreground/90">{analysisResult.keyInsights}</p>
            </div>

            {analysisResult.careerOutlook && (
               <div className="pt-2">
                <h4 className="font-semibold mb-1">Career Outlook:</h4>
                <p className="whitespace-pre-line text-foreground/90">{analysisResult.careerOutlook}</p>
              </div>
            )}
            {analysisResult.relationshipOutlook && (
               <div className="pt-2">
                <h4 className="font-semibold mb-1">Relationship Outlook:</h4>
                <p className="whitespace-pre-line text-foreground/90">{analysisResult.relationshipOutlook}</p>
              </div>
            )}
             {analysisResult.healthOutlook && (
               <div className="pt-2">
                <h4 className="font-semibold mb-1">Health Outlook:</h4>
                <p className="whitespace-pre-line text-foreground/90">{analysisResult.healthOutlook}</p>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <p className="text-xs text-muted-foreground">Note: This AI analysis is for informational purposes and should not replace professional astrological consultation.</p>
          </CardFooter>
        </Card>
      )}
    </>
  );
}
