import { describe, it, expect } from 'vitest';
import { buildImageKey, detectImageTypeFromBytes, publicImageUrl } from './imageStorage';

const bytes = (...values: number[]) => new Uint8Array(values);

describe('detectImageTypeFromBytes', () => {
  it('recognises JPEG, PNG and GIF', () => {
    expect(detectImageTypeFromBytes(bytes(0xff, 0xd8, 0xff, 0xe0))?.ext).toBe('jpg');
    expect(detectImageTypeFromBytes(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a))?.mime).toBe('image/png');
    expect(detectImageTypeFromBytes(bytes(0x47, 0x49, 0x46, 0x38, 0x39, 0x61))?.ext).toBe('gif');
  });

  it('recognises WebP and AVIF', () => {
    const webp = bytes(0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50);
    expect(detectImageTypeFromBytes(webp)?.ext).toBe('webp');

    const avif = new Uint8Array(12);
    avif.set([0, 0, 0, 0x1c], 0);
    avif.set(new TextEncoder().encode('ftypavif'), 4);
    expect(detectImageTypeFromBytes(avif)?.ext).toBe('avif');
  });

  it('rejects other content, including HTML and SVG', () => {
    expect(detectImageTypeFromBytes(new TextEncoder().encode('<svg xmlns="..."></svg>'))).toBeNull();
    expect(detectImageTypeFromBytes(new TextEncoder().encode('<!doctype html>'))).toBeNull();
    expect(detectImageTypeFromBytes(bytes(1, 2))).toBeNull();
  });

  it('rejects a RIFF file that is not WebP', () => {
    const wav = bytes(0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x41, 0x56, 0x45);
    expect(detectImageTypeFromBytes(wav)).toBeNull();
  });
});

describe('buildImageKey', () => {
  it('uses year/month folders and the given id', () => {
    const key = buildImageKey('webp', new Date(Date.UTC(2026, 9, 11)), 'abc');
    expect(key).toBe('articles/2026/10/abc.webp');
  });

  it('produces a different key on every call', () => {
    expect(buildImageKey('jpg')).not.toBe(buildImageKey('jpg'));
  });
});

describe('publicImageUrl', () => {
  it('joins base and key without doubling slashes', () => {
    expect(publicImageUrl('https://img.scope-media.net/', 'articles/a.jpg')).toBe(
      'https://img.scope-media.net/articles/a.jpg',
    );
  });
});
