"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Mail, Loader2, CheckCircle2 } from "lucide-react";
import React, { Suspense, useEffect, useMemo, useState } from "react";
import { resendSignupConfirmation } from "@/lib/supabase/auth";
import { useToast } from "@/hooks/use-toast";

const RESEND_COOLDOWN_SECONDS = 60;

function CheckEmailContent() {
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [isSending, setIsSending] = useState(false);
  const [resent, setResent] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");
  const email = useMemo(() => searchParams.get("email") || "", [searchParams]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setInterval(() => {
      setCooldown((value) => Math.max(0, value - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [cooldown]);

  async function handleResend() {
    if (!email || isSending || cooldown > 0) return;
    setIsSending(true);
    setStatusMessage("");
    try {
      await resendSignupConfirmation(email);
      setResent(true);
      setCooldown(RESEND_COOLDOWN_SECONDS);
      setStatusMessage("A new confirmation link was requested. Check your inbox and spam folder.");
      toast({ title: "Confirmation requested", description: "Check your inbox for the newest confirmation email." });
    } catch (error) {
      const rawMessage = error instanceof Error ? error.message : "Could not resend the email.";
      const rateLimited = /rate|too many|seconds|429/i.test(rawMessage);
      const message = rateLimited
        ? "Please wait before requesting another email. Supabase limits how often confirmation emails can be sent."
        : rawMessage;
      if (rateLimited) setCooldown(RESEND_COOLDOWN_SECONDS);
      setStatusMessage(message);
      toast({ title: "Could not resend", description: message, variant: "destructive" });
    } finally {
      setIsSending(false);
    }
  }

  const buttonLabel = isSending
    ? "Requesting new link..."
    : cooldown > 0
      ? `Resend available in ${cooldown}s`
      : resent
        ? "Resend confirmation email"
        : "Resend confirmation email";

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
            Your profile stays private until you confirm this address. Use the newest email if you request another link.
          </AlertDescription>
        </Alert>

        {statusMessage ? (
          <div
            role="status"
            aria-live="polite"
            className="flex items-start gap-2 rounded-md border bg-muted/40 px-3 py-3 text-sm text-foreground"
          >
            {resent && cooldown > 0 ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> : null}
            <span>{statusMessage}</span>
          </div>
        ) : null}

        <Button
          className="w-full min-h-11"
          variant="outline"
          onClick={handleResend}
          disabled={isSending || !email || cooldown > 0}
          aria-describedby={statusMessage ? "resend-help" : undefined}
        >
          {isSending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {buttonLabel}
        </Button>
        <p id="resend-help" className="text-center text-xs text-muted-foreground">
          Confirmation emails are rate-limited. If you resend, wait at least a minute and use only the newest link.
        </p>
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
