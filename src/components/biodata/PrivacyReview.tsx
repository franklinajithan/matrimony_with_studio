"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { BiodataVisibility } from "@/lib/biodata/types";

export type PrivacyReviewProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  visibility: BiodataVisibility;
  onVisibilityChange: (next: BiodataVisibility) => void;
  /** Continue with the current visibility selections */
  onContinueExport: (visibility: BiodataVisibility) => void;
  /** Clear contact-related fields then continue */
  onUsePrivateVersion: (visibility: BiodataVisibility) => void;
  onCancel?: () => void;
};

type SensitiveKey = keyof BiodataVisibility;

const SENSITIVE_OPTIONS: Array<{
  key: SensitiveKey;
  label: string;
  description: string;
}> = [
  {
    key: "includePhoto",
    label: "Profile photo",
    description: "Show your photograph on the biodata",
  },
  {
    key: "includeDob",
    label: "Date of birth",
    description: "Exact date of birth (age-only is safer for sharing)",
  },
  {
    key: "includePhone",
    label: "Phone number",
    description: "Personal mobile or landline",
  },
  {
    key: "includeEmail",
    label: "Email address",
    description: "Personal email address",
  },
  {
    key: "includeExactAddress",
    label: "Exact address",
    description: "Full street / home address",
  },
  {
    key: "includeFamilyContacts",
    label: "Family contact numbers",
    description: "Parent or guardian phone numbers",
  },
  {
    key: "includeReligious",
    label: "Religious details",
    description: "Religion and related cultural fields",
  },
  {
    key: "includeHoroscope",
    label: "Horoscope details",
    description: "Rashi, nakshatra, and astrology fields",
  },
];

function privateVisibility(current: BiodataVisibility): BiodataVisibility {
  return {
    ...current,
    includePhone: false,
    includeEmail: false,
    includeExactAddress: false,
    includeFamilyContacts: false,
  };
}

export function PrivacyReview({
  open,
  onOpenChange,
  visibility,
  onVisibilityChange,
  onContinueExport,
  onUsePrivateVersion,
  onCancel,
}: PrivacyReviewProps) {
  const [draft, setDraft] = React.useState<BiodataVisibility>(visibility);

  React.useEffect(() => {
    if (open) setDraft(visibility);
  }, [open, visibility]);

  const setFlag = (key: SensitiveKey, checked: boolean) => {
    const next = { ...draft, [key]: checked };
    setDraft(next);
    onVisibilityChange(next);
  };

  const handleCancel = () => {
    onCancel?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-primary/15 bg-background sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-foreground">Privacy review</DialogTitle>
          <DialogDescription>
            Choose which sensitive details to include before exporting. You can
            still edit these later in Studio.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {SENSITIVE_OPTIONS.map((opt) => (
            <div
              key={opt.key}
              className="flex items-start gap-3 rounded-md border border-primary/10 bg-white/70 p-3"
            >
              <Checkbox
                id={`privacy-${opt.key}`}
                checked={draft[opt.key]}
                onCheckedChange={(v) => setFlag(opt.key, v === true)}
                className="mt-0.5 border-primary data-[state=checked]:bg-primary data-[state=checked]:text-white"
              />
              <div className="grid gap-1">
                <Label
                  htmlFor={`privacy-${opt.key}`}
                  className="cursor-pointer text-sm font-medium text-foreground"
                >
                  {opt.label}
                </Label>
                <p className="text-xs text-muted-foreground">{opt.description}</p>
              </div>
            </div>
          ))}
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-col sm:space-x-0">
          <Button
            type="button"
            className="w-full bg-primary text-white hover:bg-primary-dark"
            onClick={() => {
              onContinueExport(draft);
              onOpenChange(false);
            }}
          >
            Continue to export
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full border-gold/40 text-gold-foreground hover:bg-gold/10 hover:text-gold-foreground"
            onClick={() => {
              const next = privateVisibility(draft);
              setDraft(next);
              onVisibilityChange(next);
              onUsePrivateVersion(next);
              onOpenChange(false);
            }}
          >
            Use private version
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="w-full text-muted-foreground"
            onClick={handleCancel}
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
