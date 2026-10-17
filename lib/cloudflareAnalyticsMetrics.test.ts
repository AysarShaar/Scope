import { describe, it, expect } from 'vitest';
import {
  parseWorkersAdaptive,
  parseR2Adaptive,
  formatBytes,
} from './cloudflareAnalyticsMetrics';

describe('cloudflareAnalyticsMetrics', () => {
  describe('formatBytes', () => {
    it('formats bytes correctly', () => {
      expect(formatBytes(0)).toBe('0 B');
      expect(formatBytes(500)).toBe('500 B');
      expect(formatBytes(1024)).toBe('1.0 KB');
      expect(formatBytes(1572864)).toBe('1.5 MB');
      expect(formatBytes(2147483648)).toBe('2.0 GB');
    });
  });

  describe('parseWorkersAdaptive', () => {
    it('handles null or error raw responses', () => {
      expect(parseWorkersAdaptive(null)).toEqual({
        status: 'unavailable',
        reason: 'بيانات Workers غير متوفرة',
      });

      expect(parseWorkersAdaptive({ ok: false, reason: 'Bad token' })).toEqual({
        status: 'unavailable',
        reason: 'Bad token',
      });
    });

    it('correctly aggregates Workers metrics', () => {
      const raw = {
        ok: true,
        data: {
          viewer: {
            accounts: [
              {
                workersInvocationsAdaptive: [
                  {
                    sum: { requests: 100, errors: 2, subrequests: 50 },
                    quantiles: { cpuTimeP50: 1500, cpuTimeP99: 4500 },
                    dimensions: { status: 'success', scriptName: 'scopes-media' },
                  },
                  {
                    sum: { requests: 50, errors: 0, subrequests: 10 },
                    quantiles: { cpuTimeP50: 1200, cpuTimeP99: 3000 },
                    dimensions: { status: 'success', scriptName: 'auth-worker' },
                  },
                  {
                    sum: { requests: 10, errors: 10, subrequests: 0 },
                    dimensions: { status: 'scriptThrewException', scriptName: 'scopes-media' },
                  },
                ],
              },
            ],
          },
        },
      };

      const res = parseWorkersAdaptive(raw);
      expect(res.status).toBe('ok');
      expect(res.data?.totalRequests).toBe(160);
      expect(res.data?.totalErrors).toBe(12);
      expect(res.data?.errorRate).toBe(7.5);
      expect(res.data?.totalSubrequests).toBe(60);
      expect(res.data?.statusBreakdown).toEqual([
        { status: 'success', count: 150, percentage: 93.8 },
        { status: 'scriptThrewException', count: 10, percentage: 6.3 },
      ]);
      expect(res.data?.scriptsBreakdown[0].scriptName).toBe('scopes-media');
      expect(res.data?.scriptsBreakdown[0].requests).toBe(110);
      expect(res.data?.scriptsBreakdown[0].errors).toBe(12);
    });
  });

  describe('parseR2Adaptive', () => {
    it('handles null or error responses', () => {
      expect(parseR2Adaptive(null)).toEqual({
        status: 'unavailable',
        reason: 'بيانات R2 Storage غير متوفرة',
      });
    });

    it('correctly aggregates R2 metrics and normalizes operation types', () => {
      const rawOps = {
        ok: true,
        data: {
          viewer: {
            accounts: [
              {
                r2OperationsAdaptiveGroups: [
                  {
                    sum: { requests: 80, bytesIn: 500000, bytesOut: 1200000 },
                    dimensions: { actionType: 'PutObject', actionStatus: 'success', bucketName: 'scope-media-images' },
                  },
                  {
                    sum: { requests: 120, bytesIn: 0, bytesOut: 8500000 },
                    dimensions: { actionType: 'GetObject', actionStatus: 'success', bucketName: 'scope-media-images' },
                  },
                  {
                    sum: { requests: 5, bytesIn: 0, bytesOut: 0 },
                    dimensions: { actionType: 'DeleteObject', actionStatus: 'success', bucketName: 'scope-media-images' },
                  },
                ],
              },
            ],
          },
        },
      };

      const res = parseR2Adaptive(rawOps);
      expect(res.status).toBe('ok');
      expect(res.data?.totalOperations).toBe(205);
      expect(res.data?.bytesIn).toBe(500000);
      expect(res.data?.bytesOut).toBe(9700000);
      expect(res.data?.operationsByType).toEqual([
        { operationType: 'GET', count: 120, percentage: 58.5 },
        { operationType: 'PUT', count: 80, percentage: 39.0 },
        { operationType: 'DELETE', count: 5, percentage: 2.4 },
      ]);
      expect(res.data?.bucketsBreakdown[0].bucketName).toBe('scope-media-images');
      expect(res.data?.bucketsBreakdown[0].operations).toBe(205);
    });
  });
});
