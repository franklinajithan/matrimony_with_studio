import type { User as SupabaseAuthUser } from "@supabase/supabase-js";
import { supabase } from "./client";

export type AuthUser = {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
};

/** Firebase-compatible alias used across existing pages. */
export type User = AuthUser;

let cachedUser: AuthUser | null = null;
let authReady: Promise<void> | null = null;

function mapUser(user: SupabaseAuthUser | null): AuthUser | null {
  if (!user) return null;
  const meta = user.user_metadata || {};
  return {
    uid: user.id,
    email: user.email ?? null,
    displayName: (meta.display_name || meta.full_name || meta.name || null) as string | null,
    photoURL: (meta.photo_url || meta.avatar_url || null) as string | null,
  };
}

function mapAuthError(error: { message?: string; status?: number } | null, fallback: string): never {
  const message = error?.message || fallback;
  const lower = message.toLowerCase();
  let code = "auth/unknown";

  if (lower.includes("invalid login") || lower.includes("invalid credentials")) {
    code = "auth/invalid-credential";
  } else if (lower.includes("already registered") || lower.includes("already been registered")) {
    code = "auth/email-already-in-use";
  } else if (lower.includes("password") && (lower.includes("weak") || lower.includes("at least"))) {
    code = "auth/weak-password";
  } else if (lower.includes("invalid email") || (lower.includes("email") && lower.includes("invalid"))) {
    code = "auth/invalid-email";
  } else if (lower.includes("disabled")) {
    code = "auth/user-disabled";
  } else if (lower.includes("not found") || lower.includes("user not")) {
    code = "auth/user-not-found";
  } else if (lower.includes("network")) {
    code = "auth/network-request-failed";
  } else if (lower.includes("too many")) {
    code = "auth/too-many-requests";
  }

  const err = new Error(message) as Error & { code: string };
  err.code = code;
  throw err;
}

async function hydrateSession() {
  const { data } = await supabase.auth.getSession();
  cachedUser = mapUser(data.session?.user ?? null);
}

export const auth = {
  get currentUser(): AuthUser | null {
    return cachedUser;
  },
};

if (typeof window !== "undefined") {
  authReady = hydrateSession();
  supabase.auth.onAuthStateChange((_event, session) => {
    cachedUser = mapUser(session?.user ?? null);
  });
}

type AuthCallback = (user: AuthUser | null) => void;

export function onAuthStateChanged(
  authOrCallback: unknown,
  maybeCallback?: AuthCallback
): () => void {
  const callback = (typeof authOrCallback === "function" ? authOrCallback : maybeCallback) as AuthCallback;

  let active = true;
  const emit = async () => {
    if (!authReady) authReady = hydrateSession();
    await authReady;
    if (active) callback(cachedUser);
  };
  void emit();

  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    cachedUser = mapUser(session?.user ?? null);
    if (active) callback(cachedUser);
  });

  return () => {
    active = false;
    data.subscription.unsubscribe();
  };
}

export async function signInWithEmailAndPassword(
  _auth: unknown,
  email: string,
  password: string
) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) mapAuthError(error, "Login failed");
  cachedUser = mapUser(data.user);
  return { user: cachedUser };
}

export async function createUserWithEmailAndPassword(
  _auth: unknown,
  email: string,
  password: string,
  extras?: { displayName?: string }
) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: extras?.displayName ? { data: { display_name: extras.displayName } } : undefined,
  });
  if (error) mapAuthError(error, "Signup failed");
  cachedUser = mapUser(data.user);
  return { user: cachedUser };
}

export async function signOut(_auth?: unknown) {
  const { error } = await supabase.auth.signOut();
  if (error) mapAuthError(error, "Logout failed");
  cachedUser = null;
}

export async function sendPasswordResetEmail(_auth: unknown, email: string) {
  const redirectTo =
    typeof window !== "undefined" ? `${window.location.origin}/login` : undefined;
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
  if (error) mapAuthError(error, "Could not send reset email");
}

export async function updateProfile(
  _user: AuthUser | null,
  updates: { displayName?: string | null; photoURL?: string | null }
) {
  const metadata: Record<string, string> = {};
  if (updates.displayName !== undefined) metadata.display_name = updates.displayName || "";
  if (updates.photoURL !== undefined) metadata.photo_url = updates.photoURL || "";

  const { data, error } = await supabase.auth.updateUser({ data: metadata });
  if (error) mapAuthError(error, "Could not update profile");
  cachedUser = mapUser(data.user);

  if (cachedUser) {
    const profilePatch: Record<string, string> = {};
    if (updates.displayName !== undefined) profilePatch.display_name = updates.displayName || "";
    if (updates.photoURL !== undefined) profilePatch.photo_url = updates.photoURL || "";
    if (Object.keys(profilePatch).length > 0) {
      await supabase.from("profiles").update(profilePatch).eq("id", cachedUser.uid);
    }
  }

  return cachedUser;
}
