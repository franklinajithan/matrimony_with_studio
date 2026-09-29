import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { z } from "zod";

const verifyOtpSchema = z.object({
  phoneNumber: z.string().min(1, "Phone number is required"),
  code: z.string().length(6, "Verification code must be 6 digits"),
});

/**
 * Verify OTP code for phone number
 * POST /api/phone-verification/verify-otp
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "You must be logged in to verify a phone number" },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = verifyOtpSchema.safeParse(body);

    if (!validation.success) {
      const firstError = validation.error.errors[0];
      return NextResponse.json(
        { error: firstError?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const { phoneNumber, code } = validation.data;

    // Normalize to E.164 format
    const normalized = normalizePhoneE164(phoneNumber);
    if (!normalized) {
      return NextResponse.json(
        {
          error:
            "Invalid phone number format. Please include country code (e.g., +1234567890)",
        },
        { status: 400 }
      );
    }

    // Verify code using service role
    const adminClient = createServiceRoleClient();
    const { data: verificationResult, error: verifyError } = await adminClient.rpc(
      "verify_phone_code",
      {
        p_user_id: user.id,
        p_phone_number: normalized,
        p_code: code,
      }
    );

    if (verifyError) {
      console.error("Error verifying code:", verifyError);

      // Return user-friendly error messages
      const errorMessage = verifyError.message || "";

      if (errorMessage.includes("No valid verification code found")) {
        return NextResponse.json(
          {
            error:
              "Verification code expired or not found. Please request a new code.",
          },
          { status: 400 }
        );
      }

      if (errorMessage.includes("Too many failed attempts")) {
        return NextResponse.json(
          {
            error:
              "Too many incorrect attempts. Please request a new verification code.",
          },
          { status: 429 }
        );
      }

      if (errorMessage.includes("Incorrect verification code")) {
        // Extract remaining attempts if present
        const attemptsMatch = errorMessage.match(/(\d+) attempts remaining/);
        const remaining = attemptsMatch ? attemptsMatch[1] : "few";
        return NextResponse.json(
          {
            error: `Incorrect verification code. ${remaining} attempts remaining.`,
          },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: "Failed to verify code. Please try again." },
        { status: 400 }
      );
    }

    if (!verificationResult) {
      return NextResponse.json(
        { error: "Verification failed. Please try again." },
        { status: 400 }
      );
    }

    // Fetch updated profile to confirm verification
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, phone_number, phone_verified_at")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      console.error("Error fetching profile:", profileError);
      return NextResponse.json(
        { error: "Failed to fetch profile. Please refresh the page." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Phone number verified successfully",
      phoneNumber: profile.phone_number,
      verifiedAt: profile.phone_verified_at,
    });
  } catch (error) {
    console.error("Error in verify-otp:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}

/**
 * Normalize phone number to E.164 format
 */
function normalizePhoneE164(phone: string): string | null {
  if (!phone) return null;

  // Remove all non-digit characters except leading +
  let normalized = phone.replace(/[^\+0-9]/g, "");

  // Ensure it starts with +
  if (!normalized.startsWith("+")) {
    return null;
  }

  // Basic validation: should be between 8-15 digits after +
  if (normalized.length < 9 || normalized.length > 16) {
    return null;
  }

  return normalized;
}
