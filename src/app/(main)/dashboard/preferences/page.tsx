
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { SlidersHorizontal, Users, MapPin, Briefcase, Ruler, Languages, EyeOff } from 'lucide-react'; // Added EyeOff
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch"; // Added Switch import

// Mock existing user preferences
const currentUserPreferences = {
  ageRange: { min: 25, max: 35 },
  heightRange: { min: "5'2\"", max: "6'0\"" }, 
  religion: ["Hinduism", "Sikhism"],
  caste: "Any",
  language: ["English", "Hindi", "Punjabi", "Tamil", "Sinhala"],
  locationProximity: "100km", 
  professionType: ["Technology", "Healthcare"],
  showOnlyVerified: true,
  rasiNakshatraPref: "Consider", 
  incognitoMode: false, // Added for mock data consistency
};

const preferencesSchema = z.object({
  ageMin: z.coerce.number().min(18).max(99),
  ageMax: z.coerce.number().min(18).max(99),
  heightMin: z.string().optional(), 
  heightMax: z.string().optional(),
  religion: z.array(z.string()).optional(), 
  caste: z.string().optional(),
  language: z.array(z.string()).optional(), 
  location: z.string().optional(),
  profession: z.string().optional(),
  rasiNakshatraPref: z.enum(["Strict", "Consider", "Ignore"]),
  showOnlyVerified: z.boolean(),
  incognitoMode: z.boolean().optional(), // Added incognitoMode to schema
}).refine(data => data.ageMin <= data.ageMax, {
  message: "Min age cannot be greater than max age.",
  path: ["ageMax"],
});


const religionOptionsForCheckboxes = [
  { id: "Hinduism", label: "Hinduism" },
  { id: "Islam", label: "Islam" },
  { id: "Christianity", label: "Christianity" },
  { id: "Sikhism", label: "Sikhism" },
  { id: "Buddhism", label: "Buddhism" },
  { id: "Jainism", label: "Jainism" },
  { id: "Zoroastrianism", label: "Zoroastrianism" },
  { id: "Atheism", label: "Atheism" },
  { id: "Agnosticism", label: "Agnosticism" },
  { id: "Spiritual", label: "Spiritual but not religious" },
  { id: "Other", label: "Other" },
  { id: "NoPreferenceReligion", label: "Any/No Preference" },
];


export default function EditPreferencesPage() {
  const { toast } = useToast();
  const form = useForm<z.infer<typeof preferencesSchema>>({
    resolver: zodResolver(preferencesSchema),
    defaultValues: {
      ageMin: currentUserPreferences.ageRange.min,
      ageMax: currentUserPreferences.ageRange.max,
      heightMin: currentUserPreferences.heightRange.min,
      heightMax: currentUserPreferences.heightRange.max,
      religion: currentUserPreferences.religion,
      caste: currentUserPreferences.caste,
      language: currentUserPreferences.language,
      location: currentUserPreferences.locationProximity,
      profession: currentUserPreferences.professionType.join(', '), 
      rasiNakshatraPref: currentUserPreferences.rasiNakshatraPref as "Strict" | "Consider" | "Ignore",
      showOnlyVerified: currentUserPreferences.showOnlyVerified,
      incognitoMode: currentUserPreferences.incognitoMode || false, // Added default value
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
  
  return (
    <Card className="w-full max-w-2xl mx-auto shadow-xl">
      <CardHeader>
        <CardTitle className="font-headline text-3xl text-primary flex items-center gap-2">
          <SlidersHorizontal className="h-7 w-7" />
          Edit Match Preferences
        </CardTitle>
        <CardDescription>Refine your criteria to find the most compatible partners on CupidMatch.</CardDescription>
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
                 <FormField control={form.control} name="religion" render={() => (
                    <FormItem>
                        <FormLabel>Preferred Religion(s)</FormLabel>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2">
                        {religionOptionsForCheckboxes.map(option => (
                            <FormField
                                key={option.id}
                                control={form.control}
                                name="religion"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                                    <FormControl>
                                        <Checkbox
                                            checked={field.value?.includes(option.id)}
                                            onCheckedChange={(checked) => {
                                                const currentValue = field.value || [];
                                                if (option.id === "NoPreferenceReligion") {
                                                    return checked ? field.onChange([]) : field.onChange(currentValue.filter(v => v !== option.id)); 
                                                }
                                                return checked
                                                    ? field.onChange([...currentValue, option.id])
                                                    : field.onChange(currentValue.filter((value) => value !== option.id))
                                            }}
                                        />
                                    </FormControl>
                                    <FormLabel className="font-normal text-sm">{option.label}</FormLabel>
                                    </FormItem>
                                )}
                            />
                        ))}
                        </div>
                        <FormMessage />
                    </FormItem>
                )} />
                <FormField control={form.control} name="caste" render={({ field }) => (
                    <FormItem><FormLabel>Caste/Community (Type 'Any' if no preference)</FormLabel><FormControl><Input placeholder="e.g., Brahmin, Gounder, Any" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                 <FormField control={form.control} name="language" render={({ field }) => (
                    <FormItem>
                        <FormLabel className="flex items-center"><Languages className="mr-2 h-4 w-4 text-muted-foreground" />Preferred Language(s)</FormLabel>
                         <FormControl><Input placeholder="e.g., English, Tamil, Sinhala (comma-separated)" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                <FormField control={form.control} name="location" render={({ field }) => (
                    <FormItem><FormLabel className="flex items-center"><MapPin className="mr-2 h-4 w-4 text-muted-foreground" />Preferred Location / Proximity</FormLabel><FormControl><Input placeholder="e.g., Colombo, Chennai, Within 100km" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
            </div>
            
            <div className="space-y-4 p-4 border rounded-md shadow-sm">
                <h3 className="font-semibold text-lg flex items-center gap-2"><Briefcase className="h-5 w-5 text-muted-foreground" />Profession & Lifestyle</h3>
                <FormField control={form.control} name="profession" render={({ field }) => (
                    <FormItem><FormLabel>Preferred Profession(s) (comma-separated)</FormLabel><FormControl><Input placeholder="e.g., Doctor, Engineer, Artist, Any" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
            </div>

            <div className="space-y-4 p-4 border rounded-md shadow-sm">
                 <h3 className="font-semibold text-lg">Advanced Settings</h3>
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
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm bg-muted/20">
                        <div className="space-y-0.5">
                            <FormLabel>Show only Admin-Verified Profiles</FormLabel>
                            <FormDescription>Filter out profiles that haven't been verified by our team.</FormDescription>
                        </div>
                        <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    </FormItem>
                )} />
                 <FormField
                    control={form.control}
                    name="incognitoMode"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm bg-muted/20 mt-4">
                        <div className="space-y-0.5">
                            <FormLabel className="flex items-center">
                            <EyeOff className="mr-2 h-4 w-4 text-muted-foreground" />
                            Incognito Mode
                            </FormLabel>
                            <FormDescription>
                            Browse profiles without appearing in others' "Viewed Me" list. (May be a premium feature)
                            </FormDescription>
                        </div>
                        <FormControl>
                            <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            aria-label="Toggle Incognito Mode"
                            />
                        </FormControl>
                        </FormItem>
                    )}
                />
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

    