import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { z } from "zod";

const sendOtpSchema = z.object({
  phoneNumber: z.string().min(1, "Phone number is required"),
});

/**
 * Send OTP to phone number for verification
 * POST /api/phone-verification/send-otp
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
    const validation = sendOtpSchema.safeParse(body);

    if (!validation.success) {
      const firstError = validation.error.errors[0];
      return NextResponse.json(
        { error: firstError?.message || "Invalid phone number" },
        { status: 400 }
      );
    }

    const { phoneNumber } = validation.data;

    // Normalize to E.164 format (basic validation)
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

    // Check if phone is already verified by another user
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id, phone_verified_at")
      .eq("phone_number", normalized)
      .not("phone_verified_at", "is", null)
      .single();

    if (existingProfile && existingProfile.id !== user.id) {
      return NextResponse.json(
        {
          error:
            "This phone number is already verified by another account. Please use a different number or contact support.",
        },
        { status: 409 }
      );
    }

    // Generate 6-digit OTP
    const otp = generateOTP();

    // Store OTP using service role (bypasses RLS)
    const adminClient = createServiceRoleClient();
    const { data: codeId, error: createError } = await adminClient.rpc(
      "create_phone_verification_code",
      {
        p_user_id: user.id,
        p_phone_number: normalized,
        p_code: otp,
        p_ttl_seconds: 600, // 10 minutes
      }
    );

    if (createError) {
      console.error("Error creating verification code:", createError);
      
      // Check for rate limiting error
      if (createError.message?.includes("Too many verification attempts")) {
        return NextResponse.json(
          {
            error:
              "Too many verification attempts. Please wait 15 minutes before trying again.",
          },
          { status: 429 }
        );
      }

      return NextResponse.json(
        { error: "Failed to create verification code. Please try again." },
        { status: 500 }
      );
    }

    // Send OTP via SMS
    const smsResult = await sendSMS(normalized, otp);

    if (!smsResult.success) {
      console.error("Failed to send SMS:", smsResult.error);
      return NextResponse.json(
        {
          error:
            "Failed to send verification code. Please check the phone number and try again.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Verification code sent successfully",
      expiresIn: 600,
      phoneNumber: normalized,
    });
  } catch (error) {
    console.error("Error in send-otp:", error);
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
    return null; // Invalid E.164 format
  }

  // Basic validation: should be between 8-15 digits after +
  if (normalized.length < 9 || normalized.length > 16) {
    return null;
  }

  return normalized;
}

/**
 * Generate 6-digit OTP
 */
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Send SMS with OTP code
 * 
 * PRODUCTION NOTE: This is a stub implementation that logs to console.
 * Replace with actual SMS provider (Twilio, AWS SNS, etc.) before production use.
 */
async function sendSMS(
  phoneNumber: string,
  code: string
): Promise<{ success: boolean; error?: string }> {
  const isDevelopment = process.env.NODE_ENV === "development";

  // In development, just log the OTP
  if (isDevelopment) {
    console.log("\n" + "=".repeat(60));
    console.log("📱 PHONE VERIFICATION OTP (DEVELOPMENT MODE)");
    console.log("=".repeat(60));
    console.log(`Phone: ${phoneNumber}`);
    console.log(`Code:  ${code}`);
    console.log(`Time:  ${new Date().toISOString()}`);
    console.log("=".repeat(60) + "\n");
    return { success: true };
  }

  // PRODUCTION: Integrate with SMS provider
  // 
  // Example Twilio integration:
  // const accountSid = process.env.TWILIO_ACCOUNT_SID;
  // const authToken = process.env.TWILIO_AUTH_TOKEN;
  // const fromNumber = process.env.TWILIO_PHONE_NUMBER;
  //
  // if (!accountSid || !authToken || !fromNumber) {
  //   return { success: false, error: "SMS provider not configured" };
  // }
  //
  // try {
  //   const client = require('twilio')(accountSid, authToken);
  //   await client.messages.create({
  //     body: `Your CupidMatch verification code is: ${code}. Valid for 10 minutes.`,
  //     from: fromNumber,
  //     to: phoneNumber
  //   });
  //   return { success: true };
  // } catch (error) {
  //   return { success: false, error: error.message };
  // }

  console.warn(
    "⚠️  SMS PROVIDER NOT CONFIGURED - OTP will be logged to server console"
  );
  console.log(`OTP for ${phoneNumber}: ${code}`);

  // For testing in non-dev environments without SMS configured
  return { success: true };
}
