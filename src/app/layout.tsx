import type { Metadata } from 'next';
import './globals.css';
import PwaRegistration from '@/components/PwaRegistration';
import { Toaster } from "@/components/ui/toaster";
import { I18nProvider } from "@/components/i18n/I18nProvider";

const siteUrl = 'https://cupidmatch.co.uk';
const SHARE_CARD_VERSION = 'royal-cupid-20261018';
const shareCardImage = `/opengraph-image?v=${SHARE_CARD_VERSION}`;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: 'Sri Lankan Matrimony Worldwide | CupidMatch', template: '%s | CupidMatch' },
  description: 'CupidMatch is a matrimony platform for the Sri Lankan community worldwide. Discover meaningful introductions with Sri Lankan singles wherever you live.',
  applicationName: 'CupidMatch',
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, title: 'CupidMatch', statusBarStyle: 'default' },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large' } },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.png', type: 'image/png', sizes: '512x512' },
    ],
    shortcut: '/favicon.ico',
    apple: [{ url: '/apple-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  openGraph: {
    type: 'website',
    url: siteUrl,
    locale: 'en_GB',
    siteName: 'CupidMatch',
    title: 'CupidMatch | Sri Lankan Matrimony Worldwide',
    description: 'Meaningful marriage-focused introductions for the Sri Lankan community worldwide.',
    images: [{ url: shareCardImage, width: 1200, height: 630, alt: 'CupidMatch | Sri Lankan Matrimony Worldwide' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CupidMatch | Sri Lankan Matrimony Worldwide',
    description: 'Meaningful marriage-focused introductions for the Sri Lankan community worldwide.',
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
        <PwaRegistration />
      </body>
    </html>
  );
}