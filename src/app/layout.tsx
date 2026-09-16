import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";

const productionHost =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.VERCEL_PROJECT_PRODUCTION_URL ||
  process.env.VERCEL_URL ||
  'matrimony-with-studio.vercel.app';
const siteUrl = productionHost.startsWith('http') ? productionHost : `https://${productionHost}`;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: 'CupidMatch - Find Your Perfect Match in India & Sri Lanka',
  description: 'Matrimony site for Indian and Sri Lankan communities, powered by intelligent suggestions and horoscope matching.',
  openGraph: {
    type: 'website',
    siteName: 'CupidMatch',
    title: 'CupidMatch - Find Your Perfect Match',
    description: 'Meaningful matrimony connections for Indian and Sri Lankan communities.',
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'CupidMatch - Find Your Perfect Match' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CupidMatch - Find Your Perfect Match',
    description: 'Meaningful matrimony connections for Indian and Sri Lankan communities.',
    images: ['/opengraph-image'],
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
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Inter:wght@400;500;600;700;800;900&family=Noto+Sans+Sinhala:wght@400;500;600;700&family=Noto+Sans+Tamil:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
