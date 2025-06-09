
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Heart, MessageSquare, Briefcase, MapPin, Cake, Languages, CheckCircle, Ruler, Star as StarIcon } from 'lucide-react'; // Added StarIcon for horoscope

// Mock data - replace with actual data fetching
const mockProfilesData: { [key: string]: any } = {
  '1': { id: '1', name: 'Rohan Sharma', age: 30, profession: 'Doctor', location: 'Delhi, India', bio: "Loves coding, chai, and long walks on the beach (if there was one in Delhi). Looking for someone with a good sense of humor.", interests: ['Music', 'Books', 'Cricket'], photos: [{ id: 'p1', url: 'https://placehold.co/600x800.png', alt: 'Rohan Sharma Profile Photo 1', dataAiHint: 'man indian' }], religion: 'Hindu', caste: 'Sharma', language: 'Hindi, English', height: '175 cm (5\'9")', isVerified: true, horoscopeSign: 'Aries' },
  '2': { id: '2', name: 'Priya Patel', age: 27, profession: 'Architect', location: 'Bangalore, India', bio: "Creative soul, passionate about design and sustainability. Enjoys art, yoga, and exploring cafes.", interests: ['Art', 'Yoga', 'Travel'], photos: [{ id: 'p1', url: 'https://placehold.co/600x800.png', alt: 'Priya Patel Profile Photo 1', dataAiHint: 'woman professional' }], religion: 'Hindu', caste: 'Patel', language: 'Gujarati, English', height: '160 cm (5\'3")', isVerified: false, horoscopeSign: 'Taurus' },
  '3': { id: '3', name: 'Amit Singh', age: 32, profession: 'Marketing Manager', location: 'Pune, India', bio: "Driven and ambitious, loves a good challenge. Enjoys sports, movies, and trying new restaurants.", interests: ['Sports', 'Movies', 'Foodie'], photos: [{ id: 'p1', url: 'https://placehold.co/600x800.png', alt: 'Amit Singh Profile Photo 1', dataAiHint: 'man smiling' }], religion: 'Sikh', caste: 'Singh', language: 'Punjabi, English', height: '180 cm (5\'11")', isVerified: true, horoscopeSign: 'Gemini' },
  '4': { id: '4', name: 'Sneha Reddy', age: 29, profession: 'Graphic Designer', location: 'Hyderabad, India', bio: "Visual storyteller with a love for all things creative. Passionate about photography, dance, and social causes.", interests: ['Photography', 'Dance', 'Volunteering'], photos: [{ id: 'p1', url: 'https://placehold.co/600x800.png', alt: 'Sneha Reddy Profile Photo 1', dataAiHint: 'woman creative' }], religion: 'Hindu', caste: 'Reddy', language: 'Telugu, English', height: '168 cm (5\'6")', isVerified: true, horoscopeSign: 'Cancer' },
  '5': { id: '5', name: 'Vikram Kumar', age: 28, profession: 'Civil Engineer', location: 'Chennai, India', bio: "Building dreams, one project at a time. Enjoys gaming, trekking, and exploring historical places.", interests: ['Gaming', 'Trekking', 'History'], photos: [{ id: 'p1', url: 'https://placehold.co/600x800.png', alt: 'Vikram Kumar Profile Photo 1', dataAiHint: 'man outdoor' }], religion: 'Hindu', caste: 'Kumar', language: 'Tamil, English', height: '170 cm (5\'7")', isVerified: false, horoscopeSign: 'Leo' },
  '6': { id: '6', name: 'Anjali Desai', age: 26, profession: 'Teacher', location: 'Ahmedabad, India', bio: "Shaping young minds and making a difference. Loves crafts, reading, and spending time with family.", interests: ['Crafts', 'Reading', 'Family Time'], photos: [{ id: 'p1', url: 'https://placehold.co/600x800.png', alt: 'Anjali Desai Profile Photo 1', dataAiHint: 'woman glasses' }], religion: 'Jain', caste: 'Desai', language: 'Gujarati, English', height: '155 cm (5\'1")', isVerified: true, horoscopeSign: 'Virgo' },
  'default': { id: '0', name: 'User Not Found', age: 0, profession: 'N/A', location: 'N/A', bio: "This profile could not be found.", interests: [], photos: [{id: 'pd', url: 'https://placehold.co/600x800.png', alt: 'Profile not found', dataAiHint: 'placeholder question mark'}], religion: 'N/A', caste: 'N/A', language: 'N/A', height: 'N/A', isVerified: false, horoscopeSign: 'N/A' }
};

type ProfilePageProps = {
  params: { userId: string };
};

