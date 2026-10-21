import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../src/app/globals.css', import.meta.url), 'utf8');
const root = css.match(/:root\s*\{([\s\S]*?)\n  \}/)[1];
const tokens = Object.fromEntries([...root.matchAll(/--([\w-]+):\s*([^;]+);/g)].map(([, k, v]) => [k, v.trim()]));
function channels(name) {
  const value = tokens[name];
  assert.ok(value, `Missing token ${name}`);
  const alias = value.match(/^var\(--([\w-]+)\)$/);
  if (alias) return channels(alias[1]);
  const [h, s, l] = value.split(/\s+/).map(parseFloat);
  const saturation = s / 100, lightness = l / 100;
  const a = saturation * Math.min(lightness, 1 - lightness);
  return [0, 8, 4].map(n => {
    const k = (n + h / 30) % 12;
    return lightness - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
  });
}
function luminance(name) {
  return channels(name).map(c => c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
    .reduce((sum, c, i) => sum + c * [0.2126, 0.7152, 0.0722][i], 0);
}
for (const [foreground, background] of [
  ['foreground', 'background'], ['muted-foreground', 'card'],
  ['muted-foreground', 'accent'], ['primary-foreground', 'primary'],
  ['primary-foreground', 'dark-purple'], ['gold-foreground', 'background'],
  ['gold-foreground', 'accent'], ['gold-foreground', 'gold-soft'],
  ['secondary-foreground', 'secondary'], ['gold-light', 'dark-purple'],
  ['destructive-foreground', 'destructive'],
]) {
  test(`${foreground} on ${background} meets WCAG AA for normal text`, () => {
    const values = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
    const ratio = (values[0] + 0.05) / (values[1] + 0.05);
    assert.ok(ratio >= 4.5, `Contrast ${ratio.toFixed(2)}:1 is below 4.5:1`);
  });
}
test('input boundaries and keyboard focus have at least 3:1 contrast', () => {
  for (const name of ['input', 'ring']) {
    const ratio = (luminance('background') + 0.05) / (luminance(name) + 0.05);
    assert.ok(ratio >= 3, `${name} contrast ${ratio.toFixed(2)}:1 is below 3:1`);
  }
});
