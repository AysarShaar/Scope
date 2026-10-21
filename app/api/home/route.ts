import { NextRequest, NextResponse } from 'next/server';
import { withEdgeCache } from '../../../lib/server/edgeCache';
import { getHomeBootstrap } from '../../../lib/server/home';

// One public, short-cached payload for the home page (articles + programs + ticker + live id).
export async function GET(request: NextRequest) {
  return withEdgeCache(request, 60, async () => {
    try {
      const data = await getHomeBootstrap(36);
      return NextResponse.json(
        { success: true, data },
        { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' } },
      );
    } catch (err) {
      console.error('[api/home] error:', err);
      return NextResponse.json({ success: false, error: 'تعذر تحميل بيانات الصفحة الرئيسية' }, { status: 500 });
    }
  });
}
