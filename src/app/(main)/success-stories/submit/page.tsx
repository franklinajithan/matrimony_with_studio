
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
import { Users, BookOpen, Image as ImageIcon, Mail, CheckSquare, Loader2, Send } from 'lucide-react';
import { Checkbox } from "@/components/ui/checkbox";
import React, { useState } from "react";

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
    console.log("Success story submission:", values);
    // Mock submission
    await new Promise(resolve => setTimeout(resolve, 1500));

    toast({
      title: "Story Submitted! (Mock)",
      description: "Thank you for sharing your beautiful story with CupidMatch. We'll review it shortly.",
      variant: "default",
    });
    form.reset();
    setSelectedFileName(null);
    setIsSubmitting(false);
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
    <div className="container mx-auto max-w-2xl py-8 md:py-12">
      <Card className="shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="font-headline text-3xl md:text-4xl text-primary">Share Your CupidMatch Story</CardTitle>
          <CardDescription className="text-lg">Inspire others by telling us how you found love on CupidMatch!</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="coupleNames"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center"><Users className="mr-2 h-4 w-4 text-muted-foreground" />Your Names (e.g., Priya & Rohan)</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter both names" {...field} disabled={isSubmitting} />
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
                    <FormLabel className="flex items-center"><BookOpen className="mr-2 h-4 w-4 text-muted-foreground" />Your Success Story</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Tell us how you met, your journey, and what makes your connection special..." {...field} rows={8} disabled={isSubmitting} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="photo"
                render={({ field: { onChange, ...rest } }) => (
                  <FormItem>
                    <FormLabel className="flex items-center"><ImageIcon className="mr-2 h-4 w-4 text-muted-foreground" />Share a Photo (Optional)</FormLabel>
                    <FormControl>
                      <Input 
                        type="file" 
                        accept={ACCEPTED_IMAGE_TYPES.join(',')}
                        onChange={(e) => {
                           onChange(e.target.files?.[0]); // RHF's onChange
                           handleFileChange(e); // Custom handler for file name display
                        }}
                        {...rest} 
                        disabled={isSubmitting} 
                      />
                    </FormControl>
                    {selectedFileName && <FormDescription className="text-xs">Selected: {selectedFileName}</FormDescription>}
                    <FormDescription>A photo of you together would be lovely! Max 5MB (JPG, PNG, WebP).</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center"><Mail className="mr-2 h-4 w-4 text-muted-foreground" />Your Email (Optional, for verification)</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="you@example.com" {...field} disabled={isSubmitting} />
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
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm bg-muted/30">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isSubmitting}
                        id="consent"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel htmlFor="consent" className="cursor-pointer">
                        I consent to CupidMatch sharing my story and photo (if provided) on their website and promotional materials.
                      </FormLabel>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-lg py-3" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Send className="mr-2 h-5 w-5" />}
                Submit Your Story
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter>
            <p className="text-xs text-muted-foreground text-center w-full">
                By submitting, you confirm you have the rights to share the story and photo.
            </p>
        </CardFooter>
      </Card>
    </div>
  );
}
