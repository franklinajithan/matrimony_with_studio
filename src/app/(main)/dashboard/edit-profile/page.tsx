
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { User, Image as ImageIcon, Info, MapPin, Briefcase, Ruler, Languages, CalendarDays, Upload, PlusCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

// Mock existing user data
const currentUser = {
  fullName: "Aisha Khan",
  bio: "Passionate about technology, travel, and finding meaningful connections. I enjoy reading, hiking, and exploring new cuisines. Looking for someone kind, ambitious, and with a good sense of humor.",
  profilePhotoUrl: "https://placehold.co/150x150",
  dataAiHint: "woman portrait",
  location: "Mumbai, India",
  profession: "Software Engineer",
  height: "165", // cm
  dob: "1995-07-20",
  religion: "Islam",
  caste: "Sunni",
  language: "Urdu, English, Hindi",
  horoscopeInfo: "Leo, some details...",
  // photos: ["url1", "url2"] // For multiple photo uploads
};

const editProfileSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters."),
  bio: z.string().min(10, "Bio must be at least 10 characters.").max(500, "Bio cannot exceed 500 characters."),
  profilePhoto: z.any().optional(), // For new photo upload
  location: z.string().min(2, "Location is required."),
  profession: z.string().min(2, "Profession is required."),
  height: z.string().regex(/^\d{2,3}$/, "Enter height in cm (e.g., 165)."),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Enter DOB in YYYY-MM-DD format."),
  religion: z.string().min(1, "Religion is required."),
  caste: z.string().min(1, "Caste is required."),
  language: z.string().min(1, "Primary language is required."),
  horoscopeInfo: z.string().optional(),
  horoscopePdf: z.any().optional(),
});

export default function EditProfilePage() {
  const { toast } = useToast();
  const form = useForm<z.infer<typeof editProfileSchema>>({
    resolver: zodResolver(editProfileSchema),
    defaultValues: {
      fullName: currentUser.fullName,
      bio: currentUser.bio,
      location: currentUser.location,
      profession: currentUser.profession,
      height: currentUser.height,
      dob: currentUser.dob,
      religion: currentUser.religion,
      caste: currentUser.caste,
      language: currentUser.language,
      horoscopeInfo: currentUser.horoscopeInfo,
    },
  });

  async function onSubmit(values: z.infer<typeof editProfileSchema>) {
    console.log("Profile update submitted:", values);
    toast({
      title: "Profile Updated (Mock)",
      description: "Your profile information would be saved.",
    });
    // Here you would:
    // 1. If new profilePhoto, upload to Firebase Storage and get URL
    // 2. If new horoscopePdf, upload to Firebase Storage and get URL
    // 3. Update profile data in Firestore
  }

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-xl">
      <CardHeader>
        <CardTitle className="font-headline text-3xl text-primary">Edit Your Profile</CardTitle>
        <CardDescription>Keep your information up-to-date to find the best matches.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-4 mb-6">
          <img src={currentUser.profilePhotoUrl} alt={currentUser.fullName} data-ai-hint={currentUser.dataAiHint} className="h-24 w-24 rounded-full object-cover" />
          <div>
            <h3 className="text-xl font-semibold">{currentUser.fullName}</h3>
            <Button variant="link" className="p-0 h-auto text-sm text-primary">Change Photo</Button> {/* Link to modal or section */}
          </div>
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField control={form.control} name="fullName" render={({ field }) => (
              <FormItem><FormLabel className="flex items-center"><User className="mr-2 h-4 w-4 text-muted-foreground" />Full Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="bio" render={({ field }) => (
              <FormItem><FormLabel className="flex items-center"><Info className="mr-2 h-4 w-4 text-muted-foreground" />About Me (Bio)</FormLabel><FormControl><Textarea {...field} rows={4} /></FormControl><FormMessage /></FormItem>
            )} />
            <div className="grid md:grid-cols-2 gap-6">
                <FormField control={form.control} name="location" render={({ field }) => (
                <FormItem><FormLabel className="flex items-center"><MapPin className="mr-2 h-4 w-4 text-muted-foreground" />Location</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="profession" render={({ field }) => (
                <FormItem><FormLabel className="flex items-center"><Briefcase className="mr-2 h-4 w-4 text-muted-foreground" />Profession</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                 <FormField control={form.control} name="height" render={({ field }) => (
                <FormItem><FormLabel className="flex items-center"><Ruler className="mr-2 h-4 w-4 text-muted-foreground" />Height (cm)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                 <FormField control={form.control} name="dob" render={({ field }) => (
                <FormItem><FormLabel className="flex items-center"><CalendarDays className="mr-2 h-4 w-4 text-muted-foreground" />Date of Birth</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
            </div>
             <FormField control={form.control} name="religion" render={({ field }) => (
                <FormItem><FormLabel>Religion</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select Religion" /></SelectTrigger></FormControl>
                    <SelectContent>
                        <SelectItem value="Hinduism">Hinduism</SelectItem><SelectItem value="Islam">Islam</SelectItem>
                        <SelectItem value="Christianity">Christianity</SelectItem><SelectItem value="Sikhism">Sikhism</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                </Select><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="caste" render={({ field }) => (
              <FormItem><FormLabel>Caste/Community</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="language" render={({ field }) => (
              <FormItem><FormLabel className="flex items-center"><Languages className="mr-2 h-4 w-4 text-muted-foreground" />Primary Language(s)</FormLabel><FormControl><Input placeholder="e.g., English, Hindi" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="horoscopeInfo" render={({ field }) => (
              <FormItem><FormLabel>Horoscope Information (Rasi, Nakshatra, etc.)</FormLabel><FormControl><Textarea placeholder="Enter details like Rasi, Nakshatra, Gothram..." {...field} rows={3} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="horoscopePdf" render={({ field }) => (
                <FormItem><FormLabel className="flex items-center"><Upload className="mr-2 h-4 w-4 text-muted-foreground" />Upload Horoscope PDF</FormLabel><FormControl><Input type="file" accept=".pdf" onChange={(e) => field.onChange(e.target.files ? e.target.files[0] : null)} /></FormControl><FormMessage /></FormItem>
            )} />

            {/* Placeholder for Multiple Photo Uploads */}
            <div className="space-y-2">
                <Label className="flex items-center"><ImageIcon className="mr-2 h-4 w-4 text-muted-foreground" />Profile Photos</Label>
                <div className="grid grid-cols-3 gap-2">
                    {/* Map existing photos here with delete option */}
                    {[1,2,3].map(i => (
                        <div key={i} className="aspect-square bg-muted rounded-md flex items-center justify-center">
                            <img src={`https://placehold.co/100x100?text=Photo+${i}`} alt={`Photo ${i}`} className="object-cover rounded-md h-full w-full" data-ai-hint="person profile"/>
                        </div>
                    ))}
                    <Button type="button" variant="outline" className="aspect-square flex items-center justify-center">
                        <PlusCircle className="h-6 w-6 text-muted-foreground"/>
                    </Button>
                </div>
                <p className="text-sm text-muted-foreground">Upload multiple photos. First photo will be your main display picture.</p>
            </div>


            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
              Save Changes
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
