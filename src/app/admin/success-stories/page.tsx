
"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { db } from '@/lib/firebase/config';
import { collection, onSnapshot, query, orderBy, Timestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Eye, Edit3, Loader2, Search, BookHeart, PlusCircle } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface SuccessStoryData {
  id: string;
  coupleNames?: string;
  status?: 'pending' | 'approved' | 'rejected';
  submittedAt?: Timestamp;
  storyText?: string; 
}

export default function AdminSuccessStoriesPage() {
  const [stories, setStories] = useState<SuccessStoryData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    setIsLoading(true);
    const storiesColRef = collection(db, 'successStories');
    // Order by submission date, newest first for pending, or by status then date.
    const q = query(storiesColRef, orderBy('status', 'asc'), orderBy('submittedAt', 'desc'));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedStories: SuccessStoryData[] = [];
      querySnapshot.forEach((doc) => {
        fetchedStories.push({ id: doc.id, ...doc.data() } as SuccessStoryData);
      });
      setStories(fetchedStories);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching success stories:", error);
      toast({
        title: "Error Loading Stories",
        description: "Could not fetch success stories. Please try again.",
        variant: "destructive",
      });
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [toast]);

  const filteredStories = useMemo(() => {
    if (!searchTerm) return stories;
    return stories.filter(story =>
      (story.coupleNames?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (story.id?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (story.status?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );
  }, [stories, searchTerm]);

  const getStatusBadgeVariant = (status?: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'approved':
        return 'default'; // Green (using primary for now)
      case 'pending':
        return 'secondary'; // Yellow/Amber (using secondary)
      case 'rejected':
        return 'destructive'; // Red
      default:
        return 'outline';
    }
  };
   const getStatusBadgeClasses = (status?: string): string => {
    switch (status) {
      case 'approved':
        return 'bg-green-500 hover:bg-green-600 text-white';
      case 'pending':
        return 'bg-amber-500 hover:bg-amber-600 text-white';
      default:
        return ''; // Uses default destructive or outline styles
    }
  };


  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
            <h1 className="text-3xl font-bold text-slate-700 flex items-center gap-2">
                <BookHeart className="h-8 w-8 text-primary"/>Manage Success Stories
            </h1>
            <p className="text-slate-600 mt-1">Review, edit, and publish submitted love stories.</p>
        </div>
        <Button variant="outline" asChild>
            <Link href={`/admin/success-stories/edit/new`}>
                <PlusCircle className="mr-2 h-4 w-4"/> Add New Story Manually
            </Link>
        </Button>
      </div>
      

      <div className="flex items-center gap-2 p-1 rounded-md border border-input bg-card focus-within:ring-2 focus-within:ring-ring">
        <Search className="h-5 w-5 ml-2 text-muted-foreground" />
        <Input
            type="text"
            placeholder="Filter by names, ID, or status..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full border-none shadow-none focus-visible:ring-0 h-9"
        />
      </div>

      <div className="overflow-x-auto bg-card p-4 rounded-lg shadow">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">Couple Names</TableHead>
              <TableHead>Submitted At</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredStories.map((story) => (
              <TableRow key={story.id}>
                <TableCell className="font-medium">{story.coupleNames || 'N/A'}</TableCell>
                <TableCell>
                  {story.submittedAt ? format(story.submittedAt.toDate(), 'PPp') : 'N/A'}
                </TableCell>
                <TableCell className="text-center">
                  <Badge 
                    variant={getStatusBadgeVariant(story.status)} 
                    className={getStatusBadgeClasses(story.status)}
                  >
                    {story.status || 'Unknown'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right space-x-1">
                  <Button variant="ghost" size="icon" asChild title="View/Edit Story">
                    <Link href={`/admin/success-stories/edit/${story.id}`}>
                        <Edit3 className="h-4 w-4" />
                    </Link>
                  </Button>
                  {/* Placeholder for future actions like Delete */}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {filteredStories.length === 0 && !isLoading && (
          <p className="text-center text-slate-500 py-8">
            {stories.length > 0 && searchTerm ? `No stories found matching "${searchTerm}".` : "No success stories submitted yet."}
          </p>
        )}
      </div>
    </div>
  );
}
