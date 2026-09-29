"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle2, PhoneIcon, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { PhoneNumberInput } from "./PhoneNumberInput";
import { OTPInput } from "./OTPInput";
import { useToast } from "@/hooks/use-toast";

type VerificationStep = "phone" | "otp" | "success";

interface PhoneVerificationFlowProps {
  onSuccess?: () => void;
  onSkip?: () => void;
  allowSkip?: boolean;
  redirectOnSuccess?: string;
}

/**
 * Complete phone verification flow:
 * 1. Enter phone number
 * 2. Send OTP
 * 3. Verify OTP
 * 4. Success
 */
export function PhoneVerificationFlow({
  onSuccess,
  onSkip,
  allowSkip = false,
  redirectOnSuccess,
}: PhoneVerificationFlowProps) {
  const router = useRouter();
  const { toast } = useToast();

  const [step, setStep] = useState<VerificationStep>("phone");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Auto-submit when OTP is complete
  useEffect(() => {
    if (otp.length === 6 && step === "otp" && !loading) {
      handleVerifyOtp();
    }
  }, [otp, step, loading]);

  const handleSendOtp = async () => {
    if (!phoneNumber) {
      setError("Please enter your phone number");
      return;
    }

    if (!phoneNumber.startsWith("+")) {
      setError("Please include country code (e.g., +94 for Sri Lanka)");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/phone-verification/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send verification code");
      }

      setStep("otp");
      setResendCooldown(60); // 60 second cooldown
      toast({
        title: "Verification code sent",
        description: "Please check your phone for the 6-digit code",
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to send code";
      setError(message);
      toast({
        title: "Failed to send code",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = useCallback(async () => {
    if (otp.length !== 6) {
      setError("Please enter the complete 6-digit code");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/phone-verification/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber, code: otp }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to verify code");
      }

      setStep("success");
      toast({
        title: "Phone verified!",
        description: "Your phone number has been successfully verified",
      });

      // Redirect or call success callback after a brief delay
      setTimeout(() => {
        if (redirectOnSuccess) {
          router.push(redirectOnSuccess);
        } else if (onSuccess) {
          onSuccess();
        }
      }, 1500);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to verify code";
      setError(message);
      setOtp(""); // Clear OTP on error
      toast({
        title: "Verification failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [otp, phoneNumber, onSuccess, redirectOnSuccess, router, toast]);

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setOtp("");
    setError("");
    await handleSendOtp();
  };

  const handleChangePhone = () => {
    setStep("phone");
    setOtp("");
    setError("");
  };

  const handleSkip = () => {
    if (onSkip) {
      onSkip();
    } else if (redirectOnSuccess) {
      router.push(redirectOnSuccess);
    }
  };

  // Phone input step
  if (step === "phone") {
    return (
      <div className="w-full max-w-md mx-auto space-y-6">
        <div className="space-y-2 text-center">
          <div className="flex justify-center">
            <div className="rounded-full bg-primary/10 p-3">
              <PhoneIcon className="h-6 w-6 text-primary" />
            </div>
          </div>
          <h2 className="text-2xl font-semibold tracking-tight">
            Verify your phone number
          </h2>
          <p className="text-muted-foreground">
            We'll send you a verification code to confirm your phone number
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phone">Phone number</Label>
            <PhoneNumberInput
              id="phone"
              value={phoneNumber}
              onChange={setPhoneNumber}
              disabled={loading}
              error={error}
              placeholder="+94 71 234 5678"
            />
            <p className="text-sm text-muted-foreground">
              Your phone number will never be shown publicly
            </p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button
            onClick={handleSendOtp}
            disabled={!phoneNumber || loading}
            className="w-full h-11"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending code...
              </>
            ) : (
              <>
                Send verification code
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>

          {allowSkip && (
            <Button
              variant="ghost"
              onClick={handleSkip}
              disabled={loading}
              className="w-full"
            >
              Skip for now
            </Button>
          )}
        </div>
      </div>
    );
  }

  // OTP verification step
  if (step === "otp") {
    return (
      <div className="w-full max-w-md mx-auto space-y-6">
        <div className="space-y-2 text-center">
          <div className="flex justify-center">
            <div className="rounded-full bg-primary/10 p-3">
              <PhoneIcon className="h-6 w-6 text-primary" />
            </div>
          </div>
          <h2 className="text-2xl font-semibold tracking-tight">
            Enter verification code
          </h2>
          <p className="text-muted-foreground">
            We sent a 6-digit code to{" "}
            <span className="font-medium text-foreground">{phoneNumber}</span>
          </p>
        </div>

        <div className="space-y-4">
          <OTPInput
            value={otp}
            onChange={setOtp}
            disabled={loading}
            error={error}
          />

          {error && (
            <Alert variant="destructive">
              <AlertTitle>Verification failed</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col gap-3">
            <Button
              onClick={handleVerifyOtp}
              disabled={otp.length !== 6 || loading}
              className="w-full h-11"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Verify code"
              )}
            </Button>

            <div className="flex items-center justify-between text-sm">
              <Button
                variant="link"
                onClick={handleChangePhone}
                disabled={loading}
                className="p-0 h-auto"
              >
                Change phone number
              </Button>
              <Button
                variant="link"
                onClick={handleResend}
                disabled={loading || resendCooldown > 0}
                className="p-0 h-auto"
              >
                {resendCooldown > 0
                  ? `Resend in ${resendCooldown}s`
                  : "Resend code"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Success step
  if (step === "success") {
    return (
      <div className="w-full max-w-md mx-auto space-y-6">
        <div className="space-y-4 text-center">
          <div className="flex justify-center">
            <div className="rounded-full bg-green-100 p-3">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight">
              Phone verified!
            </h2>
            <p className="text-muted-foreground">
              Your phone number has been successfully verified
            </p>
          </div>
        </div>

        <Alert className="bg-green-50 border-green-200">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-900">All set!</AlertTitle>
          <AlertDescription className="text-green-700">
            You can now continue with your profile
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return null;
}
