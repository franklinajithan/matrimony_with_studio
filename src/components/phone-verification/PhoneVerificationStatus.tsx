"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, XCircle, Phone, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { createSupabaseServerClient } from "@/lib/supabase/server";

interface PhoneVerificationStatusProps {
  userId?: string;
}

interface PhoneStatus {
  hasPhone: boolean;
  isVerified: boolean;
  phoneNumber?: string;
  verifiedAt?: string;
  lastFourDigits?: string;
}

/**
 * Component showing phone verification status in profile/settings
 * Allows users to add/update phone number
 */
export function PhoneVerificationStatus({ userId }: PhoneVerificationStatusProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<PhoneStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPhoneStatus();
  }, [userId]);

  const loadPhoneStatus = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/phone-verification/status");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load phone status");
      }

      setStatus({
        hasPhone: Boolean(data.phoneNumber),
        isVerified: Boolean(data.phoneVerifiedAt),
        phoneNumber: data.phoneNumber,
        verifiedAt: data.phoneVerifiedAt,
        lastFourDigits: data.phoneNumber?.slice(-4),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load status";
      setError(message);
      console.error("Error loading phone status:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPhone = () => {
    router.push("/verify-phone");
  };

  const handleUpdatePhone = () => {
    router.push("/verify-phone");
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Phone Verification
          </CardTitle>
          <CardDescription>Verify your phone number for account security</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Phone Verification
          </CardTitle>
          <CardDescription>Verify your phone number for account security</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Phone className="h-5 w-5" />
          Phone Verification
        </CardTitle>
        <CardDescription>
          Your phone number is private and never shown publicly
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!status?.hasPhone ? (
          <div className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No phone number added yet. Verify your phone for enhanced account
                security and quick recovery.
              </AlertDescription>
            </Alert>
            <Button onClick={handleVerifyPhone} className="w-full">
              <Phone className="mr-2 h-4 w-4" />
              Add & Verify Phone Number
            </Button>
          </div>
        ) : status.isVerified ? (
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <span className="font-medium">Phone Verified</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Ending in •••• {status.lastFourDigits}
                </p>
                {status.verifiedAt && (
                  <p className="text-xs text-muted-foreground">
                    Verified on {new Date(status.verifiedAt).toLocaleDateString()}
                  </p>
                )}
              </div>
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                Verified
              </Badge>
            </div>
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700">
                Your account is protected with phone verification
              </AlertDescription>
            </Alert>
            <Button
              variant="outline"
              onClick={handleUpdatePhone}
              className="w-full"
            >
              Update Phone Number
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-amber-600" />
                  <span className="font-medium">Phone Not Verified</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Ending in •••• {status.lastFourDigits}
                </p>
              </div>
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                Unverified
              </Badge>
            </div>
            <Alert className="bg-amber-50 border-amber-200">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-700">
                Please verify your phone number to enhance account security
              </AlertDescription>
            </Alert>
            <Button onClick={handleVerifyPhone} className="w-full">
              <Phone className="mr-2 h-4 w-4" />
              Verify Phone Number
            </Button>
          </div>
        )}

        <div className="pt-4 border-t">
          <p className="text-xs text-muted-foreground text-center">
            Phone verification helps protect your account and prevents fake profiles
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
