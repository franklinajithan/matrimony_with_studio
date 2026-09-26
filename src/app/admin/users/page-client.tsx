
"use client";

import React, { useEffect, useState, useMemo } from 'react';

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
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = subscribeToProfiles((fetched) => {
      setUsers(fetched.map((profile) => ({
        id: profile.id,
        displayName: profile.displayName,
        email: profile.email || undefined,
        isAdmin: profile.isAdmin,
        isVerified: profile.isVerified,
        createdAt: profile.createdAt,
        photoURL: profile.photoURL,
      })));
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
      <p className="text-slate-600">View member accounts. Role changes and bans are disabled until server-authorized, audited actions are implemented.</p>

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


