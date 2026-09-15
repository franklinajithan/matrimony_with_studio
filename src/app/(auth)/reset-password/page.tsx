"use client";

import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Lock, Loader2 } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, onAuthStateChanged, updatePassword } from "@/lib/supabase/auth";

const resetSchema = z
  .object({
    password: z.string().min(8, { message: "Password must be at least 8 characters." }),
    confirmPassword: z.string().min(8, { message: "Confirm your new password." }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export default function ResetPasswordPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [hasRecoverySession, setHasRecoverySession] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof resetSchema>>({
    resolver: zodResolver(resetSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setHasRecoverySession(Boolean(user));
      setAuthChecked(true);
    });
    return () => unsubscribe();
  }, []);

  async function onSubmit(values: z.infer<typeof resetSchema>) {
    setIsLoading(true);
    setFormError(null);
    try {
      await updatePassword(values.password);
      toast({ title: "Password updated", description: "You can now use your new password." });
      router.push("/dashboard");
      router.refresh();
    } catch (error: unknown) {
      const code = typeof error === "object" && error && "code" in error ? String((error as { code: string }).code) : "";
      const message =
        code === "auth/expired-action-code"
          ? "This reset link has expired. Request a new one."
          : error instanceof Error
            ? error.message
            : "Could not update your password.";
      setFormError(message);
      toast({ title: "Reset failed", description: message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }

  if (!authChecked) {
    return (
      <Card className="w-full max-w-md shadow-2xl">
        <CardContent className="flex items-center justify-center py-12 text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Checking reset link...
        </CardContent>
      </Card>
    );
  }

  if (!hasRecoverySession) {
    return (
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <CardTitle className="font-headline text-3xl text-primary">Link expired</CardTitle>
          <CardDescription>This password reset link is invalid or has expired.</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTitle>Request a new link</AlertTitle>
            <AlertDescription>
              For security, reset links can only be used once and expire after a short time.
            </AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Link href="/forgot-password" className="font-medium text-primary hover:underline">
            Send a new reset email
          </Link>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md shadow-2xl">
      <CardHeader className="text-center">
        <CardTitle className="font-headline text-3xl text-primary">Choose a new password</CardTitle>
        <CardDescription>Enter a new password for your CupidMatch account.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {formError && (
          <Alert variant="destructive">
            <AlertTitle>Could not update password</AlertTitle>
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        )}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center"><Lock className="mr-2 h-4 w-4 text-muted-foreground" />New password</FormLabel>
                  <FormControl>
                    <Input type="password" autoComplete="new-password" placeholder="At least 8 characters" {...field} disabled={isLoading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center"><Lock className="mr-2 h-4 w-4 text-muted-foreground" />Confirm password</FormLabel>
                  <FormControl>
                    <Input type="password" autoComplete="new-password" placeholder="••••••••" {...field} disabled={isLoading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full min-h-11" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update password
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
