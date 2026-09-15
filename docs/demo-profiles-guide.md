# Demo Profiles for CupidMatch Discovery Testing

This guide explains the isolated demo profile system for testing CupidMatch Discovery features.

## Overview

**10 fictional demo profiles** with AI-generated portraits:
- **5 male profiles** (Arjun, Rohan, Dinesh, Kavi, Sanjay)
- **5 female profiles** (Priya, Anjali, Nithya, Kavya, Roshini)

All profiles are clearly labeled: **"Demo profile · AI-generated image"**

---

## Key Features

### ✅ Data Isolation
- Unique demo IDs (`demo-0000-0000-000X-XXXXXXXXXXXX`)
- Separate email domain (`@cupidmatch-demo.example`)
- No interaction with real production members
- Clean separation for testing

### ✅ Realistic Diversity
- **Ages**: 27-36 years
- **Locations**: London, Toronto, Melbourne, Sydney, Colombo
- **Professions**: Software Engineer, Marketing Manager, Doctor, Financial Analyst, Business Owner, Teacher, Data Analyst, Architect, Healthcare Admin, IT Security
- **Languages**: English, Tamil, Sinhala (various combinations)
- **Relocation preferences**: Some open, some not
- **Cultural backgrounds**: Hindu, Buddhist

### ✅ Testing Coverage
Designed to test:
- Grid and detail rendering
- Age filters (27-36 range)
- Country filters (UK, Canada, Australia, Sri Lanka)
- Language filters (English: all 10, Tamil: 7, Sinhala: 7)
- Search functionality
- Shortlist persistence
- Interest system (send, accept, decline, withdraw)
- Blocking in both directions
- Profile visibility (all published)

---

## Demo Profiles

### Male Profiles

#### 1. Arjun (London, UK)
- **Age**: 34
- **Profession**: Software Engineer
- **Languages**: English, Tamil
- **Open to relocation**: ✅ Yes
- **Bio**: Software engineer who loves solving puzzles and exploring new technologies...
- **Image**: `/profiles/demo-man-01.jpg`

#### 2. Rohan (Toronto, Canada)
- **Age**: 36
- **Profession**: Marketing Manager
- **Languages**: English, Tamil, Sinhala
- **Open to relocation**: ❌ No
- **Bio**: Marketing professional passionate about creative campaigns...
- **Image**: `/profiles/demo-man-02.jpg`

#### 3. Dinesh (Melbourne, Australia)
- **Age**: 37
- **Profession**: Medical Doctor
- **Languages**: English, Tamil
- **Open to relocation**: ✅ Yes
- **Bio**: Doctor dedicated to patient care and medical research...
- **Image**: `/profiles/demo-man-03.jpg`

#### 4. Kavi (Sydney, Australia)
- **Age**: 33
- **Profession**: Financial Analyst
- **Languages**: English, Sinhala
- **Open to relocation**: ❌ No
- **Bio**: Financial analyst who enjoys solving complex problems...
- **Image**: `/profiles/demo-man-04.jpg`

#### 5. Sanjay (Colombo, Sri Lanka)
- **Age**: 35
- **Profession**: Business Owner
- **Languages**: Sinhala, English
- **Open to relocation**: ❌ No
- **Bio**: Entrepreneur building sustainable businesses...
- **Image**: `/profiles/demo-man-05.jpg`

### Female Profiles

#### 6. Priya (London, UK)
- **Age**: 32
- **Profession**: School Teacher
- **Languages**: English, Tamil
- **Open to relocation**: ✅ Yes
- **Bio**: Teacher passionate about education and making a difference...
- **Image**: `/profiles/demo-woman-01.jpg`

#### 7. Anjali (Toronto, Canada)
- **Age**: 34
- **Profession**: Data Analyst
- **Languages**: English, Sinhala
- **Open to relocation**: ✅ Yes
- **Bio**: Data analyst who loves working with numbers...
- **Image**: `/profiles/demo-woman-02.jpg`

#### 8. Nithya (Melbourne, Australia)
- **Age**: 35
- **Profession**: Architect
- **Languages**: English, Tamil
- **Open to relocation**: ✅ Yes
- **Bio**: Architect passionate about sustainable design...
- **Image**: `/profiles/demo-woman-03.jpg`

