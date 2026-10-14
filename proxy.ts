import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Only /api/* goes through this proxy (see matcher). Public pages are untouched, and the security
// headers (including the CSP) are static headers in next.config.ts.
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAuthRoute = pathname.startsWith('/api/auth/');
  const isMethodMutating = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method);
  const isRestrictedPath = pathname.startsWith('/api/editors');

  if (!isAuthRoute && (isMethodMutating || isRestrictedPath)) {
    const secret = process.env.NEXTAUTH_SECRET;
    if (!secret) {
      return NextResponse.json(
        { success: false, error: 'غير مصرح: خطأ في إعدادات الخادم' },
        { status: 500 }
      );
    }

    const token = await getToken({ req: request, secret });

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'غير مصرح: يجب تسجيل الدخول للوصول إلى هذه الواجهة' },
        { status: 401 }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*'],
};
