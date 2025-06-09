import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Heart, MessageSquare, Briefcase, MapPin, Cake, Languages, CheckCircle, Ruler } from 'lucide-react';

// Mock data - replace with actual data fetching
const userProfile = {
  id: '123',
  name: 'Aisha Khan',
  age: 28,
  profession: 'Software Engineer',
  location: 'Mumbai, India',
  bio: "Passionate about technology, travel, and finding meaningful connections. I enjoy reading, hiking, and exploring new cuisines. Looking for someone kind, ambitious, and with a good sense of humor.",
  interests: ['Reading', 'Hiking', 'Travel', 'Cooking', 'Technology'],
  photos: [
    { id: 'p1', url: 'https://placehold.co/600x800', alt: 'Aisha Khan Profile Photo 1', dataAiHint: 'woman portrait' },
    { id: 'p2', url: 'https://placehold.co/600x800', alt: 'Aisha Khan Profile Photo 2', dataAiHint: 'woman outdoor' },
  ],
  religion: 'Islam',
  caste: 'Sunni',
  language: 'Urdu, English, Hindi',
  height: '165 cm (5\'5")',
  isVerified: true,
  horoscopeSign: 'Leo', // Example
};

type ProfilePageProps = {
  params: { userId: string };
};

export default function ProfilePage({ params }: ProfilePageProps) {
  // In a real app, you would fetch user data based on params.userId
  // const userProfile = await fetchUserProfile(params.userId);

  if (!userProfile) {
    return <div>Profile not found.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="overflow-hidden shadow-xl">
        <div className="md:flex">
          <div className="md:w-1/2 relative">
            {userProfile.photos.length > 0 && (
              <Image
                src={userProfile.photos[0].url}
                alt={userProfile.photos[0].alt}
                width={600}
                height={800}
                className="object-cover w-full h-[400px] md:h-full"
                priority
                data-ai-hint={userProfile.photos[0].dataAiHint}
              />
            )}
            {/* Simple photo indicator, not a full carousel */}
            {userProfile.photos.length > 1 && (
                 <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                    {userProfile.photos.map((photo, index) => (
                        <button key={photo.id} className={`w-3 h-3 rounded-full ${index === 0 ? 'bg-primary' : 'bg-gray-300 opacity-75'}`}></button>
                    ))}
                </div>
            )}
          </div>
          <div className="md:w-1/2 p-6 md:p-8 flex flex-col">
            <CardHeader className="p-0 mb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="font-headline text-3xl md:text-4xl text-primary">{userProfile.name}</CardTitle>
                {userProfile.isVerified && (
                  <Badge variant="default" className="bg-green-500 text-white flex items-center gap-1">
                    <CheckCircle className="h-4 w-4" /> Verified
                  </Badge>
                )}
              </div>
              <CardDescription className="text-lg text-muted-foreground">{userProfile.age} years old</CardDescription>
            </CardHeader>

            <CardContent className="p-0 space-y-4 flex-grow">
              <div className="space-y-1">
                <h3 className="font-semibold text-foreground/90 flex items-center"><Briefcase className="mr-2 h-5 w-5 text-primary/80" />Profession</h3>
                <p className="text-foreground/80">{userProfile.profession}</p>
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-foreground/90 flex items-center"><MapPin className="mr-2 h-5 w-5 text-primary/80" />Location</h3>
                <p className="text-foreground/80">{userProfile.location}</p>
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-foreground/90 flex items-center"><Ruler className="mr-2 h-5 w-5 text-primary/80" />Height</h3>
                <p className="text-foreground/80">{userProfile.height}</p>
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-foreground/90 flex items-center"><Languages className="mr-2 h-5 w-5 text-primary/80" />Languages</h3>
                <p className="text-foreground/80">{userProfile.language}</p>
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-foreground/90 flex items-center"><Cake className="mr-2 h-5 w-5 text-primary/80" />Religion & Caste</h3>
                <p className="text-foreground/80">{userProfile.religion}, {userProfile.caste}</p>
              </div>
              {userProfile.horoscopeSign && (
                <div className="space-y-1">
                  <h3 className="font-semibold text-foreground/90 flex items-center">
                     <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 text-primary/80"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Z"/><path d="M12 12a5 5 0 1 0 5-5 5 5 0 0 0-5 5Z"/><path d="M12 12a2 2 0 1 0 2-2 2 2 0 0 0-2 2Z"/></svg>
                     Horoscope
                  </h3>
                  <p className="text-foreground/80">{userProfile.horoscopeSign}</p>
                </div>
              )}
              
              <div className="space-y-1">
                <h3 className="font-semibold text-foreground/90">About Me</h3>
                <p className="text-foreground/80 leading-relaxed">{userProfile.bio}</p>
              </div>

              {userProfile.interests.length > 0 && (
                <div className="space-y-1">
                  <h3 className="font-semibold text-foreground/90">Interests</h3>
                  <div className="flex flex-wrap gap-2">
                    {userProfile.interests.map((interest) => (
                      <Badge key={interest} variant="secondary" className="bg-accent/20 text-accent-foreground/80 border-accent/30">
                        {interest}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>

            <div className="mt-6 flex space-x-3">
              <Button className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground">
                <Heart className="mr-2 h-5 w-5" /> Like Profile
              </Button>
              <Button variant="outline" className="flex-1">
                <MessageSquare className="mr-2 h-5 w-5" /> Send Message
              </Button>
            </div>
             <Button variant="link" className="w-full mt-2 text-muted-foreground hover:text-destructive">
                Report Profile
              </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
