"use client";

import { Suspense, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { MessagesWorkspace } from "@/components/messages/MessagesWorkspace";

function ChatRedirect() {
  const params = useParams();
  const router = useRouter();
  const chatId = params.chatId as string;

  useEffect(() => {
    if (chatId) {
      router.replace(`/messages?chat=${encodeURIComponent(chatId)}`);
    }
  }, [chatId, router]);

  return (
    <div className="flex h-[70vh] items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

export default function ChatPage() {
  const params = useParams();
  const chatId = params.chatId as string | undefined;

  return (
    <Suspense
      fallback={
        <div className="flex h-[70vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      {chatId ? <MessagesWorkspace initialChatId={chatId} /> : <ChatRedirect />}
    </Suspense>
  );
}
