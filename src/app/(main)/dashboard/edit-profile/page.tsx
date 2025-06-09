
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { User, Image as ImageIcon, Info, MapPin, Briefcase, Ruler, Languages, CalendarDays, Upload, PlusCircle, FileImage, Trash2, XCircle, AlertTriangle, FileText } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// Mock existing user data
const currentUser = {
  fullName: "Aisha Khan",
  bio: "Passionate about technology, travel, and finding meaningful connections. I enjoy reading, hiking, and exploring new cuisines. Looking for someone kind, ambitious, and with a good sense of humor.",
  profilePhotoUrl: "https://placehold.co/150x150.png",
  dataAiHint: "woman portrait",
  location: "Mumbai, India",
  profession: "Software Engineer",
  height: "165", // cm
  dob: "1995-07-20",
  religion: "Islam",
  caste: "Sunni",
  language: "Urdu, English, Hindi",
  horoscopeInfo: "Leo, some details...",
  horoscopeFileName: "my_horoscope.pdf", // Example: name of the currently uploaded file
  additionalPhotoUrls: [
    {id:1, url: "https://placehold.co/100x100.png", hint: 'woman indoor'},
    {id:2, url: "https://placehold.co/100x100.png", hint: 'woman outdoor'},
    {id:3, url: "https://placehold.co/100x100.png", hint: 'woman casual'}
  ]
};

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const ACCEPTED_HOROSCOPE_FILE_TYPES = [...ACCEPTED_IMAGE_TYPES, "application/pdf"];

const editProfileSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters."),
  bio: z.string().min(10, "Bio must be at least 10 characters.").max(500, "Bio cannot exceed 500 characters."),
  profilePhoto: z
    .any()
    .refine((file) => !file || (file instanceof File && file.size <= MAX_FILE_SIZE), `Max file size is 5MB.`)
    .refine(
      (file) => !file || (file instanceof File && ACCEPTED_IMAGE_TYPES.includes(file.type)),
      ".jpg, .jpeg, .png and .webp files are accepted."
    ).optional(),
  additionalPhotos: z
    .array(z.instanceof(File))
    .optional()
    .refine(
        (files) => !files || files.every(file => file.size <= MAX_FILE_SIZE),
        `Max file size for each additional photo is 5MB.`
    )
    .refine(
        (files) => !files || files.every(file => ACCEPTED_IMAGE_TYPES.includes(file.type)),
        "Only .jpg, .jpeg, .png and .webp formats are supported for additional photos."
    ),
  location: z.string().min(2, "Location is required."),
  profession: z.string().min(2, "Profession is required."),
  height: z.string().regex(/^\d{2,3}$/, "Enter height in cm (e.g., 165)."),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Enter DOB in YYYY-MM-DD format."),
  religion: z.string().min(1, "Religion is required."),
  caste: z.string().min(1, "Caste is required."),
  language: z.string().min(1, "Primary language is required."),
  horoscopeInfo: z.string().optional(),
  horoscopeFile: z.any().optional()
    .refine((file) => !file || (file instanceof File && ACCEPTED_HOROSCOPE_FILE_TYPES.includes(file.type)), "Only PDF, JPG, JPEG, PNG, and WebP files are accepted for horoscope.")
    .refine((file) => !file || (file instanceof File && file.size <= MAX_FILE_SIZE), `Max file size is 5MB.`),
});

