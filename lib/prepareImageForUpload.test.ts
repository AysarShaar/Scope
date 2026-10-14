import { describe, it, expect } from 'vitest';
import { prepareImageForUpload } from './prepareImageForUpload';

describe('prepareImageForUpload', () => {
  it('returns original file safely when outside browser environment', async () => {
    // In node environment without canvas/DOM
    const dummyFile = new File(['fake-image-bytes'], 'test-photo.jpg', { type: 'image/jpeg' });
    const result = await prepareImageForUpload(dummyFile);
    expect(result).toBe(dummyFile);
    expect(result.name).toBe('test-photo.jpg');
  });

  it('handles simulated browser canvas WebP conversion when window/document are defined', async () => {
    const originalWindow = globalThis.window;
    const originalDocument = globalThis.document;

    try {
      const mockBlob = new Blob(['webp-data'], { type: 'image/webp' });
      const mockCanvas = {
        width: 0,
        height: 0,
        getContext: () => ({
          imageSmoothingEnabled: false,
          imageSmoothingQuality: 'low',
          drawImage: () => {},
        }),
        toBlob: (cb: (blob: Blob | null) => void) => {
          cb(mockBlob);
        },
      };

      globalThis.window = {} as unknown as Window & typeof globalThis;
      globalThis.document = {
        createElement: (tag: string) => {
          if (tag === 'canvas') return mockCanvas;
          return {};
        },
      } as unknown as Document;

      (globalThis as unknown as Record<string, unknown>).createImageBitmap = async () => ({
        width: 800,
        height: 600,
        close: () => {},
      });

      const file = new File(['raw-bytes'], 'banner.png', { type: 'image/png' });
      const converted = await prepareImageForUpload(file);

      expect(converted.type).toBe('image/webp');
      expect(converted.name).toBe('banner.webp');
    } finally {
      globalThis.window = originalWindow;
      globalThis.document = originalDocument;
      delete (globalThis as unknown as Record<string, unknown>).createImageBitmap;
    }
  });
});
