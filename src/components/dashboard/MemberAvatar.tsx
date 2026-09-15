"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { hasRealPhoto, memberInitials } from "@/lib/onboarding/readiness";
import { resolveMediaUrl } from "@/lib/supabase/storage";
import { cn } from "@/lib/utils";

export function MemberAvatar({
  name,
  photoURL,
  className,
  alt,
}: {
  name?: string | null;
  photoURL?: string | null;
  className?: string;
  alt?: string;
}) {
  const label = name?.trim() || "Member";
  const resolved = resolveMediaUrl(photoURL);
  const src = hasRealPhoto(resolved) ? resolved : undefined;

  return (
    <Avatar className={cn("h-10 w-10 border border-border", className)}>
      {src ? (
        <AvatarImage src={src} alt={alt || `Profile photo of ${label}`} className="object-cover" />
      ) : null}
      <AvatarFallback className="bg-accent text-sm font-semibold text-primary">
        {memberInitials(label)}
      </AvatarFallback>
    </Avatar>
  );
}
