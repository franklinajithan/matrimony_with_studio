
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, UserCheck, MessageSquareWarning, Settings } from "lucide-react";
import Link from "next/link";

const adminSections = [
  { title: "User Management", description: "View and manage user accounts.", icon: <Users className="h-6 w-6" />, href: "/admin/users" },
  { title: "Profile Verification", description: "Approve or reject profile verification requests.", icon: <UserCheck className="h-6 w-6" />, href: "/admin/verifications" },
  { title: "Reported Content", description: "Review and moderate reported profiles or messages.", icon: <MessageSquareWarning className="h-6 w-6" />, href: "/admin/reports" },
  { title: "Site Settings", description: "Configure global application settings.", icon: <Settings className="h-6 w-6" />, href: "/admin/settings" },
];

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-700">Admin Dashboard</h1>
      <p className="text-slate-600">Welcome to the CupidMatch Admin Panel. Manage your application from here.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {adminSections.map((section) => (
          <Card key={section.title} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-3 text-primary">
                {section.icon}
                <CardTitle className="text-xl">{section.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>{section.description}</CardDescription>
              {/* Placeholder link, actual pages not created yet */}
              <Link href={section.href} className="text-sm text-primary hover:underline mt-3 block">
                Go to {section.title}
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
       <p className="text-sm text-slate-500 mt-8">
        This is a placeholder admin panel. Further development is needed to implement the actual functionalities.
      </p>
    </div>
  );
}
