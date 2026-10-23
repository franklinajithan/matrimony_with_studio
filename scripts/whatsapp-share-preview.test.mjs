import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { test } from 'node:test';
import sharp from 'sharp';

const root = new URL('../', import.meta.url);
const get = (path) => readFileSync(new URL(path, root), 'utf8');
const image = new URL('public/images/cupidmatch-og.jpg', root);

test('approved share banner exists and is JPEG 1200x630', async () => {
  assert.ok(existsSync(image), 'Missing public/images/cupidmatch-og.jpg');
  const metadata = await sharp(readFileSync(image)).metadata();
  assert.equal(metadata.format, 'jpeg');
  assert.equal(metadata.width, 1200);
  assert.equal(metadata.height, 630);
});

test('homepage has explicit public Open Graph and Twitter metadata', () => {
  const page = get('src/app/page.tsx');
  assert.match(page, /CupidMatch \| Sri Lankan Matrimony Worldwide/);
  assert.match(page, /https:\/\/cupidmatch\.co\.uk\/images\/cupidmatch-og\.jpg/);
  assert.match(page, /secureUrl: shareImage/);
  assert.match(page, /summary_large_image/);
  assert.match(page, /width: 1200, height: 630/);
});

test('site default points to same image without legacy dynamic card', () => {
  const layout = get('src/app/layout.tsx');
  assert.match(layout, /shareCardImage = '\/images\/cupidmatch-og\.jpg'/);
  assert.doesNotMatch(layout, /opengraph-image\?v=/);
});


test('legacy file metadata cannot override the approved banner', () => {
  assert.equal(existsSync(new URL('src/app/opengraph-image.tsx', root)), false);
  assert.equal(existsSync(new URL('src/app/opengraph-image.png', root)), false);
});
