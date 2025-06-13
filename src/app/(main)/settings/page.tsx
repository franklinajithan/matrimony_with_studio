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
import { User, Image as ImageIcon, Info, Loader2, MapPin, Briefcase, Cake } from 'lucide-react';
import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase/config";
import { updateProfile } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { uploadFile } from "@/lib/firebase/storageService";
import { updateUserProfile } from "@/lib/firebase/userService";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const profileSchema = z.object({
  displayName: z.string().min(2, "Name must be at least 2 characters."),
  bio: z.string().min(10, "Bio must be at least 10 characters.").max(500, "Bio cannot exceed 500 characters."),
  location: z.string().min(1, "Location is required"),
  profession: z.string().min(1, "Profession is required"),
  dob: z.string().min(1, "Date of birth is required"),
  profilePhoto: z
    .instanceof(File, { message: "Please select a file." })
    .optional()
    .refine(file => !file || file.size <= 5 * 1024 * 1024, `Max file size is 5MB.`)
    .refine(
      file => !file || ["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(file.type),
      ".jpg, .jpeg, .png and .webp files are accepted."
    ),
});

export default function SettingsPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [currentPhotoURL, setCurrentPhotoURL] = useState<string>("");

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: "",
      bio: "",
      location: "",
      profession: "",
      dob: "",
      profilePhoto: undefined,
    },
  });

  useEffect(() => {
    const loadUserProfile = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          form.reset({
            displayName: data.displayName || "",
            bio: data.bio || "",
            location: data.location || "",
            profession: data.profession || "",
            dob: data.dob || "",
          });
          setCurrentPhotoURL(data.photoURL || "");
        }
      } catch (error) {
        console.error("Error loading profile:", error);
        toast({
          title: "Error",
          description: "Failed to load profile data. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadUserProfile();
  }, [form, toast]);

  async function onSubmit(values: z.infer<typeof profileSchema>) {
    setIsSaving(true);
    const user = auth.currentUser;

    if (!user) {
      toast({ 
        title: "Error", 
        description: "No authenticated user found. Please sign in again.", 
        variant: "destructive" 
      });
      setIsSaving(false);
      return;
    }

    try {
      let finalPhotoURL = currentPhotoURL;
      let finalDataAiHint = currentPhotoURL ? "social profile" : "person placeholder";

      if (values.profilePhoto) {
        const filePath = `users/${user.uid}/profile_photo/${values.profilePhoto.name}`;
        finalPhotoURL = await uploadFile(values.profilePhoto, filePath);
        finalDataAiHint = "profile photo";
      }

      await updateProfile(user, {
        displayName: values.displayName,
        photoURL: finalPhotoURL,
      });

      const profileData = {
        displayName: values.displayName,
        bio: values.bio,
        photoURL: finalPhotoURL,
        dataAiHint: finalDataAiHint,
        location: values.location,
        profession: values.profession,
        dob: values.dob,
      };

      await updateUserProfile(user.uid, profileData);

      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      });
    } catch (error: any) {
      console.error("Profile update error:", error);
      toast({
        title: "Update Failed",
        description: error.message || "An unexpected error occurred while updating your profile.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container max-w-2xl py-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Edit Profile</CardTitle>
          <CardDescription>Update your profile information</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="flex flex-col items-center gap-4 mb-6">
                <Avatar className="h-24 w-24 border-2 border-primary">
                  <AvatarImage src={currentPhotoURL} alt="Profile" />
                  <AvatarFallback>
                    <User className="h-12 w-12" />
                  </AvatarFallback>
                </Avatar>
                <FormField
                  control={form.control}
                  name="profilePhoto"
                  render={({ field: { value, onChange, ...field } }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              onChange(file);
                            }
                          }}
                          {...field}
                          disabled={isSaving}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Full Name
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Your full name" {...field} disabled={isSaving} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Info className="h-4 w-4" />
                      About Me
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Tell us about yourself..."
                        className="resize-none"
                        rows={4}
                        {...field}
                        disabled={isSaving}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Location
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Your current location" {...field} disabled={isSaving} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="profession"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4" />
                      Profession
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Your profession" {...field} disabled={isSaving} />
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
                    <FormLabel className="flex items-center gap-2">
                      <Cake className="h-4 w-4" />
                      Date of Birth
                    </FormLabel>
                    <FormControl>
                      <Input type="date" {...field} disabled={isSaving} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
} 