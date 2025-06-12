
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookText, CalendarDays, ChevronRight } from 'lucide-react';

const mockBlogPosts = [
  {
    slug: 'finding-love-in-modern-times',
    title: 'Finding Love in Modern Times: Navigating the Digital Age',
    date: 'October 26, 2023',
    author: 'CupidMatch Team',
    snippet: 'The landscape of love has changed dramatically with technology. Discover how to navigate online matchmaking successfully while staying true to your values...',
    tags: ['Modern Dating', 'Online Safety', 'Relationships'],
  },
  {
    slug: 'cultural-nuances-in-indian-sri-lankan-marriages',
    title: 'Cultural Nuances in Indian & Sri Lankan Marriages',
    date: 'October 20, 2023',
    author: 'Dr. Priya Sharma',
    snippet: 'Understanding cultural expectations is key to a harmonious marital life. We delve into common traditions and communication styles...',
    tags: ['Culture', 'Tradition', 'Communication'],
  },
  {
    slug: 'astrology-and-compatibility-a-guide',
    title: 'Astrology and Compatibility: A Beginner\'s Guide',
    date: 'October 15, 2023',
    author: 'Astro Vani',
    snippet: 'How much do the stars influence your match? Learn the basics of Rasi, Nakshatra, and how they play a role in compatibility analysis...',
    tags: ['Astrology', 'Compatibility', 'Vedic Science'],
  },
];

export default function BlogPage() {
  return (
    <div className="space-y-12 py-8">
      <section className="text-center py-12 bg-gradient-to-br from-rose-50 to-peach-100 rounded-xl shadow-lg">
        <div className="flex justify-center mb-4">
          <BookText className="h-16 w-16 text-primary" />
        </div>
        <h1 className="font-headline text-5xl font-bold text-primary mb-6">
          CupidMatch Blog
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Insights, advice, and stories on relationships, culture, and finding your perfect match.
        </p>
      </section>

      <section className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {mockBlogPosts.map((post) => (
          <Card key={post.slug} className="flex flex-col shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out overflow-hidden rounded-lg bg-card">
            <CardHeader className="pb-3">
              <Link href={`/blog/${post.slug}`} className="block hover:text-primary transition-colors">
                <CardTitle className="font-headline text-2xl text-card-foreground ">{post.title}</CardTitle>
              </Link>
              <CardDescription className="text-xs flex items-center pt-1">
                <CalendarDays className="h-3.5 w-3.5 mr-1.5 text-muted-foreground/80" />
                {post.date} by {post.author}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow px-6 pb-4">
              <p className="text-muted-foreground text-sm leading-relaxed line-clamp-3">{post.snippet}</p>
              {post.tags && post.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {post.tags.map(tag => (
                    <span key={tag} className="px-2 py-0.5 text-xs bg-primary/10 text-primary rounded-full">{tag}</span>
                  ))}
                </div>
              )}
            </CardContent>
            <CardFooter className="p-5 border-t">
              <Button variant="link" asChild className="w-full justify-start text-primary hover:text-primary/80 p-0">
                <Link href={`/blog/${post.slug}`}>
                  Read More <ChevronRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </section>

      <div className="text-center mt-12">
        <Button variant="outline" size="lg">
          Load More Posts
        </Button>
      </div>
    </div>
  );
}
