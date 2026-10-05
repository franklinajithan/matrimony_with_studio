"use client";

import React from "react";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { cn } from "@/lib/utils";

interface PhoneNumberInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: string;
  placeholder?: string;
  className?: string;
  id?: string;
}

/**
 * International phone number input with country code selector
 * Uses E.164 format (+[country code][number])
 */
export function PhoneNumberInput({
  value,
  onChange,
  disabled = false,
  error,
  placeholder = "Enter phone number",
  className,
  id,
}: PhoneNumberInputProps) {
  return (
    <div className="space-y-2">
      <PhoneInput
        id={id}
        international
        defaultCountry="LK" // Sri Lanka as default for matrimony platform
        value={value}
        onChange={(val) => onChange(val || "")}
        disabled={disabled}
        placeholder={placeholder}
        className={cn(
          "phone-input-wrapper",
          error && "phone-input-error",
          className
        )}
        numberInputProps={{
          className: cn(
            "flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
            "file:border-0 file:bg-transparent file:text-sm file:font-medium",
            "placeholder:text-muted-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-destructive focus-visible:ring-destructive"
          ),
        }}
        countrySelectProps={{
          className: "phone-country-select",
        }}
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <style jsx global>{`
        .phone-input-wrapper {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .phone-input-wrapper .PhoneInputCountry {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          padding: 0.5rem;
          border: 1px solid hsl(var(--input));
          border-radius: 0.375rem;
          background-color: hsl(var(--background));
          cursor: pointer;
          transition: border-color 0.2s;
        }

        .phone-input-wrapper .PhoneInputCountry:hover {
          border-color: hsl(var(--primary));
        }

        .phone-input-wrapper .PhoneInputCountryIcon {
          width: 1.5rem;
          height: 1rem;
        }

        .phone-input-wrapper .PhoneInputCountrySelect {
          margin-left: 0.25rem;
          border: none;
          background: transparent;
          cursor: pointer;
          font-size: 0.875rem;
        }

        .phone-input-wrapper .PhoneInputCountrySelectArrow {
          width: 0.375rem;
          height: 0.375rem;
          margin-left: 0.25rem;
          border: solid currentColor;
          border-width: 0 1px 1px 0;
          transform: rotate(45deg);
          opacity: 0.7;
        }

        .phone-input-wrapper.phone-input-error .PhoneInputCountry {
          border-color: hsl(var(--destructive));
        }

        .phone-input-wrapper input {
          flex: 1;
        }

        .phone-input-wrapper input:disabled {
          cursor: not-allowed;
          opacity: 0.5;
        }
      `}</style>
    </div>
  );
}
