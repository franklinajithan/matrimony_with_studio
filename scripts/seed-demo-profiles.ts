/**
 * Seed isolated demo profiles for CupidMatch Discovery testing
 * 
 * IMPORTANT: These are fictional demo profiles with AI-generated images.
 * They are clearly labeled and isolated from real production members.
 * 
 * Run with: npx tsx scripts/seed-demo-profiles.ts
 * Clean up with: npx tsx scripts/seed-demo-profiles.ts --cleanup
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Demo profile IDs - stable and recognizable
const DEMO_IDS = {
  // Male profiles
  'demo-man-01': 'demo-0000-0000-0001-000000000001',
  'demo-man-02': 'demo-0000-0000-0001-000000000002',
  'demo-man-03': 'demo-0000-0000-0001-000000000003',
  'demo-man-04': 'demo-0000-0000-0001-000000000004',
  'demo-man-05': 'demo-0000-0000-0001-000000000005',
  // Female profiles
  'demo-woman-01': 'demo-0000-0000-0002-000000000001',
  'demo-woman-02': 'demo-0000-0000-0002-000000000002',
  'demo-woman-03': 'demo-0000-0000-0002-000000000003',
  'demo-woman-04': 'demo-0000-0000-0002-000000000004',
  'demo-woman-05': 'demo-0000-0000-0002-000000000005',
};

const DEMO_PROFILES = [
  // Male profiles
  {
    id: DEMO_IDS['demo-man-01'],
    email: 'demo.arjun@cupidmatch-demo.example',
    display_name: 'Arjun',
    bio: 'Software engineer who loves solving puzzles and exploring new technologies. Enjoy hiking on weekends and trying new cuisines.\n\nDemo profile · AI-generated image',
    photo_url: '/profiles/demo-man-01.jpg',
    location: 'London',
    profession: 'Software Engineer',
    dob: '1992-03-15',
    country: 'United Kingdom',
    region: 'Greater London',
    languages: ['English', 'Tamil'],
    relationship_intentions: { type: 'marriage', timeline: '1-2 years' },
    values_lifestyle: { interests: ['Technology', 'Hiking', 'Cooking'] },
    cultural_family: { family_type: 'Nuclear' },
    settlement: { preferred_countries: ['United Kingdom', 'Canada'], open_to_relocation: true },
    is_published: true,
    onboarding_step: 8,
    education_level: 'Masters',
    religion: 'Hindu',
    height: '178 cm'
  },
  {
    id: DEMO_IDS['demo-man-02'],
    email: 'demo.rohan@cupidmatch-demo.example',
    display_name: 'Rohan',
    bio: 'Marketing professional passionate about creative campaigns and brand storytelling. Love photography and weekend getaways.\n\nDemo profile · AI-generated image',
    photo_url: '/profiles/demo-man-02.jpg',
    location: 'Toronto',
    profession: 'Marketing Manager',
    dob: '1990-07-22',
    country: 'Canada',
    region: 'Ontario',
    languages: ['English', 'Tamil', 'Sinhala'],
    relationship_intentions: { type: 'marriage', timeline: 'within 1 year' },
    values_lifestyle: { interests: ['Photography', 'Travel', 'Music'] },
    cultural_family: { family_type: 'Joint' },
    settlement: { preferred_countries: ['Canada', 'Australia'], open_to_relocation: false },
    is_published: true,
    onboarding_step: 8,
    education_level: 'Bachelors',
    religion: 'Buddhist',
    height: '175 cm'
  },
  {
    id: DEMO_IDS['demo-man-03'],
    email: 'demo.dinesh@cupidmatch-demo.example',
    display_name: 'Dinesh',
    bio: 'Doctor dedicated to patient care and medical research. Enjoy reading, classical music, and volunteering in community health.\n\nDemo profile · AI-generated image',
    photo_url: '/profiles/demo-man-03.jpg',
    location: 'Melbourne',
    profession: 'Medical Doctor',
    dob: '1989-11-08',
    country: 'Australia',
    region: 'Victoria',
    languages: ['English', 'Tamil'],
    relationship_intentions: { type: 'marriage', timeline: '2-3 years' },
    values_lifestyle: { interests: ['Healthcare', 'Reading', 'Classical Music'] },
    cultural_family: { family_type: 'Nuclear' },
    settlement: { preferred_countries: ['Australia', 'Singapore'], open_to_relocation: true },
    is_published: true,
    onboarding_step: 8,
    education_level: 'Doctorate',
    religion: 'Hindu',
    height: '180 cm'
  },
  {
    id: DEMO_IDS['demo-man-04'],
    email: 'demo.kavi@cupidmatch-demo.example',
    display_name: 'Kavi',
    bio: 'Financial analyst who enjoys solving complex problems. Love cricket, good coffee, and meaningful conversations.\n\nDemo profile · AI-generated image',
    photo_url: '/profiles/demo-man-04.jpg',
    location: 'Sydney',
    profession: 'Financial Analyst',
    dob: '1993-05-30',
    country: 'Australia',
    region: 'New South Wales',
    languages: ['English', 'Sinhala'],
    relationship_intentions: { type: 'marriage', timeline: '1-2 years' },
    values_lifestyle: { interests: ['Sports', 'Finance', 'Travel'] },
    cultural_family: { family_type: 'Nuclear' },
    settlement: { preferred_countries: ['Australia', 'New Zealand'], open_to_relocation: false },
    is_published: true,
    onboarding_step: 8,
    education_level: 'Masters',
    religion: 'Buddhist',
    height: '176 cm'
  },
  {
    id: DEMO_IDS['demo-man-05'],
    email: 'demo.sanjay@cupidmatch-demo.example',
    display_name: 'Sanjay',
    bio: 'Entrepreneur building sustainable businesses. Passionate about innovation, reading, and exploring Sri Lankan heritage.\n\nDemo profile · AI-generated image',
    photo_url: '/profiles/demo-man-05.jpg',
    location: 'Colombo',
    profession: 'Business Owner',
    dob: '1991-09-12',
    country: 'Sri Lanka',
    region: 'Western Province',
    languages: ['Sinhala', 'English'],
    relationship_intentions: { type: 'marriage', timeline: 'within 1 year' },
    values_lifestyle: { interests: ['Business', 'Culture', 'Reading'] },
    cultural_family: { family_type: 'Joint' },
    settlement: { preferred_countries: ['Sri Lanka'], open_to_relocation: false },
    is_published: true,
    onboarding_step: 8,
    education_level: 'Bachelors',
    religion: 'Buddhist',
    height: '172 cm'
  },

  // Female profiles
  {
    id: DEMO_IDS['demo-woman-01'],
    email: 'demo.priya@cupidmatch-demo.example',
    display_name: 'Priya',
    bio: 'Teacher passionate about education and making a difference. Love art, yoga, and spending time with family and friends.\n\nDemo profile · AI-generated image',
    photo_url: '/profiles/demo-woman-01.jpg',
    location: 'London',
    profession: 'School Teacher',
    dob: '1994-02-18',
    country: 'United Kingdom',
    region: 'Greater London',
    languages: ['English', 'Tamil'],
    relationship_intentions: { type: 'marriage', timeline: '1-2 years' },
    values_lifestyle: { interests: ['Education', 'Art', 'Yoga'] },
    cultural_family: { family_type: 'Joint' },
    settlement: { preferred_countries: ['United Kingdom', 'Canada'], open_to_relocation: true },
    is_published: true,
    onboarding_step: 8,
    education_level: 'Bachelors',
    religion: 'Hindu',
    height: '165 cm'
  },
  {
    id: DEMO_IDS['demo-woman-02'],
    email: 'demo.anjali@cupidmatch-demo.example',
    display_name: 'Anjali',
    bio: 'Data analyst who loves working with numbers and uncovering insights. Enjoy cooking, gardening, and weekend hikes.\n\nDemo profile · AI-generated image',
    photo_url: '/profiles/demo-woman-02.jpg',
    location: 'Toronto',
    profession: 'Data Analyst',
    dob: '1992-08-25',
    country: 'Canada',
    region: 'Ontario',
    languages: ['English', 'Sinhala'],
    relationship_intentions: { type: 'marriage', timeline: '2-3 years' },
    values_lifestyle: { interests: ['Data Science', 'Cooking', 'Hiking'] },
    cultural_family: { family_type: 'Nuclear' },
    settlement: { preferred_countries: ['Canada', 'United States'], open_to_relocation: true },
    is_published: true,
    onboarding_step: 8,
    education_level: 'Masters',
    religion: 'Buddhist',
    height: '162 cm'
  },
  {
    id: DEMO_IDS['demo-woman-03'],
    email: 'demo.nithya@cupidmatch-demo.example',
    display_name: 'Nithya',
    bio: 'Architect passionate about sustainable design. Love sketching, traveling, and discovering new cultures and cuisines.\n\nDemo profile · AI-generated image',
    photo_url: '/profiles/demo-woman-03.jpg',
    location: 'Melbourne',
    profession: 'Architect',
    dob: '1991-06-14',
    country: 'Australia',
    region: 'Victoria',
    languages: ['English', 'Tamil'],
    relationship_intentions: { type: 'marriage', timeline: '1-2 years' },
    values_lifestyle: { interests: ['Architecture', 'Art', 'Travel'] },
    cultural_family: { family_type: 'Nuclear' },
    settlement: { preferred_countries: ['Australia', 'United Kingdom'], open_to_relocation: true },
    is_published: true,
    onboarding_step: 8,
    education_level: 'Masters',
    religion: 'Hindu',
    height: '160 cm'
  },
  {
    id: DEMO_IDS['demo-woman-04'],
    email: 'demo.kavya@cupidmatch-demo.example',
    display_name: 'Kavya',
    bio: 'Healthcare administrator dedicated to improving patient experiences. Enjoy reading, music, and community volunteering.\n\nDemo profile · AI-generated image',
    photo_url: '/profiles/demo-woman-04.jpg',
    location: 'Sydney',
    profession: 'Healthcare Administrator',
    dob: '1993-12-03',
    country: 'Australia',
    region: 'New South Wales',
    languages: ['English', 'Sinhala', 'Tamil'],
    relationship_intentions: { type: 'marriage', timeline: 'within 1 year' },
    values_lifestyle: { interests: ['Healthcare', 'Reading', 'Music'] },
    cultural_family: { family_type: 'Joint' },
    settlement: { preferred_countries: ['Australia'], open_to_relocation: false },
    is_published: true,
    onboarding_step: 8,
    education_level: 'Bachelors',
    religion: 'Buddhist',
    height: '158 cm'
  },
  {
    id: DEMO_IDS['demo-woman-05'],
    email: 'demo.roshini@cupidmatch-demo.example',
    display_name: 'Roshini',
    bio: 'IT professional specializing in cybersecurity. Love solving puzzles, learning languages, and exploring nature.\n\nDemo profile · AI-generated image',
    photo_url: '/profiles/demo-woman-05.jpg',
    location: 'Colombo',
    profession: 'IT Security Specialist',
    dob: '1990-04-20',
    country: 'Sri Lanka',
    region: 'Western Province',
    languages: ['Sinhala', 'English', 'Tamil'],
    relationship_intentions: { type: 'marriage', timeline: '2-3 years' },
    values_lifestyle: { interests: ['Technology', 'Languages', 'Nature'] },
    cultural_family: { family_type: 'Nuclear' },
    settlement: { preferred_countries: ['Sri Lanka', 'Singapore'], open_to_relocation: true },
    is_published: true,
    onboarding_step: 8,
    education_level: 'Masters',
    religion: 'Buddhist',
    height: '163 cm'
  },
];

async function seedDemoProfiles() {
  console.log('🎭 Seeding demo profiles for CupidMatch Discovery testing');
  console.log('📝 Creating 10 fictional profiles with AI-generated images\n');

  let successCount = 0;
  let errorCount = 0;

  for (const profile of DEMO_PROFILES) {
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert(profile, {
          onConflict: 'id',
          ignoreDuplicates: false
        });

      if (error) {
        console.error(`❌ Error seeding ${profile.display_name}:`, error.message);
        errorCount++;
      } else {
        console.log(`✅ Seeded: ${profile.display_name} (${profile.profession}, ${profile.location})`);
        successCount++;
      }
    } catch (err) {
      console.error(`❌ Exception seeding ${profile.display_name}:`, err);
      errorCount++;
    }
  }

  console.log(`\n✨ Demo seeding completed!`);
  console.log(`   ✅ Success: ${successCount}`);
  if (errorCount > 0) {
    console.log(`   ❌ Errors: ${errorCount}`);
  }
  console.log(`\n📍 View at: https://matrimony-with-studio.vercel.app/discover`);
  console.log(`\n⚠️  These are isolated demo profiles with AI-generated images`);
  console.log(`   They are clearly labeled: "Demo profile · AI-generated image"`);
}

async function cleanupDemoProfiles() {
  console.log('🧹 Cleaning up demo profiles...\n');

  const demoIds = Object.values(DEMO_IDS);
  
  try {
    const { error, count } = await supabase
      .from('profiles')
      .delete()
      .in('id', demoIds);

    if (error) {
      console.error('❌ Error during cleanup:', error.message);
      process.exit(1);
    }

    console.log(`✅ Removed ${count || demoIds.length} demo profiles`);
    console.log('✨ Cleanup completed!');
  } catch (err) {
    console.error('❌ Exception during cleanup:', err);
    process.exit(1);
  }
}

// Main execution
const isCleanup = process.argv.includes('--cleanup');

if (isCleanup) {
  cleanupDemoProfiles()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Fatal error:', err);
      process.exit(1);
    });
} else {
  seedDemoProfiles()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Fatal error:', err);
      process.exit(1);
    });
}
