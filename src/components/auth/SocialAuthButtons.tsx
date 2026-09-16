"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { signInWithOAuth, type OAuthProvider } from "@/lib/supabase/auth";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.4-.18-2.07H12v3.91h5.38a4.6 4.6 0 0 1-2 3.02v2.54h3.24c1.9-1.75 2.98-4.33 2.98-7.4Z" />
      <path fill="#34A853" d="M12 22c2.7 0 4.98-.9 6.63-2.43l-3.24-2.54c-.9.6-2.05.96-3.39.96-2.61 0-4.82-1.76-5.61-4.13H3.05v2.62A10 10 0 0 0 12 22Z" />
      <path fill="#FBBC05" d="M6.39 13.86A6.02 6.02 0 0 1 6.08 12c0-.65.11-1.28.31-1.86V7.52H3.05A10 10 0 0 0 2 12c0 1.61.39 3.14 1.05 4.48l3.34-2.62Z" />
      <path fill="#EA4335" d="M12 6.01c1.47 0 2.79.5 3.82 1.5l2.88-2.88A9.65 9.65 0 0 0 12 2a10 10 0 0 0-8.95 5.52l3.34 2.62C7.18 7.77 9.39 6.01 12 6.01Z" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path fill="#1877F2" d="M24 12a12 12 0 1 0-13.88 11.85v-8.47H7.08V12h3.04V9.42c0-3 1.79-4.66 4.53-4.66 1.31 0 2.69.23 2.69.23v2.96h-1.52c-1.49 0-1.96.93-1.96 1.88V12h3.33l-.53 3.38h-2.8v8.47A12 12 0 0 0 24 12Z" />
      <path fill="#fff" d="m16.66 15.38.53-3.38h-3.33V9.83c0-.95.47-1.88 1.96-1.88h1.52V4.99s-1.38-.23-2.69-.23c-2.74 0-4.53 1.66-4.53 4.66V12H7.08v3.38h3.04v8.47a12.1 12.1 0 0 0 3.74 0v-8.47h2.8Z" />
    </svg>
  );
}

export function SocialAuthButtons({ next = "/dashboard" }: { next?: string }) {
  const { toast } = useToast();
  const [loadingProvider, setLoadingProvider] = useState<OAuthProvider | null>(null);

  async function continueWith(provider: OAuthProvider) {
    setLoadingProvider(provider);
    try {
      await signInWithOAuth(provider, next);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Please try again.";
      toast({
        title: `${provider === "google" ? "Google" : "Facebook"} sign-in failed`,
        description: message,
        variant: "destructive",
      });
      setLoadingProvider(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Button
          type="button"
          variant="outline"
          className="min-h-11 bg-background"
          disabled={loadingProvider !== null}
          onClick={() => void continueWith("google")}
        >
          {loadingProvider === "google" ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <span className="mr-2"><GoogleIcon /></span>}
          Google
        </Button>
        <Button
          type="button"
          variant="outline"
          className="min-h-11 bg-background"
          disabled={loadingProvider !== null}
          onClick={() => void continueWith("facebook")}
        >
          {loadingProvider === "facebook" ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <span className="mr-2"><FacebookIcon /></span>}
          Facebook
        </Button>
      </div>
      <div className="flex items-center gap-3" aria-hidden="true">
        <span className="h-px flex-1 bg-border" />
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">or use email</span>
        <span className="h-px flex-1 bg-border" />
      </div>
    </div>
  );
}
