/** Safe to serialize to Super Admin: return names and booleans, never environment values. */
export function integrationReadiness(env: Record<string, string | undefined>) {
  const present = (name: string) => !!env[name]?.trim();
  const definitions = [
    { name: "Account erasure", flag: "ACCOUNT_DELETION_ENABLED", requirements: ["SUPABASE_SERVICE_ROLE_KEY", "CRON_SECRET", "RETENTION_POLICY_APPROVED"], tests: "Approved retention, storage/provider cleanup, retry recovery and dedicated-account erasure acceptance" },
    {
      name: "Private media and archives",
      flag: null,
      requirements: ["SUPABASE_SERVICE_ROLE_KEY"],
      tests: "Storage upload/download, ownership, privacy and account archive",
    },
    {
      name: "Stripe billing (test mode)",
      flag: "BILLING_ENABLED",
      requirements: [
        "SUPABASE_SERVICE_ROLE_KEY",
        "STRIPE_SECRET_KEY",
        "STRIPE_WEBHOOK_SECRET",
        "PROVIDER_TEST_MEMBER_IDS",
        "STRIPE_PRICE_PREMIUM_MONTHLY",
        "STRIPE_PRICE_PREMIUM_3_MONTHS",
        "STRIPE_PRICE_PREMIUM_6_MONTHS",
        "STRIPE_PRICE_PREMIUM_PLUS_MONTHLY",
        "STRIPE_PRICE_PREMIUM_PLUS_3_MONTHS",
        "STRIPE_PRICE_PREMIUM_PLUS_6_MONTHS",
      ],
      tests:
        "Sandbox checkout, subscription failure/expiry, portal, cancellation and refund",
    },
    {
      name: "Government-ID verification (test mode)",
      flag: "IDENTITY_ENABLED",
      requirements: [
        "SUPABASE_SERVICE_ROLE_KEY",
        "STRIPE_SECRET_KEY",
        "STRIPE_IDENTITY_WEBHOOK_SECRET",
        "PROVIDER_TEST_MEMBER_IDS",
      ],
      tests:
        "Hosted sandbox submission, rejection/retry and signed webhook; no live badge for test evidence",
    },
    {
      name: "SMS verification",
      flag: "SMS_ENABLED",
      requirements: [],
      tests:
        "Supabase phone/provider setup, actual OTP delivery, expiry and retry limits",
    },
    {
      name: "Voice and video calls",
      flag: "CALLING_ENABLED",
      requirements: ["TURN_URL", "TURN_AUTH_SECRET"],
      tests:
        "Private database calling flag and two-device/network permission/block tests",
    },
    {
      name: "Optional email notifications",
      flag: "EMAIL_NOTIFICATIONS_ENABLED",
      requirements: [
        "SUPABASE_SERVICE_ROLE_KEY",
        "RESEND_API_KEY",
        "RESEND_WEBHOOK_SECRET",
        "EMAIL_FROM",
        "CRON_SECRET",
        "EMAIL_TEST_RECIPIENTS",
      ],
      tests:
        "Verified sender, authorised recipients, delivery/retries and worker schedule",
    },
  ];
  return definitions.map((item) => {
    const missing = item.requirements.filter((name) => !present(name)),
      invalid: string[] = [];
    if (item.flag === "ACCOUNT_DELETION_ENABLED" && env.RETENTION_POLICY_APPROVED !== "true") invalid.push("RETENTION_POLICY_APPROVED must be true after operator review");
    if (
      item.requirements.includes("STRIPE_SECRET_KEY") &&
      present("STRIPE_SECRET_KEY") &&
      !/^([sr]k)_test_/.test(env.STRIPE_SECRET_KEY || "")
    )
      invalid.push("STRIPE_SECRET_KEY must be a test key");
    if (
      item.requirements.includes("PROVIDER_TEST_MEMBER_IDS") &&
      present("PROVIDER_TEST_MEMBER_IDS") &&
      !(env.PROVIDER_TEST_MEMBER_IDS || "")
        .split(",")
        .some((value) =>
          /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
            value.trim(),
          ),
        )
    )
      invalid.push(
        "PROVIDER_TEST_MEMBER_IDS must contain dedicated test-account UUIDs",
      );
    if (
      item.requirements.includes("TURN_AUTH_SECRET") &&
      present("TURN_AUTH_SECRET") &&
      (env.TURN_AUTH_SECRET?.length || 0) < 32
    )
      invalid.push("TURN_AUTH_SECRET needs at least 32 characters");
    return {
      name: item.name,
      enabled: item.flag === null || env[item.flag] === "true",
      configured: missing.length === 0 && invalid.length === 0,
      missing,
      invalid,
      acceptanceRequired: item.tests,
    };
  });
}
