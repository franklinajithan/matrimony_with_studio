
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, CalendarDays, UserCircle, MessageSquare } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

// Mock function to get post data by slug
const getPostData = async (slug: string) => {
  // In a real app, you would fetch this from a CMS or database
  const mockPosts: { [key: string]: any } = {
    'finding-love-in-modern-times': {
      title: 'Finding Love in Modern Times: Navigating the Digital Age',
      author: 'CupidMatch Team',
      authorAvatar: 'https://placehold.co/100x100.png?text=CT',
      date: 'October 26, 2023',
      imageUrl: 'https://placehold.co/1200x600.png',
      dataAiHint: 'digital dating modern technology',
      tags: ['Modern Dating', 'Online Safety', 'Relationships'],
      content: `
        <p>The digital age has revolutionized how we connect, and finding a life partner is no exception. Online matrimonial platforms like CupidMatch offer incredible opportunities but also come with unique challenges. Here are some tips to navigate this landscape:</p>
        <br/>
        <h2 class="text-xl font-semibold my-3">1. Create an Authentic Profile</h2>
        <p>Your profile is your first impression. Be honest and genuine about who you are and what you're looking for. Use clear, recent photos. AI tools can help enhance your bio, but ensure it truly reflects your personality.</p>
        <br/>
        <h2 class="text-xl font-semibold my-3">2. Prioritize Safety</h2>
        <p>While most users are genuine, it's crucial to be cautious. Don't share overly personal information too quickly. Use the platform's secure messaging system and consider video calls before meeting in person. Report any suspicious activity.</p>
        <br/>
        <h2 class="text-xl font-semibold my-3">3. Be Open-Minded but Clear on Dealbreakers</h2>
        <p>You might be surprised by who you connect with. Be open to profiles that might not perfectly match your initial checklist. However, be clear about your non-negotiables, whether they relate to values, lifestyle, or future goals.</p>
        <br/>
        <h2 class="text-xl font-semibold my-3">4. Utilize Platform Features</h2>
        <p>Make the most of features like advanced search filters, horoscope matching, and AI suggestions. These tools are designed to help you find more compatible matches efficiently.</p>
        <br/>
        <p>Finding love in modern times requires a blend of optimism, realism, and smart navigation. Embrace the journey, and let technology be your ally.</p>
      `,
    },
     'cultural-nuances-in-indian-sri-lankan-marriages': {
      title: 'Cultural Nuances in Indian & Sri Lankan Marriages',
      date: 'October 20, 2023',
      author: 'Dr. Priya Sharma',
      authorAvatar: 'https://placehold.co/100x100.png?text=PS',
      imageUrl: 'https://placehold.co/1200x600.png',
      dataAiHint: 'cultural wedding tradition',
      tags: ['Culture', 'Tradition', 'Communication', 'Family'],
      content: `
        <p>Marriages in Indian and Sri Lankan cultures are often a beautiful amalgamation of traditions, family involvement, and deep-rooted values. Understanding these nuances is crucial for anyone seeking a partner from these backgrounds.</p>
        <br/>
        <h2 class="text-xl font-semibold my-3">The Role of Family</h2>
        <p>Family plays a significant role in the matchmaking process and in married life. Decisions are often made collectively, and the approval and blessings of elders are highly valued. It's important to be respectful and understanding of these dynamics.</p>
        <br/>
        <h2 class="text-xl font-semibold my-3">Respect for Traditions and Rituals</h2>
        <p>Weddings are rich with rituals that have been passed down through generations. Showing an interest in and respect for these traditions can go a long way in building a strong foundation with your partner and their family.</p>
        <br/>
        <h2 class="text-xl font-semibold my-3">Communication Styles</h2>
        <p>Directness in communication might vary. Sometimes, subtlety and indirect communication are preferred, especially when discussing sensitive topics. Learning to read between the lines and practicing empathetic listening are valuable skills.</p>
        <br/>
        <p>While these are general observations, remember that every family and individual is unique. Open communication with your potential partner about their expectations and cultural background is paramount.</p>
      `,
    },
     'astrology-and-compatibility-a-guide': {
      title: 'Astrology and Compatibility: A Beginner\'s Guide',
      date: 'October 15, 2023',
      author: 'Astro Vani',
      authorAvatar: 'https://placehold.co/100x100.png?text=AV',
      imageUrl: 'https://placehold.co/1200x600.png',
      dataAiHint: 'astrology chart stars',
      tags: ['Astrology', 'Compatibility', 'Vedic Science', 'Horoscope'],
      content: `
        <p>In many Indian and Sri Lankan families, astrological compatibility (often called Kundali Milan or Porutham) is a significant factor in matchmaking. While not the only determinant, it's considered a valuable tool for understanding potential harmony between partners.</p>
        <br/>
        <h2 class="text-xl font-semibold my-3">Key Astrological Elements</h2>
        <p><strong>Rasi (Moon Sign):</strong> Your Moon Sign in Vedic astrology represents your mind and emotions. Compatibility between Moon Signs is often checked for emotional understanding.</p>
        <p><strong>Nakshatra (Birth Star):</strong> There are 27 Nakshatras, and your birth Nakshatra is believed to influence your core characteristics. Nakshatra compatibility (like Kuta matching) assesses various aspects of a relationship.</p>
        <p><strong>Lagna (Ascendant):</strong> Your Ascendant sign represents your outer personality and how you project yourself to the world. Its compatibility can indicate a harmonious public life together.</p>
        <br/>
        <h2 class="text-xl font-semibold my-3">How CupidMatch Helps</h2>
        <p>CupidMatch incorporates astrological details into profiles and offers AI-driven compatibility insights. Users can upload horoscope PDFs, and the platform can help extract key details and even provide basic compatibility scores.</p>
        <br/>
        <p>While astrology can offer guidance, it's important to remember that personal connection, understanding, and mutual respect are the cornerstones of any successful relationship. Use astrological insights as a guide, not a rigid rulebook.</p>
      `,
    },
  };
  return mockPosts[slug] || null;
};

