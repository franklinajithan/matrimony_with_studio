
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

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_FILE_TYPES = ["application/pdf", "image/jpeg", "image/jpg", "image/png", "image/webp"];

const ExtractHoroscopeDetailsFormSchema = z.object({
  dateOfBirth: z.string().min(1, { message: "Date of birth is required."}).regex(/^\d{4}-\d{2}-\d{2}$/, "Date of birth must be in YYYY-MM-DD format."),
  timeOfBirth: z.string().min(1, { message: "Time of birth is required."}),
  placeOfBirth: z.string().min(1, { message: "Place of birth is required."}),
  horoscopeFileDataUri: z.string().optional(), // This will hold the data URI
  // We'll add a temporary field for the File object for client-side validation, not part of the AI flow input.
  horoscopeFile: z
    .any()
    .refine((file) => !file || (file instanceof File && file.size <= MAX_FILE_SIZE), `Max file size is 5MB.`)
    .refine(
      (file) => !file || (file instanceof File && ACCEPTED_FILE_TYPES.includes(file.type)),
      "Only PDF, JPG, JPEG, PNG, and WebP files are accepted."
    ).optional(),
});

type FormData = z.infer<typeof ExtractHoroscopeDetailsFormSchema>;

export function ExtractHoroscopeDetailsForm() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<ExtractHoroscopeDetailsOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);


  const form = useForm<FormData>({
    resolver: zodResolver(ExtractHoroscopeDetailsFormSchema),
    defaultValues: {
      dateOfBirth: "1990-01-01",
      timeOfBirth: "12:00 PM", 
      placeOfBirth: "Delhi, India",
      horoscopeFileDataUri: undefined,
      horoscopeFile: undefined,
    },
  });

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate using Zod schema for horoscopeFile
      const validationResult = ExtractHoroscopeDetailsFormSchema.shape.horoscopeFile.safeParse(file);
      if (!validationResult.success) {
        form.setError("horoscopeFile", { type: "manual", message: validationResult.error.errors[0].message });
        form.setValue("horoscopeFileDataUri", undefined);
        setSelectedFileName(null);
        return;
      }

      form.clearErrors("horoscopeFile");
      setSelectedFileName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        form.setValue("horoscopeFileDataUri", reader.result as string, { shouldValidate: true });
      };
      reader.onerror = () => {
        toast({ title: "File Read Error", description: "Could not read the selected file.", variant: "destructive" });
        form.setValue("horoscopeFileDataUri", undefined);
        setSelectedFileName(null);
      };
      reader.readAsDataURL(file);
    } else {
      form.setValue("horoscopeFileDataUri", undefined);
      form.setValue("horoscopeFile", undefined);
      setSelectedFileName(null);
      form.clearErrors("horoscopeFile");
    }
  };

  async function onSubmit(values: FormData) {
    setIsLoading(true);
    setAnalysisResult(null);
    setError(null);
    
    const flowInput: ExtractHoroscopeDetailsInput = {
        dateOfBirth: values.dateOfBirth,
        timeOfBirth: values.timeOfBirth,
        placeOfBirth: values.placeOfBirth,
        horoscopeFileDataUri: values.horoscopeFileDataUri, // This is the data URI
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
            name="horoscopeFile" // Control the File object for validation display
            render={({ field: { onChange, ...restFieldProps }}) => ( 
              <FormItem>
                <FormLabel className="flex items-center">
                  <FileText className="mr-2 h-4 w-4 text-muted-foreground" />
                  Upload Horoscope File (PDF/Image - Optional)
                </FormLabel>
                <FormControl>
                  <Input 
                    type="file" 
                    accept=".pdf,image/jpeg,image/jpg,image/png,image/webp" 
                    onChange={(e) => {
                       onChange(e.target.files?.[0] || null); // Update RHF for the File object
                       handleFileChange(e); // Custom handler for data URI and further processing
                    }}
                    className="text-sm"
                    {...restFieldProps} // Pass other props like ref, onBlur
                  />
                </FormControl>
                {selectedFileName && <FormDescription className="text-xs">Selected: {selectedFileName}. Will be used to supplement analysis.</FormDescription>}
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
