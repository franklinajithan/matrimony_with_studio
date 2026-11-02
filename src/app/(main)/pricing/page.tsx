"use client";
import {LivePricing} from "@/components/subscriptions/LivePricing";
import {useI18n} from "@/components/i18n/I18nProvider";
import {getMessages} from "@/components/i18n/messages";
export default function PricingPage(){const {language}=useI18n();const t=getMessages(language).pricing;return <main className="mx-auto max-w-6xl space-y-8 px-4 py-12"><header className="mx-auto max-w-3xl space-y-3 text-center"><span className="inline-flex rounded-full bg-primary/10 px-4 py-1.5 text-sm font-semibold text-primary">{t.eyebrow}</span><h1 className="text-4xl font-bold">{t.title}</h1><p className="text-muted-foreground">{t.subtitle}</p></header><LivePricing/></main>;}
