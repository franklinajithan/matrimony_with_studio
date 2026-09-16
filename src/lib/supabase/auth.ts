import type { User as SupabaseAuthUser, Session } from "@supabase/supabase-js";
import { supabase } from "./client";
import { getSiteUrl, isSupabaseConfigured } from "./env";

export type AuthUser = {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
};

/** Firebase-compatible alias used across existing pages. */
export type User = AuthUser;

export type OAuthProvider = "google" | "facebook";

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
  } else if (lower.includes("too many") || lower.includes("rate limit")) {
    code = "auth/too-many-requests";
  } else if (lower.includes("expired") || lower.includes("invalid") && lower.includes("link")) {
    code = "auth/expired-action-code";
  } else if (lower.includes("invalid api key") || lower.includes("invalid jwt")) {
    code = "auth/invalid-api-key";
  } else if (lower.includes("email not confirmed") || lower.includes("email_not_confirmed")) {
    code = "auth/email-not-confirmed";
  }

  const err = new Error(message) as Error & { code: string };
  err.code = code;
  throw err;
}

function callbackUrl(next: string): string {
  const origin = getSiteUrl();
  return `${origin}/auth/callback?next=${encodeURIComponent(next)}`;
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
  if (!isSupabaseConfigured()) {
    const err = new Error(
      "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) to .env, then restart the dev server."
    ) as Error & { code: string };
    err.code = "auth/invalid-api-key";
    throw err;
  }
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) mapAuthError(error, "Login failed");
  cachedUser = mapUser(data.user);
  return { user: cachedUser, session: data.session };
}

/** Starts a Supabase-hosted OAuth flow. Provider secrets remain in Supabase. */
export async function signInWithOAuth(provider: OAuthProvider, next = "/dashboard") {
  if (!isSupabaseConfigured()) {
    const err = new Error(
      "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, then restart the app."
    ) as Error & { code: string };
    err.code = "auth/invalid-api-key";
    throw err;
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: callbackUrl(next),
      scopes: provider === "facebook" ? "email,public_profile" : "openid email profile",
    },
  });

  if (error) mapAuthError(error, `Could not continue with ${provider}`);
  return data;
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
    options: {
      emailRedirectTo: callbackUrl("/onboarding"),
      data: extras?.displayName ? { display_name: extras.displayName } : undefined,
    },
  });
  if (error) mapAuthError(error, "Signup failed");
  cachedUser = mapUser(data.session?.user ?? data.user);
  return {
    user: cachedUser,
    session: data.session as Session | null,
    needsEmailConfirmation: !data.session,
  };
}

export async function signOut(_auth?: unknown) {
  // Full sign-out so @supabase/ssr auth cookies are cleared (not just localStorage).
  const { error } = await supabase.auth.signOut({ scope: "global" });
  if (error) {
    const local = await supabase.auth.signOut({ scope: "local" });
    if (local.error) mapAuthError(error, "Logout failed");
  }
  cachedUser = null;
  if (typeof window !== "undefined") {
    try {
      Object.keys(window.localStorage)
        .filter((key) => key.startsWith("sb-") || key.includes("firebase"))
        .forEach((key) => window.localStorage.removeItem(key));
    } catch {
      // ignore storage access errors
    }
  }
}

/** Clears the session via the server route, then hard-navigates to the landing page. */
export function signOutToLanding() {
  if (typeof window === "undefined") return;
  window.location.assign("/logout");
}

export async function sendPasswordResetEmail(_auth: unknown, email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: callbackUrl("/reset-password"),
  });
  if (error) mapAuthError(error, "Could not send reset email");
}

export async function updatePassword(password: string) {
  const { error } = await supabase.auth.updateUser({ password });
  if (error) mapAuthError(error, "Could not update password");
}

export async function resendSignupConfirmation(email: string) {
  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: { emailRedirectTo: callbackUrl("/onboarding") },
  });
  if (error) mapAuthError(error, "Could not resend confirmation email");
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
