
"use client";

import React, { useState, useEffect } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { extractHoroscopeDetails, ExtractHoroscopeDetailsInput, ExtractHoroscopeDetailsOutput } from '@/ai/flows/extract-horoscope-details-flow';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Sparkles, Telescope, FileText, Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { HoroscopeChartDisplay } from './HoroscopeChartDisplay';
import { auth, db } from '@/lib/firebase/config';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_FILE_TYPES = ["application/pdf", "image/jpeg", "image/jpg", "image/png", "image/webp"];

const ExtractHoroscopeDetailsFormClientSchema = z.object({
  dateOfBirth: z.string().min(1, { message: "Date of birth is required."}).regex(/^\d{4}-\d{2}-\d{2}$/, "Date of birth must be in YYYY-MM-DD format."),
  timeOfBirth: z.string().min(1, { message: "Time of birth is required."}),
  placeOfBirth: z.string().min(1, { message: "Place of birth is required."}),
  horoscopeFileDataUri: z.string().optional(),
  horoscopeFile: z
    .any() 
    .refine((file) => !file || (file instanceof File && file.size <= MAX_FILE_SIZE), `Max file size is 5MB.`)
    .refine(
      (file) => !file || (file instanceof File && ACCEPTED_FILE_TYPES.includes(file.type)),
      "Only PDF, JPG, JPEG, PNG, and WebP files are accepted."
    ).optional(),
});

type FormData = z.infer<typeof ExtractHoroscopeDetailsFormClientSchema>;

export function ExtractHoroscopeDetailsForm() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [analysisResult, setAnalysisResult] = useState<ExtractHoroscopeDetailsOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [profileHoroscopeFileName, setProfileHoroscopeFileName] = useState<string | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(ExtractHoroscopeDetailsFormClientSchema),
    defaultValues: {
      dateOfBirth: "", // Will be pre-filled from profile or default
      timeOfBirth: "", 
      placeOfBirth: "",
      horoscopeFileDataUri: undefined,
      horoscopeFile: undefined,
    },
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchProfileData = async () => {
      if (currentUser) {
        setIsLoadingProfile(true);
        try {
          const userDocRef = doc(db, "users", currentUser.uid);
          const docSnap = await getDoc(userDocRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            form.reset({
              dateOfBirth: data.dob || "1990-01-01",
              timeOfBirth: data.timeOfBirth || "12:00 PM", // Assuming timeOfBirth is stored
              placeOfBirth: data.location || "Delhi, India", // Using location as a proxy for placeOfBirth for now
              horoscopeFileDataUri: undefined,
              horoscopeFile: undefined,
            });
            if (data.horoscopeFileName) {
              setProfileHoroscopeFileName(data.horoscopeFileName);
            }
            toast({
                title: "Profile Data Loaded",
                description: "Form pre-filled with your saved details. Modify as needed for this analysis.",
                variant: "default",
                duration: 2000,
            });
          } else {
             // Set default values if profile doesn't exist or is empty
            form.reset({
              dateOfBirth: "1990-01-01",
              timeOfBirth: "12:00 PM",
              placeOfBirth: "Delhi, India",
              horoscopeFileDataUri: undefined,
              horoscopeFile: undefined,
            });
          }
        } catch (e) {
          console.error("Failed to fetch profile data:", e);
          toast({ title: "Error", description: "Could not load your profile data for pre-filling.", variant: "destructive" });
           form.reset({ // Fallback to defaults on error
              dateOfBirth: "1990-01-01",
              timeOfBirth: "12:00 PM",
              placeOfBirth: "Delhi, India",
            });
        } finally {
          setIsLoadingProfile(false);
        }
      } else {
         // No user logged in, set default values
        form.reset({
          dateOfBirth: "1990-01-01",
          timeOfBirth: "12:00 PM",
          placeOfBirth: "Delhi, India",
          horoscopeFileDataUri: undefined,
          horoscopeFile: undefined,
        });
        setIsLoadingProfile(false);
      }
    };
    fetchProfileData();
  }, [currentUser, form, toast]);


  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const validationResult = ExtractHoroscopeDetailsFormClientSchema.shape.horoscopeFile.safeParse(file);
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
        horoscopeFileDataUri: values.horoscopeFileDataUri,
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

  if (isLoadingProfile) {
    return (
        <div className="flex flex-col items-center justify-center p-8 space-y-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading your profile data...</p>
        </div>
    );
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
                <FormControl><Input type="date" {...field} value={field.value || ""} /></FormControl>
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
                <FormControl><Input type="text" placeholder="e.g., 12:00 PM or 14:30" {...field} value={field.value || ""} /></FormControl>
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
                <FormControl><Input placeholder="e.g., City, Country" {...field} value={field.value || ""} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="horoscopeFile" 
            render={({ field: { onChange: rhfOnChange, onBlur, name, ref }}) => ( 
              <FormItem>
                <FormLabel className="flex items-center">
                  <FileText className="mr-2 h-4 w-4 text-muted-foreground" />
                  Upload Horoscope File (PDF/Image - Optional)
                </FormLabel>
                <FormControl>
                  <Input 
                    type="file" 
                    accept={ACCEPTED_FILE_TYPES.join(',')} 
                    onChange={(e) => {
                       rhfOnChange(e.target.files?.[0] || null); 
                       handleFileChange(e); 
                    }}
                    onBlur={onBlur}
                    name={name}
                    ref={ref}
                    className="text-sm"
                  />
                </FormControl>
                {selectedFileName && <FormDescription className="text-xs">Selected for this analysis: {selectedFileName}.</FormDescription>}
                {!selectedFileName && profileHoroscopeFileName && (
                     <FormDescription className="text-xs flex items-center gap-1 text-blue-600">
                        <Info size={14}/> Your profile has a stored horoscope: '{profileHoroscopeFileName}'. Select a file above to use it or upload a new one for this analysis.
                    </FormDescription>
                )}
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
        <>
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
          
          {analysisResult.ascendant && analysisResult.planetaryPositions && (
            <HoroscopeChartDisplay 
              ascendant={analysisResult.ascendant}
              planetaryPositions={analysisResult.planetaryPositions}
            />
          )}
        </>
      )}
    </>
  );
}
