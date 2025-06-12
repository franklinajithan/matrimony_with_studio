
"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { db } from '@/lib/firebase/config';
import { collection, onSnapshot, query, orderBy, doc, updateDoc, getDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Eye, Edit3, UserCheck, UserX, ShieldCheck, ShieldOff, Loader2, Search } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface UserData {
  id: string; // UID
  displayName?: string;
  email?: string;
  isAdmin?: boolean;
  isVerified?: boolean;
  createdAt?: any;
  photoURL?: string;
}

export default function UserManagementPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingUserId, setProcessingUserId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    setIsLoading(true);
    const usersColRef = collection(db, 'users');
    const q = query(usersColRef, orderBy('displayName', 'asc'));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedUsers: UserData[] = [];
      querySnapshot.forEach((doc) => {
        fetchedUsers.push({ id: doc.id, ...doc.data() } as UserData);
      });
      setUsers(fetchedUsers);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching users:", error);
      toast({
        title: "Error Loading Users",
        description: "Could not fetch user data. Please try again.",
        variant: "destructive",
      });
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [toast]);

  const filteredUsers = useMemo(() => {
    if (!searchTerm) return users;
    return users.filter(user =>
      (user.displayName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (user.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (user.id?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );
  }, [users, searchTerm]);

  const toggleAdminStatus = async (userId: string, currentIsAdmin: boolean | undefined) => {
    setProcessingUserId(userId);
    const userDocRef = doc(db, "users", userId);
    try {
      await updateDoc(userDocRef, {
        isAdmin: !currentIsAdmin,
      });
      toast({
        title: "Admin Status Updated",
        description: `User ${users.find(u=>u.id === userId)?.displayName || userId} is ${!currentIsAdmin ? 'now an admin' : 'no longer an admin'}.`,
      });
    } catch (error) {
      console.error("Error updating admin status:", error);
      toast({
        title: "Update Failed",
        description: "Could not update admin status.",
        variant: "destructive",
      });
    } finally {
      setProcessingUserId(null);
    }
  };

  const handleBanUser = async (userId: string) => {
    setProcessingUserId(userId);
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast({
      title: "User Banned (Mock)",
      description: `User ${users.find(u=>u.id === userId)?.displayName || userId} would be banned. Actual ban logic needs implementation.`,
      variant: "destructive"
    });
    setProcessingUserId(null);
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
      <h1 className="text-3xl font-bold text-slate-700">User Management</h1>
      <p className="text-slate-600">View and manage user accounts in CupidMatch.</p>

      <div className="flex items-center gap-2 p-1 rounded-md border border-input bg-card focus-within:ring-2 focus-within:ring-ring">
        <Search className="h-5 w-5 ml-2 text-muted-foreground" />
        <Input
            type="text"
            placeholder="Filter by name, email, or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full border-none shadow-none focus-visible:ring-0 h-9"
        />
      </div>

      <div className="overflow-x-auto bg-card p-4 rounded-lg shadow">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[150px]">User ID</TableHead>
              <TableHead>Display Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead className="text-center">Admin</TableHead>
              <TableHead className="text-center">Verified</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium text-xs truncate max-w-[100px]" title={user.id}>{user.id}</TableCell>
                <TableCell>{user.displayName || 'N/A'}</TableCell>
                <TableCell>{user.email || 'N/A'}</TableCell>
                <TableCell className="text-center">
                  {user.isAdmin ? (
                    <Badge variant="default" className="bg-green-500 hover:bg-green-600 text-white">Yes</Badge>
                  ) : (
                    <Badge variant="secondary">No</Badge>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  {user.isVerified ? (
                    <Badge variant="outline" className="border-blue-500 text-blue-600 bg-blue-500/10">Yes</Badge>
                  ) : (
                    <Badge variant="outline" className="border-amber-500 text-amber-600 bg-amber-500/10">No</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right space-x-1">
                  <Button variant="ghost" size="icon" asChild title="View Profile">
                    <Link href={`/profile/${user.id}`} target="_blank">
                      <Eye className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button variant="ghost" size="icon" title="Edit User" asChild>
                    <Link href={`/admin/users/edit/${user.id}`}>
                        <Edit3 className="h-4 w-4" />
                    </Link>
                  </Button>
                   <AlertDialog>
                    <AlertDialogTrigger asChild>
                       <Button
                          variant="ghost"
                          size="icon"
                          title={user.isAdmin ? "Remove Admin" : "Make Admin"}
                          disabled={processingUserId === user.id}
                          className={user.isAdmin ? "text-orange-600 hover:text-orange-700 hover:bg-orange-100" : "text-green-600 hover:text-green-700 hover:bg-green-100"}
                        >
                          {processingUserId === user.id && user.isAdmin ? <Loader2 className="h-4 w-4 animate-spin" /> : user.isAdmin ? <ShieldOff className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
                       </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                        <AlertDialogTitle>Confirm Admin Status Change</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to {user.isAdmin ? 'remove admin privileges from' : 'grant admin privileges to'} {user.displayName || user.id}?
                        </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                        <AlertDialogCancel disabled={processingUserId === user.id}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => toggleAdminStatus(user.id, user.isAdmin)}
                            disabled={processingUserId === user.id}
                            className={user.isAdmin ? "bg-orange-600 hover:bg-orange-700" : "bg-green-600 hover:bg-green-700"}
                        >
                            {processingUserId === user.id ? <Loader2 className="h-4 w-4 animate-spin mr-2"/> : null}
                            Yes, {user.isAdmin ? 'Remove Admin' : 'Make Admin'}
                        </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" title="Ban User (Placeholder)" className="text-destructive hover:bg-destructive/10" disabled={processingUserId === user.id}>
                           {processingUserId === user.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserX className="h-4 w-4" />}
                        </Button>
                    </AlertDialogTrigger>
                     <AlertDialogContent>
                        <AlertDialogHeader>
                        <AlertDialogTitle>Confirm Ban User</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to ban {user.displayName || user.id}? This action would typically prevent them from accessing the service.
                        </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                        <AlertDialogCancel disabled={processingUserId === user.id}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleBanUser(user.id)} className="bg-destructive hover:bg-destructive/90" disabled={processingUserId === user.id}>
                             {processingUserId === user.id ? <Loader2 className="h-4 w-4 animate-spin mr-2"/> : null}
                            Yes, Ban User
                        </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {filteredUsers.length === 0 && !isLoading && (
          <p className="text-center text-slate-500 py-8">
            {users.length > 0 && searchTerm ? `No users found matching "${searchTerm}".` : "No users found."}
          </p>
        )}
      </div>
    </div>
  );
}

