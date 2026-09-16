import { ImageResponse } from 'next/og';
import { getShareByToken } from '@/lib/supabase/biodata';
import type { BiodataContent, BiodataVisibility } from '@/lib/biodata/types';

export const runtime = 'edge';
export const alt = 'CupidMatch shared biodata';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

type Props = { params: Promise<{ token: string }> };

function contentOf(value: unknown): BiodataContent {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const v = value as BiodataContent;
    if (Array.isArray(v.sections)) return v;
  }
  return { introduction: '', sections: [] };
}

function visibilityOf(value: unknown): BiodataVisibility {
  if (value && typeof value === 'object' && !Array.isArray(value)) return value as BiodataVisibility;
  return { includePhoto: false, includeDob: false, includePhone: false, includeEmail: false, includeExactAddress: false, includeFamilyContacts: false, includeReligious: false, includeHoroscope: false };
}

function safeName(content: BiodataContent) {
  const labels = new Set(['name', 'full name', 'பெயர்', 'නම']);
  for (const section of content.sections) {
    if (!section.visible) continue;
    const field = section.fields.find((f) => f.visible && labels.has(f.label.trim().toLowerCase()) && f.value.trim());
    if (field) return field.value.trim().slice(0, 80);
  }
  return 'Shared Biodata';
}

export default async function Image({ params }: Props) {
  const { token } = await params;
  const link = await getShareByToken(token);
  const content = link ? contentOf(link.snapshot.content) : { introduction: '', sections: [] } as BiodataContent;
  const visibility = link ? visibilityOf(link.snapshot.visibility) : visibilityOf(null);
  const name = link ? safeName(content) : 'Biodata unavailable';
  const photo = link && visibility.includePhoto && content.photoUrl ? content.photoUrl : undefined;

  return new ImageResponse(
    <div style={{ width: '100%', height: '100%', display: 'flex', background: 'linear-gradient(135deg,#fff9fb,#f5edff)', fontFamily: 'Arial, sans-serif', padding: 64, alignItems: 'center' }}>
      <div style={{ display: 'flex', width: '100%', height: '100%', borderRadius: 38, background: 'rgba(255,255,255,.92)', border: '2px solid #eadcff', boxShadow: '0 20px 60px rgba(75,35,110,.12)', overflow: 'hidden' }}>
        <div style={{ width: 410, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(160deg,#efe2ff,#ffe8ef)' }}>
          {photo ? (
            <img src={photo} width="310" height="390" style={{ width: 310, height: 390, objectFit: 'cover', borderRadius: 28, boxShadow: '0 14px 40px rgba(0,0,0,.16)' }} />
          ) : (
            <div style={{ width: 250, height: 250, borderRadius: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#ffffff', color: '#7027E8', fontSize: 120 }}>♥</div>
          )}
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '55px 70px' }}>
          <div style={{ fontSize: 27, color: '#7027E8', fontWeight: 700, display: 'flex' }}>♥ CupidMatch</div>
          <div style={{ marginTop: 28, fontSize: 58, lineHeight: 1.08, color: '#24152f', fontWeight: 800, display: 'flex' }}>{name}</div>
          <div style={{ marginTop: 22, fontSize: 27, color: '#6b6070', display: 'flex' }}>Biodata shared securely through CupidMatch</div>
          <div style={{ marginTop: 42, fontSize: 20, color: '#8a7d91', display: 'flex' }}>Open the link to view the shared details</div>
        </div>
      </div>
    </div>,
    size,
  );
}
