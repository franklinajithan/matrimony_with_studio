/**
 * Seed script to create test profiles with images
 * Run with: npx tsx scripts/seed-test-profiles.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Read environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface TestProfile {
  id: string;
  email: string;
  display_name: string;
  bio: string;
  photo_url: string;
  location: string;
  profession: string;
  dob: string;
  country: string;
  region: string;
  languages: string[];
  relationship_intentions: Record<string, any>;
  values_lifestyle: Record<string, any>;
  cultural_family: Record<string, any>;
  settlement: Record<string, any>;
  is_published: boolean;
  onboarding_step: number;
  education_level: string;
  religion: string;
  height: string;
}

const testProfiles: TestProfile[] = [
  {
    id: '01a0a652-f929-76ac-bbce-9b3f2c188d5a',
    email: 'rajesh.kumar.test@cupidmatch.com',
    display_name: 'Rajesh Kumar',
    bio: 'Software engineer passionate about technology and innovation. Love exploring new places and trying different cuisines. Looking for someone who shares my values and dreams.',
    photo_url: '/profiles/01a0a652-f929-76ac-bbce-9b3f2c188d5a.jpg',
    location: 'Colombo',
    profession: 'Software Engineer',
    dob: '1992-03-15',
    country: 'Sri Lanka',
    region: 'Western Province',
    languages: ['English', 'Tamil', 'Sinhala'],
    relationship_intentions: { type: 'marriage', timeline: '1-2 years' },
    values_lifestyle: { interests: ['Technology', 'Travel', 'Cooking'], lifestyle: 'Active' },
    cultural_family: { family_type: 'Nuclear', living_with_family: false },
    settlement: { preferred_countries: ['Sri Lanka', 'Canada', 'United Kingdom'], open_to_relocation: true },
    is_published: true,
    onboarding_step: 8,
    education_level: 'Bachelors',
    religion: 'Buddhist',
    height: '175 cm'
  },
  {
    id: '01a0a652-f947-73e7-8499-271e3c1e84d8',
    email: 'arun.patel.test@cupidmatch.com',
    display_name: 'Arun Patel',
    bio: 'Marketing professional with a love for adventure and outdoor activities. Family-oriented and looking for a life partner who values tradition and modern thinking equally.',
    photo_url: '/profiles/01a0a652-f947-73e7-8499-271e3c1e84d8.jpg',
    location: 'London',
    profession: 'Marketing Manager',
    dob: '1990-07-22',
    country: 'United Kingdom',
    region: 'Greater London',
    languages: ['English', 'Tamil'],
    relationship_intentions: { type: 'marriage', timeline: 'within 1 year' },
    values_lifestyle: { interests: ['Sports', 'Reading', 'Photography'], lifestyle: 'Balanced' },
    cultural_family: { family_type: 'Joint', living_with_family: true },
    settlement: { preferred_countries: ['United Kingdom', 'Sri Lanka'], open_to_relocation: false },
    is_published: true,
    onboarding_step: 8,
    education_level: 'Masters',
    religion: 'Hindu',
    height: '178 cm'
  },
  {
    id: '01a0a652-f963-7793-a4da-78dff528095e',
    email: 'dinesh.fernando.test@cupidmatch.com',
    display_name: 'Dinesh Fernando',
    bio: 'Doctor by profession, music enthusiast by passion. Believe in building meaningful connections based on mutual respect and understanding.',
    photo_url: '/profiles/01a0a652-f963-7793-a4da-78dff528095e.jpg',
    location: 'Toronto',
    profession: 'Medical Doctor',
    dob: '1988-11-08',
    country: 'Canada',
    region: 'Ontario',
    languages: ['English', 'Sinhala'],
    relationship_intentions: { type: 'marriage', timeline: '2-3 years' },
    values_lifestyle: { interests: ['Music', 'Healthcare', 'Volunteering'], lifestyle: 'Professional' },
    cultural_family: { family_type: 'Nuclear', living_with_family: false },
    settlement: { preferred_countries: ['Canada', 'Sri Lanka', 'United States'], open_to_relocation: true },
    is_published: true,
    onboarding_step: 8,
    education_level: 'Doctorate',
    religion: 'Catholic',
    height: '180 cm'
  },
  {
    id: '01a0a652-f983-72ec-95e5-6a2f6cafa0ce',
    email: 'karthik.reddy.test@cupidmatch.com',
    display_name: 'Karthik Reddy',
    bio: 'Finance analyst who enjoys good conversations over coffee. Looking for someone to build a future with, filled with love, laughter, and shared dreams.',
    photo_url: '/profiles/01a0a652-f983-72ec-95e5-6a2f6cafa0ce.jpg',
    location: 'Melbourne',
    profession: 'Finance Analyst',
    dob: '1993-05-30',
    country: 'Australia',
    region: 'Victoria',
    languages: ['English', 'Tamil'],
    relationship_intentions: { type: 'marriage', timeline: '1-2 years' },
    values_lifestyle: { interests: ['Finance', 'Travel', 'Food'], lifestyle: 'Urban' },
    cultural_family: { family_type: 'Nuclear', living_with_family: false },
    settlement: { preferred_countries: ['Australia', 'Sri Lanka', 'Singapore'], open_to_relocation: true },
    is_published: true,
    onboarding_step: 8,
    education_level: 'Masters',
    religion: 'Hindu',
    height: '172 cm'
  },
  {
    id: '01a0a652-f9a1-736d-93cf-ac7f98096303',
    email: 'vikram.silva.test@cupidmatch.com',
    display_name: 'Vikram Silva',
    bio: 'Entrepreneur passionate about sustainability and social impact. Love hiking, reading, and meaningful conversations. Seeking a partner who shares similar values.',
    photo_url: '/profiles/01a0a652-f9a1-736d-93cf-ac7f98096303.jpg',
    location: 'Kandy',
    profession: 'Business Owner',
    dob: '1991-09-12',
    country: 'Sri Lanka',
    region: 'Central Province',
    languages: ['English', 'Sinhala', 'Tamil'],
    relationship_intentions: { type: 'marriage', timeline: 'within 1 year' },
    values_lifestyle: { interests: ['Business', 'Environment', 'Fitness'], lifestyle: 'Active' },
    cultural_family: { family_type: 'Joint', living_with_family: true },
    settlement: { preferred_countries: ['Sri Lanka', 'Singapore'], open_to_relocation: false },
    is_published: true,
    onboarding_step: 8,
    education_level: 'Bachelors',
    religion: 'Buddhist',
    height: '176 cm'
  },
  {
    id: '01a0a652-f9c1-70ff-9eef-ad297f2281b0',
    email: 'priya.jayawardena.test@cupidmatch.com',
    display_name: 'Priya Jayawardena',
    bio: 'Teacher who believes in lifelong learning and personal growth. Family is important to me, and I value traditions while embracing modernity.',
    photo_url: '/profiles/01a0a652-f9c1-70ff-9eef-ad297f2281b0.jpg',
    location: 'Jaffna',
    profession: 'School Teacher',
    dob: '1994-02-18',
    country: 'Sri Lanka',
    region: 'Northern Province',
    languages: ['Tamil', 'English'],
    relationship_intentions: { type: 'marriage', timeline: '1-2 years' },
    values_lifestyle: { interests: ['Education', 'Arts', 'Community'], lifestyle: 'Traditional' },
    cultural_family: { family_type: 'Joint', living_with_family: true },
    settlement: { preferred_countries: ['Sri Lanka', 'Canada'], open_to_relocation: true },
    is_published: true,
    onboarding_step: 8,
    education_level: 'Bachelors',
    religion: 'Hindu',
    height: '160 cm'
  },
  {
    id: '01a0a652-f9e0-76ea-bb5b-13ce9e54cca5',
    email: 'anjali.perera.test@cupidmatch.com',
    display_name: 'Anjali Perera',
    bio: 'IT professional working in cybersecurity. Love solving puzzles, both technical and in daily life. Looking for someone intelligent, kind, and family-oriented.',
    photo_url: '/profiles/01a0a652-f9e0-76ea-bb5b-13ce9e54cca5.jpg',
    location: 'Sydney',
    profession: 'Cybersecurity Specialist',
    dob: '1992-08-25',
    country: 'Australia',
    region: 'New South Wales',
    languages: ['English', 'Sinhala'],
    relationship_intentions: { type: 'marriage', timeline: '2-3 years' },
    values_lifestyle: { interests: ['Technology', 'Chess', 'Yoga'], lifestyle: 'Balanced' },
    cultural_family: { family_type: 'Nuclear', living_with_family: false },
    settlement: { preferred_countries: ['Australia', 'Sri Lanka', 'New Zealand'], open_to_relocation: true },
    is_published: true,
    onboarding_step: 8,
    education_level: 'Masters',
    religion: 'Buddhist',
    height: '165 cm'
  },
  {
    id: '01a0a652-f9ff-7f68-ad79-59442a3508bf',
    email: 'nithya.rajan.test@cupidmatch.com',
    display_name: 'Nithya Rajan',
    bio: 'Architect passionate about sustainable design and cultural heritage. Looking for a life partner who appreciates art, culture, and meaningful connections.',
    photo_url: '/profiles/01a0a652-f9ff-7f68-ad79-59442a3508bf.jpg',
    location: 'Dubai',
    profession: 'Architect',
    dob: '1991-06-14',
    country: 'United Arab Emirates',
    region: 'Dubai',
    languages: ['English', 'Tamil', 'Sinhala'],
    relationship_intentions: { type: 'marriage', timeline: '1-2 years' },
    values_lifestyle: { interests: ['Architecture', 'Art', 'Travel'], lifestyle: 'Creative' },
    cultural_family: { family_type: 'Nuclear', living_with_family: false },
    settlement: { preferred_countries: ['Sri Lanka', 'United Arab Emirates', 'United Kingdom'], open_to_relocation: true },
    is_published: true,
    onboarding_step: 8,
    education_level: 'Masters',
    religion: 'Hindu',
    height: '162 cm'
  },
  {
    id: '01a0a652-fa20-782a-9f96-1a38d12e7135',
    email: 'kavya.mendis.test@cupidmatch.com',
    display_name: 'Kavya Mendis',
    bio: 'Healthcare administrator dedicated to improving patient care. Enjoy cooking, gardening, and spending time with family. Seeking someone with similar values.',
    photo_url: '/profiles/01a0a652-fa20-782a-9f96-1a38d12e7135.jpg',
    location: 'Galle',
    profession: 'Healthcare Administrator',
    dob: '1993-12-03',
    country: 'Sri Lanka',
    region: 'Southern Province',
    languages: ['Sinhala', 'English'],
    relationship_intentions: { type: 'marriage', timeline: 'within 1 year' },
    values_lifestyle: { interests: ['Healthcare', 'Cooking', 'Gardening'], lifestyle: 'Homely' },
    cultural_family: { family_type: 'Joint', living_with_family: true },
    settlement: { preferred_countries: ['Sri Lanka'], open_to_relocation: false },
    is_published: true,
    onboarding_step: 8,
    education_level: 'Bachelors',
    religion: 'Buddhist',
    height: '158 cm'
  },
  {
    id: '01a0a652-fa40-7ce7-836a-e84608163af4',
    email: 'roshini.kumar.test@cupidmatch.com',
    display_name: 'Roshini Kumar',
    bio: 'Data scientist fascinated by AI and machine learning. Love solving complex problems and learning new things. Looking for someone who values growth and partnership.',
    photo_url: '/profiles/01a0a652-fa40-7ce7-836a-e84608163af4.jpg',
    location: 'Singapore',
    profession: 'Data Scientist',
    dob: '1990-04-20',
    country: 'Singapore',
    region: 'Singapore',
    languages: ['English', 'Tamil'],
    relationship_intentions: { type: 'marriage', timeline: '2-3 years' },
    values_lifestyle: { interests: ['Data Science', 'Learning', 'Travel'], lifestyle: 'Professional' },
    cultural_family: { family_type: 'Nuclear', living_with_family: false },
    settlement: { preferred_countries: ['Singapore', 'Sri Lanka', 'United States'], open_to_relocation: true },
    is_published: true,
    onboarding_step: 8,
    education_level: 'Masters',
    religion: 'Hindu',
    height: '163 cm'
  }
];

async function seedProfiles() {
  console.log('🌱 Starting profile seeding...');
  console.log(`📝 Seeding ${testProfiles.length} profiles\n`);

  for (const profile of testProfiles) {
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert(profile, {
          onConflict: 'id',
          ignoreDuplicates: false
        });

      if (error) {
        console.error(`❌ Error seeding ${profile.display_name}:`, error.message);
      } else {
        console.log(`✅ Seeded: ${profile.display_name} (${profile.profession})`);
      }
    } catch (err) {
      console.error(`❌ Exception seeding ${profile.display_name}:`, err);
    }
  }

  console.log('\n✨ Profile seeding completed!');
  console.log(`\n📊 You can now test the app with ${testProfiles.length} diverse profiles`);
}

seedProfiles()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
