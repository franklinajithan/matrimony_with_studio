"use client";

import { useEffect } from "react";
import { consumeLoginWelcome } from "@/lib/auth/welcome-toast";
import { useToast } from "@/hooks/use-toast";

export function useLoginWelcomeToast() {
  const { toast, dismiss } = useToast();

  useEffect(() => {
    if (!consumeLoginWelcome()) return;
    const result = toast({
      title: "Welcome back",
      description: "You are signed in.",
      duration: 4000,
    });
    const timer = window.setTimeout(() => dismiss(result.id), 4000);
    return () => window.clearTimeout(timer);
  }, [dismiss, toast]);
}
