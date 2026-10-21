import type { Metadata } from 'next';
import { CUPIDMATCH_LOGO } from '@/lib/brand';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { I18nProvider } from "@/components/i18n/I18nProvider";

const siteUrl = 'https://cupidmatch.co.uk';
const SHARE_CARD_VERSION = 'royal-cupid-20261018';
const shareCardImage = `/opengraph-image?v=${SHARE_CARD_VERSION}`;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: 'CupidMatch | Sri Lankan & Indian Matrimony UK', template: '%s | CupidMatch' },
  description: 'Discover meaningful matrimonial connections for Sri Lankan and Indian communities in the UK. Explore compatible partners, biodata and cultural preferences.',
  applicationName: 'CupidMatch',
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large' } },
  icons: {
    icon: [
      { url: CUPIDMATCH_LOGO, type: 'image/png' },
    ],
    shortcut: CUPIDMATCH_LOGO,
    apple: CUPIDMATCH_LOGO,
  },
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    url: siteUrl,
    locale: 'en_GB',
    siteName: 'CupidMatch',
    title: 'CupidMatch - Find Your Perfect Match',
    description: 'Meaningful matrimony connections for Indian and Sri Lankan communities.',
    images: [{ url: shareCardImage, width: 1200, height: 630, alt: 'CupidMatch - Find Your Perfect Match' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CupidMatch - Find Your Perfect Match',
    description: 'Meaningful matrimony connections for Indian and Sri Lankan communities.',
    images: [shareCardImage],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Great+Vibes&family=Inter:wght@400;500;600;700;800;900&family=Noto+Sans+Sinhala:wght@400;500;600;700&family=Noto+Sans+Tamil:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,500;0,600;0,700;1,500;1,600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased">
        <I18nProvider>{children}</I18nProvider>
        <Toaster />
      </body>
    </html>
  );
}