import { NextRequest, NextResponse } from "next/server";
import { getCloudflareEnv } from "@/lib/cloudflare";
import { getDb } from "@/db/client";
import { articles } from "@/db/schema";
import { authenticateRequest } from "@/lib/auth";
import { inArray, desc } from "drizzle-orm";
import { errorMessage } from "@/lib/errors";

export const runtime = "nodejs";

interface TopArticleItem {
  id: string;
  path: string;
  title: string;
  subtitle?: string | null;
  category: string;
  categorySlug: string;
  imageUrl?: string | null;
  date?: string | null;
  views: number;
  uniques: number;
}

interface CountryItem {
  code: string;
  nameAr: string;
  nameEn: string;
  flag: string;
  visitors: number;
  percentage: number;
}

interface ReferrerItem {
  source: string;
  sourceAr: string;
  sourceEn: string;
  category: "search" | "social" | "direct" | "referral";
  count: number;
  percentage: number;
}

interface DeviceItem {
  type: string;
  labelAr: string;
  labelEn: string;
  count: number;
  percentage: number;
}

const COUNTRY_MAP: Record<string, { ar: string; en: string; flag: string }> = {
  SA: { ar: "المملكة العربية السعودية", en: "Saudi Arabia", flag: "🇸🇦" },
  EG: { ar: "مصر", en: "Egypt", flag: "🇪🇬" },
  AE: { ar: "الإمارات العربية المتحدة", en: "United Arab Emirates", flag: "🇦🇪" },
  JO: { ar: "الأردن", en: "Jordan", flag: "🇯🇴" },
  IQ: { ar: "العراق", en: "Iraq", flag: "🇮🇶" },
  SY: { ar: "سوريا", en: "Syria", flag: "🇸🇾" },
  LB: { ar: "لبنان", en: "Lebanon", flag: "🇱🇧" },
  PS: { ar: "فلسطين", en: "Palestine", flag: "🇵🇸" },
  KW: { ar: "الكويت", en: "Kuwait", flag: "🇰🇼" },
  QA: { ar: "قطر", en: "Qatar", flag: "🇶🇦" },
  BH: { ar: "البحرين", en: "Bahrain", flag: "🇧🇭" },
  OM: { ar: "عُمان", en: "Oman", flag: "🇴🇲" },
  MA: { ar: "المغرب", en: "Morocco", flag: "🇲🇦" },
  DZ: { ar: "الجزائر", en: "Algeria", flag: "🇩🇿" },
  TN: { ar: "تونس", en: "Tunisia", flag: "🇹🇳" },
  US: { ar: "الولايات المتحدة", en: "United States", flag: "🇺🇸" },
  GB: { ar: "المملكة المتحدة", en: "United Kingdom", flag: "🇬🇧" },
  DE: { ar: "ألمانيا", en: "Germany", flag: "🇩🇪" },
  FR: { ar: "فرنسا", en: "France", flag: "🇫🇷" },
  TR: { ar: "تركيا", en: "Turkey", flag: "🇹🇷" },
  NL: { ar: "هولندا", en: "Netherlands", flag: "🇳🇱" },
  SE: { ar: "السويد", en: "Sweden", flag: "🇸🇪" },
};

function formatCountry(nameOrCode: string): { ar: string; en: string; flag: string; code: string } {
  const clean = nameOrCode?.trim() || "";
  if (COUNTRY_MAP[clean.toUpperCase()]) {
    const c = COUNTRY_MAP[clean.toUpperCase()];
    return { ...c, code: clean.toUpperCase() };
  }
  // Try matching by English name
  const match = Object.entries(COUNTRY_MAP).find(
    ([, v]) => v.en.toLowerCase() === clean.toLowerCase()
  );
  if (match) {
    return { ...match[1], code: match[0] };
  }
  return {
    ar: clean || "أخرى",
    en: clean || "Other",
    flag: "🌐",
    code: clean.slice(0, 3).toUpperCase() || "INT",
  };
}