export default function EditProfilePage() {
  const { toast } = useToast();
  const [profilePhotoPreview, setProfilePhotoPreview] = useState<string | null>(null);
  const [additionalPhotosPreview, setAdditionalPhotosPreview] = useState<string[]>([]);
  const [selectedProfilePhotoName, setSelectedProfilePhotoName] = useState<string | null>(null);
  const [selectedHoroscopeFileName, setSelectedHoroscopeFileName] = useState<string | null>(currentUser.horoscopeFileName || null);
  const [managedExistingPhotos, setManagedExistingPhotos] = useState(currentUser.additionalPhotoUrls);

  const profilePhotoInputRef = React.useRef<HTMLInputElement>(null);


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
      profilePhoto: undefined,
      additionalPhotos: [],
      horoscopeFile: undefined,
    },
  });

  async function onSubmit(values: z.infer<typeof editProfileSchema>) {
    console.log("Profile update submitted:", values);
    // In a real app, you would also send information about which `managedExistingPhotos` were removed.
    toast({
      title: "Profile Updated (Mock)",
      description: "Your profile information would be saved.",
    });
  }
  
  const handleProfilePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      form.setValue('profilePhoto', file, { shouldValidate: true });
      setSelectedProfilePhotoName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      form.setValue('profilePhoto', null, { shouldValidate: true });
      setSelectedProfilePhotoName(null);
      setProfilePhotoPreview(null);
    }
  };

  const clearProfilePhotoSelection = () => {
    setProfilePhotoPreview(null);
    setSelectedProfilePhotoName(null);
    form.setValue('profilePhoto', null, { shouldValidate: true });
    if (profilePhotoInputRef.current) {
        profilePhotoInputRef.current.value = ""; // Clear the file input
    }
    toast({ title: "Profile photo selection cleared."});
  }

  const handleAdditionalPhotosChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    form.setValue("additionalPhotos", files, { shouldValidate: true }); 

    if (files.length > 0) {
      const newPreviews: string[] = [];
      let loadedCount = 0;
      files.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          newPreviews.push(reader.result as string);
          loadedCount++;
          if (loadedCount === files.length) {
            setAdditionalPhotosPreview(prev => [...prev, ...newPreviews.filter(p => !prev.includes(p))]);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeAdditionalPhotoPreview = (index: number) => {
    setAdditionalPhotosPreview(prev => prev.filter((_, i) => i !== index));
    const currentFiles = form.getValues("additionalPhotos") || [];
    const updatedFiles = currentFiles.filter((_, i) => i !== index);
    form.setValue("additionalPhotos", updatedFiles, { shouldValidate: true });
    toast({title: "Photo preview removed."});
  };

  const removeExistingPhoto = (photoId: number) => {
    setManagedExistingPhotos(prev => prev.filter(p => p.id !== photoId));
    toast({
      title: "Photo Removed (Locally)",
      description: "This photo will be permanently deleted when you save changes.",
      variant: "destructive"
    });
  };
  
  const handleDeactivateAccount = () => {
    toast({
        title: "Account Deactivated (Mock)",
        description: "Your account has been scheduled for deactivation.",
        variant: "destructive"
    });
  };

  const handleHoroscopeFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
        form.setValue('horoscopeFile', file, { shouldValidate: true });
        setSelectedHoroscopeFileName(file.name);
    } else {
        form.setValue('horoscopeFile', null, { shouldValidate: true });
        setSelectedHoroscopeFileName(null);
    }
  };


  return (
    <div className="space-y-8">
    <Card className="w-full max-w-2xl mx-auto shadow-xl">
      <CardHeader>
        <CardTitle className="font-headline text-3xl text-primary">Edit Your Profile</CardTitle>
        <CardDescription>Keep your information up-to-date to find the best matches.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="flex flex-col items-center space-y-4 mb-4">
                <div className="relative group">
                    <Image 
                        src={profilePhotoPreview || currentUser.profilePhotoUrl} 
                        alt={currentUser.fullName} 
                        width={128} 
                        height={128} 
                        className="h-32 w-32 rounded-full object-cover border-2 border-muted shadow-md" 
                        data-ai-hint={profilePhotoPreview ? "new upload" : currentUser.dataAiHint}
                    />
                    {profilePhotoPreview && (
                         <Button 
                            type="button" 
                            variant="ghost" 
                            size="icon" 
                            className="absolute -top-1 -right-1 h-7 w-7 rounded-full bg-destructive/80 text-destructive-foreground hover:bg-destructive"
                            onClick={clearProfilePhotoSelection}
                            aria-label="Clear selected profile photo"
                        >
                            <XCircle className="h-4 w-4" />
                        </Button>
                    )}
                </div>
              
              <div className="w-full max-w-sm">
                <FormField
                  control={form.control}
                  name="profilePhoto"
                  render={({ field }) => ( 
                    <FormItem>
                      <FormLabel className="text-base font-semibold sr-only">Change Profile Photo</FormLabel>
                      <FormControl>
                        <Input 
                          type="file"
                          ref={profilePhotoInputRef}
                          accept={ACCEPTED_IMAGE_TYPES.join(',')} 
                          onChange={(e) => {
                            field.onChange(e.target.files?.[0] || null); // RHF update
                            handleProfilePhotoChange(e); // Custom preview logic
                          }}
                          className="text-sm"
                        />
                      </FormControl>
                      {selectedProfilePhotoName && <FormDescription className="text-xs text-center mt-1">Selected: {selectedProfilePhotoName}</FormDescription>}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

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
             <FormField
                control={form.control}
                name="horoscopeFile"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel className="flex items-center"><FileText className="mr-2 h-4 w-4 text-muted-foreground" />Upload Horoscope File (PDF/Image)</FormLabel>
                    <FormControl>
                        <Input 
                        type="file" 
                        accept={ACCEPTED_HOROSCOPE_FILE_TYPES.join(',')} 
                        onChange={(e) => {
                             field.onChange(e.target.files ? e.target.files[0] : null); // RHF update
                             handleHoroscopeFileChange(e); // Custom handler for name display
                        }}
                        />
                    </FormControl>
                    {selectedHoroscopeFileName && <FormDescription className="text-xs">Selected: {selectedHoroscopeFileName}</FormDescription>}
                    <FormMessage />
                    </FormItem>
                )}
            />

            <div className="space-y-2">
                <Label className="flex items-center font-semibold"><FileImage className="mr-2 h-4 w-4 text-muted-foreground" />Your Photo Gallery</Label>
                <FormDescription>Manage your additional photos. Upload new ones or remove existing ones.</FormDescription>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                    {managedExistingPhotos.map(photo => (
                        <div key={`existing-${photo.id}`} className="aspect-square bg-muted rounded-md flex items-center justify-center relative group">
                            <Image src={photo.url} alt={`Photo ${photo.id}`} width={100} height={100} className="object-cover rounded-md h-full w-full" data-ai-hint={photo.hint}/>
                            <Button type="button" variant="destructive" size="icon" className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => removeExistingPhoto(photo.id)}>
                                <Trash2 className="h-3 w-3" />
                            </Button>
                        </div>
                    ))}
                    {additionalPhotosPreview.map((previewUrl, index) => (
                         <div key={`new-${index}`} className="aspect-square bg-muted rounded-md flex items-center justify-center relative group">
                            <Image src={previewUrl} alt={`New Photo ${index + 1}`} width={100} height={100} className="object-cover rounded-md h-full w-full" data-ai-hint="new upload"/>
                             <Button type="button" variant="destructive" size="icon" className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => removeAdditionalPhotoPreview(index)}>
                                <Trash2 className="h-3 w-3" />
                            </Button>
                        </div>
                    ))}
                </div>
            </div>
            
            <FormField
              control={form.control}
              name="additionalPhotos"
              render={({ field }) => ( 
                <FormItem>
                  <FormLabel className="flex items-center"><PlusCircle className="mr-2 h-4 w-4 text-muted-foreground" />Upload Additional Photos</FormLabel>
                  <FormControl>
                    <Input
                      type="file"
                      multiple
                      accept={ACCEPTED_IMAGE_TYPES.join(',')}
                      onChange={(e) => {
                         field.onChange(e.target.files ? Array.from(e.target.files) : null); // RHF Update
                         handleAdditionalPhotosChange(e); // Custom preview logic
                      }}
                    />
                  </FormControl>
                  {form.getValues("additionalPhotos") && form.getValues("additionalPhotos")!.length > 0 && (
                    <FormDescription className="text-xs">
                      Selected {form.getValues("additionalPhotos")!.length} file(s): {form.getValues("additionalPhotos")!.map(f => f.name).join(', ')}
                    </FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
              Save Changes
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>

    <Card className="w-full max-w-2xl mx-auto shadow-xl mt-8 border-destructive/50">
        <CardHeader>
            <CardTitle className="font-headline text-2xl text-destructive flex items-center">
                <AlertTriangle className="mr-2 h-6 w-6"/>Danger Zone
            </CardTitle>
            <CardDescription>Actions in this zone are critical and may have irreversible consequences.</CardDescription>
        </CardHeader>
        <CardContent>
             <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="w-full">
                        Deactivate Account
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Deactivating your account will hide your profile from MatchCraft. You will not be able to log in or be discovered by others. 
                        You can usually reactivate your account by contacting support. This action is not immediate deletion.
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeactivateAccount} className="bg-destructive hover:bg-destructive/90">
                        Yes, Deactivate My Account
                    </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            <p className="mt-2 text-xs text-muted-foreground text-center">
                Please be certain before deactivating your account.
            </p>
        </CardContent>
    </Card>
    </div>
  );
}
