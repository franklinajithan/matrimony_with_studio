
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { SlidersHorizontal, Users, MapPin, Briefcase, Ruler, Languages } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

// Mock existing user preferences
const currentUserPreferences = {
  ageRange: { min: 25, max: 35 },
  heightRange: { min: "5'2\"", max: "6'0\"" }, // Store as string for input, convert for logic
  religion: ["Hinduism", "Sikhism"],
  caste: "Any",
  language: ["English", "Hindi", "Punjabi"],
  locationProximity: "100km", // Or specific cities
  professionType: ["Technology", "Healthcare"],
  showOnlyVerified: true,
  rasiNakshatraPref: "Consider", // 'Strict', 'Consider', 'Ignore'
};

const preferencesSchema = z.object({
  ageMin: z.coerce.number().min(18).max(99),
  ageMax: z.coerce.number().min(18).max(99),
  heightMin: z.string().optional(), // Can add regex for "X'Y\"" format
  heightMax: z.string().optional(),
  religion: z.array(z.string()).optional(), // Example for multi-select, would need a multi-select component
  caste: z.string().optional(),
  language: z.array(z.string()).optional(), // Example for multi-select
  location: z.string().optional(),
  profession: z.string().optional(),
  rasiNakshatraPref: z.enum(["Strict", "Consider", "Ignore"]),
  showOnlyVerified: z.boolean(),
}).refine(data => data.ageMin <= data.ageMax, {
  message: "Min age cannot be greater than max age.",
  path: ["ageMax"],
});


export default function EditPreferencesPage() {
  const { toast } = useToast();
  const form = useForm<z.infer<typeof preferencesSchema>>({
    resolver: zodResolver(preferencesSchema),
    defaultValues: {
      ageMin: currentUserPreferences.ageRange.min,
      ageMax: currentUserPreferences.ageRange.max,
      heightMin: currentUserPreferences.heightRange.min,
      heightMax: currentUserPreferences.heightRange.max,
      // For multi-select, you'd typically initialize from an array.
      // This setup is simplified for basic shadcn select.
      caste: currentUserPreferences.caste,
      location: currentUserPreferences.locationProximity,
      profession: currentUserPreferences.professionType.join(', '), // Simplified
      rasiNakshatraPref: currentUserPreferences.rasiNakshatraPref as "Strict" | "Consider" | "Ignore",
      showOnlyVerified: currentUserPreferences.showOnlyVerified,
    },
  });

  async function onSubmit(values: z.infer<typeof preferencesSchema>) {
    console.log("Preferences update submitted:", values);
    toast({
      title: "Preferences Updated (Mock)",
      description: "Your match preferences would be saved.",
    });
    // Here you would save preferences to Firestore
  }
  
  // Placeholder for multi-select religions
  const religions = ["Hinduism", "Islam", "Christianity", "Sikhism", "Buddhism", "Jainism", "Other"];


  return (
    <Card className="w-full max-w-2xl mx-auto shadow-xl">
      <CardHeader>
        <CardTitle className="font-headline text-3xl text-primary flex items-center gap-2">
          <SlidersHorizontal className="h-7 w-7" />
          Edit Match Preferences
        </CardTitle>
        <CardDescription>Refine your criteria to find the most compatible partners on MatchCraft.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="space-y-4 p-4 border rounded-md shadow-sm">
                <h3 className="font-semibold text-lg flex items-center gap-2"><Users className="h-5 w-5 text-muted-foreground" />Basic Criteria</h3>
                <div className="grid md:grid-cols-2 gap-6">
                    <FormField control={form.control} name="ageMin" render={({ field }) => (
                    <FormItem><FormLabel>Min Age</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="ageMax" render={({ field }) => (
                    <FormItem><FormLabel>Max Age</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                    <FormField control={form.control} name="heightMin" render={({ field }) => (
                    <FormItem><FormLabel className="flex items-center"><Ruler className="mr-2 h-4 w-4 text-muted-foreground" />Min Height</FormLabel><FormControl><Input placeholder="e.g., 5'2&quot; or 157cm" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="heightMax" render={({ field }) => (
                    <FormItem><FormLabel className="flex items-center"><Ruler className="mr-2 h-4 w-4 text-muted-foreground" />Max Height</FormLabel><FormControl><Input placeholder="e.g., 6'0&quot; or 183cm" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                </div>
            </div>

            <div className="space-y-4 p-4 border rounded-md shadow-sm">
                <h3 className="font-semibold text-lg">Community & Location</h3>
                {/* Simplified Religion select, real multi-select component would be better */}
                 <FormField control={form.control} name="religion" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Preferred Religion(s)</FormLabel>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {religions.map(r => (
                            <FormField
                                key={r}
                                control={form.control}
                                name="religion"
                                render={({ field: f }) => (
                                    <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                                    <FormControl>
                                        <Checkbox
                                        checked={f.value?.includes(r)}
                                        onCheckedChange={(checked) => {
                                            return checked
                                            ? f.onChange([...(f.value || []), r])
                                            : f.onChange(f.value?.filter((value) => value !== r))
                                        }}
                                        />
                                    </FormControl>
                                    <FormLabel className="font-normal">{r}</FormLabel>
                                    </FormItem>
                                )}
                            />
                        ))}
                        </div>
                        <FormMessage />
                    </FormItem>
                )} />
                <FormField control={form.control} name="caste" render={({ field }) => (
                    <FormItem><FormLabel>Caste/Community (Type 'Any' if no preference)</FormLabel><FormControl><Input placeholder="e.g., Brahmin, Jat, Any" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                 <FormField control={form.control} name="language" render={({ field }) => (
                    <FormItem><FormLabel className="flex items-center"><Languages className="mr-2 h-4 w-4 text-muted-foreground" />Preferred Language(s) (comma-separated)</FormLabel><FormControl><Input placeholder="e.g., English, Tamil, Sinhala" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="location" render={({ field }) => (
                    <FormItem><FormLabel className="flex items-center"><MapPin className="mr-2 h-4 w-4 text-muted-foreground" />Preferred Location / Proximity</FormLabel><FormControl><Input placeholder="e.g., Delhi NCR, Within 100km" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
            </div>
            
            <div className="space-y-4 p-4 border rounded-md shadow-sm">
                <h3 className="font-semibold text-lg flex items-center gap-2"><Briefcase className="h-5 w-5 text-muted-foreground" />Profession & Lifestyle</h3>
                <FormField control={form.control} name="profession" render={({ field }) => (
                    <FormItem><FormLabel>Preferred Profession(s) (comma-separated)</FormLabel><FormControl><Input placeholder="e.g., Doctor, Engineer, Artist, Any" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
            </div>

            <div className="space-y-4 p-4 border rounded-md shadow-sm">
                 <h3 className="font-semibold text-lg">Horoscope & Verification</h3>
                 <FormField control={form.control} name="rasiNakshatraPref" render={({ field }) => (
                    <FormItem><FormLabel>Rasi/Nakshatra Matching</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select Preference" /></SelectTrigger></FormControl>
                        <SelectContent>
                            <SelectItem value="Strict">Strictly Match</SelectItem>
                            <SelectItem value="Consider">Consider Matching</SelectItem>
                            <SelectItem value="Ignore">Ignore / Not Important</SelectItem>
                        </SelectContent>
                    </Select><FormMessage /></FormItem>
                )} />
                 <FormField control={form.control} name="showOnlyVerified" render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-2 space-y-0 mt-4">
                        <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                        <FormLabel className="font-normal">Show only Admin-Verified Profiles</FormLabel>
                    </FormItem>
                )} />
            </div>

            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-lg py-3">
              Save Preferences
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
