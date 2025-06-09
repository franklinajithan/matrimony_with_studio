import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, X, MapPin, Briefcase, CheckCircle } from 'lucide-react';

const mockProfiles = [
  { id: '1', name: 'Rohan Sharma', age: 30, profession: 'Doctor', location: 'Delhi, India', imageUrl: 'https://placehold.co/300x400', dataAiHint: 'man portrait', isVerified: true, interests: ['Music', 'Books'] },
  { id: '2', name: 'Priya Patel', age: 27, profession: 'Architect', location: 'Bangalore, India', imageUrl: 'https://placehold.co/300x400', dataAiHint: 'woman smiling', isVerified: false, interests: ['Art', 'Yoga'] },
  { id: '3', name: 'Amit Singh', age: 32, profession: 'Marketing Manager', location: 'Pune, India', imageUrl: 'https://placehold.co/300x400', dataAiHint: 'man professional', isVerified: true, interests: ['Sports', 'Movies'] },
  { id: '4', name: 'Sneha Reddy', age: 29, profession: 'Graphic Designer', location: 'Hyderabad, India', imageUrl: 'https://placehold.co/300x400', dataAiHint: 'woman creative', isVerified: true, interests: ['Photography', 'Dance'] },
  { id: '5', name: 'Vikram Kumar', age: 28, profession: 'Civil Engineer', location: 'Chennai, India', imageUrl: 'https://placehold.co/300x400', dataAiHint: 'man engineer', isVerified: false, interests: ['Gaming', 'Trekking'] },
  { id: '6', name: 'Anjali Desai', age: 26, profession: 'Teacher', location: 'Ahmedabad, India', imageUrl: 'https://placehold.co/300x400', dataAiHint: 'woman teacher', isVerified: true, interests: ['Crafts', 'Reading'] },
];

export default function DiscoverPage() {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="font-headline text-4xl font-semibold text-gray-800">Discover Your Match</h1>
        <p className="mt-2 text-lg text-muted-foreground">Swipe, like, and connect with potential partners.</p>
      </div>

      {/* Placeholder for swipe cards, showing a grid for now */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {mockProfiles.map((profile) => (
          <Card key={profile.id} className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col">
            <div className="relative">
              <Image
                src={profile.imageUrl}
                alt={profile.name}
                width={300}
                height={400}
                className="w-full h-80 object-cover"
                data-ai-hint={profile.dataAiHint}
              />
              {profile.isVerified && (
                <Badge variant="default" className="absolute top-2 right-2 bg-green-500 text-white flex items-center gap-1 text-xs">
                  <CheckCircle className="h-3 w-3" /> Verified
                </Badge>
              )}
            </div>
            <CardHeader className="p-4">
              <CardTitle className="font-headline text-xl text-primary">{profile.name}, {profile.age}</CardTitle>
              <CardDescription className="text-sm">
                <span className="flex items-center text-muted-foreground"><Briefcase className="mr-1 h-3.5 w-3.5" />{profile.profession}</span>
                <span className="flex items-center text-muted-foreground"><MapPin className="mr-1 h-3.5 w-3.5" />{profile.location}</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0 flex-grow">
              <div className="flex flex-wrap gap-1">
                {profile.interests.map(interest => (
                  <Badge key={interest} variant="secondary" className="text-xs">{interest}</Badge>
                ))}
              </div>
            </CardContent>
            <CardFooter className="p-3 border-t grid grid-cols-3 gap-2">
              <Button variant="outline" size="icon" className="border-destructive/50 text-destructive hover:bg-destructive/10">
                <X className="h-5 w-5" />
                <span className="sr-only">Skip</span>
              </Button>
              <Button variant="outline" size="icon" className="col-span-1 border-primary/50 text-primary hover:bg-primary/10" asChild>
                <Link href={`/profile/${profile.id}`}>
                  <Search className="h-5 w-5" />
                  <span className="sr-only">View Profile</span>
                </Link>
              </Button>
              <Button variant="outline" size="icon" className="border-green-500/50 text-green-600 hover:bg-green-500/10">
                <Heart className="h-5 w-5" />
                <span className="sr-only">Like</span>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
       <div className="text-center mt-12">
        <Button variant="outline" size="lg">Load More Profiles</Button>
      </div>
    </div>
  );
}
