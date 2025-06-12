
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, Users, Globe, ShieldCheck } from "lucide-react"; // Added ShieldCheck

export default function AboutUsPage() {
  return (
    <div className="space-y-12 py-8">
      <section className="text-center py-12 bg-gradient-to-br from-rose-50 to-peach-100 rounded-xl shadow-lg">
        <h1 className="font-headline text-5xl font-bold text-primary mb-6">
          About MatchCraft
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Crafting Connections, Building Futures. We are dedicated to helping you find your perfect life partner within the Indian and Sri Lankan communities.
        </p>
      </section>

      <section className="grid md:grid-cols-2 gap-8 items-center">
        <div className="prose lg:prose-lg max-w-none">
          <h2 className="font-headline text-3xl font-semibold text-gray-800 mb-4">Our Mission</h2>
          <p className="text-lg text-foreground/80 leading-relaxed mb-6">
            At MatchCraft, our mission is to provide a safe, secure, and effective platform for individuals from Indian and Sri Lankan backgrounds to connect and find meaningful, long-lasting relationships. We believe in the power of compatibility, tradition, and modern technology to bring people together.
          </p>
          <h2 className="font-headline text-3xl font-semibold text-gray-800 mb-4">Our Vision</h2>
          <p className="text-lg text-foreground/80 leading-relaxed">
            We envision a world where finding a life partner is a joyful and empowering experience. MatchCraft aims to be the most trusted and preferred matrimonial service, celebrated for creating countless successful love stories and happy families.
          </p>
        </div>
        <div className="flex justify-center items-center">
           <Image
            src="https://placehold.co/500x400.png?text=Our+Story"
            alt="Symbolic image representing connection and community"
            width={500}
            height={400}
            className="rounded-xl shadow-md object-cover"
            data-ai-hint="community connection"
          />
        </div>
      </section>

      <section className="py-10">
        <h2 className="font-headline text-3xl font-semibold text-gray-800 text-center mb-10">Why Choose MatchCraft?</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card className="shadow-md hover:shadow-lg transition-shadow bg-card">
            <CardHeader className="items-center text-center">
              <div className="p-3 bg-primary/10 rounded-full inline-block mb-3">
                <Users className="h-10 w-10 text-primary" />
              </div>
              <CardTitle className="font-headline text-xl text-card-foreground">Community Focused</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-sm text-muted-foreground">Tailored for the unique cultural nuances and preferences of Indian and Sri Lankan communities worldwide.</p>
            </CardContent>
          </Card>
          <Card className="shadow-md hover:shadow-lg transition-shadow bg-card">
            <CardHeader className="items-center text-center">
              <div className="p-3 bg-primary/10 rounded-full inline-block mb-3">
                <Globe className="h-10 w-10 text-primary" />
              </div>
              <CardTitle className="font-headline text-xl text-card-foreground">Intelligent Matching</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-sm text-muted-foreground">Leveraging AI and detailed preferences to suggest highly compatible profiles, including horoscope matching.</p>
            </CardContent>
          </Card>
          <Card className="shadow-md hover:shadow-lg transition-shadow bg-card">
            <CardHeader className="items-center text-center">
               <div className="p-3 bg-primary/10 rounded-full inline-block mb-3">
                <ShieldCheck className="h-10 w-10 text-primary" />
              </div>
              <CardTitle className="font-headline text-xl text-card-foreground">Safe & Secure</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-sm text-muted-foreground">Prioritizing your privacy and safety with verified profiles and secure communication channels.</p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="text-center py-10">
        <Heart className="w-12 h-12 text-primary mx-auto mb-4" />
        <p className="text-lg text-muted-foreground">
          Join MatchCraft today and take the first step towards finding your happily ever after.
        </p>
      </section>
    </div>
  );
}
