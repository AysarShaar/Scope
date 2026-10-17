/**
 * Cloudflare Infrastructure Analytics (Workers & R2)
 * Types, Parsers, and Metrics Calculation
 */

export interface CloudflareWorkersMetrics {
  status: 'ok' | 'unavailable';
  reason?: string;
  data?: {
    totalRequests: number;
    totalErrors: number;
    errorRate: number;
    totalSubrequests: number;
    cpuTimeP50Ms: number;
    cpuTimeP99Ms: number;
    statusBreakdown: Array<{
      status: string;
      count: number;
      percentage: number;
    }>;
    scriptsBreakdown: Array<{
      scriptName: string;
      requests: number;
      errors: number;
      errorRate: number;
    }>;
  };
}

export interface CloudflareR2Metrics {
  status: 'ok' | 'unavailable';
  reason?: string;
  data?: {
    totalOperations: number;
    bytesIn: number;
    bytesOut: number;
    operationsByType: Array<{
      operationType: string;
      count: number;
      percentage: number;
    }>;
    statusBreakdown: Array<{
      status: string;
      count: number;
      percentage: number;
    }>;
    bucketsBreakdown: Array<{
      bucketName: string;
      operations: number;
      bytesIn: number;
      bytesOut: number;
    }>;
  };
}

export interface CloudflareAnalyticsResponse {
  success: boolean;
  configured: boolean;
  diagnostics: {
    hasToken: boolean;
    hasAccountId: boolean;
    hasZoneId: boolean;
    accountId?: string;
  };
  window: {
    timeRange: string;
    since: string;
    until: string;
  };
  generatedAt: string;
  workers: CloudflareWorkersMetrics;
  r2: CloudflareR2Metrics;
}

interface RawGraphQLResponse<T = unknown> {
  ok?: boolean;
  reason?: string;
  data?: {
    viewer?: {
      accounts?: Array<T>;
    };
  };
}

interface RawWorkersAccount {
  workersInvocationsAdaptive?: RawWorkersInvocationItem[];
}

interface RawWorkersInvocationItem {
  sum?: {
    requests?: number | null;
    errors?: number | null;
    subrequests?: number | null;
    cpuTime?: number | null;
    cpuTimeUs?: number | null;
  };
  quantiles?: {
    cpuTimeP50?: number | null;
    cpuTimeP99?: number | null;
  };
  dimensions?: {
    status?: string | null;
    scriptName?: string | null;
  };
}

interface RawR2Account {
  r2OperationsAdaptiveGroups?: RawR2OperationItem[];
  r2BandwidthUsageAdaptiveGroups?: RawR2BandwidthItem[];
}

interface RawR2OperationItem {
  sum?: {
    requests?: number | null;
    operations?: number | null;
    bytesIn?: number | null;
    bytesOut?: number | null;
  };
  dimensions?: {
    operationType?: string | null;
    actionType?: string | null;
    status?: string | null;
    actionStatus?: string | null;
    bucketName?: string | null;
  };
}

interface RawR2BandwidthItem {
  sum?: {
    uploadBytes?: number | null;
    downloadBytes?: number | null;
    bytesIn?: number | null;
    bytesOut?: number | null;
  };
  dimensions?: {
    bucketName?: string | null;
  };
}

export function parseWorkersAdaptive(raw: unknown): CloudflareWorkersMetrics {
  const response = raw as RawGraphQLResponse<RawWorkersAccount> | null | undefined;
  if (!response || !response.ok) {
    return {
      status: 'unavailable',
      reason: response?.reason || 'بيانات Workers غير متوفرة',
    };
  }

  const account = response.data?.viewer?.accounts?.[0];
  const items = account?.workersInvocationsAdaptive;
  if (!items || !Array.isArray(items)) {
    return {
      status: 'unavailable',
      reason: 'لم يتم العثور على سجلات استدعاءات Workers في هذا الحساب',
    };
  }

  let totalRequests = 0;
  let totalErrors = 0;
  let totalSubrequests = 0;
  let cpuTimeP50TotalUs = 0;
  let cpuTimeP99MaxUs = 0;
  let validCpuSamples = 0;

  const statusMap = new Map<string, number>();
  const scriptMap = new Map<string, { requests: number; errors: number }>();

  for (const item of items) {
    const req = Number(item.sum?.requests || 0);
    const err = Number(item.sum?.errors || 0);
    const sub = Number(item.sum?.subrequests || 0);

    totalRequests += req;
    totalErrors += err;
    totalSubrequests += sub;

    const p50 = Number(item.quantiles?.cpuTimeP50 || item.sum?.cpuTime || item.sum?.cpuTimeUs || 0);
    const p99 = Number(item.quantiles?.cpuTimeP99 || 0);

    if (p50 > 0) {
      cpuTimeP50TotalUs += p50 * Math.max(1, req);
      validCpuSamples += Math.max(1, req);
    }
    if (p99 > cpuTimeP99MaxUs) {
      cpuTimeP99MaxUs = p99;
    }

    const status = item.dimensions?.status || 'success';
    statusMap.set(status, (statusMap.get(status) || 0) + req);

    const scriptName = item.dimensions?.scriptName || 'default';
    const existing = scriptMap.get(scriptName) || { requests: 0, errors: 0 };
    existing.requests += req;
    existing.errors += err;
    scriptMap.set(scriptName, existing);
  }

  const errorRate = totalRequests > 0 ? Number(((totalErrors / totalRequests) * 100).toFixed(2)) : 0;
  const cpuTimeP50Ms = validCpuSamples > 0 ? Number(((cpuTimeP50TotalUs / validCpuSamples) / 1000).toFixed(2)) : 0;
  const cpuTimeP99Ms = cpuTimeP99MaxUs > 0 ? Number((cpuTimeP99MaxUs / 1000).toFixed(2)) : 0;

  const statusBreakdown = Array.from(statusMap.entries())
    .map(([status, count]) => ({
      status,
      count,
      percentage: calculatePercentage(count, totalRequests, 1),
    }))
    .sort((a, b) => b.count - a.count);

  const scriptsBreakdown = Array.from(scriptMap.entries())
    .map(([scriptName, metrics]) => ({
      scriptName,
      requests: metrics.requests,
      errors: metrics.errors,
      errorRate: metrics.requests > 0 ? Number(((metrics.errors / metrics.requests) * 100).toFixed(2)) : 0,
    }))
    .sort((a, b) => b.requests - a.requests);

  return {
    status: 'ok',
    data: {
      totalRequests,
      totalErrors,
      errorRate,
      totalSubrequests,
      cpuTimeP50Ms,
      cpuTimeP99Ms,
      statusBreakdown,
      scriptsBreakdown,
    },
  };
}

