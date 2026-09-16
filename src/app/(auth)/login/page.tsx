"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Mail, Lock, Loader2 } from "lucide-react";
import React, { Suspense, useMemo, useState } from "react";
import { auth, signInWithEmailAndPassword } from "@/lib/supabase/auth";
import { getProfile } from "@/lib/supabase/profiles";
import { draftFromProfile } from "@/lib/onboarding/persist";
import { firstIncompleteOnboardingStep } from "@/lib/onboarding/readiness";
import { safeInternalPath } from "@/lib/auth/safe-redirect";
import { markLoginWelcomePending } from "@/lib/auth/welcome-toast";
import { SocialAuthButtons } from "@/components/auth/SocialAuthButtons";

const loginSchema = z.object({
  email: z.string().email({ message: "Enter a valid email address." }),
  password: z.string().min(1, { message: "Password is required." }),
});

const ERROR_MESSAGES: Record<string, string> = {
  expired_link: "That link has expired. Request a new confirmation or password reset email.",
  invalid_link: "That link is invalid. Request a new email and try again.",
  email_not_confirmed: "Please confirm your email before logging in.",
};

function LoginForm() {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const nextPath = useMemo(
    () => safeInternalPath(searchParams.get("next"), ""),
    [searchParams]
  );
  const linkError = searchParams.get("error");

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: z.infer<typeof loginSchema>) {
    setIsLoading(true);
    setFormError(null);
    try {
      const result = await signInWithEmailAndPassword(auth, values.email, values.password);
      let destination = nextPath;
      if (!destination && result.user) {
        try {
          const profile = await getProfile(result.user.uid);
          if (profile?.isPublished) {
            destination = "/dashboard";
          } else if (profile) {
            const draft = draftFromProfile(profile);
            const resumeStep = firstIncompleteOnboardingStep(draft);
            destination = `/onboarding?step=${resumeStep}`;
          } else {
            destination = "/onboarding";
          }
        } catch {
          destination = "/onboarding";
        }
      }
      markLoginWelcomePending();
      router.push(destination || "/onboarding");
      router.refresh();
    } catch (error: unknown) {
      const code = typeof error === "object" && error && "code" in error ? String((error as { code: string }).code) : "";
      let errorMessage = "Could not sign in. Please try again.";
      if (code === "auth/user-not-found" || code === "auth/wrong-password" || code === "auth/invalid-credential") {
        errorMessage = "Invalid email or password.";
      } else if (code === "auth/invalid-api-key") {
        errorMessage = "This deployment is missing a valid Supabase key. Set NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in Vercel and redeploy.";
      } else if (code === "auth/invalid-email") {
        errorMessage = "Enter a valid email address.";
      } else if (code === "auth/user-disabled") {
        errorMessage = "This account has been disabled.";
      } else if (code === "auth/email-not-confirmed") {
        errorMessage = "Please confirm your email before logging in. Check your inbox for the link.";
      } else if (code === "auth/network-request-failed") {
        errorMessage = "Network error. Check your connection and try again.";
      } else if (error instanceof Error && error.message) {
        errorMessage = error.message;
      }
      setFormError(errorMessage);
      toast({ title: "Login failed", description: errorMessage, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md shadow-2xl">
      <CardHeader className="text-center">
        <CardTitle className="font-headline text-3xl text-primary">Welcome back</CardTitle>
        <CardDescription>Log in to continue your CupidMatch profile.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {linkError && ERROR_MESSAGES[linkError] && (
          <Alert variant="destructive">
            <AlertTitle>Link not valid</AlertTitle>
            <AlertDescription>{ERROR_MESSAGES[linkError]}</AlertDescription>
          </Alert>
        )}
        {formError && (
          <Alert variant="destructive">
            <AlertTitle>Could not sign in</AlertTitle>
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        )}
        <SocialAuthButtons next={nextPath || "/dashboard"} />
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center"><Mail className="mr-2 h-4 w-4 text-muted-foreground" />Email</FormLabel>
                  <FormControl>
                    <Input type="email" autoComplete="email" placeholder="you@example.com" {...field} disabled={isLoading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center"><Lock className="mr-2 h-4 w-4 text-muted-foreground" />Password</FormLabel>
                  <FormControl>
                    <Input type="password" autoComplete="current-password" placeholder="••••••••" {...field} disabled={isLoading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full min-h-11" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Log in
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex flex-col items-center space-y-2">
        <Link href="/forgot-password">
          <Button variant="link" className="text-sm text-muted-foreground hover:text-primary">Forgot password?</Button>
        </Link>
        <p className="text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-medium text-primary hover:underline">
            Sign up
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="text-muted-foreground">Loading sign-in...</div>}>
      <LoginForm />
    </Suspense>
  );
}