#### 9. Kavya (Sydney, Australia)
- **Age**: 33
- **Profession**: Healthcare Administrator
- **Languages**: English, Sinhala, Tamil
- **Open to relocation**: ❌ No
- **Bio**: Healthcare administrator dedicated to improving patient experiences...
- **Image**: `/profiles/demo-woman-04.jpg`

#### 10. Roshini (Colombo, Sri Lanka)
- **Age**: 36
- **Profession**: IT Security Specialist
- **Languages**: Sinhala, English, Tamil
- **Open to relocation**: ✅ Yes
- **Bio**: IT professional specializing in cybersecurity...
- **Image**: `/profiles/demo-woman-05.jpg`

---

## Usage

### Seeding Demo Profiles

```bash
# Set Supabase credentials in .env.local
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key

# Seed demo profiles
npm run seed:demo
```

Expected output:
```
🎭 Seeding demo profiles for CupidMatch Discovery testing
📝 Creating 10 fictional profiles with AI-generated images

✅ Seeded: Arjun (Software Engineer, London)
✅ Seeded: Rohan (Marketing Manager, Toronto)
...
✨ Demo seeding completed!
   ✅ Success: 10
```

### Cleaning Up Demo Profiles

```bash
npm run seed:demo:cleanup
```

This removes **only** the 10 demo profiles, leaving all other data intact.

---

## Testing Guide

### Filter Tests

#### By Country
- **United Kingdom**: Should show Arjun, Priya (2)
- **Canada**: Should show Rohan, Anjali (2)
- **Australia**: Should show Dinesh, Kavi, Nithya, Kavya (4)
- **Sri Lanka**: Should show Sanjay, Roshini (2)

#### By Language
- **English**: Should show all 10
- **Tamil**: Should show Arjun, Rohan, Dinesh, Priya, Nithya, Kavya, Roshini (7)
- **Sinhala**: Should show Rohan, Kavi, Sanjay, Anjali, Kavya, Roshini (7)

#### By Age
- **27-30**: Should show 0 (all are 31+)
- **30-35**: Should show Priya (32), Kavi (33), Kavya (33), Arjun (34), Anjali (34), Sanjay (35), Nithya (35) (7)
- **35-40**: Should show Rohan (36), Roshini (36), Dinesh (37) (3)

#### By Relocation
- **Open to relocation**: Arjun, Dinesh, Priya, Anjali, Nithya, Roshini (6)
- **Not open**: Rohan, Kavi, Sanjay, Kavya (4)

### Search Tests
- "Engineer" → Arjun
- "Doctor" → Dinesh
- "Teacher" → Priya
- "Architect" → Nithya
- "London" → Arjun, Priya

### Feature Tests

#### Discovery Page
1. Navigate to `/discover`
2. Verify all 10 profiles display
3. Test filters individually and in combination
4. Test search functionality
5. Test shortlist toggle
6. Test "Send Interest" button
7. Verify shared priorities display

#### Profile Details
1. Click "View" on any profile
2. Verify full details display
3. Verify "Demo profile · AI-generated image" label
4. Test shortlist toggle
5. Test send interest

#### Interests Page
1. Send interest from demo profile A to B
2. Check "Sent" tab shows the interest
3. Login as profile B (if testing with auth)
4. Check "Received" tab shows the interest
5. Test accept/decline/withdraw actions

#### Shortlist
1. Add profiles to shortlist
2. Navigate away and back
3. Verify shortlist persists
4. Remove profiles
5. Verify dashboard shortlist count updates

---

## Image Paths

All demo images are in `/public/profiles/`:

```
/profiles/demo-man-01.jpg    (Arjun)
/profiles/demo-man-02.jpg    (Rohan)
/profiles/demo-man-03.jpg    (Dinesh)
/profiles/demo-man-04.jpg    (Kavi)
/profiles/demo-man-05.jpg    (Sanjay)
/profiles/demo-woman-01.jpg  (Priya)
/profiles/demo-woman-02.jpg  (Anjali)
/profiles/demo-woman-03.jpg  (Nithya)
/profiles/demo-woman-04.jpg  (Kavya)
/profiles/demo-woman-05.jpg  (Roshini)
```

Production URLs:
```
https://matrimony-with-studio.vercel.app/profiles/demo-man-01.jpg
https://matrimony-with-studio.vercel.app/profiles/demo-woman-01.jpg
...
```

---

## Database Queries

### View all demo profiles
```sql
SELECT display_name, profession, location, country, languages, is_published
FROM profiles
WHERE id LIKE 'demo-%'
ORDER BY display_name;
```

