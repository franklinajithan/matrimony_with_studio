
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldCheck, UserCheck, UserX } from "lucide-react";
import Link from "next/link";

// Mock data - replace with actual data fetching
const mockVerificationRequests = [
  { id: "user123", name: "Aarav Patel", requestedAt: "2023-10-26T10:00:00Z", documentType: "Aadhar Card" },
  { id: "user456", name: "Priya Singh", requestedAt: "2023-10-25T14:30:00Z", documentType: "Passport" },
];

export default function AdminVerificationsPage() {
  // In a real app, you'd fetch these requests from your backend
  const requests = mockVerificationRequests;

  const handleApprove = (userId: string) => {
    // Placeholder for approve logic
    alert(`Approve action for user ${userId} (not implemented)`);
  };

  const handleReject = (userId: string) => {
    // Placeholder for reject logic
    alert(`Reject action for user ${userId} (not implemented)`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-700">Profile Verifications</h1>
        <Button variant="outline" asChild>
          <Link href="/admin">Back to Admin Dashboard</Link>
        </Button>
      </div>
      <p className="text-slate-600">Review and manage user profile verification requests.</p>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Pending Verification Requests
          </CardTitle>
          <CardDescription>
            {requests.length > 0 
              ? "The following users have submitted verification requests." 
              : "No pending verification requests at the moment."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {requests.length > 0 ? (
            <ul className="space-y-4">
              {requests.map((req) => (
                <li key={req.id} className="p-4 border rounded-lg shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <h3 className="font-semibold text-lg">{req.name} <span className="text-sm text-muted-foreground">({req.id})</span></h3>
                    <p className="text-sm text-muted-foreground">Requested: {new Date(req.requestedAt).toLocaleDateString()}</p>
                    <p className="text-sm text-muted-foreground">Document Type: {req.documentType} (Placeholder)</p>
                  </div>
                  <div className="flex space-x-2 mt-2 sm:mt-0">
                    <Button variant="outline" size="sm" onClick={() => alert(`View document for ${req.name} (not implemented)`)}>View Document</Button>
                    <Button variant="default" size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleApprove(req.id)}>
                      <UserCheck className="mr-2 h-4 w-4"/> Approve
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleReject(req.id)}>
                      <UserX className="mr-2 h-4 w-4"/> Reject
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground text-center py-4">
              There are no pending verification requests.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
