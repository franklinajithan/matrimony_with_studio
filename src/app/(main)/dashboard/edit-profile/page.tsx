
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
import { User as UserIconLucide, Image as ImageIcon, Info, MapPin, Briefcase, Ruler, Languages, CalendarDays, PlusCircle, FileImage, Trash2, XCircle, AlertTriangle, FileText, Loader2, Film, Music, School, Droplet, Cigarette, Sparkles as SparklesIcon, Wand2, Gamepad2, Palette, Video } from 'lucide-react'; 
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import React, { useState, useEffect, useRef } from "react";
import NextImage from "next/image"; // Renamed to avoid conflict
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
import { auth, db } from "@/lib/firebase/config";
import { updateProfile, onAuthStateChanged, type User } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { uploadFile } from "@/lib/firebase/storageService";
import { Skeleton } from "@/components/ui/skeleton";
import { enhanceBio } from "@/ai/flows/enhance-bio-flow";
import { enhanceHobbies } from "@/ai/flows/enhance-hobbies-flow";
import { enhanceMovies } from "@/ai/flows/enhance-movies-flow";
import { enhanceMusic } from "@/ai/flows/enhance-music-flow";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const ACCEPTED_HOROSCOPE_FILE_TYPES = [...ACCEPTED_IMAGE_TYPES, "application/pdf"];

interface StoredPhoto {
  id: string;
  url: string;
  hint: string;
  storagePath?: string; 
}

const editProfileSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters."),
  bio: z.string().min(10, "Bio must be at least 10 characters.").max(500, "Bio cannot exceed 500 characters."),
  profilePhoto: z 
    .instanceof(File, { message: "Please select a file." })
    .optional()
    .refine(file => !file || file.size <= MAX_FILE_SIZE, `Max file size is 5MB.`)
    .refine(file => !file || ACCEPTED_IMAGE_TYPES.includes(file.type), ".jpg, .jpeg, .png and .webp files are accepted."),
  additionalPhotos: z 
    .array(z.instanceof(File))
    .optional()
    .refine(files => !files || files.every(file => file.size <= MAX_FILE_SIZE), `Max file size for each additional photo is 5MB.`)
    .refine(files => !files || files.every(file => ACCEPTED_IMAGE_TYPES.includes(file.type)), "Only .jpg, .jpeg, .png and .webp formats are supported."),
  location: z.string().min(2, "Location is required."),
  profession: z.string().min(2, "Profession is required."),
  height: z.string().regex(/^\d{2,3}$/, "Enter height in cm (e.g., 165)."),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Enter DOB in YYYY-MM-DD format."),
  religion: z.string().min(1, "Religion is required."),
  caste: z.string().min(1, "Caste is required."),
  language: z.string().min(1, "Primary language is required."),
  
  sunSign: z.string().optional(),
  moonSign: z.string().optional(),
  nakshatra: z.string().optional(),
  horoscopeInfo: z.string().optional(), 
  horoscopeFile: z 
    .instanceof(File, { message: "Please select a file." })
    .optional()
    .refine(file => !file || ACCEPTED_HOROSCOPE_FILE_TYPES.includes(file.type), "Only PDF, JPG, JPEG, PNG, and WebP files are accepted.")
    .refine(file => !file || file.size <= MAX_FILE_SIZE, `Max file size is 5MB.`),
  
  hobbies: z.string().optional(),
  favoriteMovies: z.string().optional(),
  favoriteMusic: z.string().optional(),
  educationLevel: z.string().optional(),
  smokingHabits: z.string().optional(),
  drinkingHabits: z.string().optional(),
});

const defaultFirestoreProfile = {
  fullName: "", bio: "", profilePhotoUrl: "https://placehold.co/128x128.png", dataAiHint: "person placeholder",
  location: "", profession: "", height: "", dob: "", religion: "", caste: "", language: "",
  hobbies: "", favoriteMovies: "", favoriteMusic: "", educationLevel: "", smokingHabits: "", drinkingHabits: "",
  sunSign: "", moonSign: "", nakshatra: "", horoscopeInfo: "", 
  horoscopeFileName: "", horoscopeFileUrl: "", additionalPhotoUrls: [],
};

