import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'CupidMatch - Find Your Perfect Match';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const logoUrl = 'https://matrimony-with-studio.vercel.app/images/cupidmatch-logo.png';

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
          background: 'linear-gradient(135deg, #fff8fb 0%, #f4e9ff 52%, #fff1f5 100%)',
          fontFamily: 'Arial, sans-serif',
        }}
      >
        <div style={{ position: 'absolute', width: 430, height: 430, borderRadius: 999, background: '#e9d5ff', opacity: 0.55, top: -180, right: -80 }} />
        <div style={{ position: 'absolute', width: 360, height: 360, borderRadius: 999, background: '#fecdd3', opacity: 0.45, bottom: -190, left: -80 }} />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '55px 110px' }}>
          <img src={logoUrl} width="620" height="180" style={{ width: 620, height: 180, objectFit: 'contain' }} />
          <div style={{ marginTop: 14, fontSize: 54, lineHeight: 1.12, fontWeight: 750, color: '#24152f' }}>
            Find Your Perfect Match
          </div>
          <div style={{ marginTop: 22, fontSize: 27, color: '#66586d' }}>
            Meaningful matrimony connections for India & Sri Lanka
          </div>
          <div style={{ marginTop: 38, display: 'flex', gap: 16, fontSize: 22, color: '#7027E8', fontWeight: 600 }}>
            <span>Discover</span><span>•</span><span>Connect</span><span>•</span><span>Build a future</span>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
