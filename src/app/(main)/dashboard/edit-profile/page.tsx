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
import {
  User as UserIconLucide,
  Image as ImageIcon,
  Info,
  MapPin,
  Briefcase,
  Ruler,
  Languages,
  CalendarDays,
  PlusCircle,
  FileImage,
  Trash2,
  XCircle,
  AlertTriangle,
  FileText,
  Loader2,
  Film,
  Music,
  School,
  Droplet,
  Cigarette,
  Sparkles as SparklesIcon,
  Wand2,
  Gamepad2,
  Palette,
  Video,
  Eye,
  EyeOff,
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { auth, updateProfile, onAuthStateChanged, type User } from "@/lib/supabase/auth";
import { extractStoragePath, mediaPathForUser, resolveMediaUrl, uploadFile } from "@/lib/supabase/storage";
import { createUserProfile, updateUserProfile, getProfile, setProfilePublished } from "@/lib/supabase/profiles";
import { Skeleton } from "@/components/ui/skeleton";
import { enhanceBio } from "@/ai/flows/enhance-bio-flow";
import { enhanceHobbies } from "@/ai/flows/enhance-hobbies-flow";
import { enhanceMovies } from "@/ai/flows/enhance-movies-flow";
import { enhanceMusic } from "@/ai/flows/enhance-music-flow";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ProfilePhotoEditor } from "@/components/profile/ProfilePhotoEditor";
import {
  PhotoGalleryEditor,
  type GalleryPhotoItem,
} from "@/components/profile/PhotoGalleryEditor";
import { PageFrame, PageHero } from "@/components/dashboard/PageHero";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const ACCEPTED_HOROSCOPE_FILE_TYPES = [...ACCEPTED_IMAGE_TYPES, "application/pdf"];
const MAX_ADDITIONAL_PHOTOS = 5;

interface StoredPhoto {
  id: string;
  url: string;
  hint: string;
  storagePath?: string;
  grayscale?: boolean;
}

const isFile = (value: unknown): value is File => typeof File !== "undefined" && value instanceof File;

const editProfileSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters."),
  bio: z
    .string()
    .max(500, "Bio cannot exceed 500 characters.")
    .refine((value) => !value.trim() || value.trim().length >= 10, "Bio must be at least 10 characters."),
  profilePhoto: z
    .custom<File | undefined>((value) => value == null || isFile(value), { message: "Please select a valid file." })
    .optional()
    .refine((file) => !file || file.size <= MAX_FILE_SIZE, `Max file size is 5MB.`)
    .refine((file) => !file || ACCEPTED_IMAGE_TYPES.includes(file.type), ".jpg, .jpeg, .png and .webp files are accepted."),
  additionalPhotos: z
    .array(z.custom<File>((value) => isFile(value)))
    .max(MAX_ADDITIONAL_PHOTOS, `You can select up to ${MAX_ADDITIONAL_PHOTOS} new photos at a time.`)
    .optional()
    .refine((files) => !files || files.every((file) => file.size <= MAX_FILE_SIZE), `Max file size for each additional photo is 5MB.`)
    .refine((files) => !files || files.every((file) => ACCEPTED_IMAGE_TYPES.includes(file.type)), "Only .jpg, .jpeg, .png and .webp formats are supported."),
  location: z.string().optional(),
  profession: z.string().optional(),
  height: z
    .string()
    .optional()
    .refine((value) => !value || /^\d{2,3}$/.test(value), "Enter height in cm (e.g., 165)."),
  dob: z
    .string()
    .optional()
    .refine((value) => !value || /^\d{4}-\d{2}-\d{2}$/.test(value), "Enter DOB in YYYY-MM-DD format."),
  religion: z.string().optional(),
  caste: z.string().optional(),
  language: z.string().optional(),

  sunSign: z.string().optional(),
  moonSign: z.string().optional(),
  nakshatra: z.string().optional(),
  horoscopeInfo: z.string().optional(),
  horoscopeFile: z
    .custom<File | undefined>((value) => value == null || isFile(value), { message: "Please select a valid file." })
    .optional()
    .refine((file) => !file || ACCEPTED_HOROSCOPE_FILE_TYPES.includes(file.type), "Only PDF, JPG, JPEG, PNG, and WebP files are accepted.")
    .refine((file) => !file || file.size <= MAX_FILE_SIZE, `Max file size is 5MB.`),

  hobbies: z.string().optional(),
  favoriteMovies: z.string().optional(),
  favoriteMusic: z.string().optional(),
  educationLevel: z.string().optional(),
  smokingHabits: z.string().optional(),
  drinkingHabits: z.string().optional(),
});

