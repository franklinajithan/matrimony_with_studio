"use client";

import React, { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

interface OTPInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: string;
  autoFocus?: boolean;
}

/**
 * OTP input component with individual digit boxes
 * Automatically moves focus between boxes as user types
 */
export function OTPInput({
  length = 6,
  value,
  onChange,
  disabled = false,
  error,
  autoFocus = true,
}: OTPInputProps) {
  const [digits, setDigits] = useState<string[]>(
    Array(length).fill("").map((_, i) => value[i] || "")
  );
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Update digits when value prop changes
  useEffect(() => {
    const newDigits = Array(length).fill("").map((_, i) => value[i] || "");
    setDigits(newDigits);
  }, [value, length]);

  const handleChange = (index: number, newValue: string) => {
    // Only accept digits
    if (newValue && !/^\d$/.test(newValue)) {
      return;
    }

    const newDigits = [...digits];
    newDigits[index] = newValue;
    setDigits(newDigits);

    // Call onChange with complete value
    onChange(newDigits.join(""));

    // Auto-focus next input if digit was entered
    if (newValue && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    // Handle backspace
    if (e.key === "Backspace") {
      if (!digits[index] && index > 0) {
        // If current box is empty, move to previous box
        inputRefs.current[index - 1]?.focus();
      } else {
        // Clear current box
        const newDigits = [...digits];
        newDigits[index] = "";
        setDigits(newDigits);
        onChange(newDigits.join(""));
      }
      e.preventDefault();
    }

    // Handle arrow keys
    if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
      e.preventDefault();
    }
    if (e.key === "ArrowRight" && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
      e.preventDefault();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text/plain").replace(/\D/g, "");
    const newDigits = Array(length)
      .fill("")
      .map((_, i) => pastedData[i] || "");
    setDigits(newDigits);
    onChange(newDigits.join(""));

    // Focus the next empty box or last box
    const nextEmptyIndex = newDigits.findIndex((d) => !d);
    const focusIndex = nextEmptyIndex >= 0 ? nextEmptyIndex : length - 1;
    inputRefs.current[focusIndex]?.focus();
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2 justify-center">
        {digits.map((digit, index) => (
          <Input
            key={index}
            ref={(el) => (inputRefs.current[index] = el)}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            disabled={disabled}
            autoFocus={autoFocus && index === 0}
            className={cn(
              "h-12 w-12 text-center text-lg font-semibold",
              "focus:ring-2 focus:ring-primary focus:ring-offset-2",
              error && "border-destructive focus-visible:ring-destructive",
              "sm:h-14 sm:w-14 sm:text-xl"
            )}
            aria-label={`Digit ${index + 1}`}
          />
        ))}
      </div>
      {error && (
        <p className="text-sm text-destructive text-center">{error}</p>
      )}
    </div>
  );
}
