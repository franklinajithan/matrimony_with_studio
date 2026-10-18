
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";
import { PublicPage, secondaryLink } from "@/components/marketing/PublicPage";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Users, BookOpen, Image as ImageIcon, Mail, Heart, ArrowLeft, ShieldCheck, Loader2, Send } from 'lucide-react';
import { Checkbox } from "@/components/ui/checkbox";
import React, { useState } from "react";
import { auth } from '@/lib/supabase/auth';
import { mediaPathForUser, resolveMediaUrl, uploadFile } from '@/lib/supabase/storage';
import { createSuccessStory } from '@/lib/supabase/stories';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

const successStorySchema = z.object({
  coupleNames: z.string().min(3, "Couple's names must be at least 3 characters."),
  storyText: z.string().min(50, "Your story must be at least 50 characters long.").max(5000, "Your story cannot exceed 5000 characters."),
  photo: z
    .instanceof(File, { message: "Please select a file or ensure the file is not empty." })
    .optional()
    .refine(file => !file || file.size <= MAX_FILE_SIZE, `Max file size is 5MB.`)
    .refine(
      file => !file || ACCEPTED_IMAGE_TYPES.includes(file.type),
      ".jpg, .jpeg, .png and .webp files are accepted."
    ),
  email: z.string().email("Please enter a valid email address.").optional().or(z.literal('')),
  consent: z.boolean().refine(val => val === true, { message: "You must consent to share your story." }),
});