function formatReferrer(host: string): { sourceAr: string; sourceEn: string; category: ReferrerItem["category"] } {
  const h = (host || "").toLowerCase();
  if (!h || h === "direct" || h === "none") {
    return { sourceAr: "زيارات مباشرة", sourceEn: "Direct / Bookmarks", category: "direct" };
  }
  if (h.includes("google")) {
    return { sourceAr: "بحث جوجل", sourceEn: "Google Search", category: "search" };
  }
  if (h.includes("facebook") || h.includes("fb.com")) {
    return { sourceAr: "فيسبوك", sourceEn: "Facebook", category: "social" };
  }
  if (h.includes("t.co") || h.includes("twitter") || h.includes("x.com")) {
    return { sourceAr: "منصة إكس (تويتر)", sourceEn: "X (Twitter)", category: "social" };
  }
  if (h.includes("instagram")) {
    return { sourceAr: "إنستغرام", sourceEn: "Instagram", category: "social" };
  }
  if (h.includes("t.me") || h.includes("telegram")) {
    return { sourceAr: "تيليجرام", sourceEn: "Telegram", category: "social" };
  }
  if (h.includes("linkedin")) {
    return { sourceAr: "لينكد إن", sourceEn: "LinkedIn", category: "social" };
  }
  if (h.includes("youtube")) {
    return { sourceAr: "يوتيوب", sourceEn: "YouTube", category: "social" };
  }
  if (h.includes("bing")) {
    return { sourceAr: "محرك بينغ", sourceEn: "Bing Search", category: "search" };
  }
  return { sourceAr: host, sourceEn: host, category: "referral" };
}

