
"use client";

import Link from 'next/link';
import { useParams } from 'next/navigation';
import React, { useState, useEffect, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { ArrowLeft, Send, Paperclip, Smile } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

// Mock data - In a real app, this would come from an API/Firebase
const mockUsers = {
  chat1: { id: 'chat1', name: 'Rohan Sharma', avatarUrl: 'https://placehold.co/100x100.png', dataAiHint: 'man indian' },
  chat2: { id: 'chat2', name: 'Priya Patel', avatarUrl: 'https://placehold.co/100x100.png', dataAiHint: 'woman professional' },
  chat3: { id: 'chat3', name: 'Amit Singh', avatarUrl: 'https://placehold.co/100x100.png', dataAiHint: 'man smiling' },
  chat4: { id: 'chat4', name: 'Sneha Reddy', avatarUrl: 'https://placehold.co/100x100.png', dataAiHint: 'woman creative' },
};

const mockMessagesData: { [key: string]: Array<{ id: string, senderId: string, text: string, timestamp: string }> } = {
  chat1: [
    { id: 'm1', senderId: 'chat1', text: "Hey, how are you doing? Liked your profile!", timestamp: "10:30 AM" },
    { id: 'm2', senderId: 'currentUser', text: "Hi Rohan! I'm doing well, thanks. Your profile looks great too!", timestamp: "10:32 AM" },
    { id: 'm3', senderId: 'chat1', text: "Thanks! What are you up to this weekend?", timestamp: "10:33 AM" },
  ],
  chat2: [
    { id: 'm4', senderId: 'chat2', text: "Thanks for the connection! Yes, I'd love to chat.", timestamp: "Yesterday" },
  ],
  // Add more mock messages for other chats if needed
};

const currentUserId = 'currentUser'; // Mock current user ID

export default function ChatPage() {
  const params = useParams();
  const chatId = params.chatId as string;
  
  const [otherUser, setOtherUser] = useState<{ id: string; name: string; avatarUrl: string; dataAiHint: string } | null>(null);
  const [messages, setMessages] = useState<Array<{ id: string, senderId: string, text: string, timestamp: string }>>([]);
  const [newMessage, setNewMessage] = useState("");
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // @ts-ignore
    const user = mockUsers[chatId];
    // @ts-ignore
    const chatMessages = mockMessagesData[chatId] || [];
    setOtherUser(user);
    setMessages(chatMessages);
  }, [chatId]);

  useEffect(() => {
    // Scroll to bottom when new messages are added
    if (scrollAreaRef.current) {
        const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
        if (viewport) {
            viewport.scrollTop = viewport.scrollHeight;
        }
    }
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() === "") return;

    const message = {
      id: `m${Date.now()}`,
      senderId: currentUserId,
      text: newMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages(prevMessages => [...prevMessages, message]);
    setNewMessage("");
  };

  if (!otherUser) {
    return (
        <div className="flex items-center justify-center h-full">
            <p>Loading chat...</p>
        </div>
    );
  }

  return (
    <Card className="h-[calc(100vh-10rem)] md:h-[calc(100vh-12rem)] flex flex-col shadow-xl">
      <CardHeader className="flex flex-row items-center space-x-4 p-4 border-b">
        <Button variant="ghost" size="icon" asChild className="mr-2">
          <Link href="/messages">
            <ArrowLeft className="h-5 w-5" />
            <span className="sr-only">Back to messages</span>
          </Link>
        </Button>
        <Avatar>
          <AvatarImage src={otherUser.avatarUrl} alt={otherUser.name} data-ai-hint={otherUser.dataAiHint}/>
          <AvatarFallback>{otherUser.name.substring(0, 1).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div>
          <h2 className="font-semibold text-lg">{otherUser.name}</h2>
          <p className="text-xs text-muted-foreground">Online</p> {/* Placeholder status */}
        </div>
      </CardHeader>

      <CardContent className="flex-grow p-0 overflow-hidden">
        <ScrollArea className="h-full p-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex items-end space-x-2",
                  msg.senderId === currentUserId ? "justify-end" : "justify-start"
                )}
              >
                {msg.senderId !== currentUserId && (
                  <Avatar className="h-8 w-8 self-start">
                    <AvatarImage src={otherUser.avatarUrl} alt={otherUser.name} data-ai-hint={otherUser.dataAiHint} />
                    <AvatarFallback>{otherUser.name.substring(0, 1).toUpperCase()}</AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={cn(
                    "max-w-[70%] rounded-lg px-3 py-2 text-sm shadow",
                    msg.senderId === currentUserId
                      ? "bg-primary text-primary-foreground rounded-br-none"
                      : "bg-muted text-foreground rounded-bl-none"
                  )}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                  <p className={cn(
                      "text-xs mt-1",
                       msg.senderId === currentUserId ? "text-primary-foreground/70 text-right" : "text-muted-foreground text-left"
                    )}>
                    {msg.timestamp}
                  </p>
                </div>
                 {msg.senderId === currentUserId && (
                   <Avatar className="h-8 w-8 self-start">
                    {/* Placeholder for current user's avatar, if available */}
                    <AvatarFallback>Y</AvatarFallback> 
                  </Avatar>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>

      <CardFooter className="p-4 border-t">
        <form onSubmit={handleSendMessage} className="flex w-full items-center space-x-2">
          <Button variant="ghost" size="icon" type="button">
            <Paperclip className="h-5 w-5 text-muted-foreground" />
            <span className="sr-only">Attach file</span>
          </Button>
          <Input
            type="text"
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="flex-1"
            autoComplete="off"
          />
           <Button variant="ghost" size="icon" type="button">
            <Smile className="h-5 w-5 text-muted-foreground" />
            <span className="sr-only">Add emoji</span>
          </Button>
          <Button type="submit" size="icon" className="bg-primary hover:bg-primary/90">
            <Send className="h-5 w-5 text-primary-foreground" />
            <span className="sr-only">Send message</span>
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}
