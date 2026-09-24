"use client";

import { Suspense } from "react";
import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { MessagesWorkspace } from "@/components/messages/MessagesWorkspace";

export default function ChatPage() {
  const params = useParams();
  const rawChatId = params.chatId;
  const chatId = Array.isArray(rawChatId) ? rawChatId[0] : rawChatId;

  return (
    <Suspense
      fallback={
        <div className="flex h-[70vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      {chatId ? (
        <MessagesWorkspace initialChatId={decodeURIComponent(chatId)} />
      ) : (
        <div className="flex h-[70vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}
    </Suspense>
  );
}
