# Phone Verification Setup Guide

This document describes the phone verification system for CupidMatch and what needs to be configured for production use.

## Overview

The phone verification system provides:
- International phone number input with country code selection
- 6-digit OTP (One-Time Password) delivery via SMS
- Server-controlled verification state (users cannot mark themselves as verified)
- Rate limiting (3 attempts per 15 minutes)
- Phone numbers stored in E.164 format
- Phone numbers are private and never appear in discovery profiles
- Verification required when changing phone number

## Database Migration

Run the migration to add phone verification tables and functions:

```bash
# Migration file: supabase/migrations/20260929180000_phone_verification.sql
```

This migration adds:
- `phone_number`, `phone_verified_at`, and `phone_verification_metadata` columns to `profiles`
- `phone_verification_codes` table for OTP storage (service role access only)
- RLS policies to protect phone data
- Functions for OTP creation, verification, and rate limiting
- Unique constraint ensuring one verified phone per account

## Environment Variables

### Required for Development

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...  # Server-side only, NEVER expose to client
```

### Required for Production SMS Delivery

**IMPORTANT**: The current implementation logs OTPs to the server console in development mode. For production, you MUST configure an SMS provider.

#### Option 1: Twilio (Recommended)

1. Sign up for a Twilio account: https://www.twilio.com
2. Purchase a phone number capable of sending SMS
3. Get your Account SID and Auth Token from the Twilio console
4. Add to environment variables:

```bash
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1234567890
```

5. Uncomment and configure the Twilio integration in:
   - `src/app/api/phone-verification/send-otp/route.ts`

#### Option 2: AWS SNS

1. Create an AWS account and enable SNS
2. Create IAM credentials with SNS publish permissions
3. Add to environment variables:

```bash
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
```

4. Implement AWS SNS integration in `send-otp/route.ts`

#### Option 3: Other SMS Providers

Supported alternatives include:
- MessageBird
- Vonage (Nexmo)
- Plivo
- Sinch

Follow the provider's Node.js SDK documentation and integrate in `send-otp/route.ts`.

## Supabase Dashboard Configuration

### 1. Run the Migration

1. Go to Supabase Dashboard → SQL Editor
2. Run the migration: `supabase/migrations/20260929180000_phone_verification.sql`
3. Verify tables were created:
   - Check that `profiles` has new phone columns
   - Check that `phone_verification_codes` table exists
   - Check that `discovery_profiles` view excludes phone fields

### 2. Set Service Role Key

The service role key is needed for:
- Creating OTP codes (bypasses RLS)
- Verifying OTP codes and updating verified status

This key should ONLY be used server-side and NEVER exposed to the client.

### 3. (Optional) Configure Supabase Auth Phone Provider

Supabase has built-in phone authentication, but this implementation uses custom OTP to:
- Maintain backward compatibility with email-first registration
- Allow phone verification as optional onboarding step
- Provide more control over verification flow

If you prefer to use Supabase Auth's phone provider:
1. Go to Authentication → Providers → Phone
2. Configure Twilio integration in Supabase dashboard
3. Replace custom OTP implementation with `supabase.auth.signInWithOtp({ phone })`

## Testing

### Unit Tests

Run validation tests:
```bash
npm run test src/lib/phone-verification/validation.test.ts
```

### Authorization Tests

These tests require a configured Supabase instance:
```bash
npm run test src/lib/phone-verification/authorization.test.ts
```

Authorization tests verify:
- Phone data is protected by RLS
- Users cannot mark themselves as verified
- Phone numbers don't appear in discovery profiles
- Rate limiting is enforced
- Phone numbers are unique across verified accounts

### Manual Testing

1. **Development Mode** (OTP logged to console):
   ```bash
   npm run dev
   ```
   - Navigate to `/verify-phone`
   - Enter phone number with country code (e.g., +94 71 234 5678)
   - Check server console for OTP code
   - Enter the OTP to verify

2. **Production Mode** (requires SMS provider):
   - Configure SMS provider as described above
   - Deploy to staging environment
   - Test with real phone number
   - Verify SMS is received
   - Complete verification flow

## Security Considerations

1. **Service Role Key**: NEVER expose this in client code or commit to git
2. **Rate Limiting**: Enforced at database level (3 codes per 15 minutes per user)
3. **OTP Expiry**: Codes expire after 10 minutes
4. **Attempt Limiting**: Max 5 verification attempts per code
5. **Phone Privacy**: Phone numbers never appear in public discovery profiles
6. **Unique Phones**: One verified phone per account (prevents abuse)
7. **Re-verification**: Changing phone number clears verification status

## Integration Points

### Onboarding Flow

Phone verification can be integrated into onboarding in two ways:

1. **Optional Step After Email Verification** (Current):
   - User completes email registration
   - Redirected to `/verify-phone` with skip option
   - Can proceed to onboarding even if skipped

2. **Required Step in Onboarding Wizard** (Alternative):
   - Add phone verification as Step 1.5 or Step 8
   - Block profile publishing until verified
   - Modify `OnboardingWizard.tsx` to include phone verification

### Settings/Profile Page

Phone verification status is shown in:
- `/settings` - via `PhoneVerificationStatus` component
- Shows verification status badge
- Allows updating/verifying phone number

### Admin Dashboard

Admins can view (but not edit) phone verification status:
- Phone verified status is visible in admin member views
- Last 4 digits shown (full number hidden for privacy)
- Verification timestamp available

## API Endpoints

- `POST /api/phone-verification/send-otp` - Send OTP to phone number
- `POST /api/phone-verification/verify-otp` - Verify OTP code
- `GET /api/phone-verification/status` - Get current user's phone verification status

## Files Changed

### Database
- `supabase/migrations/20260929180000_phone_verification.sql` - Schema and functions

### API Routes
- `src/app/api/phone-verification/send-otp/route.ts` - Send OTP endpoint
- `src/app/api/phone-verification/verify-otp/route.ts` - Verify OTP endpoint
- `src/app/api/phone-verification/status/route.ts` - Status endpoint
- `src/lib/supabase/service-role.ts` - Service role client helper

### UI Components
- `src/components/phone-verification/PhoneNumberInput.tsx` - International phone input
- `src/components/phone-verification/OTPInput.tsx` - 6-digit OTP entry
- `src/components/phone-verification/PhoneVerificationFlow.tsx` - Complete flow
- `src/components/phone-verification/PhoneVerificationStatus.tsx` - Status card
- `src/app/verify-phone/page.tsx` - Standalone verification page
- `src/app/(main)/settings/page.tsx` - Added phone status to settings

### Tests
- `src/lib/phone-verification/validation.test.ts` - Validation tests (10 passing)
- `src/lib/phone-verification/authorization.test.ts` - RLS and security tests

## Production Checklist

Before deploying to production:

- [ ] Run database migration
- [ ] Configure SMS provider (Twilio, AWS SNS, etc.)
- [ ] Set `SUPABASE_SERVICE_ROLE_KEY` in environment (server-side only)
- [ ] Test phone verification with real phone number
- [ ] Verify OTP SMS is delivered
- [ ] Verify phone numbers don't appear in discovery profiles
- [ ] Test rate limiting (try 4 codes in 15 minutes)
- [ ] Test re-verification when changing phone number
- [ ] Monitor error logs for SMS delivery failures
- [ ] Set up SMS provider billing alerts
- [ ] Document SMS costs for business planning

## Known Limitations

1. **SMS Delivery Not Implemented**: 
   - Current implementation logs OTP to console in development
   - Production requires SMS provider integration (see above)

2. **International SMS Costs**:
   - SMS costs vary by country
   - Sri Lanka, India, UAE typically 0.02-0.10 USD per SMS
   - US/UK typically 0.01-0.05 USD per SMS
   - Budget accordingly based on user geography

3. **No Phone Number Portability**:
   - If a user changes their verified phone, old phone becomes available
   - Could be an issue if phone numbers are recycled by carriers

4. **One Phone Per Account**:
   - Unique constraint prevents same phone on multiple accounts
   - This is intentional to prevent fraud, but may cause issues if:
     - Users create multiple accounts accidentally
     - Family members share a phone number

## Future Enhancements

Potential improvements:
- [ ] SMS template customization (branding)
- [ ] Support for voice call OTP delivery
- [ ] Support for WhatsApp OTP delivery
- [ ] Phone verification badges in profiles
- [ ] Phone verification requirement based on membership plan
- [ ] Admin tools to manually verify/unverify phones
- [ ] Audit log for phone verification attempts
- [ ] Analytics dashboard for verification conversion rates

## Support

For issues or questions:
1. Check error logs in server console
2. Verify environment variables are set correctly
3. Check Supabase logs in dashboard
4. Review SMS provider delivery logs (if configured)
5. Run authorization tests to verify RLS policies
