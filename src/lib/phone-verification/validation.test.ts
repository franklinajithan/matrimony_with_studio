/**
 * Phone verification validation tests
 */

import { describe, test, expect } from "vitest";

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

describe("Phone Number Validation", () => {
  describe("normalizePhoneE164", () => {
    test("should normalize valid E.164 phone numbers", () => {
      expect(normalizePhoneE164("+94712345678")).toBe("+94712345678");
      expect(normalizePhoneE164("+1 (555) 123-4567")).toBe("+15551234567");
      expect(normalizePhoneE164("+44 20 7123 4567")).toBe("+442071234567");
      expect(normalizePhoneE164("+91 98765 43210")).toBe("+919876543210");
    });

    test("should reject phone numbers without country code", () => {
      expect(normalizePhoneE164("0712345678")).toBeNull();
      expect(normalizePhoneE164("712345678")).toBeNull();
      expect(normalizePhoneE164("5551234567")).toBeNull();
    });

    test("should reject invalid formats", () => {
      expect(normalizePhoneE164("")).toBeNull();
      expect(normalizePhoneE164("+")).toBeNull();
      expect(normalizePhoneE164("+1")).toBeNull(); // Too short
      expect(normalizePhoneE164("+123")).toBeNull(); // Too short
      expect(normalizePhoneE164("+12345678901234567")).toBeNull(); // Too long
    });

    test("should handle various formatting styles", () => {
      expect(normalizePhoneE164("+94 71 234 5678")).toBe("+94712345678");
      expect(normalizePhoneE164("+94-71-234-5678")).toBe("+94712345678");
      expect(normalizePhoneE164("+94.71.234.5678")).toBe("+94712345678");
      expect(normalizePhoneE164("+94 (71) 234-5678")).toBe("+94712345678");
    });

    test("should preserve valid E.164 numbers unchanged", () => {
      const validNumbers = [
        "+94712345678",
        "+15551234567",
        "+442071234567",
        "+919876543210",
      ];

      validNumbers.forEach((number) => {
        expect(normalizePhoneE164(number)).toBe(number);
      });
    });

    test("should handle edge cases", () => {
      expect(normalizePhoneE164("+94 71 234 5678  ")).toBe("+94712345678"); // Trailing spaces
      expect(normalizePhoneE164("  +94712345678")).toBe("+94712345678"); // Leading spaces
      expect(normalizePhoneE164("+94 (0) 71 234 5678")).toBe("+940712345678"); // With trunk prefix
    });

    test("should validate length constraints", () => {
      // Minimum valid length (9 chars including +)
      expect(normalizePhoneE164("+1234567")).toBeNull(); // 8 chars - too short
      expect(normalizePhoneE164("+12345678")).toBe("+12345678"); // 9 chars - valid

      // Maximum valid length (16 chars including +)
      expect(normalizePhoneE164("+123456789012345")).toBe("+123456789012345"); // 16 chars - valid
      expect(normalizePhoneE164("+1234567890123456")).toBeNull(); // 17 chars - too long
    });
  });
});

describe("OTP Generation", () => {
  function generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  test("should generate 6-digit OTP", () => {
    const otp = generateOTP();
    expect(otp).toHaveLength(6);
    expect(/^\d{6}$/.test(otp)).toBe(true);
  });

  test("should generate unique OTPs", () => {
    const otps = new Set<string>();
    for (let i = 0; i < 100; i++) {
      otps.add(generateOTP());
    }
    // Should have generated mostly unique codes (allow some collisions due to randomness)
    expect(otps.size).toBeGreaterThan(90);
  });

  test("should generate OTPs within valid range", () => {
    for (let i = 0; i < 50; i++) {
      const otp = generateOTP();
      const numericOtp = parseInt(otp, 10);
      expect(numericOtp).toBeGreaterThanOrEqual(100000);
      expect(numericOtp).toBeLessThanOrEqual(999999);
    }
  });
});