const defaultFirestoreProfile = {
  fullName: "",
  bio: "",
  profilePhotoUrl: "https://placehold.co/128x128.png",
  dataAiHint: "person placeholder",
  location: "",
  profession: "",
  height: "",
  dob: "",
  religion: "",
  caste: "",
  language: "",
  hobbies: "",
  favoriteMovies: "",
  favoriteMusic: "",
  educationLevel: "",
  smokingHabits: "",
  drinkingHabits: "",
  sunSign: "",
  moonSign: "",
  nakshatra: "",
  horoscopeInfo: "",
  horoscopeFileName: "",
  horoscopeFileUrl: "",
  additionalPhotoUrls: [],
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

const ABOUT_FIELDS = ["fullName", "bio", "location", "profession", "height", "dob", "religion", "caste", "language", "educationLevel", "smokingHabits", "drinkingHabits"];
const PHOTO_FIELDS = ["profilePhoto", "additionalPhotos"];
const INTEREST_FIELDS = ["hobbies", "favoriteMovies", "favoriteMusic"];

const toHeightString = (value: unknown) => {
  if (value == null || value === "") return "";
  return String(value).replace(/\D/g, "");
};

export default function EditProfilePage() {
  const { toast } = useToast();
  const [profileDataLoaded, setProfileDataLoaded] = useState(false);
  const [userDocExists, setUserDocExists] = useState(false);
  const [activeTab, setActiveTab] = useState("about");
  const [isSaving, setIsSaving] = useState(false);
  const [isEnhancingBio, setIsEnhancingBio] = useState(false);
  const [isEnhancingHobbies, setIsEnhancingHobbies] = useState(false);
  const [isEnhancingMovies, setIsEnhancingMovies] = useState(false);
  const [isEnhancingMusic, setIsEnhancingMusic] = useState(false);

  const [currentProfilePhotoUrl, setCurrentProfilePhotoUrl] = useState<string | null>(defaultFirestoreProfile.profilePhotoUrl);
  const [currentDataAiHint, setCurrentDataAiHint] = useState<string>(defaultFirestoreProfile.dataAiHint);
  const [isProfileVisible, setIsProfileVisible] = useState(false);
  const [visibilitySaving, setVisibilitySaving] = useState(false);

  const [profilePhotoPreview, setProfilePhotoPreview] = useState<string | null>(null);
    const [selectedProfilePhotoName, setSelectedProfilePhotoName] = useState<string | null>(null);
  const [selectedHoroscopeFileName, setSelectedHoroscopeFileName] = useState<string | null>(null);

  const [galleryPhotos, setGalleryPhotos] = useState<GalleryPhotoItem[]>([]);

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
      try {
        const data = await getProfile(currentUser.uid);
        if (data) {
          form.reset({
            fullName: data.displayName || currentUser.displayName || defaultFirestoreProfile.fullName,
            bio: data.bio || defaultFirestoreProfile.bio,
            location: data.location || defaultFirestoreProfile.location,
            profession: data.profession || defaultFirestoreProfile.profession,
            height: toHeightString(data.height) || defaultFirestoreProfile.height,
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
          setIsProfileVisible(Boolean(data.isPublished));
          setSelectedHoroscopeFileName(data.horoscopeFileName || null);
          setGalleryPhotos(
            (data.additionalPhotoUrls || []).map((photo) => ({
              id: photo.id,
              url: photo.url,
              hint: photo.hint || "gallery photo",
              storagePath: photo.storagePath,
              grayscale: Boolean(photo.grayscale),
            }))
          );
          setUserDocExists(true);
        } else {
          setUserDocExists(false);
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
          setIsProfileVisible(false);
          setSelectedHoroscopeFileName(null);
          setGalleryPhotos([]);
        }
      } catch (error: any) {
        const permissionDenied = error?.code === "permission-denied";
        toast({
          title: "Profile Load Error",
          description: permissionDenied
            ? "Could not load profile. Check your Supabase configuration and RLS policies."
            : `Could not load profile. Error: ${error.message || String(error)}`,
          variant: "destructive",
        });
        form.reset({ ...defaultFirestoreProfile, profilePhoto: undefined, additionalPhotos: [], horoscopeFile: undefined });
        setCurrentProfilePhotoUrl(defaultFirestoreProfile.profilePhotoUrl);
        setCurrentDataAiHint(defaultFirestoreProfile.dataAiHint);
        setGalleryPhotos([]);
        setSelectedHoroscopeFileName(defaultFirestoreProfile.horoscopeFileName);
      } finally {
        setProfileDataLoaded(true);
      }
    };

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        loadProfile(user);
      } else {
        setUserDocExists(false);
        form.reset({ ...defaultFirestoreProfile, profilePhoto: undefined, additionalPhotos: [], horoscopeFile: undefined });
        setCurrentProfilePhotoUrl(defaultFirestoreProfile.profilePhotoUrl);
        setCurrentDataAiHint(defaultFirestoreProfile.dataAiHint);
        setGalleryPhotos([]);
        setSelectedHoroscopeFileName(defaultFirestoreProfile.horoscopeFileName);
        setProfileDataLoaded(true);
      }
    });

    return () => unsubscribe();
  }, [form, toast]);

  const handleEnhanceWithAI = async (fieldName: "bio" | "hobbies" | "favoriteMovies" | "favoriteMusic", enhancerFunction: (input: any) => Promise<any>, setLoadingState: React.Dispatch<React.SetStateAction<boolean>>, inputKey: string, outputKey: string, title: string) => {
    const currentValue = form.getValues(fieldName);
    if (!currentValue || currentValue.trim().length < 3) {
      // Basic check
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
        const filePath = mediaPathForUser(user.uid, values.profilePhoto.name, "profile_photo");
        const newPhotoURL = await uploadFile(values.profilePhoto, filePath);
        await updateProfile(user, { photoURL: newPhotoURL });
        dataToSave.photoURL = newPhotoURL;
        dataToSave.dataAiHint = "new profile upload";
        setCurrentProfilePhotoUrl(resolveMediaUrl(newPhotoURL));
        setCurrentDataAiHint("new profile upload");
        setProfilePhotoPreview(null);
        setSelectedProfilePhotoName(null);
      } else {
        dataToSave.photoURL =
          extractStoragePath(currentProfilePhotoUrl) || currentProfilePhotoUrl;
        dataToSave.dataAiHint = currentDataAiHint;
      }

      if (user.displayName !== values.fullName) {
        await updateProfile(user, { displayName: values.fullName });
      }

      if (values.horoscopeFile) {
        const filePath = mediaPathForUser(user.uid, values.horoscopeFile.name, "horoscope_file");
        dataToSave.horoscopeFileUrl = await uploadFile(values.horoscopeFile, filePath);
        dataToSave.horoscopeFileName = values.horoscopeFile.name;
        setSelectedHoroscopeFileName(values.horoscopeFile.name);
      } else if (selectedHoroscopeFileName === null && form.getValues("horoscopeFile") === undefined) {
        dataToSave.horoscopeFileUrl = "";
        dataToSave.horoscopeFileName = "";
      }

      const finalAdditionalPhotos: StoredPhoto[] = [];
      for (const photo of galleryPhotos) {
        let path = photo.storagePath || extractStoragePath(photo.url) || photo.url;
        if (photo.pendingFile) {
          const filePath = mediaPathForUser(
            user.uid,
            photo.pendingFile.name || `gallery-${Date.now()}.jpg`,
            "additional_photos"
          );
          path = await uploadFile(photo.pendingFile, filePath);
        }
        finalAdditionalPhotos.push({
          id: photo.id.startsWith("new-")
            ? `${Date.now()}-${Math.random().toString(16).slice(2, 6)}`
            : photo.id,
          url: path,
          hint: photo.hint || "gallery photo",
          storagePath: path,
          grayscale: Boolean(photo.grayscale),
        });
      }
      dataToSave.additionalPhotoUrls = finalAdditionalPhotos;
      setGalleryPhotos(
        finalAdditionalPhotos.map((photo) => ({
          id: photo.id,
          url: resolveMediaUrl(photo.url),
          hint: photo.hint,
          storagePath: photo.storagePath,
          grayscale: Boolean(photo.grayscale),
        }))
      );
      form.setValue("additionalPhotos", undefined);

      if (userDocExists) {
        await updateUserProfile(user.uid, dataToSave);
      } else {
        try {
          await updateUserProfile(user.uid, dataToSave);
        } catch (error: any) {
          if (error?.code === "not-found") {
            await createUserProfile(user.uid, {
              uid: user.uid,
              email: user.email,
              ...dataToSave,
            });
          } else {
            throw error;
          }
        }
        setUserDocExists(true);
      }

      toast({
        title: "Profile Updated!",
        description: "Your profile information has been saved.",
      });
    } catch (error: any) {
      const permissionDenied = error?.code === "permission-denied";
      toast({
        title: "Update Failed",
        description: permissionDenied
          ? "Could not save profile. Firestore rules may need publishing."
          : error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  }

  const handleInvalidSubmit = (errors: Record<string, unknown>) => {
    const errorKeys = Object.keys(errors);
    toast({
      title: "Fix the highlighted fields",
      description: "Some details need attention before saving.",
      variant: "destructive",
    });
    if (errorKeys.some((key) => ABOUT_FIELDS.includes(key))) {
      setActiveTab("about");
    } else if (errorKeys.some((key) => PHOTO_FIELDS.includes(key))) {
      setActiveTab("photos");
    } else if (errorKeys.some((key) => INTEREST_FIELDS.includes(key))) {
      setActiveTab("interests");
    } else {
      setActiveTab("horoscope");
    }
  };

  const handleVisibilityChange = async (checked: boolean) => {
    const user = auth.currentUser;
    if (!user) return;
    const previous = isProfileVisible;
    setIsProfileVisible(checked);
    setVisibilitySaving(true);
    try {
      await setProfilePublished(user.uid, checked);
      toast({
        title: checked ? "Profile visible" : "Profile hidden",
        description: checked
          ? "Members can find you in Discover."
          : "You are hidden from Discover until you make the profile visible again.",
      });
    } catch (error) {
      setIsProfileVisible(previous);
      toast({
        title: "Could not update visibility",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setVisibilitySaving(false);
    }
  };

  const clearProfilePhotoSelection = () => {
    if (profilePhotoPreview?.startsWith("blob:")) {
      URL.revokeObjectURL(profilePhotoPreview);
    }
    setProfilePhotoPreview(null);
    setSelectedProfilePhotoName(null);
    form.setValue("profilePhoto", undefined, { shouldValidate: true });
    if (profilePhotoInputRef.current) {
      profilePhotoInputRef.current.value = "";
    }
    toast({ title: "Profile photo selection cleared." });
  };

  const handleCroppedProfilePhoto = (file: File, previewUrl: string) => {
    if (profilePhotoPreview?.startsWith("blob:")) {
      URL.revokeObjectURL(profilePhotoPreview);
    }
    form.setValue("profilePhoto", file, { shouldValidate: true });
    setSelectedProfilePhotoName(file.name);
    setProfilePhotoPreview(previewUrl);
  };

  const handleDeactivateAccount = () => {
    toast({
      title: "Account Deactivated (Mock)",
      description: "Your account has been scheduled for deactivation.",
      variant: "destructive",
    });
  };

  const handleHoroscopeFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      form.setValue("horoscopeFile", file, { shouldValidate: true });
      setSelectedHoroscopeFileName(file.name);
    } else {
      form.setValue("horoscopeFile", undefined, { shouldValidate: true });
      if (form.getValues("horoscopeInfo")) {
        try {
          const data = await getProfile(auth.currentUser!.uid);
          if (data?.horoscopeFileName) {
            setSelectedHoroscopeFileName(data.horoscopeFileName);
          } else {
            setSelectedHoroscopeFileName(null);
          }
        } catch (error) {
          console.error("Error fetching horoscope file name:", error);
          setSelectedHoroscopeFileName(null);
        }
      } else {
        setSelectedHoroscopeFileName(null);
      }
    }
  };

  const clearHoroscopeFileSelection = () => {
    setSelectedHoroscopeFileName(null);
    form.setValue("horoscopeFile", undefined, { shouldValidate: true });
    const horoscopeFileInput = document.getElementById("horoscopeFile-input") as HTMLInputElement | null;
    if (horoscopeFileInput) {
      horoscopeFileInput.value = "";
    }
    toast({ title: "Horoscope file selection cleared." });
  };

  if (!profileDataLoaded) {
    return (
      <div className="space-y-8 max-w-2xl mx-auto">
        <Card className="shadow-xl">
          <CardHeader>
            <Skeleton className="h-8 w-3/4" />
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center space-y-4 mb-4">
              <Skeleton className="h-32 w-32 rounded-full" /> <Skeleton className="h-8 w-1/2" />
            </div>
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-20 w-full" />
            <div className="grid md:grid-cols-2 gap-6">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  const anyEnhancementLoading = isEnhancingBio || isEnhancingHobbies || isEnhancingMovies || isEnhancingMusic;
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit, handleInvalidSubmit)}>
        <PageFrame>
          <PageHero
            eyebrow="Your profile"
            title="Edit profile"
            description="Update how you appear to members. Changes stay private until you save."
            leading={
              <div className="relative group shrink-0">
                <Avatar className="h-20 w-20 border-4 border-white text-lg shadow-md sm:h-24 sm:w-24">
                  <AvatarImage src={profilePhotoPreview || currentProfilePhotoUrl || defaultFirestoreProfile.profilePhotoUrl} alt={form.getValues("fullName") || "User"} data-ai-hint={profilePhotoPreview ? "new upload preview" : currentDataAiHint} />
                  <AvatarFallback className="text-2xl text-[#713c78]">{form.getValues("fullName")?.substring(0, 2) || "U"}</AvatarFallback>
                </Avatar>
                {profilePhotoPreview && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute -top-2 -right-2 h-8 w-8 rounded-full bg-destructive/80 text-destructive-foreground hover:bg-destructive"
                    onClick={clearProfilePhotoSelection}
                    aria-label="Clear selected profile photo"
                    disabled={isSaving || anyEnhancementLoading}
                  >
                    <XCircle className="h-5 w-5" />
                  </Button>
                )}
              </div>
            }
          >
            <div className="mt-3 space-y-2">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem className="mb-0">
                    <FormControl>
                      <Input {...field} className="h-auto border-none bg-transparent p-0 text-xl font-semibold text-[#351532] focus-visible:ring-0 focus-visible:ring-offset-0 sm:text-2xl" disabled={isSaving || anyEnhancementLoading} />
                    </FormControl>
                    <FormMessage className="text-xs text-red-500" />
                  </FormItem>
                )}
              />
              <div className="flex flex-col gap-1 text-sm text-[#745d70] sm:text-base">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 shrink-0" />
                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem className="mb-0 flex items-center">
                        <FormControl>
                          <Input {...field} className="h-auto w-auto border-none bg-transparent p-0 text-[#745d70] focus-visible:ring-0 focus-visible:ring-offset-0" placeholder="Add location" disabled={isSaving || anyEnhancementLoading} />
                        </FormControl>
                        <FormMessage className="text-xs text-red-500" />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 shrink-0" />
                  <FormField
                    control={form.control}
                    name="profession"
                    render={({ field }) => (
                      <FormItem className="mb-0 flex items-center">
                        <FormControl>
                          <Input {...field} className="h-auto w-auto border-none bg-transparent p-0 text-[#745d70] focus-visible:ring-0 focus-visible:ring-offset-0" placeholder="Add profession" disabled={isSaving || anyEnhancementLoading} />
                        </FormControl>
                        <FormMessage className="text-xs text-red-500" />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-3 rounded-xl border border-[#eadce5] bg-white/70 px-3 py-2.5">
                <Checkbox
                  id="profile-visible"
                  checked={isProfileVisible}
                  disabled={isSaving || visibilitySaving || anyEnhancementLoading}
                  onCheckedChange={(value) => void handleVisibilityChange(value === true)}
                />
                <Label htmlFor="profile-visible" className="flex cursor-pointer items-center gap-2 text-sm font-medium text-[#351532]">
                  {isProfileVisible ? (
                    <Eye className="h-4 w-4 text-primary" aria-hidden />
                  ) : (
                    <EyeOff className="h-4 w-4 text-muted-foreground" aria-hidden />
                  )}
                  {isProfileVisible ? "Visible in Discover" : "Invisible — hidden from Discover"}
                </Label>
                {visibilitySaving ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : null}
                <Button asChild variant="outline" size="sm" className="ml-auto rounded-xl border-[#dcc9d8]">
                  <Link href="/biodata">Biodata Studio</Link>
                </Button>
              </div>
            </div>
          </PageHero>

        {/* Main Content */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 rounded-xl">
              <TabsTrigger value="about">About</TabsTrigger>
              <TabsTrigger value="photos">Photos</TabsTrigger>
              <TabsTrigger value="interests">Interests</TabsTrigger>
              <TabsTrigger value="horoscope">Horoscope</TabsTrigger>
            </TabsList>

            <TabsContent value="about" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Basic Information</CardTitle>
                  <CardDescription>Your essential details that help others get to know you better.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="bio"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center justify-between">
                          <FormLabel className="flex items-center">
                            <Info className="mr-2 h-4 w-4 text-muted-foreground" />
                            About Me
                          </FormLabel>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEnhanceWithAI("bio", enhanceBio, setIsEnhancingBio, "bioText", "enhancedBioText", "Bio")}
                            disabled={isEnhancingBio || isSaving || anyEnhancementLoading}
                            className="text-xs text-primary hover:bg-primary/10 h-auto p-1"
                          >
                            {isEnhancingBio ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Wand2 className="h-3 w-3 mr-1" />}
                            Enhance with AI
                          </Button>
                        </div>
                        <FormControl>
                          <Textarea {...field} rows={4} disabled={isSaving || anyEnhancementLoading} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="height"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center">
                            <Ruler className="mr-2 h-4 w-4 text-muted-foreground" />
                            Height (cm)
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              value={field.value ?? ""}
                              onChange={(event) => field.onChange(event.target.value)}
                              disabled={isSaving || anyEnhancementLoading}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="dob"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center">
                            <CalendarDays className="mr-2 h-4 w-4 text-muted-foreground" />
                            Date of Birth
                          </FormLabel>
                          <FormControl>
                            <Input type="date" {...field} disabled={isSaving || anyEnhancementLoading} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="religion"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Religion</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || undefined} disabled={isSaving || anyEnhancementLoading}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select Religion" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {religionOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="caste"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Caste/Community</FormLabel>
                          <FormControl>
                            <Input {...field} disabled={isSaving || anyEnhancementLoading} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="language"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center">
                          <Languages className="mr-2 h-4 w-4 text-muted-foreground" />
                          Primary Language(s)
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., English, Tamil, Sinhala" {...field} disabled={isSaving || anyEnhancementLoading} />
                        </FormControl>
                        <FormDescription>Enter one or more languages, separated by commas.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="educationLevel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center">
                            <School className="mr-2 h-4 w-4 text-muted-foreground" />
                            Education Level
                          </FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || undefined} disabled={isSaving || anyEnhancementLoading}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select Education Level" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="High School">High School</SelectItem>
                              <SelectItem value="Associate Degree">Associate Degree</SelectItem>
                              <SelectItem value="Bachelor's Degree">Bachelor&apos;s Degree</SelectItem>
                              <SelectItem value="Master's Degree">Master&apos;s Degree</SelectItem>
                              <SelectItem value="Doctorate">Doctorate</SelectItem>
                              <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="profession"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center">
                            <Briefcase className="mr-2 h-4 w-4 text-muted-foreground" />
                            Profession
                          </FormLabel>
                          <FormControl>
                            <Input {...field} disabled={isSaving || anyEnhancementLoading} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="smokingHabits"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center">
                            <Cigarette className="mr-2 h-4 w-4 text-muted-foreground" />
                            Smoking Habits
                          </FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || undefined} disabled={isSaving || anyEnhancementLoading}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select Smoking Habits" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Never">Never</SelectItem>
                              <SelectItem value="Occasionally/Socially">Occasionally/Socially</SelectItem>
                              <SelectItem value="Regularly">Regularly</SelectItem>
                              <SelectItem value="Prefer not to say">Prefer not to say</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="drinkingHabits"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center">
                            <Droplet className="mr-2 h-4 w-4 text-muted-foreground" />
                            Drinking Habits
                          </FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || undefined} disabled={isSaving || anyEnhancementLoading}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select Drinking Habits" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Never">Never</SelectItem>
                              <SelectItem value="Occasionally/Socially">Occasionally/Socially</SelectItem>
                              <SelectItem value="Regularly">Regularly</SelectItem>
                              <SelectItem value="Prefer not to say">Prefer not to say</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="photos" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Profile Photo</CardTitle>
                  <CardDescription>Update your profile picture to help others recognize you.</CardDescription>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="profilePhoto"
                    render={() => (
                      <FormItem>
                        <FormControl>
                          <ProfilePhotoEditor
                            currentUrl={currentProfilePhotoUrl}
                            previewUrl={profilePhotoPreview}
                            displayName={form.getValues("fullName")}
                            disabled={isSaving || anyEnhancementLoading}
                            onCropped={handleCroppedProfilePhoto}
                            onClear={clearProfilePhotoSelection}
                          />
                        </FormControl>
                        {selectedProfilePhotoName ? (
                          <FormDescription className="text-center text-xs">
                            Selected: {selectedProfilePhotoName}
                          </FormDescription>
                        ) : null}
                        <FormMessage className="text-center" />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Photo Gallery</CardTitle>
                  <CardDescription>Manage your additional photos to showcase more of yourself.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <PhotoGalleryEditor
                    photos={galleryPhotos}
                    maxPhotos={MAX_ADDITIONAL_PHOTOS}
                    disabled={isSaving || anyEnhancementLoading}
                    onChange={(next) => {
                      setGalleryPhotos(next);
                      const pending = next
                        .map((photo) => photo.pendingFile)
                        .filter((file): file is File => Boolean(file));
                      form.setValue("additionalPhotos", pending.length ? pending : undefined, {
                        shouldValidate: true,
                      });
                    }}
                  />
                  <FormField
                    control={form.control}
                    name="additionalPhotos"
                    render={() => (
                      <FormItem>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="interests" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Hobbies & Interests</CardTitle>
                  <CardDescription>Share what you love to do in your free time.</CardDescription>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="hobbies"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center justify-between">
                          <FormLabel className="flex items-center">
                            <Gamepad2 className="mr-2 h-4 w-4 text-muted-foreground" />
                            Hobbies & Interests
                          </FormLabel>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEnhanceWithAI("hobbies", enhanceHobbies, setIsEnhancingHobbies, "hobbiesText", "enhancedHobbiesText", "Hobbies")}
                            disabled={isEnhancingHobbies || isSaving || anyEnhancementLoading}
                            className="text-xs text-primary hover:bg-primary/10 h-auto p-1"
                          >
                            {isEnhancingHobbies ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Wand2 className="h-3 w-3 mr-1" />} Enhance
                          </Button>
                        </div>
                        <FormControl>
                          <Textarea placeholder="e.g., Reading, Cooking, Hiking (comma-separated)" {...field} rows={3} disabled={isSaving || anyEnhancementLoading} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Entertainment Preferences</CardTitle>
                  <CardDescription>Share your favorite movies and music.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="favoriteMovies"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center justify-between">
                          <FormLabel className="flex items-center">
                            <Film className="mr-2 h-4 w-4 text-muted-foreground" />
                            Favorite Movies
                          </FormLabel>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEnhanceWithAI("favoriteMovies", enhanceMovies, setIsEnhancingMovies, "moviesText", "enhancedMoviesText", "Favorite Movies")}
                            disabled={isEnhancingMovies || isSaving || anyEnhancementLoading}
                            className="text-xs text-primary hover:bg-primary/10 h-auto p-1"
                          >
                            {isEnhancingMovies ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Wand2 className="h-3 w-3 mr-1" />} Enhance
                          </Button>
                        </div>
                        <FormControl>
                          <Textarea placeholder="e.g., The Shawshank Redemption, Inception (comma-separated)" {...field} rows={2} disabled={isSaving || anyEnhancementLoading} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="favoriteMusic"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center justify-between">
                          <FormLabel className="flex items-center">
                            <Music className="mr-2 h-4 w-4 text-muted-foreground" />
                            Favorite Music
                          </FormLabel>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEnhanceWithAI("favoriteMusic", enhanceMusic, setIsEnhancingMusic, "musicText", "enhancedMusicText", "Favorite Music")}
                            disabled={isEnhancingMusic || isSaving || anyEnhancementLoading}
                            className="text-xs text-primary hover:bg-primary/10 h-auto p-1"
                          >
                            {isEnhancingMusic ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Wand2 className="h-3 w-3 mr-1" />} Enhance
                          </Button>
                        </div>
                        <FormControl>
                          <Textarea placeholder="e.g., Classical, Pop, A.R. Rahman (comma-separated)" {...field} rows={2} disabled={isSaving || anyEnhancementLoading} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="horoscope" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <SparklesIcon className="mr-2 h-5 w-5 text-primary" />
                    Astrological Details
                  </CardTitle>
                  <CardDescription>Provide these for more accurate AI-driven horoscope analysis and matching.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="sunSign"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sun Sign (Western)</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Aries" {...field} disabled={isSaving || anyEnhancementLoading} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="moonSign"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Moon Sign (Vedic Rasi)</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Mesha" {...field} disabled={isSaving || anyEnhancementLoading} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="nakshatra"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nakshatra (Birth Star)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Ashwini" {...field} disabled={isSaving || anyEnhancementLoading} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="horoscopeInfo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>General Horoscope Notes</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Enter any additional horoscope details or notes here..." {...field} rows={3} disabled={isSaving || anyEnhancementLoading} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="horoscopeFile"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center justify-between">
                          <FormLabel className="flex items-center">
                            <FileText className="mr-2 h-4 w-4 text-muted-foreground" />
                            Upload Horoscope File
                          </FormLabel>
                          {selectedHoroscopeFileName && (
                            <Button type="button" variant="ghost" size="sm" onClick={clearHoroscopeFileSelection} className="text-xs h-auto p-1 text-destructive" disabled={isSaving || anyEnhancementLoading}>
                              <XCircle className="h-3 w-3 mr-1" /> Clear
                            </Button>
                          )}
                        </div>
                        <FormControl>
                          <Input
                            type="file"
                            id="horoscopeFile-input"
                            accept={ACCEPTED_HOROSCOPE_FILE_TYPES.join(",")}
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
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <Button type="submit" className="w-full rounded-xl bg-primary text-primary-foreground shadow-md hover:bg-primary/90" disabled={isSaving || !profileDataLoaded || anyEnhancementLoading}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>

          <Card className="rounded-2xl border-destructive/50 shadow-sm">
            <CardHeader>
              <CardTitle className="font-headline flex items-center text-2xl text-destructive">
                <AlertTriangle className="mr-2 h-6 w-6" />
                Danger Zone
              </CardTitle>
              <CardDescription>Actions in this zone are critical and may have irreversible consequences.</CardDescription>
            </CardHeader>
            <CardContent>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="w-full rounded-xl" disabled={isSaving || anyEnhancementLoading}>
                    Deactivate Account
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>Deactivating your account will hide your profile from CupidMatch. You will not be able to log in or be discovered by others. You can usually reactivate your account by contacting support. This action is not immediate deletion.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeactivateAccount} className="bg-destructive hover:bg-destructive/90">
                      Yes, Deactivate My Account
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <p className="mt-2 text-center text-xs text-muted-foreground">Please be certain before deactivating your account.</p>
            </CardContent>
          </Card>
        </PageFrame>
      </form>
    </Form>
  );
}
