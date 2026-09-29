import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Get phone verification status for current user
 * GET /api/phone-verification/status
 */
export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "You must be logged in to view phone status" },
        { status: 401 }
      );
    }

    // Fetch phone status from profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("phone_number, phone_verified_at")
      .eq("id", user.id)
      .single();

    if (profileError) {
      console.error("Error fetching phone status:", profileError);
      return NextResponse.json(
        { error: "Failed to fetch phone status" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      phoneNumber: profile.phone_number,
      phoneVerifiedAt: profile.phone_verified_at,
    });
  } catch (error) {
    console.error("Error in phone status:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
