import assert from 'node:assert/strict';
import sharp from 'sharp';

const base = process.env.BASE_URL || 'http://localhost:3000';
const imageUrl = 'https://cupidmatch.co.uk/images/cupidmatch-og.jpg';
const title = 'CupidMatch | Sri Lankan Matrimony Worldwide';
const description = 'Find your perfect match with CupidMatch. Meaningful matrimonial connections for the Sri Lankan community worldwide.';
const expected = {
  'og:title': title, 'og:description': description, 'og:type': 'website',
  'og:site_name': 'CupidMatch', 'og:url': 'https://cupidmatch.co.uk/',
  'og:image': imageUrl, 'og:image:secure_url': imageUrl,
  'og:image:width': '1200', 'og:image:height': '630', 'og:image:type': 'image/jpeg',
  'og:image:alt': 'CupidMatch — Find Your Perfect Match',
  'twitter:card': 'summary_large_image', 'twitter:title': title,
  'twitter:description': description, 'twitter:image': imageUrl,
};
for (const agent of ['WhatsApp/2.24.7.81', 'facebookexternalhit/1.1', 'LinkedInBot/1.0']) {
  const response = await fetch(base, { headers: { 'User-Agent': agent }, redirect: 'manual' });
  assert.equal(response.status, 200, agent);
  const html = await response.text();
  const head = html.split('</head>')[0];
  for (const [name, value] of Object.entries(expected)) {
    const tags = [...head.matchAll(/<meta\b[^>]*>/g)].map(m => m[0]).filter(t => t.includes(`property="${name}"`) || t.includes(`name="${name}"`));
    assert.equal(tags.length, 1, `${agent}: ${name} must occur once in initial head`);
    assert.ok(tags[0].includes(`content="${value}"`), `${name}: ${tags[0]}`);
  }
  assert.ok(head.includes('rel="canonical" href="https://cupidmatch.co.uk/"'));
  const image = await fetch(new URL('/images/cupidmatch-og.jpg', base), { headers: { 'User-Agent': agent }, redirect: 'manual' });
  assert.equal(image.status, 200);
  assert.equal(image.headers.get('content-type'), 'image/jpeg');
  const meta = await sharp(Buffer.from(await image.arrayBuffer())).metadata();
  assert.equal(meta.width, 1200); assert.equal(meta.height, 630);
  console.log(`${agent}: initial HTML metadata and public JPEG 1200x630 passed; cache=${image.headers.get('cache-control')}`);
}
const robots = await fetch(new URL('/robots.txt', base));
assert.equal(robots.status, 200);
const rules = await robots.text();
assert.ok(rules.includes('Allow: /'));
assert.ok(!/^Disallow: \/(?:images.*)?$/m.test(rules));
console.log('robots.txt allows homepage and image');