### Count demo profiles
```sql
SELECT COUNT(*) FROM profiles WHERE id LIKE 'demo-%';
```

### Remove demo profiles
```sql
DELETE FROM profiles WHERE id LIKE 'demo-%';
```

---

## Safety & Isolation

### ✅ What's Protected
- Demo profiles use distinct ID format (`demo-0000-...`)
- Demo emails use reserved domain (`@cupidmatch-demo.example`)
- All profiles clearly labeled with "Demo profile · AI-generated image"
- Cleanup script removes only demo profiles

### ⚠️ Important Notes
- **No real verification**: Demo profiles are not marked as verified
- **No testimonials**: Bios don't claim real success stories
- **No contact details**: No phone numbers or social media
- **Isolated**: Not intended to interact with real production members
- **Testing only**: Use on staging/development databases

### 🚫 What NOT to Do
- Don't use demo profiles on production without clear demo mode
- Don't remove the "Demo profile · AI-generated image" label
- Don't add fake verification badges
- Don't use demo profiles for automated interactions with real members
- Don't weaken RLS policies for demo profiles

---

## Production Demo Mode

If you need demo profiles in production:

1. **Implement persistent demo banner**:
   ```tsx
   {isDemoMode && (
     <div className="bg-yellow-100 border-b border-yellow-200 p-2 text-center text-sm">
       🎭 Demo Mode: Viewing fictional profiles with AI-generated images
     </div>
   )}
   ```

2. **Separate queries**:
   - Real discovery: `WHERE is_published = true AND id NOT LIKE 'demo-%'`
   - Demo discovery: `WHERE is_published = true AND id LIKE 'demo-%'`

3. **Prevent cross-interaction**:
   - Block demo profiles from sending interests to real profiles
   - Block real profiles from seeing demo profiles
   - Keep demo interactions isolated

4. **Clear labeling**:
   - Always show "Demo profile · AI-generated image"
   - Never claim real activity or verification

---

## Troubleshooting

### Demo profiles not showing
**Problem**: Seeded but not visible

**Solutions**:
1. Check `is_published = true`: `SELECT id, display_name, is_published FROM profiles WHERE id LIKE 'demo-%'`
2. Verify RLS policies allow reading published profiles
3. Check discovery_profiles view includes demo profiles
4. Ensure no filters exclude all demo profiles

### Images not loading
**Problem**: 404 errors on profile images

**Solutions**:
1. Verify images exist: `ls -la public/profiles/demo-*.jpg`
2. Check Next.js is serving static files
3. Clear browser cache
4. Wait for Vercel CDN to update (~1-2 minutes)

### Duplicate key errors
**Problem**: Demo profiles already exist

**Solutions**:
1. Run cleanup first: `npm run seed:demo:cleanup`
2. Then seed again: `npm run seed:demo`
3. Or the seed script will upsert (update existing)

---

## Verification Checklist

Before considering demo profiles production-ready:

- [ ] All 10 profiles created successfully
- [ ] All images loading correctly
- [ ] "Demo profile · AI-generated image" label visible in all bios
- [ ] No verification badges on demo profiles
- [ ] No testimonials or fake activity claims
- [ ] Country filters work correctly
- [ ] Language filters work correctly
- [ ] Age filters work correctly
- [ ] Search functionality works
- [ ] Shortlist persists across sessions
- [ ] Interest system functional
- [ ] Profile details page renders correctly
- [ ] Mobile bottom navigation visible on all tabs
- [ ] Responsive layout works (390px, 768px, 1440px)
- [ ] TypeScript checks pass
- [ ] Lint checks pass
- [ ] Production build succeeds

---

## Next Steps

After seeding:

1. **Test Discovery**: Visit `/discover` and verify all profiles display
2. **Test Filters**: Try each filter combination
3. **Test Interactions**: Shortlist and send interests
4. **Mobile Testing**: Check responsive layout
5. **Performance**: Verify fast loading times
6. **Documentation**: Update any relevant docs

---

## Support

For issues or questions:
- Review [docs/seeding-test-data.md](./seeding-test-data.md) for general seeding
- Check Supabase Dashboard for profile data
- Verify RLS policies are correct
- Ensure `.env.local` has correct credentials

---

**Remember**: These are fictional demo profiles with AI-generated images for testing purposes only!
