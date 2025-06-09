
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { User, Image as ImageIcon, Info, Loader2 } from 'lucide-react';
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { Logo } from "@/components/shared/Logo";
import { auth, db } from "@/lib/firebase/config";
import { updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { uploadFile } from "@/lib/firebase/storageService";

const profileSetupSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters."),
  bio: z.string().min(10, "Bio must be at least 10 characters.").max(500, "Bio cannot exceed 500 characters."),
  profilePhoto: z
    .instanceof(File, { message: "Please select a file." })
    .optional()
    .refine(file => !file || file.size <= 5 * 1024 * 1024, `Max file size is 5MB.`)
    .refine(
      file => !file || ["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(file.type),
      ".jpg, .jpeg, .png and .webp files are accepted."
    ),
});

export default function ProfileSetupPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<z.infer<typeof profileSetupSchema>>({
    resolver: zodResolver(profileSetupSchema),
    defaultValues: {
      fullName: auth.currentUser?.displayName || "",
      bio: "",
      profilePhoto: undefined,
    },
  });

  async function onSubmit(values: z.infer<typeof profileSetupSchema>) {
    setIsSaving(true);
    const user = auth.currentUser;

    if (!user) {
      toast({ title: "Error", description: "No authenticated user found. Please sign in again.", variant: "destructive" });
      setIsSaving(false);
      router.push('/login');
      return;
    }

    try {
      let finalPhotoURL = user.photoURL; // Start with existing photo from Auth (e.g. Google)
      let finalDataAiHint = user.photoURL ? "social profile" : "person placeholder"; // Default hint

      if (values.profilePhoto) {
        const filePath = `users/${user.uid}/profile_photo/${values.profilePhoto.name}`;
        finalPhotoURL = await uploadFile(values.profilePhoto, filePath);
        finalDataAiHint = "profile photo"; // Hint for newly uploaded photo
      } else if (!user.photoURL) { // No new photo uploaded AND no existing photo from Auth
        finalPhotoURL = "https://placehold.co/128x128.png"; // Default placeholder
        finalDataAiHint = "person placeholder";
      }

      // Update Firebase Auth profile with the determined photoURL and new displayName
      await updateProfile(user, {
        displayName: values.fullName,
        photoURL: finalPhotoURL, 
      });

      // Prepare comprehensive initial data for Firestore
      const userDocRef = doc(db, "users", user.uid);
      const initialProfileData = {
        uid: user.uid,
        email: user.email,
        displayName: values.fullName,
        bio: values.bio,
        photoURL: finalPhotoURL,
        dataAiHint: finalDataAiHint,
        
        // Initialize other profile fields to defaults
        location: "",
        profession: "",
        height: "", 
        dob: "",    
        religion: "",
        caste: "",
        language: "",
        horoscopeInfo: "",
        horoscopeFileName: "",
        horoscopeFileUrl: "",
        additionalPhotoUrls: [], // Initialize as empty array
        
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(), // Add updatedAt timestamp
      };

      // Save profile data to Firestore
      await setDoc(userDocRef, initialProfileData, { merge: true });

      toast({
        title: "Profile Setup Complete!",
        description: "Your profile has been saved. Redirecting to dashboard...",
      });
      router.push('/dashboard');

    } catch (error: any) {
      console.error("Profile setup error:", error);
      toast({
        title: "Setup Failed",
        description: error.message || "An unexpected error occurred while saving your profile.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background to-rose-50 p-4">
      <div className="absolute top-8 left-8">
        <Logo />
      </div>
      <Card className="w-full max-w-lg shadow-2xl">
        <CardHeader className="text-center">
          <CardTitle className="font-headline text-3xl text-primary">Set Up Your Profile</CardTitle>
          <CardDescription>Tell us a bit about yourself to get started on MatchCraft.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center"><User className="mr-2 h-4 w-4 text-muted-foreground" />Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="E.g., Aisha Khan" {...field} disabled={isSaving} />
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
                    <FormLabel className="flex items-center"><Info className="mr-2 h-4 w-4 text-muted-foreground" />About Me (Bio)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Share a few words about yourself, your interests, and what you're looking for." {...field} rows={4} disabled={isSaving} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="profilePhoto"
                render={({ field }) => ( 
                  <FormItem>
                    <FormLabel className="flex items-center"><ImageIcon className="mr-2 h-4 w-4 text-muted-foreground" />Profile Photo</FormLabel>
                    <FormControl>
                      <Input 
                        type="file" 
                        accept="image/jpeg,image/jpg,image/png,image/webp" 
                        onChange={(e) => field.onChange(e.target.files ? e.target.files[0] : null)} 
                        disabled={isSaving}
                      />
                    </FormControl>
                    <FormDescription>A clear photo helps make a great first impression. Max 5MB.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save and Continue
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-center">
            <Link href="/dashboard">
                <Button variant="link" className="text-sm text-muted-foreground hover:text-primary" disabled={isSaving}>Skip for now</Button>
            </Link>
        </CardFooter>
      </Card>
      <p className="mt-8 text-center text-sm text-muted-foreground">
        &copy; {new Date().getFullYear()} MatchCraft. All rights reserved.
      </p>
    </div>
  );
}
