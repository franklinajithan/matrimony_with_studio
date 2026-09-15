"use client";

import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { MessagesWorkspace } from "@/components/messages/MessagesWorkspace";

function MessagesFallback() {
  return (
    <div className="flex h-[70vh] items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<MessagesFallback />}>
      <MessagesWorkspace />
    </Suspense>
  );
}
