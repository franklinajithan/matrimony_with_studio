import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'CupidMatch – Find Your Perfect Match',
    short_name: 'CupidMatch',
    description: 'Meaningful matrimonial connections for Sri Lankan and Indian communities.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#fffaf2',
    theme_color: '#55218a',
    icons: [
      { src: '/icon.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/apple-icon.png', sizes: '180x180', type: 'image/png', purpose: 'any' },
    ],
  };
}
