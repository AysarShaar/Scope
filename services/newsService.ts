import { ScopeArticle, ScopeShow, BreakingItem } from "../data/scopeData";

export interface PaginatedArticlesResult {
  articles: ScopeArticle[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
}

export interface HomeBootstrapData {
  articles: ScopeArticle[];
  specialArticles?: ScopeArticle[];
  /** Newest published article flagged is_special (tall hero box); null when none is flagged. */
  special?: ScopeArticle | null;
  programs: ScopeShow[];
  breaking: BreakingItem[];
  liveStreamId: string;
}

function resolveApiBase(): string {
  if (typeof window === "undefined") {
    return process.env.APP_URL?.replace(/\/$/, '') || "";
  }
  return "";
}

async function fetchApi(path: string, init?: RequestInit): Promise<Response> {
  const base = resolveApiBase();
  if (typeof window === "undefined" && !base) {
    throw new Error(`Cannot fetch relative URL '${path}' on server without APP_URL`);
  }
  const url = base && path.startsWith('/') ? `${base}${path}` : path;
  return fetch(url, init);
}

async function fetchRead(path: string): Promise<Response> {
  const res = await fetchApi(path);
  if (!res.ok) {
    throw new Error(`Failed to fetch ${path}: ${res.status}`);
  }
  return res;
}

let inFlightBreakingPromise: Promise<BreakingItem[]> | null = null;
let cachedBreakingData: BreakingItem[] | null = null;
let breakingCacheTimestamp = 0;
const BREAKING_CACHE_TTL_MS = 30000;

let homeBootstrapPromise: Promise<HomeBootstrapData | null> | null = null;
let homeBootstrapTimestamp = 0;
const HOME_BOOTSTRAP_TTL_MS = 30000;

export interface ArticleQueryOptions {
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
  full?: boolean;
  from?: string;
  to?: string;
  date?: string;
  status?: string;
  author?: string;
  sort?: 'desc' | 'asc';
  includePending?: boolean;
}

function buildArticleQueryParams(options: ArticleQueryOptions): URLSearchParams {
  const page = Math.max(1, options.page || 1);
  const limit = Math.min(1000, Math.max(1, options.limit || 12));
  const params = new URLSearchParams();

  if (options.category && options.category !== 'home' && options.category !== 'all') {
    params.set('category', options.category);
  }
  if (options.search) params.set('search', options.search);
  if (options.from) params.set('from', options.from);
  if (options.to) params.set('to', options.to);
  if (options.date) params.set('date', options.date);
  if (options.status) params.set('status', options.status);
  if (options.author) params.set('author', options.author);
  if (options.sort) params.set('sort', options.sort);
  if (options.includePending) params.set('includePending', 'true');
  if (options.full) params.set('full', 'true');

  params.set('page', page.toString());
  params.set('limit', limit.toString());
  return params;
}

interface RawPaginatedJson {
  success?: boolean;
  data?: ScopeArticle[];
  pagination?: {
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
    hasMore?: boolean;
  };
}

function parsePaginatedResponse(
  json: RawPaginatedJson | null | undefined,
  page: number,
  limit: number
): PaginatedArticlesResult | null {
  if (!json?.success || !Array.isArray(json.data)) return null;

  const pagination = json.pagination || {};
  const total = pagination.total ?? json.data.length;
  const totalPages = pagination.totalPages || Math.max(1, Math.ceil(total / limit));

  return {
    articles: json.data,
    total,
    page: pagination.page || page,
    limit: pagination.limit || limit,
    totalPages,
    hasMore: pagination.hasMore ?? page < totalPages,
  };
}

function createEmptyPaginatedResult(page: number, limit: number): PaginatedArticlesResult {
  return {
    articles: [],
    total: 0,
    page,
    limit,
    totalPages: 1,
    hasMore: false,
  };
}

const inFlightArticleRequests = new Map<string, Promise<PaginatedArticlesResult>>();

export const newsService = {
  isD1Configured(): boolean {
    return true;
  },

  async getArticlesPaginated(options: ArticleQueryOptions = {}): Promise<PaginatedArticlesResult> {
    const params = buildArticleQueryParams(options);
    const page = Number(params.get('page')) || 1;
    const limit = Number(params.get('limit')) || 12;

    const cacheKey = params.toString();
    const existingPromise = inFlightArticleRequests.get(cacheKey);
    if (existingPromise) {
      return existingPromise;
    }

    const fetchPromise = (async (): Promise<PaginatedArticlesResult> => {
      try {
        const res = await fetchRead(`/api/articles?${cacheKey}`);
        if (res.ok) {
          const json = await res.json().catch(() => null);
          const parsed = parsePaginatedResponse(json, page, limit);
          if (parsed) return parsed;
        }
      } catch (err) {
        console.error('[newsService] getArticlesPaginated error:', err);
      }

      return createEmptyPaginatedResult(page, limit);
    })().finally(() => {
      inFlightArticleRequests.delete(cacheKey);
    });

    inFlightArticleRequests.set(cacheKey, fetchPromise);
    return fetchPromise;
  },

  async getArticles(
    category?: string,
    search?: string,
    limit = 50,
    page = 1,
    full = false,
  ): Promise<ScopeArticle[]> {
    const result = await this.getArticlesPaginated({
      category,
      search,
      limit,
      page,
      full,
    });
    return result.articles;
  },

  async getArticleById(id: string): Promise<ScopeArticle | null> {
    try {
      const res = await fetchRead(`/api/articles/${id}`);
      if (res.ok) {
        const json = await res.json().catch(() => null);
        if (json?.success && json.data) return json.data;
      }
    } catch (err) {
      console.error(`[newsService] getArticleById(${id}) error:`, err);
    }
    return null;
  },

  /**
   * One request that returns everything the home page needs (articles, programs, ticker, live id).
   * The promise is shared, so the header and hero components can wait on it instead of firing their own
   * requests. Resolves to null on failure, in which case callers fall back to their individual endpoints.
   */
  getHomeBootstrap(): Promise<HomeBootstrapData | null> {
    const now = Date.now();
    if (homeBootstrapPromise && now - homeBootstrapTimestamp < HOME_BOOTSTRAP_TTL_MS) {
      return homeBootstrapPromise;
    }
    homeBootstrapTimestamp = now;
    const promise: Promise<HomeBootstrapData | null> = (async () => {
      try {
        const res = await fetchRead("/api/home");
        const json = await res.json().catch(() => null);
        const data = json?.success ? (json.data as Partial<HomeBootstrapData> | undefined) : undefined;
        if (data && Array.isArray(data.articles)) {
          const result: HomeBootstrapData = {
            articles: data.articles,
            programs: Array.isArray(data.programs) ? data.programs : [],
            breaking: Array.isArray(data.breaking) ? data.breaking.slice(0, 12) : [],
            liveStreamId: typeof data.liveStreamId === "string" ? data.liveStreamId : "",
          };
          cachedBreakingData = result.breaking;
          breakingCacheTimestamp = Date.now();
          return result;
        }
      } catch (err) {
        console.error("[newsService] getHomeBootstrap error:", err);
      }
      return null;
    })();
    homeBootstrapPromise = promise;
    promise.then((r) => {
      if (!r && homeBootstrapPromise === promise) homeBootstrapPromise = null;
    });
    return promise;
  },

  /** Seeds the shared home bootstrap with data the server already rendered, so no extra request is made. */
  seedHomeBootstrap(data: HomeBootstrapData): void {
    homeBootstrapPromise = Promise.resolve(data);
    homeBootstrapTimestamp = Date.now();
    cachedBreakingData = data.breaking;
    breakingCacheTimestamp = Date.now();
  },

  /** The shared home bootstrap request if one is running or still fresh, otherwise null. */
  peekHomeBootstrap(): Promise<HomeBootstrapData | null> | null {
    if (homeBootstrapPromise && Date.now() - homeBootstrapTimestamp < HOME_BOOTSTRAP_TTL_MS) {
      return homeBootstrapPromise;
    }
    return null;
  },

  async getBreakingNews(): Promise<BreakingItem[]> {
    const pending = this.peekHomeBootstrap();
    if (pending) {
      const boot = await pending;
      if (boot && boot.breaking.length > 0) return boot.breaking;
    }

    const now = Date.now();
    if (cachedBreakingData && now - breakingCacheTimestamp < BREAKING_CACHE_TTL_MS) {
      return cachedBreakingData;
    }
    if (inFlightBreakingPromise) {
      return inFlightBreakingPromise;
    }

    inFlightBreakingPromise = (async () => {
      try {
        const res = await fetchRead("/api/breaking?limit=12");
        if (res.ok) {
          const json = await res.json().catch(() => null);
          if (json?.success && Array.isArray(json.data)) {
            const items = json.data.slice(0, 12);
            cachedBreakingData = items;
            breakingCacheTimestamp = Date.now();
            return items;
          }
        }
      } catch (err) {
        console.error("[newsService] getBreakingNews error:", err);
      }
      return cachedBreakingData || [];
    })().finally(() => {
      inFlightBreakingPromise = null;
    });

    return inFlightBreakingPromise;
  },
};
