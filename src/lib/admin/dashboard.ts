import 'server-only';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export interface AdminDashboardMetrics {
  members: number;
  activeUsers: number;
  pendingVerification: number;
  openReports?: number;
  reportsUnderReview?: number;
  suspendedMembers?: number;
  reportsLast7Days?: number;
  updatedAt: string;
}

/** The RPC independently checks the caller's current admin role in the database. */
export async function getAdminDashboardMetrics(): Promise<AdminDashboardMetrics> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc('admin_dashboard_counts');
  if (error || !data ||
      !['members', 'activeUsers', 'pendingVerification'].every(
        key => Number.isSafeInteger(data[key]) && data[key] >= 0
      ) || typeof data.updatedAt !== 'string' || Number.isNaN(Date.parse(data.updatedAt))) {
    throw new Error('Dashboard statistics are unavailable.');
  }
  return {
    ...data,
    members: data.members,
    activeUsers: data.activeUsers,
    pendingVerification: data.pendingVerification,
    updatedAt: data.updatedAt,
  };
}