export async function GET(request: NextRequest) {
  const env = getCloudflareEnv();

  // 1. Strict Authorization Check: Admin Role Only
  const auth = await authenticateRequest(request, env);
  if (!auth.isValid) {
    return NextResponse.json(
      { success: false, error: "غير مصرح: يجب تسجيل الدخول للوصول إلى لوحة المؤشرات." },
      { status: 401 }
    );
  }
  if (auth.systemRole !== "admin") {
    return NextResponse.json(
      { success: false, error: "صلاحية مرفوضة: لوحة المؤشرات والتحليلات مخصصة لمدير النظام (Admin) فقط." },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(request.url);
  const timeRange = searchParams.get("timeRange") || "today"; // "today" | "7d" | "30d"

  // Calculate ISO dates for Cloudflare GraphQL
  const now = new Date();
  let sinceDate = new Date();
  if (timeRange === "30d") {
    sinceDate.setDate(now.getDate() - 30);
  } else if (timeRange === "7d") {
    sinceDate.setDate(now.getDate() - 7);
  } else {
    // 24 hours
    sinceDate.setHours(now.getHours() - 24);
  }

  const since = sinceDate.toISOString();
  const until = now.toISOString();

  // 2. Read Cloudflare secrets
  const apiToken = (
    process.env.CLOUDFLARE_API_TOKEN ||
    (env as unknown as Record<string, string>)?.CLOUDFLARE_API_TOKEN
  )?.trim();
  const zoneId = (
    process.env.CLOUDFLARE_ZONE_ID ||
    (env as unknown as Record<string, string>)?.CLOUDFLARE_ZONE_ID
  )?.trim();

  // 3. Fallback / Demo data if secrets are not configured or if DB lookup is needed
  let dbArticles: Array<{
    id: string;
    title: string;
    subtitle: string | null;
    category: string;
    categorySlug: string;
    imageUrl: string | null;
    date: string | null;
  }> = [];

  if (env?.DB) {
    try {
      const db = getDb(env.DB);
      dbArticles = await db
        .select({
          id: articles.id,
          title: articles.title,
          subtitle: articles.subtitle,
          category: articles.category,
          categorySlug: articles.categorySlug,
          imageUrl: articles.imageUrl,
          date: articles.date,
        })
        .from(articles)
        .orderBy(desc(articles.createdAt))
        .limit(20);
    } catch (e) {
      console.error("[analytics] Failed to fetch articles from DB:", e);
    }
  }

  // If Cloudflare secrets are missing, deliver realistic, interactive demo analytics
  // populated with actual articles from the site's database!
  if (!apiToken || !zoneId) {
    const demoMultiplier = timeRange === "30d" ? 28 : timeRange === "7d" ? 6.5 : 1;
    const baseVisitors = Math.round(1420 * demoMultiplier);
    const basePageViews = Math.round(4890 * demoMultiplier);
    const baseBytes = Math.round(345000000 * demoMultiplier); // ~345MB

    const topArticles: TopArticleItem[] = dbArticles.slice(0, 8).map((art, idx) => {
      const weight = Math.max(1, 8 - idx);
      const views = Math.round((basePageViews * 0.42 * weight) / 28);
      const uniques = Math.round(views * 0.72);
      return {
        id: art.id,
        path: `/news/${art.id}`,
        title: art.title,
        subtitle: art.subtitle,
        category: art.category,
        categorySlug: art.categorySlug,
        imageUrl: art.imageUrl,
        date: art.date,
        views,
        uniques,
      };
    });

    const countries: CountryItem[] = [
      { code: "SA", nameAr: "المملكة العربية السعودية", nameEn: "Saudi Arabia", flag: "🇸🇦", visitors: Math.round(baseVisitors * 0.38), percentage: 38 },
      { code: "EG", nameAr: "مصر", nameEn: "Egypt", flag: "🇪🇬", visitors: Math.round(baseVisitors * 0.22), percentage: 22 },
      { code: "AE", nameAr: "الإمارات العربية المتحدة", nameEn: "United Arab Emirates", flag: "🇦🇪", visitors: Math.round(baseVisitors * 0.14), percentage: 14 },
      { code: "JO", nameAr: "الأردن", nameEn: "Jordan", flag: "🇯🇴", visitors: Math.round(baseVisitors * 0.08), percentage: 8 },
      { code: "IQ", nameAr: "العراق", nameEn: "Iraq", flag: "🇮🇶", visitors: Math.round(baseVisitors * 0.06), percentage: 6 },
      { code: "US", nameAr: "الولايات المتحدة", nameEn: "United States", flag: "🇺🇸", visitors: Math.round(baseVisitors * 0.05), percentage: 5 },
      { code: "GB", nameAr: "المملكة المتحدة", nameEn: "United Kingdom", flag: "🇬🇧", visitors: Math.round(baseVisitors * 0.04), percentage: 4 },
      { code: "DE", nameAr: "ألمانيا", nameEn: "Germany", flag: "🇩🇪", visitors: Math.round(baseVisitors * 0.03), percentage: 3 },
    ];

    const referrers: ReferrerItem[] = [
      { source: "google.com", sourceAr: "بحث جوجل", sourceEn: "Google Search", category: "search", count: Math.round(baseVisitors * 0.41), percentage: 41 },
      { source: "direct", sourceAr: "زيارات مباشرة", sourceEn: "Direct / Bookmarks", category: "direct", count: Math.round(baseVisitors * 0.26), percentage: 26 },
      { source: "x.com", sourceAr: "منصة إكس (تويتر)", sourceEn: "X (Twitter)", category: "social", count: Math.round(baseVisitors * 0.16), percentage: 16 },
      { source: "facebook.com", sourceAr: "فيسبوك", sourceEn: "Facebook", category: "social", count: Math.round(baseVisitors * 0.09), percentage: 9 },
      { source: "telegram.org", sourceAr: "تيليجرام", sourceEn: "Telegram", category: "social", count: Math.round(baseVisitors * 0.05), percentage: 5 },
      { source: "instagram.com", sourceAr: "إنستغرام", sourceEn: "Instagram", category: "social", count: Math.round(baseVisitors * 0.03), percentage: 3 },
    ];

    const devices: DeviceItem[] = [
      { type: "mobile", labelAr: "الهواتف المحمولة", labelEn: "Mobile Devices", count: Math.round(baseVisitors * 0.76), percentage: 76 },
      { type: "desktop", labelAr: "أجهزة الحاسوب", labelEn: "Desktop", count: Math.round(baseVisitors * 0.20), percentage: 20 },
      { type: "tablet", labelAr: "الأجهزة اللوحية", labelEn: "Tablet", count: Math.round(baseVisitors * 0.04), percentage: 4 },
    ];

    return NextResponse.json({
      success: true,
      isConfigured: false,
      notice: "Cloudflare Analytics secrets (CLOUDFLARE_API_TOKEN, CLOUDFLARE_ZONE_ID) are not set yet. Showing simulated demonstration data with real database articles.",
      data: {
        timeRange,
        overview: {
          totalVisitors: baseVisitors,
          totalPageViews: basePageViews,
          dataTransferredBytes: baseBytes,
          cacheHitRatio: 94.2,
          avgViewsPerVisitor: +(basePageViews / baseVisitors).toFixed(1),
        },
        topArticles,
        topCountries: countries,
        topReferrers: referrers,
        devices,
      },
    });
  }

  // 4. Query Real Cloudflare GraphQL API
  const graphqlQuery = `
    query GetDomainAnalytics($zoneTag: string!, $since: string!, $until: string!) {
      viewer {
        zones(filter: { zoneTag: $zoneTag }) {
          totalOverview: httpRequestsAdaptiveGroups(
            filter: {
              datetime_geq: $since
              datetime_leq: $until
              requestSource: "eyeball"
            }
            limit: 1
          ) {
            count
            sum {
              edgeResponseBytes
            }
            uniq {
              uniques
            }
          }
          cachedOverview: httpRequestsAdaptiveGroups(
            filter: {
              datetime_geq: $since
              datetime_leq: $until
              cacheStatus: "hit"
              requestSource: "eyeball"
            }
            limit: 1
          ) {
            count
          }
          topArticles: httpRequestsAdaptiveGroups(
            filter: {
              datetime_geq: $since
              datetime_leq: $until
              clientRequestPath_like: "/news/%"
              requestSource: "eyeball"
            }
            orderBy: [count_DESC]
            limit: 20
          ) {
            count
            dimensions {
              clientRequestPath
            }
            uniq {
              uniques
            }
          }
          topCountries: httpRequestsAdaptiveGroups(
            filter: {
              datetime_geq: $since
              datetime_leq: $until
              requestSource: "eyeball"
            }
            orderBy: [count_DESC]
            limit: 12
          ) {
            count
            dimensions {
              clientCountryName
            }
            uniq {
              uniques
            }
          }
          topReferrers: httpRequestsAdaptiveGroups(
            filter: {
              datetime_geq: $since
              datetime_leq: $until
              clientRefererHost_neq: ""
              requestSource: "eyeball"
            }
            orderBy: [count_DESC]
            limit: 8
          ) {
            count
            dimensions {
              clientRefererHost
            }
          }
          devices: httpRequestsAdaptiveGroups(
            filter: {
              datetime_geq: $since
              datetime_leq: $until
              requestSource: "eyeball"
            }
            orderBy: [count_DESC]
            limit: 5
          ) {
            count
            dimensions {
              clientDeviceType
            }
          }
        }
      }
    }
  `;

  try {
    const cfRes = await fetch("https://api.cloudflare.com/client/v4/graphql", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: graphqlQuery,
        variables: {
          zoneTag: zoneId,
          since,
          until,
        },
      }),
    });

    if (!cfRes.ok) {
      const errText = await cfRes.text();
      throw new Error(`Cloudflare HTTP error ${cfRes.status}: ${errText.slice(0, 200)}`);
    }

    const cfJson = await cfRes.json();
    if (cfJson.errors && cfJson.errors.length > 0) {
      throw new Error(cfJson.errors.map((e: { message: string }) => e.message).join(", "));
    }

    const zoneData = cfJson.data?.viewer?.zones?.[0];
    if (!zoneData) {
      throw new Error("No zone data returned from Cloudflare GraphQL.");
    }

    const totalGroup = zoneData.totalOverview?.[0] || {};
    const totalRequests = totalGroup.count || 0;
    const totalVisitors = totalGroup.uniq?.uniques || 0;
    const dataTransferredBytes = totalGroup.sum?.edgeResponseBytes || 0;
    const cachedCount = zoneData.cachedOverview?.[0]?.count || 0;
    const cacheHitRatio = totalRequests > 0 ? +((cachedCount / totalRequests) * 100).toFixed(1) : 95.0;

    // Resolve top articles from DB by path
    const rawArticles = zoneData.topArticles || [];
    const articleIds: string[] = [];

    rawArticles.forEach((item: { dimensions?: { clientRequestPath?: string } }) => {
      const path = item.dimensions?.clientRequestPath || "";
      const match = path.match(/^\/news\/([^/?#]+)/);
      if (match && match[1]) {
        articleIds.push(match[1]);
      }
    });

    // Query DB for these articles to get real titles & names
    let resolvedDbArticles: Record<string, (typeof dbArticles)[0]> = {};
    if (articleIds.length > 0 && env?.DB) {
      try {
        const db = getDb(env.DB);
        const rows = await db
          .select({
            id: articles.id,
            title: articles.title,
            subtitle: articles.subtitle,
            category: articles.category,
            categorySlug: articles.categorySlug,
            imageUrl: articles.imageUrl,
            date: articles.date,
          })
          .from(articles)
          .where(inArray(articles.id, articleIds));

        rows.forEach((r: (typeof dbArticles)[0]) => {
          resolvedDbArticles[r.id] = r;
        });
      } catch (e) {
        console.error("[analytics] DB resolve error:", e);
      }
    }

    const topArticles: TopArticleItem[] = rawArticles
      .map((item: { count: number; dimensions?: { clientRequestPath?: string }; uniq?: { uniques?: number } }) => {
        const path = item.dimensions?.clientRequestPath || "";
        const match = path.match(/^\/news\/([^/?#]+)/);
        const id = match ? match[1] : path;
        const dbArt = resolvedDbArticles[id];

        // Format clean title: prefer DB title, fallback to clean slug or path
        const title = dbArt?.title || decodeURIComponent(id).replace(/-/g, " ");

        return {
          id,
          path,
          title,
          subtitle: dbArt?.subtitle || null,
          category: dbArt?.category || "تقرير خاص",
          categorySlug: dbArt?.categorySlug || "news",
          imageUrl: dbArt?.imageUrl || null,
          date: dbArt?.date || null,
          views: item.count || 0,
          uniques: item.uniq?.uniques || Math.round((item.count || 1) * 0.75),
        };
      })
      .slice(0, 15);

    // Format countries
    const rawCountries = zoneData.topCountries || [];
    const totalCountryVisitors = rawCountries.reduce(
      (sum: number, c: { uniq?: { uniques?: number } }) => sum + (c.uniq?.uniques || 0),
      0
    ) || totalVisitors || 1;

    const countries: CountryItem[] = rawCountries.map((c: { count: number; dimensions?: { clientCountryName?: string }; uniq?: { uniques?: number } }) => {
      const rawName = c.dimensions?.clientCountryName || "";
      const formatted = formatCountry(rawName);
      const visitors = c.uniq?.uniques || c.count || 0;
      const percentage = +((visitors / totalCountryVisitors) * 100).toFixed(1);
      return {
        code: formatted.code,
        nameAr: formatted.ar,
        nameEn: formatted.en,
        flag: formatted.flag,
        visitors,
        percentage,
      };
    });

    // Format referrers
    const rawReferrers = zoneData.topReferrers || [];
    const totalReferrerCount = rawReferrers.reduce((s: number, r: { count?: number }) => s + (r.count || 0), 0) || totalRequests || 1;
    const referrers: ReferrerItem[] = rawReferrers.map((r: { count: number; dimensions?: { clientRefererHost?: string } }) => {
      const host = r.dimensions?.clientRefererHost || "";
      const f = formatReferrer(host);
      const count = r.count || 0;
      const percentage = +((count / totalReferrerCount) * 100).toFixed(1);
      return {
        source: host,
        sourceAr: f.sourceAr,
        sourceEn: f.sourceEn,
        category: f.category,
        count,
        percentage,
      };
    });

    // Format devices
    const rawDevices = zoneData.devices || [];
    const totalDeviceCount = rawDevices.reduce((s: number, d: { count?: number }) => s + (d.count || 0), 0) || totalRequests || 1;
    const devices: DeviceItem[] = rawDevices.map((d: { count: number; dimensions?: { clientDeviceType?: string } }) => {
      const type = (d.dimensions?.clientDeviceType || "desktop").toLowerCase();
      const count = d.count || 0;
      const percentage = +((count / totalDeviceCount) * 100).toFixed(1);
      let labelAr = "حاسوب";
      let labelEn = "Desktop";
      if (type.includes("mobile") || type.includes("phone")) {
        labelAr = "هواتف محمولة";
        labelEn = "Mobile";
      } else if (type.includes("tablet")) {
        labelAr = "أجهزة لوحية";
        labelEn = "Tablet";
      }
      return {
        type,
        labelAr,
        labelEn,
        count,
        percentage,
      };
    });

    return NextResponse.json({
      success: true,
      isConfigured: true,
      data: {
        timeRange,
        overview: {
          totalVisitors,
          totalPageViews: totalRequests,
          dataTransferredBytes,
          cacheHitRatio,
          avgViewsPerVisitor: totalVisitors > 0 ? +(totalRequests / totalVisitors).toFixed(1) : 1.0,
        },
        topArticles,
        topCountries: countries,
        topReferrers: referrers,
        devices,
      },
    });
  } catch (err: unknown) {
    console.error("[analytics] Cloudflare GraphQL query error:", err);
    // Return friendly error with fallback demo so admin is never locked out of the UI
    return NextResponse.json(
      {
        success: true,
        isConfigured: false,
        error: `تعذر الاتصال بـ Cloudflare Analytics: ${errorMessage(err)}`,
        data: {
          timeRange,
          overview: {
            totalVisitors: 0,
            totalPageViews: 0,
            dataTransferredBytes: 0,
            cacheHitRatio: 0,
            avgViewsPerVisitor: 0,
          },
          topArticles: [],
          topCountries: [],
          topReferrers: [],
          devices: [],
        },
      },
      { status: 200 }
    );
  }
}
