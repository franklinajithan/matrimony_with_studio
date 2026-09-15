# Seeding Test Profiles

This guide explains how to populate the CupidMatch database with realistic test profiles for development and testing.

## Overview

The seed script creates **10 diverse test profiles** with:
- ✅ Professional profile photos
- ✅ Realistic biographical information
- ✅ Diverse locations (Sri Lanka, UK, Canada, Australia, Singapore, Dubai)
- ✅ Various professions and backgrounds
- ✅ Different languages (English, Tamil, Sinhala)
- ✅ All profiles published and discoverable

## Test Profiles

### Male Profiles (5)
1. **Rajesh Kumar** - Software Engineer, Colombo, Sri Lanka
2. **Arun Patel** - Marketing Manager, London, UK
3. **Dinesh Fernando** - Medical Doctor, Toronto, Canada
4. **Karthik Reddy** - Finance Analyst, Melbourne, Australia
5. **Vikram Silva** - Business Owner, Kandy, Sri Lanka

### Female Profiles (5)
6. **Priya Jayawardena** - School Teacher, Jaffna, Sri Lanka
7. **Anjali Perera** - Cybersecurity Specialist, Sydney, Australia
8. **Nithya Rajan** - Architect, Dubai, UAE
9. **Kavya Mendis** - Healthcare Administrator, Galle, Sri Lanka
10. **Roshini Kumar** - Data Scientist, Singapore

## Running the Seed Script

### Prerequisites

1. **Environment variables** configured in `.env.local`:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   # Optional: For full admin access
   SUPABASE_SERVICE_ROLE_KEY=your_service_key
   ```

2. **tsx** is already installed as a dev dependency

### Method 1: Using npm script (Recommended)

```bash
npm run seed
```

### Method 2: Direct execution

```bash
npx tsx scripts/seed-test-profiles.ts
```

### Method 3: Using SQL migration

If you prefer SQL, run the migration file:

```bash
# Using Supabase CLI
supabase db reset --linked

# Or execute the SQL directly in Supabase Studio
# Copy content from: supabase/migrations/20260915_seed_test_profiles.sql
```

## Verification

After seeding, verify the profiles:

1. **Check the Discovery page**: 
   - Navigate to `/discover`
   - You should see all 10 profiles

2. **Test filtering**:
   - Filter by country: "Sri Lanka" should show 5 profiles
   - Filter by language: "Tamil" should show 8 profiles
   - Search for "Doctor" or "Engineer"

3. **Test interactions**:
   - Send interests to profiles
   - Shortlist profiles
   - View profile details

## Database Access

The test profile IDs follow this pattern:
```
01a0a652-f929-76ac-bbce-9b3f2c188d5a  (Rajesh Kumar)
01a0a652-f947-73e7-8499-271e3c1e84d8  (Arun Patel)
... etc
```

You can query them directly:
```sql
SELECT display_name, profession, location, is_published 
FROM profiles 
WHERE email LIKE '%test@cupidmatch.com';
```

## Profile Images

All profile images are stored in `/public/profiles/` and are automatically served by Next.js.

Image files:
- Format: JPG
- Size: ~350-430 KB each
- Dimensions: Optimized for profile display
- Total: 10 images

## Resetting Test Data

To remove all test profiles:

```sql
DELETE FROM profiles WHERE email LIKE '%test@cupidmatch.com';
```

Or to reset just one profile:

```sql
DELETE FROM profiles WHERE id = '01a0a652-f929-76ac-bbce-9b3f2c188d5a';
```

## Customizing Test Data

To add more profiles or modify existing ones:

1. Edit `scripts/seed-test-profiles.ts`
2. Add profile images to `/public/profiles/`
3. Run `npm run seed`

## Troubleshooting

### Error: "Missing Supabase credentials"
- Ensure `.env.local` exists with correct Supabase URL and keys
- Restart your development server after adding env vars

### Error: "duplicate key value violates unique constraint"
- Profiles already exist. Either:
  - Delete existing test profiles (see Resetting Test Data above)
  - Or the upsert will update them automatically

### Profiles not showing in Discovery
- Check if profiles are published: `is_published = true`
- Verify RLS policies allow reading published profiles
- Check the discovery_profiles view exists

### Images not loading
- Ensure images are in `/public/profiles/`
- Check Next.js is serving static files correctly
- Verify photo_url paths start with `/profiles/`

## Production Warning

⚠️ **Never run seed scripts on production databases!**

These profiles are for development and testing only. They use:
- Test email addresses (`@cupidmatch.com`)
- Fictional biographical data
- Stock photography

For production, users should create their own authentic profiles through the onboarding flow.