interface PageProps {
  params: { slug: string };
}

export default async function BlogPostPage({ params }: PageProps) {
  const post = await getPostData(params.slug);

  if (!post) {
    return (
      <div className="text-center py-20">
        <h1 className="text-3xl font-bold">Post Not Found</h1>
        <p className="text-muted-foreground mt-2">Sorry, we couldn't find the blog post you were looking for.</p>
        <Button asChild variant="link" className="mt-4">
          <Link href="/blog">Back to Blog</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <article className="space-y-8">
        <header className="space-y-4">
          <Button variant="outline" size="sm" asChild className="mb-6 text-sm">
            <Link href="/blog" className="flex items-center">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Blog
            </Link>
          </Button>
          {post.imageUrl && (
            <div className="relative w-full h-64 md:h-96 rounded-lg overflow-hidden shadow-lg">
              <Image
                src={post.imageUrl}
                alt={post.title}
                fill
                className="object-cover"
                data-ai-hint={post.dataAiHint || "blog feature image"}
                priority
              />
            </div>
          )}
          <h1 className="font-headline text-4xl md:text-5xl font-bold text-primary leading-tight">
            {post.title}
          </h1>
          <div className="flex items-center space-x-4 text-muted-foreground text-sm">
            <div className="flex items-center">
              <Avatar className="h-8 w-8 mr-2">
                <AvatarImage src={post.authorAvatar} alt={post.author} />
                <AvatarFallback>{post.author.substring(0,1)}</AvatarFallback>
              </Avatar>
              <span>By {post.author}</span>
            </div>
            <div className="flex items-center">
              <CalendarDays className="h-4 w-4 mr-1.5" />
              <span>{post.date}</span>
            </div>
          </div>
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2">
              {post.tags.map((tag: string) => (
                <Badge key={tag} variant="secondary" className="bg-accent/20 text-accent-foreground/90 border-accent/30">{tag}</Badge>
              ))}
            </div>
          )}
        </header>

        <Separator />

        <div
          className="prose prose-lg max-w-none dark:prose-invert text-foreground/90 
                     prose-headings:font-headline prose-headings:text-foreground 
                     prose-a:text-primary hover:prose-a:text-primary/80
                     prose-strong:text-foreground/90
                     prose-blockquote:border-l-primary prose-blockquote:text-muted-foreground"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        <Separator />

        <section className="space-y-6">
          <h2 className="text-2xl font-semibold flex items-center">
            <MessageSquare className="mr-3 h-6 w-6 text-primary" /> Comments (Placeholder)
          </h2>
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              <p>Comments section coming soon!</p>
              <p className="text-sm">We'd love to hear your thoughts on this post.</p>
            </CardContent>
          </Card>
        </section>
      </article>
    </div>
  );
}
