import "server-only";
import type { User } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AdminPermission =
  | "workspace"
  | "manage"
  | "members"
  | "moderation"
  | "content"
  | "billing"
  | "notifications"
  | "member_read"
  | "notes"
  | "support";

type AdminAccess =
  | { status: "authorized"; user: User }
  | { status: "unauthenticated" | "forbidden" | "unavailable"; user: null };

/** Verify identity and read the current database role on every request. */
export async function getServerAdminAccess(
  permission: AdminPermission = "workspace",
): Promise<AdminAccess> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) return { status: "unauthenticated", user: null };

    // This existing RLS helper derives the caller from auth.uid(). Never trust
    // browser state, user_metadata, or a role supplied by the caller.
    const role = await supabase.rpc("is_admin");
    if (role.error) return { status: "unavailable", user: null };
    if (role.data !== true) {
      if (
        role.data !== false ||
        permission === "manage" ||
        permission === "billing"
      )
        return { status: "forbidden", user: null };
      const scoped = await supabase.rpc("admin_has_permission", {
        p_permission: permission,
      });
      if (scoped.error) return { status: "unavailable", user: null };
      if (scoped.data !== true) return { status: "forbidden", user: null };
    }
    return { status: "authorized", user: data.user };
  } catch {
    // Configuration, Auth and database failures must never grant access.
    return { status: "unavailable", user: null };
  }
}

/** API handlers must call this before any protected read or write. */
export async function requireServerAdmin(
  permission: AdminPermission = "manage",
): Promise<User | null> {
  const access = await getServerAdminAccess(permission);
  return access.status === "authorized" ? access.user : null;
}