export default function SubmitSuccessStoryPage() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);

  const form = useForm<z.infer<typeof successStorySchema>>({
    resolver: zodResolver(successStorySchema),
    defaultValues: {
      coupleNames: "",
      storyText: "",
      photo: undefined,
      email: "",
      consent: false,
    },
  });

  async function onSubmit(values: z.infer<typeof successStorySchema>) {
    setIsSubmitting(true);
    const currentUser = auth.currentUser;

    try {
      let photoUrl: string | null = null;
      let photoStoragePath: string | null = null;

      if (values.photo) {
        if (!currentUser?.uid) {
          throw new Error("Please sign in before uploading a photo with your story.");
        }
        const filePath = mediaPathForUser(currentUser.uid, values.photo.name, "success_stories");
        const storedPath = await uploadFile(values.photo, filePath);
        photoStoragePath = storedPath;
        photoUrl = resolveMediaUrl(storedPath);
      }

      await createSuccessStory({
        coupleNames: values.coupleNames,
        storyText: values.storyText,
        originalStoryText: values.storyText,
        photoUrl,
        photoStoragePath,
        contactEmail: values.email || null,
        submittedByUid: currentUser ? currentUser.uid : null,
      });

      toast({
        title: "Story Submitted!",
        description: "Thank you for sharing your beautiful story with CupidMatch. We'll review it shortly.",
        variant: "default",
      });
      form.reset();
      setSelectedFileName(null);
    } catch (error: any) {
      console.error("Error submitting success story:", error);
      toast({
        title: "Submission Failed",
        description: error.message || "Could not submit your story. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      form.setValue('photo', file, { shouldValidate: true });
      setSelectedFileName(file.name);
    } else {
      form.setValue('photo', undefined, { shouldValidate: true });
      setSelectedFileName(null);
    }
  };

  return (
    <PublicPage>
      <div className="mx-auto max-w-5xl">
        <Link href="/success-stories" className={`${secondaryLink} mb-7`}><ArrowLeft aria-hidden className="h-4 w-4" /> Back to stories</Link>
        <header className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[.22em] text-[#846294]">Your CupidMatch journey</p>
          <h1 className="mt-4 font-serif text-[2.5rem] font-semibold leading-[1.1] tracking-tight sm:text-5xl">A story only <span className="text-[#A52A8A]">you can tell.</span></h1>
          <p className="mt-5 text-base leading-7 text-[#6B5A78]">From the first hello to your next chapter together, share the moments that made your connection meaningful.</p>
        </header>
        <div className="mt-8 grid items-start gap-7 lg:grid-cols-[minmax(0,1fr)_270px] lg:gap-8">
        <section aria-labelledby="story-form-title" className="min-w-0 rounded-3xl border border-[#EADFED] bg-white/80 p-5 sm:p-8">
          <h2 id="story-form-title" className="font-serif text-2xl font-semibold">Tell us your story</h2>
          <p className="mb-7 mt-2 text-sm leading-6 text-[#6B5A78]">Names, your story and sharing consent are required. A photo and email are optional.</p>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" aria-busy={isSubmitting}>
              <FormField
                control={form.control}
                name="coupleNames"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center text-sm font-semibold leading-6 text-[#2A1845]"><Users className="mr-2 h-4 w-4 text-[#846294]" aria-hidden />Your Names (e.g., Priya & Rohan)</FormLabel>
                    <FormControl>
                      <Input className="h-12 rounded-xl border-[#DDD0E7] bg-[#FFFDF9] text-base" autoComplete="name" placeholder="Enter both names" {...field} disabled={isSubmitting} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="storyText"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center text-sm font-semibold leading-6 text-[#2A1845]"><BookOpen className="mr-2 h-4 w-4 text-[#846294]" aria-hidden />Your Success Story</FormLabel>
                    <FormControl>
                      <Textarea className="min-h-48 rounded-xl border-[#DDD0E7] bg-[#FFFDF9] text-base leading-7" placeholder="Tell us how you met, your journey, and what makes your connection special..." {...field} rows={8} disabled={isSubmitting} />
                    </FormControl>
                    <FormDescription>Write 50–5,000 characters. You might start with how you met and what you hope to build together.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="photo"
                render={({ field: { onChange, onBlur, name, ref } }) => (
                  <FormItem>
                    <FormLabel className="flex items-center text-sm font-semibold leading-6 text-[#2A1845]"><ImageIcon className="mr-2 h-4 w-4 text-[#846294]" aria-hidden />Share a Photo (Optional)</FormLabel>
                    <FormControl>
                      <Input 
                        className="h-auto min-h-12 max-w-full rounded-xl border-dashed border-[#CDB9DE] bg-[#FBF7FE] p-3 text-sm file:mr-3 file:rounded-full file:bg-[#F0E5FC] file:px-3 file:py-1 file:text-[#6D28D9]"
                        type="file" 
                        accept={ACCEPTED_IMAGE_TYPES.join(',')}
                        onChange={(e) => {
                           onChange(e.target.files?.[0]); // RHF's onChange
                           handleFileChange(e); // Custom handler for file name display
                        }}
                        name={name}
                        ref={ref}
                        onBlur={onBlur}
                        disabled={isSubmitting} 
                      />
                    </FormControl>
                    {selectedFileName && <FormDescription className="break-all text-xs">Selected: {selectedFileName}</FormDescription>}
                    <FormDescription>A photo of you together would be lovely! Max 5MB (JPG, PNG, WebP). Sign in before attaching a photo.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center text-sm font-semibold leading-6 text-[#2A1845]"><Mail className="mr-2 h-4 w-4 text-[#846294]" aria-hidden />Your Email (Optional, for verification)</FormLabel>
                    <FormControl>
                      <Input className="h-12 rounded-xl border-[#DDD0E7] bg-[#FFFDF9] text-base" autoComplete="email" type="email" placeholder="you@example.com" {...field} disabled={isSubmitting} />
                    </FormControl>
                    <FormDescription>We may contact you to verify your story. This will not be published.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="consent"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-2xl border border-[#EADFED] bg-[#F8F1FC] p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <div className="min-w-0 space-y-2 leading-6">
                      <FormLabel className="cursor-pointer text-sm leading-6 text-[#51435C]">
                        I consent to CupidMatch sharing my story and photo (if provided) on their website and promotional materials.
                      </FormLabel>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />
              <Button type="submit" className="min-h-12 w-full rounded-full bg-[#7C3AED] px-4 py-3 text-base font-semibold text-white shadow-sm hover:bg-[#6D28D9]" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Send className="mr-2 h-5 w-5" />}
                Submit Your Story
              </Button>
            </form>
          </Form>
          <p className="mt-5 text-center text-xs leading-5 text-[#6B5A78]">By submitting, you confirm you have the rights to share the story and photo.</p>
        </section>
        <aside className="space-y-5 rounded-3xl bg-[#F3EBFA] p-6 sm:p-7">
          <Heart aria-hidden className="h-7 w-7 text-[#A52A8A]" />
          <h2 className="font-serif text-2xl font-semibold">The little moments matter.</h2>
          <p className="text-sm leading-6 text-[#6B5A78]">You don’t need the perfect words. Here are a few places to start:</p>
          <ul className="list-disc space-y-3 pl-4 text-sm leading-6 text-[#51435C]"><li>What made you send that first hello?</li><li>Which values brought you closer?</li><li>What would you tell someone just starting out?</li></ul>
          <div className="border-t border-[#DED0EA] pt-5"><ShieldCheck aria-hidden className="mb-3 h-5 w-5 text-[#7C3AED]" /><h3 className="text-sm font-semibold">Shared with care</h3><p className="mt-2 text-sm leading-6 text-[#6B5A78]">Our team reviews submissions before they’re featured. Your email is only for verification and won’t be published.</p></div>
        </aside>
        </div>
      </div>
    </PublicPage>
  );
}
