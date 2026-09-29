"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Ban, Loader2, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface BlockMemberButtonProps {
  memberId: string;
  memberName?: string;
  variant?: "default" | "ghost" | "outline" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  onBlockStatusChange?: (isBlocked: boolean) => void;
}

export function BlockMemberButton({
  memberId,
  memberName = "this member",
  variant = "ghost",
  size = "sm",
  className,
  onBlockStatusChange,
}: BlockMemberButtonProps) {
  const [open, setOpen] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const { toast } = useToast();

  // Check if member is already blocked
  useEffect(() => {
    const checkBlockStatus = async () => {
      setChecking(true);
      try {
        const response = await fetch('/api/members/block');
        if (response.ok) {
          const data = await response.json();
          const blocked = data.blocks?.some((b: any) => b.blocked_id === memberId);
          setIsBlocked(blocked || false);
        }
      } catch (error) {
        console.error('Error checking block status:', error);
      } finally {
        setChecking(false);
      }
    };

    checkBlockStatus();
  }, [memberId]);

  const handleBlock = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/members/block', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blockedMemberId: memberId }),
      });

      if (!response.ok) {
        throw new Error('Failed to block member');
      }

      setIsBlocked(true);
      toast({
        title: "Member blocked",
        description: `${memberName} has been blocked. They will no longer appear in your discovery, and you won&apos;t be able to message each other.`,
      });

      onBlockStatusChange?.(true);
      setOpen(false);
    } catch (error) {
      console.error('Error blocking member:', error);
      toast({
        title: "Unable to block member",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUnblock = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/members/block?memberId=${memberId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to unblock member');
      }

      setIsBlocked(false);
      toast({
        title: "Member unblocked",
        description: `${memberName} has been unblocked. You can now interact with them again.`,
      });

      onBlockStatusChange?.(false);
      setOpen(false);
    } catch (error) {
      console.error('Error unblocking member:', error);
      toast({
        title: "Unable to unblock member",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <Button variant={variant} size={size} className={className} disabled>
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading...
      </Button>
    );
  }

  if (isBlocked) {
    return (
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogTrigger asChild>
          <Button variant={variant} size={size} className={className}>
            <Shield className="mr-2 h-4 w-4" />
            Unblock
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unblock {memberName}?</AlertDialogTitle>
            <AlertDialogDescription>
              Unblocking will allow {memberName} to:
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                <li>Appear in your discovery</li>
                <li>Send you connection requests</li>
                <li>Message you if you&apos;re connected</li>
              </ul>
              <p className="mt-3">
                Previous connections will not be automatically restored.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleUnblock}
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {loading ? "Unblocking..." : "Unblock"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant={variant} size={size} className={className}>
          <Ban className="mr-2 h-4 w-4" />
          Block
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Block {memberName}?</AlertDialogTitle>
          <AlertDialogDescription>
            Blocking will prevent {memberName} from:
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
              <li>Appearing in your discovery</li>
              <li>Sending you new connection requests</li>
              <li>Messaging you</li>
            </ul>
            <p className="mt-3">
              Any existing connection will be removed, but historical messages will be preserved. 
              {memberName} will not be notified that they&apos;ve been blocked.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleBlock}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700"
          >
            {loading ? "Blocking..." : "Block Member"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