export function parseR2Adaptive(rawOps: unknown, rawBandwidth?: unknown): CloudflareR2Metrics {
  const opsResponse = rawOps as RawGraphQLResponse<RawR2Account> | null | undefined;
  if (!opsResponse || !opsResponse.ok) {
    return {
      status: 'unavailable',
      reason: opsResponse?.reason || 'بيانات R2 Storage غير متوفرة',
    };
  }

  const account = opsResponse.data?.viewer?.accounts?.[0];
  const opsItems = account?.r2OperationsAdaptiveGroups;
  if (!opsItems || !Array.isArray(opsItems)) {
    return {
      status: 'unavailable',
      reason: 'لم يتم العثور على عمليات R2 في هذا الحساب',
    };
  }

  let totalOperations = 0;
  let bytesIn = 0;
  let bytesOut = 0;

  const opTypeMap = new Map<string, number>();
  const statusMap = new Map<string, number>();
  const bucketMap = new Map<string, { operations: number; bytesIn: number; bytesOut: number }>();

  for (const item of opsItems) {
    const count = Number(item.sum?.requests || item.sum?.operations || 0);
    const bIn = Number(item.sum?.bytesIn || 0);
    const bOut = Number(item.sum?.bytesOut || 0);

    totalOperations += count;
    bytesIn += bIn;
    bytesOut += bOut;

    const operationType = normalizeR2Operation(item.dimensions?.operationType || item.dimensions?.actionType);
    opTypeMap.set(operationType, (opTypeMap.get(operationType) || 0) + count);

    const status = String(item.dimensions?.actionStatus || item.dimensions?.status || 'success');
    statusMap.set(status, (statusMap.get(status) || 0) + count);

    const bucket = String(item.dimensions?.bucketName || 'default');
    const existing = bucketMap.get(bucket) || { operations: 0, bytesIn: 0, bytesOut: 0 };
    existing.operations += count;
    existing.bytesIn += bIn;
    existing.bytesOut += bOut;
    bucketMap.set(bucket, existing);
  }

  const bwResponse = rawBandwidth as RawGraphQLResponse<RawR2Account> | null | undefined;
  if (bwResponse?.ok) {
    const bwItems = bwResponse.data?.viewer?.accounts?.[0]?.r2BandwidthUsageAdaptiveGroups;
    if (Array.isArray(bwItems)) {
      for (const item of bwItems) {
        const u = Number(item.sum?.uploadBytes || item.sum?.bytesIn || 0);
        const d = Number(item.sum?.downloadBytes || item.sum?.bytesOut || 0);
        bytesIn += u;
        bytesOut += d;

        const bucket = String(item.dimensions?.bucketName || 'default');
        const existing = bucketMap.get(bucket) || { operations: 0, bytesIn: 0, bytesOut: 0 };
        existing.bytesIn += u;
        existing.bytesOut += d;
        bucketMap.set(bucket, existing);
      }
    }
  }

  const operationsByType = Array.from(opTypeMap.entries())
    .map(([operationType, count]) => ({
      operationType,
      count,
      percentage: calculatePercentage(count, totalOperations, 1),
    }))
    .sort((a, b) => b.count - a.count);

  const statusBreakdown = Array.from(statusMap.entries())
    .map(([status, count]) => ({
      status,
      count,
      percentage: calculatePercentage(count, totalOperations, 1),
    }))
    .sort((a, b) => b.count - a.count);

  const bucketsBreakdown = Array.from(bucketMap.entries())
    .map(([bucketName, metrics]) => ({
      bucketName,
      operations: metrics.operations,
      bytesIn: metrics.bytesIn,
      bytesOut: metrics.bytesOut,
    }))
    .sort((a, b) => b.operations - a.operations);

  return {
    status: 'ok',
    data: {
      totalOperations,
      bytesIn,
      bytesOut,
      operationsByType,
      statusBreakdown,
      bucketsBreakdown,
    },
  };
}

export function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const exponent = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  const val = (bytes / Math.pow(1024, exponent)).toFixed(exponent === 0 ? 0 : 1);
  return `${val} ${units[exponent]}`;
}

function normalizeR2Operation(rawOp?: string | null): string {
  const op = String(rawOp || 'OTHER').toLowerCase();
  if (op.includes('get')) return 'GET';
  if (op.includes('put')) return 'PUT';
  if (op.includes('delete')) return 'DELETE';
  if (op.includes('list')) return 'LIST';
  if (op.includes('head')) return 'HEAD';
  return String(rawOp || 'OTHER');
}

function calculatePercentage(count: number, total: number, decimals = 1): number {
  if (total <= 0) return 0;
  return Number(((count / total) * 100).toFixed(decimals));
}
