/**
 * Phone verification authorization tests
 * Tests RLS policies and security controls for phone verification
 */

import { describe, test, expect, beforeAll, afterAll } from "vitest";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Skip tests if Supabase is not configured
const shouldRun = Boolean(supabaseUrl && (supabaseAnonKey || supabaseServiceKey));

describe.skipIf(!shouldRun)("Phone Verification Authorization", () => {
  const anonClient = createClient(supabaseUrl, supabaseAnonKey);
  const serviceClient = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  let testUserId: string;
  let testUserEmail: string;

  beforeAll(async () => {
    // Create a test user for authorization tests
    testUserEmail = `test-phone-${Date.now()}@example.com`;
    const { data: authData, error: authError } = await serviceClient.auth.admin.createUser({
      email: testUserEmail,
      password: "TestPassword123!",
      email_confirm: true,
    });

    if (authError || !authData.user) {
      throw new Error(`Failed to create test user: ${authError?.message}`);
    }

    testUserId = authData.user.id;

    // Create profile for test user
    await serviceClient.from("profiles").insert({
      id: testUserId,
      email: testUserEmail,
      display_name: "Phone Test User",
    });
  });

  afterAll(async () => {
    // Cleanup test user
    if (testUserId) {
      await serviceClient.auth.admin.deleteUser(testUserId);
    }
  });

  describe("Phone Verification Codes Table", () => {
    test("anonymous users cannot read verification codes", async () => {
      const { data, error } = await anonClient
        .from("phone_verification_codes")
        .select("*")
        .limit(1);

      // Should be denied (either error or empty result due to RLS)
      expect(error || !data || data.length === 0).toBe(true);
    });

    test("authenticated users cannot read their own verification codes via RLS", async () => {
      // Sign in as test user
      const { data: authData, error: signInError } = await anonClient.auth.signInWithPassword({
        email: testUserEmail,
        password: "TestPassword123!",
      });

      expect(signInError).toBeNull();
      expect(authData.user).toBeTruthy();

      const authedClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: `Bearer ${authData.session?.access_token}` } },
      });

      const { data, error } = await authedClient
        .from("phone_verification_codes")
        .select("*")
        .eq("user_id", testUserId);

      // Should be denied due to RLS
      expect(error || !data || data.length === 0).toBe(true);

      await anonClient.auth.signOut();
    });

    test("authenticated users cannot insert verification codes directly", async () => {
      const { data: authData } = await anonClient.auth.signInWithPassword({
        email: testUserEmail,
        password: "TestPassword123!",
      });

      const authedClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: `Bearer ${authData.session?.access_token}` } },
      });

      const { error } = await authedClient.from("phone_verification_codes").insert({
        user_id: testUserId,
        phone_number: "+94712345678",
        code: "123456",
        expires_at: new Date(Date.now() + 600000).toISOString(),
      });

      // Should be denied
      expect(error).toBeTruthy();

      await anonClient.auth.signOut();
    });
  });

  describe("Profile Phone Fields Protection", () => {
    test("users cannot directly set phone_verified_at on their profile", async () => {
      const { data: authData } = await anonClient.auth.signInWithPassword({
        email: testUserEmail,
        password: "TestPassword123!",
      });

      const authedClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: `Bearer ${authData.session?.access_token}` } },
      });

      const { error } = await authedClient
        .from("profiles")
        .update({
          phone_number: "+94712345678",
          phone_verified_at: new Date().toISOString(),
        })
        .eq("id", testUserId);

      // Should be denied by trigger
      expect(error).toBeTruthy();
      expect(error?.message).toContain("phone verification");

      await anonClient.auth.signOut();
    });

    test("users can update phone_number but verification is cleared", async () => {
      // First, set verified phone as service role
      await serviceClient
        .from("profiles")
        .update({
          phone_number: "+94712345678",
          phone_verified_at: new Date().toISOString(),
        })
        .eq("id", testUserId);

      // Now sign in as user and try to change phone
      const { data: authData } = await anonClient.auth.signInWithPassword({
        email: testUserEmail,
        password: "TestPassword123!",
      });

      const authedClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: `Bearer ${authData.session?.access_token}` } },
      });

      const { error } = await authedClient
        .from("profiles")
        .update({ phone_number: "+94787654321" })
        .eq("id", testUserId);

      // Update should succeed but verification should be cleared
      expect(error).toBeNull();

      // Verify that phone_verified_at was cleared
      const { data: profile } = await authedClient
        .from("profiles")
        .select("phone_number, phone_verified_at")
        .eq("id", testUserId)
        .single();

      expect(profile?.phone_number).toBe("+94787654321");
      expect(profile?.phone_verified_at).toBeNull();

      await anonClient.auth.signOut();
    });

    test("phone numbers are not exposed in discovery_profiles view", async () => {
      // Set phone and publish profile
      await serviceClient
        .from("profiles")
        .update({
          phone_number: "+94712345678",
          phone_verified_at: new Date().toISOString(),
          is_published: true,
        })
        .eq("id", testUserId);

      // Query discovery_profiles
      const { data: discoveryProfile } = await anonClient
        .from("discovery_profiles")
        .select("*")
        .eq("id", testUserId)
        .single();

      // Phone should not be in discovery view
      expect(discoveryProfile).toBeTruthy();
      expect(discoveryProfile).not.toHaveProperty("phone_number");
      expect(discoveryProfile).not.toHaveProperty("phone_verified_at");
      expect(discoveryProfile).not.toHaveProperty("phone_verification_metadata");
    });
  });

  describe("Rate Limiting", () => {
    test("create_phone_verification_code enforces rate limiting", async () => {
      // Try to create 4 codes in quick succession (limit is 3 per 15 minutes)
      const testPhone = "+94712345678";
      const codes = ["111111", "222222", "333333", "444444"];

      for (let i = 0; i < codes.length; i++) {
        const { error } = await serviceClient.rpc("create_phone_verification_code", {
          p_user_id: testUserId,
          p_phone_number: testPhone,
          p_code: codes[i],
          p_ttl_seconds: 600,
        });

        if (i < 3) {
          // First 3 should succeed
          expect(error).toBeNull();
        } else {
          // 4th should be rate limited
          expect(error).toBeTruthy();
          expect(error?.message).toContain("Too many verification attempts");
        }
      }
    });
  });

  describe("Phone Number Uniqueness", () => {
    test("two users cannot have the same verified phone number", async () => {
      // Create second test user
      const secondEmail = `test-phone-2-${Date.now()}@example.com`;
      const { data: authData, error: authError } = await serviceClient.auth.admin.createUser({
        email: secondEmail,
        password: "TestPassword123!",
        email_confirm: true,
      });

      expect(authError).toBeNull();
      const secondUserId = authData!.user!.id;

      await serviceClient.from("profiles").insert({
        id: secondUserId,
        email: secondEmail,
        display_name: "Second Phone Test User",
      });

      // Set phone for first user
      const testPhone = "+94712345679";
      await serviceClient
        .from("profiles")
        .update({
          phone_number: testPhone,
          phone_verified_at: new Date().toISOString(),
        })
        .eq("id", testUserId);

      // Try to set same phone for second user
      const { error } = await serviceClient
        .from("profiles")
        .update({
          phone_number: testPhone,
          phone_verified_at: new Date().toISOString(),
        })
        .eq("id", secondUserId);

      // Should fail due to unique constraint
      expect(error).toBeTruthy();
      expect(error?.message).toContain("unique");

      // Cleanup
      await serviceClient.auth.admin.deleteUser(secondUserId);
    });
  });
});
