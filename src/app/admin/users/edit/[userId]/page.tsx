
"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { db } from '@/lib/firebase/config';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft, Save, UserCircle, FileText, MapPinIcon, Briefcase, CheckSquare, Shield } from 'lucide-react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';

const adminEditUserSchema = z.object({
  displayName: z.string().min(2, "Display name must be at least 2 characters."),
  email: z.string().email("Invalid email address.").optional(), // Admins might see email but not change it here due to auth implications
  bio: z.string().max(1000, "Bio cannot exceed 1000 characters.").optional().nullable(),
  location: z.string().optional().nullable(),
  profession: z.string().optional().nullable(),
  isVerified: z.boolean().optional(),
  isAdmin: z.boolean().optional(),
});

type AdminEditUserFormData = z.infer<typeof adminEditUserSchema>;

interface UserDataForEditForm extends AdminEditUserFormData {
  id: string;
  email?: string; // To display, not necessarily to edit via this form
}

export default function AdminEditUserPage() {
  const params = useParams();
  const userId = params.userId as string;
  const router = useRouter();
  const { toast } = useToast();

  const [user, setUser] = useState<UserDataForEditForm | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<AdminEditUserFormData>({
    resolver: zodResolver(adminEditUserSchema),
    defaultValues: {
      displayName: "",
      bio: "",
      location: "",
      profession: "",
      isVerified: false,
      isAdmin: false,
    },
  });

  useEffect(() => {
    if (!userId) {
        toast({ title: "Error", description: "User ID is missing.", variant: "destructive" });
        router.push('/admin/users');
        return;
    }
    setIsLoading(true);
    const fetchUserData = async () => {
      try {
        const userDocRef = doc(db, "users", userId);
        const docSnap = await getDoc(userDocRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          const userData: UserDataForEditForm = {
            id: docSnap.id,
            displayName: data.displayName || "",
            email: data.email || "", // Assuming email is stored in Firestore user doc
            bio: data.bio || "",
            location: data.location || "",
            profession: data.profession || "",
            isVerified: data.isVerified || false,
            isAdmin: data.isAdmin || false,
          };
          setUser(userData);
          form.reset(userData); // Pre-fill the form
        } else {
          toast({ title: "Error", description: "User not found.", variant: "destructive" });
          router.push('/admin/users');
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        toast({ title: "Error", description: "Failed to fetch user data.", variant: "destructive" });
        router.push('/admin/users');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [userId, router, toast, form]);

  const onSubmit = async (data: AdminEditUserFormData) => {
    setIsSaving(true);
    const userDocRef = doc(db, "users", userId);
    try {
      const dataToUpdate: Partial<AdminEditUserFormData & { updatedAt: string }> = {};
      
      // Only include fields that are part of the form schema and intended for update
      if (data.displayName !== undefined) dataToUpdate.displayName = data.displayName;
      
      // For optional text fields, save as empty string if null/undefined from form, or the value itself
      dataToUpdate.bio = data.bio ?? ""; 
      dataToUpdate.location = data.location ?? "";
      dataToUpdate.profession = data.profession ?? "";
      
      if (data.isVerified !== undefined) dataToUpdate.isVerified = data.isVerified;
      if (data.isAdmin !== undefined) dataToUpdate.isAdmin = data.isAdmin;
      
      dataToUpdate.updatedAt = new Date().toISOString(); // Add/update the timestamp

      console.log("Admin Edit User: Data to update Firestore:", dataToUpdate);
      await updateDoc(userDocRef, dataToUpdate);
      
      toast({
        title: "User Updated",
        description: `${data.displayName}'s profile has been successfully updated.`,
      });
      router.push('/admin/users');
    } catch (error: any) {
      let description = "Could not update user profile. Please check console for details.";
      if (error.message) {
        description = error.message;
      }
      if (error.code) { // Firebase errors often have a code
        description = `${error.message} (Code: ${error.code})`;
      }
      console.error("Error updating user:", error); // Ensure full error is logged
      toast({ title: "Update Failed", description, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <Skeleton className="h-9 w-1/4" />
                <Skeleton className="h-9 w-24" />
            </div>
            <Card className="shadow-lg">
                <CardHeader>
                    <Skeleton className="h-8 w-1/2" />
                    <Skeleton className="h-4 w-3/4" />
                </CardHeader>
                <CardContent className="space-y-6">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <div className="flex items-center space-x-4">
                        <Skeleton className="h-10 w-24" />
                        <Skeleton className="h-10 w-24" />
                    </div>
                </CardContent>
                <CardFooter>
                    <Skeleton className="h-10 w-32" />
                </CardFooter>
            </Card>
        </div>
    );
  }

  if (!user) {
    return <div className="text-center p-8">User data could not be loaded or user does not exist.</div>;
  }

  return (
    <div className="space-y-6">
        <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-slate-700">Edit User: {user.displayName || userId}</h1>
            <Button variant="outline" asChild>
                <Link href="/admin/users"><ArrowLeft className="mr-2 h-4 w-4"/> Back to User List</Link>
            </Button>
        </div>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>User Details</CardTitle>
          <CardDescription>Modify the user's information below. Email is display-only.</CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center"><UserCircle className="mr-2 h-4 w-4 text-muted-foreground"/>Display Name</FormLabel>
                    <FormControl><Input {...field} disabled={isSaving} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormItem>
                <FormLabel>Email (Read-only)</FormLabel>
                <Input value={user.email || "N/A"} readOnly disabled className="bg-muted/50" />
                <FormDescription>Email addresses must be changed through Firebase Authentication directly or user actions.</FormDescription>
              </FormItem>
              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center"><FileText className="mr-2 h-4 w-4 text-muted-foreground"/>Bio</FormLabel>
                    <FormControl><Textarea {...field} value={field.value ?? ""} rows={4} disabled={isSaving} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center"><MapPinIcon className="mr-2 h-4 w-4 text-muted-foreground"/>Location</FormLabel>
                    <FormControl><Input {...field} value={field.value ?? ""} disabled={isSaving} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="profession"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center"><Briefcase className="mr-2 h-4 w-4 text-muted-foreground"/>Profession</FormLabel>
                    <FormControl><Input {...field} value={field.value ?? ""} disabled={isSaving} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
                <FormField
                    control={form.control}
                    name="isVerified"
                    render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4 bg-muted/20">
                        <FormControl>
                        <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={isSaving}
                            id={`isVerified-${userId}`}
                        />
                        </FormControl>
                        <div className="space-y-0.5 leading-none">
                        <FormLabel htmlFor={`isVerified-${userId}`} className="flex items-center cursor-pointer">
                            <CheckSquare className="mr-2 h-4 w-4 text-muted-foreground"/> Is Verified
                        </FormLabel>
                        <FormDescription>Mark if the user's profile has been manually verified.</FormDescription>
                        </div>
                    </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="isAdmin"
                    render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-md border p-4 bg-muted/20">
                        <div className="space-y-0.5">
                        <FormLabel className="flex items-center">
                            <Shield className="mr-2 h-4 w-4 text-muted-foreground"/> Is Admin
                        </FormLabel>
                        <FormDescription>Grant or revoke administrator privileges.</FormDescription>
                        </div>
                        <FormControl>
                        <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={isSaving}
                            aria-label="Toggle admin status"
                        />
                        </FormControl>
                    </FormItem>
                    )}
                />
                </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isSaving || isLoading}>
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save Changes
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
