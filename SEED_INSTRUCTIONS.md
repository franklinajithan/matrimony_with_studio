# 🌱 How to Seed Test Profiles

Your test profile images and seed script are now deployed! Follow these steps to populate your database with 10 realistic test profiles.

## ✅ What You Get

After seeding, you'll have **10 published profiles** ready for testing:

### Male Profiles (5)
1. **Rajesh Kumar** - Software Engineer, 34, Colombo, Sri Lanka 🇱🇰
2. **Arun Patel** - Marketing Manager, 36, London, UK 🇬🇧
3. **Dinesh Fernando** - Medical Doctor, 38, Toronto, Canada 🇨🇦
4. **Karthik Reddy** - Finance Analyst, 33, Melbourne, Australia 🇦🇺
5. **Vikram Silva** - Business Owner, 35, Kandy, Sri Lanka 🇱🇰

### Female Profiles (6)
6. **Priya Jayawardena** - School Teacher, 32, Jaffna, Sri Lanka 🇱🇰
7. **Anjali Perera** - Cybersecurity Specialist, 34, Sydney, Australia 🇦🇺
8. **Nithya Rajan** - Architect, 35, Dubai, UAE 🇦🇪
9. **Kavya Mendis** - Healthcare Administrator, 33, Galle, Sri Lanka 🇱🇰
10. **Roshini Kumar** - Data Scientist, 36, Singapore 🇸🇬

---

## 📋 Prerequisites

You need your Supabase credentials. Get them from your [Supabase Dashboard](https://supabase.com/dashboard):

1. Go to **Project Settings** → **API**
2. Copy these values:
   - **Project URL**
   - **anon/public key** (for read access)
   - **service_role key** (for full admin access - **recommended**)

---

## 🚀 Method 1: Run the Seed Script (Recommended)

### Step 1: Set Environment Variables

Create or update `.env.local` in your project root:

```bash
# Required
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Recommended for full access (allows upserts)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

### Step 2: Run the Seed Script

```bash
cd /workspace
npm run seed
```

You should see output like:

```
🌱 Starting profile seeding...
📝 Seeding 10 profiles

✅ Seeded: Rajesh Kumar (Software Engineer)
✅ Seeded: Arun Patel (Marketing Manager)
✅ Seeded: Dinesh Fernando (Medical Doctor)
✅ Seeded: Karthik Reddy (Finance Analyst)
✅ Seeded: Vikram Silva (Business Owner)
✅ Seeded: Priya Jayawardena (School Teacher)
✅ Seeded: Anjali Perera (Cybersecurity Specialist)
✅ Seeded: Nithya Rajan (Architect)
✅ Seeded: Kavya Mendis (Healthcare Administrator)
✅ Seeded: Roshini Kumar (Data Scientist)

✨ Profile seeding completed!
📊 You can now test the app with 10 diverse profiles
```

---

## 🔧 Method 2: Run SQL Directly (Alternative)

If you prefer SQL, run this in your Supabase SQL Editor:

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Click **New Query**
3. Copy the contents of `supabase/migrations/20260915_seed_test_profiles.sql`
4. Click **Run**

---

## ✅ Verify the Profiles

### Check in Supabase Dashboard

1. Go to **Table Editor** → **profiles**
2. You should see 10 profiles with emails like `*@cupidmatch.com`
3. All should have `is_published = true`

### Check in Your App

1. **Discovery Page**: Navigate to `/discover`
   - Should show all 10 profiles
   
2. **Filter Tests**:
   - Country "Sri Lanka" → 5 profiles
   - Language "Tamil" → 8 profiles
   - Search "Engineer" → Rajesh Kumar

3. **Test Interactions**:
   - Send interest to any profile
   - Shortlist profiles
   - View profile details

---

## 🎯 What You Can Now Test

### ✅ Discovery Features
- Browse all profiles
- Search by name, profession, location
- Filter by country, language
- See "shared priorities" (shared languages, locations, settlement preferences)
- Profile cards with photos

### ✅ Interest System
- Send interests to profiles
- View sent interests (Interests → Sent tab)
- Accept/decline received interests
- Withdraw sent interests
- Interest status tracking

### ✅ Shortlist
- Add profiles to shortlist
- Remove from shortlist
- View shortlisted profiles
- Shortlist count on dashboard

### ✅ Profile Details
- View full profile information
- See profile photos
- Read bios and preferences
- View shared interests/values

### ✅ Connections
- Accept interests creates connections
- View connection list
- Remove connections
- Connection count on dashboard

---

## 🔄 Resetting Test Data

To remove all test profiles and start over:

### Using SQL
```sql
DELETE FROM profiles WHERE email LIKE '%test@cupidmatch.com';
```

### Or Delete Individual Profiles
```sql
DELETE FROM profiles WHERE id = '01a0a652-f929-76ac-bbce-9b3f2c188d5a';
```

Then run the seed script again: `npm run seed`

---

## 🐛 Troubleshooting

### "Missing Supabase credentials"
**Problem**: Environment variables not set

**Solution**:
1. Ensure `.env.local` exists with correct values
2. Restart your terminal/dev server
3. Run `npm run seed` again

### "duplicate key value violates unique constraint"
**Problem**: Profiles already exist

**Solution**:
- The script uses `upsert`, so it should update existing profiles
- Or delete existing test profiles first (see Resetting section)

### Profiles not showing in Discovery
**Problem**: Profiles not published or RLS policies blocking

**Solution**:
1. Check if profiles have `is_published = true`
2. Verify your Supabase RLS policies allow reading published profiles
3. Check the `discovery_profiles` view exists

### Images not loading (404 errors)
**Problem**: Images not deployed or incorrect paths

**Solution**:
1. Images are in `/public/profiles/` and deployed ✅
2. Wait a few minutes for Vercel CDN to update
3. Clear your browser cache
4. Check Network tab in DevTools for actual path being requested

---

## 📝 Profile Image Paths

All profile photos are served from:
```
https://matrimony-with-studio.vercel.app/profiles/[profile-id].jpg
```

Examples:
- `https://matrimony-with-studio.vercel.app/profiles/01a0a652-f929-76ac-bbce-9b3f2c188d5a.jpg`
- `https://matrimony-with-studio.vercel.app/profiles/01a0a652-f947-73e7-8499-271e3c1e84d8.jpg`

---

## ⚠️ Important Notes

- **Development/Testing Only**: These profiles use test emails and fictional data
- **Do NOT use on production databases**: Intended for local/staging environments only
- **Stock Photos**: Profile images are stock photography, not real users
- **RLS Policies**: Ensure your Supabase RLS policies allow reading published profiles

---

## 📚 Full Documentation

For complete details, see:
- [docs/seeding-test-data.md](docs/seeding-test-data.md)

---

## 🎉 Ready to Test!

After seeding, you have a fully functional test environment with:
- ✅ 10 diverse, realistic profiles
- ✅ Professional photos
- ✅ Various locations and backgrounds
- ✅ All features unlocked for testing

Visit [https://matrimony-with-studio.vercel.app/discover](https://matrimony-with-studio.vercel.app/discover) to see your test profiles!

---

## 📞 Need Help?

If you encounter issues:
1. Check the troubleshooting section above
2. Review [docs/seeding-test-data.md](docs/seeding-test-data.md)
3. Verify your Supabase credentials are correct
4. Ensure RLS policies allow profile reads
