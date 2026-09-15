"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Mail, Loader2 } from "lucide-react";
import React, { Suspense, useMemo, useState } from "react";
import { resendSignupConfirmation } from "@/lib/supabase/auth";
import { useToast } from "@/hooks/use-toast";

function CheckEmailContent() {
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [isSending, setIsSending] = useState(false);
  const [resent, setResent] = useState(false);
  const email = useMemo(() => searchParams.get("email") || "", [searchParams]);

  async function handleResend() {
    if (!email) return;
    setIsSending(true);
    try {
      await resendSignupConfirmation(email);
      setResent(true);
      toast({ title: "Email sent", description: "Check your inbox for a new confirmation link." });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not resend the email.";
      toast({ title: "Could not resend", description: message, variant: "destructive" });
    } finally {
      setIsSending(false);
    }
  }

  return (
    <Card className="w-full max-w-md shadow-2xl">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Mail className="h-6 w-6" />
        </div>
        <CardTitle className="font-headline text-3xl text-primary">Confirm your email</CardTitle>
        <CardDescription>
          We sent a confirmation link{email ? ` to ${email}` : ""}. Open it to activate your account and continue onboarding.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertTitle>Email confirmation is required</AlertTitle>
          <AlertDescription>
            Your profile stays private until you confirm this address. The link expires, so request a new one if it no longer works.
          </AlertDescription>
        </Alert>
        <Button className="w-full min-h-11" variant="outline" onClick={handleResend} disabled={isSending || !email}>
          {isSending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {resent ? "Send another link" : "Resend confirmation email"}
        </Button>
      </CardContent>
      <CardFooter className="flex flex-col items-center gap-2">
        <Link href="/login" className="text-sm font-medium text-primary hover:underline">
          I have confirmed — log in
        </Link>
        <Link href="/signup" className="text-sm text-muted-foreground hover:text-primary">
          Use a different email
        </Link>
      </CardFooter>
    </Card>
  );
}

export default function CheckEmailPage() {
  return (
    <Suspense fallback={<div className="text-muted-foreground">Loading...</div>}>
      <CheckEmailContent />
    </Suspense>
  );
}
