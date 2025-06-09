import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageSquarePlus, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

const mockConversations = [
  { id: '1', name: 'Rohan Sharma', lastMessage: "Hey, how are you doing? Liked your profile!", unreadCount: 2, timestamp: "10:30 AM", avatarUrl: "https://placehold.co/100x100", dataAiHint:"man portrait" },
  { id: '2', name: 'Priya Patel', lastMessage: "Thanks for the connection! Yes, I'd love to chat.", unreadCount: 0, timestamp: "Yesterday", avatarUrl: "https://placehold.co/100x100", dataAiHint:"woman smiling" },
  { id: '3', name: 'Amit Singh', lastMessage: "Let's catch up sometime this week?", unreadCount: 5, timestamp: "Mon", avatarUrl: "https://placehold.co/100x100", dataAiHint:"man professional" },
  { id: '4', name: 'Sneha Reddy', lastMessage: "Your interests are quite similar to mine!", unreadCount: 0, timestamp: "Sun", avatarUrl: "https://placehold.co/100x100", dataAiHint:"woman creative" },
];

export default function MessagesPage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
            <h1 className="font-headline text-4xl font-semibold text-gray-800">Your Conversations</h1>
            <p className="mt-1 text-lg text-muted-foreground">Connect and chat with your matches.</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <MessageSquarePlus className="mr-2 h-5 w-5" /> Start New Chat
        </Button>
      </div>

      <Card className="shadow-lg">
        <CardHeader className="border-b">
          <div className="flex items-center space-x-2">
            <Search className="h-5 w-5 text-muted-foreground" />
            <Input placeholder="Search conversations..." className="border-none focus-visible:ring-0 shadow-none text-base"/>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {mockConversations.length > 0 ? (
            <ul className="divide-y divide-border">
              {mockConversations.map((convo) => (
                <li key={convo.id}>
                  <Link href={`/messages/${convo.id}`} className="block hover:bg-muted/50 transition-colors">
                    <div className="flex items-center p-4 space-x-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={convo.avatarUrl} alt={convo.name} data-ai-hint={convo.dataAiHint} />
                        <AvatarFallback>{convo.name.substring(0, 1).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground truncate">{convo.name}</p>
                        <p className={`text-sm truncate ${convo.unreadCount > 0 ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                          {convo.lastMessage}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">{convo.timestamp}</p>
                        {convo.unreadCount > 0 && (
                          <Badge className="mt-1 bg-primary text-primary-foreground text-xs px-1.5 py-0.5">{convo.unreadCount}</Badge>
                        )}
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-12 text-center">
              <MessageSquarePlus className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No conversations yet.</p>
              <p className="text-sm text-muted-foreground">Start connecting with profiles to begin chatting.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
