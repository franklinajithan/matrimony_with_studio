"use client";

import { useI18n } from "@/components/i18n/I18nProvider";
import { messages } from "@/components/i18n/messages";

/** Keep the public pricing heading consistent with the selected site language. */
export function PricingIntroduction() {
  const { language } = useI18n();
  const { title, subtitle } = messages[language].pricing;
  return (
    <header className="space-y-3 text-center">
      <h1 className="text-4xl font-bold">{title}</h1>
      <p>{subtitle}</p>
      <p className="text-sm text-muted-foreground">
        Free has no card requirement. Paid membership access begins only after verified payment.
        Existing introductory offers retain their original end dates.
      </p>
    </header>
  );
}