export default function ProfilePage({ params }: ProfilePageProps) {
  // In a real app, you would fetch user data based on params.userId
  const userProfile = mockProfilesData[params.userId] || mockProfilesData['default'];

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="overflow-hidden shadow-xl">
        <div className="md:flex">
          <div className="md:w-1/2 relative">
            {userProfile.photos.length > 0 && (
              <Image
                src={userProfile.photos[0].url}
                alt={userProfile.photos[0].alt || `Profile photo of ${userProfile.name}`}
                width={600}
                height={800}
                className="object-cover w-full h-[400px] md:h-full"
                priority
                data-ai-hint={userProfile.photos[0].dataAiHint || "profile image"}
              />
            )}
            {/* Simple photo indicator, not a full carousel */}
            {userProfile.photos.length > 1 && (
                 <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                    {userProfile.photos.map((photo: any, index: number) => (
                        <button key={photo.id} aria-label={`View photo ${index + 1}`} className={`w-3 h-3 rounded-full ${index === 0 ? 'bg-primary' : 'bg-gray-300 opacity-75 hover:opacity-100'}`}></button>
                    ))}
                </div>
            )}
          </div>
          <div className="md:w-1/2 p-6 md:p-8 flex flex-col">
            <CardHeader className="p-0 mb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="font-headline text-3xl md:text-4xl text-primary">{userProfile.name}</CardTitle>
                {userProfile.isVerified && (
                  <Badge variant="default" className="bg-green-500 text-white flex items-center gap-1 text-xs px-2 py-0.5">
                    <CheckCircle className="h-3.5 w-3.5" /> Verified
                  </Badge>
                )}
              </div>
              <CardDescription className="text-lg text-muted-foreground">{userProfile.age} years old</CardDescription>
            </CardHeader>

            <CardContent className="p-0 space-y-3 md:space-y-4 flex-grow">
              <div className="space-y-0.5">
                <h3 className="font-semibold text-foreground/90 flex items-center text-sm"><Briefcase className="mr-2 h-4 w-4 text-primary/80" />Profession</h3>
                <p className="text-foreground/80 text-sm">{userProfile.profession}</p>
              </div>
              <div className="space-y-0.5">
                <h3 className="font-semibold text-foreground/90 flex items-center text-sm"><MapPin className="mr-2 h-4 w-4 text-primary/80" />Location</h3>
                <p className="text-foreground/80 text-sm">{userProfile.location}</p>
              </div>
              <div className="space-y-0.5">
                <h3 className="font-semibold text-foreground/90 flex items-center text-sm"><Ruler className="mr-2 h-4 w-4 text-primary/80" />Height</h3>
                <p className="text-foreground/80 text-sm">{userProfile.height}</p>
              </div>
              <div className="space-y-0.5">
                <h3 className="font-semibold text-foreground/90 flex items-center text-sm"><Languages className="mr-2 h-4 w-4 text-primary/80" />Languages</h3>
                <p className="text-foreground/80 text-sm">{userProfile.language}</p>
              </div>
              <div className="space-y-0.5">
                <h3 className="font-semibold text-foreground/90 flex items-center text-sm"><Cake className="mr-2 h-4 w-4 text-primary/80" />Religion & Caste</h3>
                <p className="text-foreground/80 text-sm">{userProfile.religion}, {userProfile.caste}</p>
              </div>
              {userProfile.horoscopeSign && (
                <div className="space-y-0.5">
                  <h3 className="font-semibold text-foreground/90 flex items-center text-sm">
                     <StarIcon className="mr-2 h-4 w-4 text-primary/80" />
                     Horoscope
                  </h3>
                  <p className="text-foreground/80 text-sm">{userProfile.horoscopeSign}</p>
                </div>
              )}
              
              <div className="space-y-1">
                <h3 className="font-semibold text-foreground/90 text-sm">About Me</h3>
                <p className="text-foreground/80 leading-relaxed text-sm">{userProfile.bio}</p>
              </div>

              {userProfile.interests.length > 0 && (
                <div className="space-y-1">
                  <h3 className="font-semibold text-foreground/90 text-sm">Interests</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {userProfile.interests.map((interest: string) => (
                      <Badge key={interest} variant="secondary" className="bg-accent/10 text-accent-foreground/90 border-accent/20 text-xs">
                        {interest}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>

            <div className="mt-6 space-y-3">
              <div className="flex space-x-3">
                <Button className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground">
                  <Heart className="mr-2 h-4 w-4" /> Like
                </Button>
                <Button variant="outline" className="flex-1">
                  <MessageSquare className="mr-2 h-4 w-4" /> Message
                </Button>
              </div>
               <Button variant="link" className="w-full text-xs text-muted-foreground hover:text-destructive p-0 h-auto">
                  Report Profile
                </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