const religionOptions = [
  { value: "Hinduism", label: "Hinduism" },
  { value: "Islam", label: "Islam" },
  { value: "Christianity", label: "Christianity" },
  { value: "Sikhism", label: "Sikhism" },
  { value: "Buddhism", label: "Buddhism" },
  { value: "Jainism", label: "Jainism" },
  { value: "Zoroastrianism", label: "Zoroastrianism" },
  { value: "Atheism", label: "Atheism" },
  { value: "Agnosticism", label: "Agnosticism" },
  { value: "Spiritual but not religious", label: "Spiritual but not religious" },
  { value: "Other", label: "Other" },
  { value: "Prefer not to say", label: "Prefer not to say" },
];


export default function EditProfilePage() {
  const { toast } = useToast();
  const [profileDataLoaded, setProfileDataLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isEnhancingBio, setIsEnhancingBio] = useState(false);
  const [isEnhancingHobbies, setIsEnhancingHobbies] = useState(false);
  const [isEnhancingMovies, setIsEnhancingMovies] = useState(false);
  const [isEnhancingMusic, setIsEnhancingMusic] = useState(false);
  
  const [currentProfilePhotoUrl, setCurrentProfilePhotoUrl] = useState<string | null>(defaultFirestoreProfile.profilePhotoUrl);
  const [currentDataAiHint, setCurrentDataAiHint] = useState<string>(defaultFirestoreProfile.dataAiHint);

  const [profilePhotoPreview, setProfilePhotoPreview] = useState<string | null>(null);
  const [additionalPhotosPreview, setAdditionalPhotosPreview] = useState<string[]>([]); 
  const [selectedProfilePhotoName, setSelectedProfilePhotoName] = useState<string | null>(null);
  const [selectedHoroscopeFileName, setSelectedHoroscopeFileName] = useState<string | null>(null);
  
  const [managedExistingPhotos, setManagedExistingPhotos] = useState<StoredPhoto[]>([]); 

  const profilePhotoInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<z.infer<typeof editProfileSchema>>({
    resolver: zodResolver(editProfileSchema),
    defaultValues: { 
      ...defaultFirestoreProfile,
      profilePhoto: undefined,
      additionalPhotos: [],
      horoscopeFile: undefined,
    },
  });

  useEffect(() => {
    const loadProfile = async (currentUser: User) => {
      const userDocRef = doc(db, "users", currentUser.uid);
      try {
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          form.reset({
            fullName: data.displayName || currentUser.displayName || defaultFirestoreProfile.fullName,
            bio: data.bio || defaultFirestoreProfile.bio,
            location: data.location || defaultFirestoreProfile.location,
            profession: data.profession || defaultFirestoreProfile.profession,
            height: data.height || defaultFirestoreProfile.height,
            dob: data.dob || defaultFirestoreProfile.dob,
            religion: data.religion || defaultFirestoreProfile.religion,
            caste: data.caste || defaultFirestoreProfile.caste,
            language: data.language || defaultFirestoreProfile.language,
            hobbies: data.hobbies || defaultFirestoreProfile.hobbies,
            favoriteMovies: data.favoriteMovies || defaultFirestoreProfile.favoriteMovies, 
            favoriteMusic: data.favoriteMusic || defaultFirestoreProfile.favoriteMusic, 
            educationLevel: data.educationLevel || defaultFirestoreProfile.educationLevel,
            smokingHabits: data.smokingHabits || defaultFirestoreProfile.smokingHabits,
            drinkingHabits: data.drinkingHabits || defaultFirestoreProfile.drinkingHabits,
            sunSign: data.sunSign || defaultFirestoreProfile.sunSign,
            moonSign: data.moonSign || defaultFirestoreProfile.moonSign,
            nakshatra: data.nakshatra || defaultFirestoreProfile.nakshatra,
            horoscopeInfo: data.horoscopeInfo || defaultFirestoreProfile.horoscopeInfo,
            profilePhoto: undefined,
            additionalPhotos: [],
            horoscopeFile: undefined,
          });
          
          const photoToUse = data.photoURL || currentUser.photoURL || defaultFirestoreProfile.profilePhotoUrl;
          setCurrentProfilePhotoUrl(photoToUse);
          setCurrentDataAiHint(data.dataAiHint || (photoToUse !== defaultFirestoreProfile.profilePhotoUrl ? "person" : defaultFirestoreProfile.dataAiHint));
          setSelectedHoroscopeFileName(data.horoscopeFileName || null);
          setManagedExistingPhotos(data.additionalPhotoUrls || []);

        } else {
          form.reset({
            fullName: currentUser.displayName || defaultFirestoreProfile.fullName,
            bio: defaultFirestoreProfile.bio,
            location: defaultFirestoreProfile.location,
            profession: defaultFirestoreProfile.profession,
            height: defaultFirestoreProfile.height,
            dob: defaultFirestoreProfile.dob,
            religion: defaultFirestoreProfile.religion,
            caste: defaultFirestoreProfile.caste,
            language: defaultFirestoreProfile.language,
            hobbies: defaultFirestoreProfile.hobbies,
            favoriteMovies: defaultFirestoreProfile.favoriteMovies,
            favoriteMusic: defaultFirestoreProfile.favoriteMusic,
            educationLevel: defaultFirestoreProfile.educationLevel,
            smokingHabits: defaultFirestoreProfile.smokingHabits,
            drinkingHabits: defaultFirestoreProfile.drinkingHabits,
            sunSign: defaultFirestoreProfile.sunSign,
            moonSign: defaultFirestoreProfile.moonSign,
            nakshatra: defaultFirestoreProfile.nakshatra,
            horoscopeInfo: defaultFirestoreProfile.horoscopeInfo,
            profilePhoto: undefined,
            additionalPhotos: [],
            horoscopeFile: undefined,
          });
          const authPhoto = currentUser.photoURL || defaultFirestoreProfile.profilePhotoUrl;
          setCurrentProfilePhotoUrl(authPhoto);
          setCurrentDataAiHint(authPhoto !== defaultFirestoreProfile.profilePhotoUrl ? "person" : defaultFirestoreProfile.dataAiHint);
          setSelectedHoroscopeFileName(null);
          setManagedExistingPhotos([]);
        }
      } catch (error: any) {
        toast({ 
            title: "Profile Load Error", 
            description: `Could not load profile. Error: ${error.message || String(error)}`, 
            variant: "destructive" 
        });
        form.reset({ ...defaultFirestoreProfile, profilePhoto: undefined, additionalPhotos: [], horoscopeFile: undefined });
        setCurrentProfilePhotoUrl(defaultFirestoreProfile.profilePhotoUrl);
        setCurrentDataAiHint(defaultFirestoreProfile.dataAiHint);
        setManagedExistingPhotos(defaultFirestoreProfile.additionalPhotoUrls);
        setSelectedHoroscopeFileName(defaultFirestoreProfile.horoscopeFileName);
      } finally {
        setProfileDataLoaded(true);
      }
    };

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        loadProfile(user);
      } else {
        form.reset({ ...defaultFirestoreProfile, profilePhoto: undefined, additionalPhotos: [], horoscopeFile: undefined });
        setCurrentProfilePhotoUrl(defaultFirestoreProfile.profilePhotoUrl);
        setCurrentDataAiHint(defaultFirestoreProfile.dataAiHint);
        setManagedExistingPhotos(defaultFirestoreProfile.additionalPhotoUrls);
        setSelectedHoroscopeFileName(defaultFirestoreProfile.horoscopeFileName);
        setProfileDataLoaded(true); 
      }
    });

    return () => unsubscribe();
  }, [form, toast]);

  const handleEnhanceWithAI = async (
    fieldName: "bio" | "hobbies" | "favoriteMovies" | "favoriteMusic",
    enhancerFunction: (input: any) => Promise<any>,
    setLoadingState: React.Dispatch<React.SetStateAction<boolean>>,
    inputKey: string,
    outputKey: string,
    title: string
  ) => {
    const currentValue = form.getValues(fieldName);
    if (!currentValue || currentValue.trim().length < 3) { // Basic check
      toast({
        title: `${title} Too Short`,
        description: `Please write a bit more in your ${title.toLowerCase()} before enhancing.`,
        variant: "default",
      });
      return;
    }
    setLoadingState(true);
    try {
      const result = await enhancerFunction({ [inputKey]: currentValue });
      form.setValue(fieldName, result[outputKey], { shouldValidate: true, shouldDirty: true });
      toast({
        title: `${title} Enhanced!`,
        description: `AI has helped refine your ${title.toLowerCase()}.`,
        variant: "default",
      });
    } catch (error: any) {
      toast({
        title: `${title} Enhancement Failed`,
        description: error.message || `Could not enhance ${title.toLowerCase()} at this time.`,
        variant: "destructive",
      });
    } finally {
      setLoadingState(false);
    }
  };


  async function onSubmit(values: z.infer<typeof editProfileSchema>) {
    setIsSaving(true);
    const user = auth.currentUser;
    if (!user) {
      toast({ title: "Authentication Error", description: "Please sign in again.", variant: "destructive" });
      setIsSaving(false);
      return;
    }

    try {
      const dataToSave: any = {
        displayName: values.fullName,
        bio: values.bio,
        location: values.location,
        profession: values.profession,
        height: values.height,
        dob: values.dob,
        religion: values.religion,
        caste: values.caste,
        language: values.language,
        hobbies: values.hobbies, 
        favoriteMovies: values.favoriteMovies, 
        favoriteMusic: values.favoriteMusic, 
        educationLevel: values.educationLevel,
        smokingHabits: values.smokingHabits,
        drinkingHabits: values.drinkingHabits,
        sunSign: values.sunSign,
        moonSign: values.moonSign,
        nakshatra: values.nakshatra,
        horoscopeInfo: values.horoscopeInfo,
        updatedAt: new Date().toISOString(),
      };

      if (values.profilePhoto) {
        const filePath = `users/${user.uid}/profile_photo/${values.profilePhoto.name}`;
        const newPhotoURL = await uploadFile(values.profilePhoto, filePath);
        await updateProfile(user, { photoURL: newPhotoURL });
        dataToSave.photoURL = newPhotoURL;
        dataToSave.dataAiHint = "new profile upload"; 
        setCurrentProfilePhotoUrl(newPhotoURL); 
        setCurrentDataAiHint("new profile upload");
        setProfilePhotoPreview(null); 
        setSelectedProfilePhotoName(null);
      } else {
        dataToSave.photoURL = currentProfilePhotoUrl; 
        dataToSave.dataAiHint = currentDataAiHint;
      }
      
      if (user.displayName !== values.fullName) {
        await updateProfile(user, { displayName: values.fullName });
      }

      if (values.horoscopeFile) {
        const filePath = `users/${user.uid}/horoscope_file/${values.horoscopeFile.name}`;
        dataToSave.horoscopeFileUrl = await uploadFile(values.horoscopeFile, filePath);
        dataToSave.horoscopeFileName = values.horoscopeFile.name;
        setSelectedHoroscopeFileName(values.horoscopeFile.name); 
      } else if (selectedHoroscopeFileName === null && form.getValues('horoscopeFile') === undefined) {
        dataToSave.horoscopeFileUrl = ""; 
        dataToSave.horoscopeFileName = ""; 
      }


      let finalAdditionalPhotos = [...managedExistingPhotos]; 
      if (values.additionalPhotos && values.additionalPhotos.length > 0) {
        const newUploadedPhotos: StoredPhoto[] = [];
        for (const file of values.additionalPhotos) {
          const timestamp = Date.now();
          const filePath = `users/${user.uid}/additional_photos/${timestamp}-${file.name}`;
          const url = await uploadFile(file, filePath);
          newUploadedPhotos.push({ id: timestamp.toString(), url, hint: "new additional upload", storagePath: filePath });
        }
        finalAdditionalPhotos = [...finalAdditionalPhotos, ...newUploadedPhotos];
        setAdditionalPhotosPreview([]); 
      }
      dataToSave.additionalPhotoUrls = finalAdditionalPhotos;
      setManagedExistingPhotos(finalAdditionalPhotos); 


      const userDocRef = doc(db, "users", user.uid);
      await setDoc(userDocRef, dataToSave, { merge: true });

      toast({
        title: "Profile Updated!",
        description: "Your profile information has been saved.",
      });
    } catch (error: any) {
      toast({
        title: "Update Failed",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
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
      form.setValue('profilePhoto', undefined, { shouldValidate: true });
      setSelectedProfilePhotoName(null);
      setProfilePhotoPreview(null);
    }
  };

  const clearProfilePhotoSelection = () => {
    setProfilePhotoPreview(null);
    setSelectedProfilePhotoName(null);
    form.setValue('profilePhoto', undefined, { shouldValidate: true });
    if (profilePhotoInputRef.current) {
        profilePhotoInputRef.current.value = ""; 
    }
    toast({ title: "Profile photo selection cleared."});
  }

  const handleAdditionalPhotosChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    form.setValue("additionalPhotos", files.length > 0 ? files : undefined, { shouldValidate: true }); 

    if (files.length > 0) {
      const newPreviews: string[] = [];
      files.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          newPreviews.push(reader.result as string);
          if (newPreviews.length === files.length) { 
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
    form.setValue("additionalPhotos", updatedFiles.length > 0 ? updatedFiles : undefined, { shouldValidate: true });
    toast({title: "Photo preview removed."});
  };

  const removeExistingPhoto = (photoId: string) => {
    setManagedExistingPhotos(prev => prev.filter(p => p.id !== photoId));
    toast({
      title: "Photo Marked for Removal",
      description: "This photo will be removed when you save changes.",
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
        form.setValue('horoscopeFile', undefined, { shouldValidate: true });
        const existingFirestoreFileName = form.getValues('horoscopeInfo') ? (doc(db, "users", auth.currentUser!.uid), getDoc(doc(db, "users", auth.currentUser!.uid)).then(d => d.data()?.horoscopeFileName)) : null;
        setSelectedHoroscopeFileName(existingFirestoreFileName || null);
    }
  };
  
  const clearHoroscopeFileSelection = () => {
    setSelectedHoroscopeFileName(null);
    form.setValue('horoscopeFile', undefined, { shouldValidate: true });
    const horoscopeFileInput = document.getElementById('horoscopeFile-input') as HTMLInputElement | null; 
    if (horoscopeFileInput) {
        horoscopeFileInput.value = "";
    }
    toast({ title: "Horoscope file selection cleared."});
  };


  if (!profileDataLoaded) {
    return (
        <div className="space-y-8 max-w-2xl mx-auto">
            <Card className="shadow-xl">
                <CardHeader><Skeleton className="h-8 w-3/4" /></CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex flex-col items-center space-y-4 mb-4"><Skeleton className="h-32 w-32 rounded-full" /> <Skeleton className="h-8 w-1/2" /></div>
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-20 w-full" />
                    <div className="grid md:grid-cols-2 gap-6"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div>
                    <Skeleton className="h-10 w-full" />
                </CardContent>
            </Card>
        </div>
    )
  }
  
  const anyEnhancementLoading = isEnhancingBio || isEnhancingHobbies || isEnhancingMovies || isEnhancingMusic;

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
                    <NextImage 
                        src={profilePhotoPreview || currentProfilePhotoUrl || defaultFirestoreProfile.profilePhotoUrl} 
                        alt={form.getValues("fullName") || "User"} 
                        width={128} 
                        height={128} 
                        className="h-32 w-32 rounded-full object-cover border-2 border-muted shadow-md" 
                        data-ai-hint={profilePhotoPreview ? "new upload preview" : currentDataAiHint}
                        key={profilePhotoPreview || currentProfilePhotoUrl} 
                    />
                    {profilePhotoPreview && (
                         <Button 
                            type="button" 
                            variant="ghost" 
                            size="icon" 
                            className="absolute -top-1 -right-1 h-7 w-7 rounded-full bg-destructive/80 text-destructive-foreground hover:bg-destructive"
                            onClick={clearProfilePhotoSelection}
                            aria-label="Clear selected profile photo"
                            disabled={isSaving || anyEnhancementLoading}
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
                            field.onChange(e.target.files?.[0] || null);
                            handleProfilePhotoChange(e);
                          }}
                          className="text-sm"
                          disabled={isSaving || anyEnhancementLoading}
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
              <FormItem><FormLabel className="flex items-center"><UserIconLucide className="mr-2 h-4 w-4 text-muted-foreground" />Full Name</FormLabel><FormControl><Input {...field} disabled={isSaving || anyEnhancementLoading} /></FormControl><FormMessage /></FormItem>
            )} />
            
            <FormField control={form.control} name="bio" render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel className="flex items-center"><Info className="mr-2 h-4 w-4 text-muted-foreground" />About Me (Bio)</FormLabel>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleEnhanceWithAI("bio", enhanceBio, setIsEnhancingBio, "bioText", "enhancedBioText", "Bio")} 
                    disabled={isEnhancingBio || isSaving || anyEnhancementLoading}
                    className="text-xs text-primary hover:bg-primary/10 h-auto p-1"
                  >
                    {isEnhancingBio ? <Loader2 className="h-3 w-3 mr-1 animate-spin"/> : <Wand2 className="h-3 w-3 mr-1"/>}
                    Enhance with AI
                  </Button>
                </div>
                <FormControl><Textarea {...field} rows={4} disabled={isSaving || anyEnhancementLoading} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            
            <div className="grid md:grid-cols-2 gap-6">
                <FormField control={form.control} name="location" render={({ field }) => (
                <FormItem><FormLabel className="flex items-center"><MapPin className="mr-2 h-4 w-4 text-muted-foreground" />Location</FormLabel><FormControl><Input {...field} disabled={isSaving || anyEnhancementLoading} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="profession" render={({ field }) => (
                <FormItem><FormLabel className="flex items-center"><Briefcase className="mr-2 h-4 w-4 text-muted-foreground" />Profession</FormLabel><FormControl><Input {...field} disabled={isSaving || anyEnhancementLoading} /></FormControl><FormMessage /></FormItem>
                )} />
                 <FormField control={form.control} name="height" render={({ field }) => (
                <FormItem><FormLabel className="flex items-center"><Ruler className="mr-2 h-4 w-4 text-muted-foreground" />Height (cm)</FormLabel><FormControl><Input type="number" {...field} disabled={isSaving || anyEnhancementLoading} /></FormControl><FormMessage /></FormItem>
                )} />
                 <FormField control={form.control} name="dob" render={({ field }) => (
                <FormItem><FormLabel className="flex items-center"><CalendarDays className="mr-2 h-4 w-4 text-muted-foreground" />Date of Birth</FormLabel><FormControl><Input type="date" {...field} disabled={isSaving || anyEnhancementLoading} /></FormControl><FormMessage /></FormItem>
                )} />
            </div>
             <FormField control={form.control} name="religion" render={({ field }) => (
                <FormItem><FormLabel>Religion</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSaving || anyEnhancementLoading} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select Religion" /></SelectTrigger></FormControl>
                    <SelectContent>
                        {religionOptions.map(option => (
                           <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="caste" render={({ field }) => (
              <FormItem><FormLabel>Caste/Community</FormLabel><FormControl><Input {...field} disabled={isSaving || anyEnhancementLoading} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="language" render={({ field }) => (
                <FormItem>
                    <FormLabel className="flex items-center"><Languages className="mr-2 h-4 w-4 text-muted-foreground" />Primary Language(s)</FormLabel>
                    <FormControl><Input placeholder="e.g., English, Tamil, Sinhala" {...field} disabled={isSaving || anyEnhancementLoading} /></FormControl>
                    <FormDescription>Enter one or more languages, separated by commas.</FormDescription>
                    <FormMessage />
                </FormItem>
            )} />

            <FormField control={form.control} name="hobbies" render={({ field }) => (
                <FormItem>
                    <div className="flex items-center justify-between">
                        <FormLabel className="flex items-center"><Gamepad2 className="mr-2 h-4 w-4 text-muted-foreground" />Hobbies & Interests</FormLabel>
                        <Button type="button" variant="ghost" size="sm" onClick={() => handleEnhanceWithAI("hobbies", enhanceHobbies, setIsEnhancingHobbies, "hobbiesText", "enhancedHobbiesText", "Hobbies")} disabled={isEnhancingHobbies || isSaving || anyEnhancementLoading} className="text-xs text-primary hover:bg-primary/10 h-auto p-1">
                            {isEnhancingHobbies ? <Loader2 className="h-3 w-3 mr-1 animate-spin"/> : <Wand2 className="h-3 w-3 mr-1"/>} Enhance
                        </Button>
                    </div>
                    <FormControl><Textarea placeholder="e.g., Reading, Cooking, Hiking (comma-separated)" {...field} rows={3} disabled={isSaving || anyEnhancementLoading}/></FormControl>
                    <FormMessage />
                </FormItem>
            )} />
             <FormField control={form.control} name="favoriteMovies" render={({ field }) => (
                <FormItem>
                    <div className="flex items-center justify-between">
                        <FormLabel className="flex items-center"><Film className="mr-2 h-4 w-4 text-muted-foreground" />Favorite Movies</FormLabel>
                        <Button type="button" variant="ghost" size="sm" onClick={() => handleEnhanceWithAI("favoriteMovies", enhanceMovies, setIsEnhancingMovies, "moviesText", "enhancedMoviesText", "Favorite Movies")} disabled={isEnhancingMovies || isSaving || anyEnhancementLoading} className="text-xs text-primary hover:bg-primary/10 h-auto p-1">
                             {isEnhancingMovies ? <Loader2 className="h-3 w-3 mr-1 animate-spin"/> : <Wand2 className="h-3 w-3 mr-1"/>} Enhance
                        </Button>
                    </div>
                    <FormControl><Textarea placeholder="e.g., The Shawshank Redemption, Inception (comma-separated)" {...field} rows={2} disabled={isSaving || anyEnhancementLoading}/></FormControl>
                    <FormMessage />
                </FormItem>
            )} />
            <FormField control={form.control} name="favoriteMusic" render={({ field }) => (
                <FormItem>
                    <div className="flex items-center justify-between">
                        <FormLabel className="flex items-center"><Music className="mr-2 h-4 w-4 text-muted-foreground" />Favorite Music</FormLabel>
                        <Button type="button" variant="ghost" size="sm" onClick={() => handleEnhanceWithAI("favoriteMusic", enhanceMusic, setIsEnhancingMusic, "musicText", "enhancedMusicText", "Favorite Music")} disabled={isEnhancingMusic || isSaving || anyEnhancementLoading} className="text-xs text-primary hover:bg-primary/10 h-auto p-1">
                            {isEnhancingMusic ? <Loader2 className="h-3 w-3 mr-1 animate-spin"/> : <Wand2 className="h-3 w-3 mr-1"/>} Enhance
                        </Button>
                    </div>
                    <FormControl><Textarea placeholder="e.g., Classical, Pop, A.R. Rahman (comma-separated)" {...field} rows={2} disabled={isSaving || anyEnhancementLoading}/></FormControl>
                    <FormMessage />
                </FormItem>
            )} />

            <FormField control={form.control} name="educationLevel" render={({ field }) => (
                <FormItem><FormLabel className="flex items-center"><School className="mr-2 h-4 w-4 text-muted-foreground" />Education Level</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSaving || anyEnhancementLoading} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select Education Level" /></SelectTrigger></FormControl>
                    <SelectContent>
                        <SelectItem value="High School">High School</SelectItem>
                        <SelectItem value="Associate Degree">Associate Degree</SelectItem>
                        <SelectItem value="Bachelor's Degree">Bachelor&apos;s Degree</SelectItem>
                        <SelectItem value="Master's Degree">Master&apos;s Degree</SelectItem>
                        <SelectItem value="Doctorate">Doctorate</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                </Select><FormMessage /></FormItem>
            )} />

            <div className="grid md:grid-cols-2 gap-6">
                <FormField control={form.control} name="smokingHabits" render={({ field }) => (
                    <FormItem><FormLabel className="flex items-center"><Cigarette className="mr-2 h-4 w-4 text-muted-foreground" />Smoking Habits</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSaving || anyEnhancementLoading} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select Smoking Habits" /></SelectTrigger></FormControl>
                        <SelectContent>
                            <SelectItem value="Never">Never</SelectItem>
                            <SelectItem value="Occasionally/Socially">Occasionally/Socially</SelectItem>
                            <SelectItem value="Regularly">Regularly</SelectItem>
                            <SelectItem value="Prefer not to say">Prefer not to say</SelectItem>
                        </SelectContent>
                    </Select><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="drinkingHabits" render={({ field }) => (
                    <FormItem><FormLabel className="flex items-center"><Droplet className="mr-2 h-4 w-4 text-muted-foreground" />Drinking Habits</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSaving || anyEnhancementLoading} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select Drinking Habits" /></SelectTrigger></FormControl>
                        <SelectContent>
                            <SelectItem value="Never">Never</SelectItem>
                            <SelectItem value="Occasionally/Socially">Occasionally/Socially</SelectItem>
                            <SelectItem value="Regularly">Regularly</SelectItem>
                            <SelectItem value="Prefer not to say">Prefer not to say</SelectItem>
                        </SelectContent>
                    </Select><FormMessage /></FormItem>
                )} />
            </div>

            <Card className="border-primary/30 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center"><SparklesIcon className="mr-2 h-5 w-5 text-primary" />Astrological Details (for AI)</CardTitle>
                <CardDescription className="text-xs">Provide these for more accurate AI-driven horoscope analysis and matching.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-2">
                <FormField control={form.control} name="sunSign" render={({ field }) => (
                  <FormItem><FormLabel>Sun Sign (Western)</FormLabel><FormControl><Input placeholder="e.g., Aries" {...field} disabled={isSaving || anyEnhancementLoading} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="moonSign" render={({ field }) => (
                  <FormItem><FormLabel>Moon Sign (Vedic Rasi)</FormLabel><FormControl><Input placeholder="e.g., Mesha" {...field} disabled={isSaving || anyEnhancementLoading} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="nakshatra" render={({ field }) => (
                  <FormItem><FormLabel>Nakshatra (Birth Star)</FormLabel><FormControl><Input placeholder="e.g., Ashwini" {...field} disabled={isSaving || anyEnhancementLoading} /></FormControl><FormMessage /></FormItem>
                )} />
              </CardContent>
            </Card>
            
            <FormField control={form.control} name="horoscopeInfo" render={({ field }) => (
              <FormItem><FormLabel>General Horoscope Notes (Rasi, Nakshatra, Gotra, etc.)</FormLabel><FormControl><Textarea placeholder="Enter any additional horoscope details or notes here..." {...field} rows={3} disabled={isSaving || anyEnhancementLoading} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField
                control={form.control}
                name="horoscopeFile"
                render={({ field }) => (
                    <FormItem>
                        <div className="flex items-center justify-between">
                            <FormLabel className="flex items-center"><FileText className="mr-2 h-4 w-4 text-muted-foreground" />Upload Horoscope File (PDF/Image)</FormLabel>
                            {selectedHoroscopeFileName && (
                                <Button type="button" variant="ghost" size="sm" onClick={clearHoroscopeFileSelection} className="text-xs h-auto p-1 text-destructive" disabled={isSaving || anyEnhancementLoading}>
                                    <XCircle className="h-3 w-3 mr-1"/> Clear
                                </Button>
                            )}
                        </div>
                        <FormControl>
                            <Input 
                                type="file" 
                                id="horoscopeFile-input"
                                accept={ACCEPTED_HOROSCOPE_FILE_TYPES.join(',')} 
                                onChange={(e) => {
                                    field.onChange(e.target.files ? e.target.files[0] : null); 
                                    handleHoroscopeFileChange(e); 
                                }}
                                disabled={isSaving || anyEnhancementLoading}
                            />
                        </FormControl>
                        {selectedHoroscopeFileName && <FormDescription className="text-xs">Current file: {selectedHoroscopeFileName}</FormDescription>}
                        <FormMessage />
                    </FormItem>
                )}
            />

            <div className="space-y-2">
                <Label className="flex items-center font-semibold"><FileImage className="mr-2 h-4 w-4 text-muted-foreground" />Your Photo Gallery</Label>
                <FormDescription>Manage your additional photos. Upload new ones or remove existing ones. (Max 5MB each, JPG/PNG/WebP)</FormDescription>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                    {managedExistingPhotos.map(photo => (
                        <div key={`existing-${photo.id}`} className="aspect-square bg-muted rounded-md flex items-center justify-center relative group">
                            <NextImage src={photo.url} alt={`Photo ${photo.id}`} width={100} height={100} className="object-cover rounded-md h-full w-full" data-ai-hint={photo.hint}/>
                            <Button type="button" variant="destructive" size="icon" className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => removeExistingPhoto(photo.id)} disabled={isSaving || anyEnhancementLoading}>
                                <Trash2 className="h-3 w-3" />
                            </Button>
                        </div>
                    ))}
                    {additionalPhotosPreview.map((previewUrl, index) => (
                         <div key={`new-${index}`} className="aspect-square bg-muted rounded-md flex items-center justify-center relative group">
                            <NextImage src={previewUrl} alt={`New Photo ${index + 1}`} width={100} height={100} className="object-cover rounded-md h-full w-full" data-ai-hint="new upload preview"/>
                             <Button type="button" variant="destructive" size="icon" className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => removeAdditionalPhotoPreview(index)} disabled={isSaving || anyEnhancementLoading}>
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
                         field.onChange(e.target.files ? Array.from(e.target.files) : undefined);
                         handleAdditionalPhotosChange(e);
                      }}
                      disabled={isSaving || anyEnhancementLoading}
                    />
                  </FormControl>
                  {form.getValues("additionalPhotos") && form.getValues("additionalPhotos")!.length > 0 && (
                    <FormDescription className="text-xs">
                      Selected {form.getValues("additionalPhotos")!.length} file(s) for upload.
                    </FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isSaving || !profileDataLoaded || anyEnhancementLoading}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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
                    <Button variant="destructive" className="w-full" disabled={isSaving || anyEnhancementLoading}>
                        Deactivate Account
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Deactivating your account will hide your profile from CupidMatch. You will not be able to log in or be discovered by others. 
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
