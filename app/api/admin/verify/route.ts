import { NextRequest, NextResponse } from 'next/server';
import { newsService } from '../../../../services/newsService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const key = body.key || request.headers.get('x-admin-key') || '';

    if (!key) {
      return NextResponse.json({ success: false, message: 'رمز المصادقة مطلوب' }, { status: 400 });
    }

    const verification = await newsService.verifyAdminKey(key);
    if (!verification.success) {
      return NextResponse.json(verification, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      message: 'تم التحقق من صلاحيات المسؤول بنجاح',
      d1Connected: newsService.isD1Configured(),
      workerUrl: newsService.getWorkerUrl() || null,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || 'خطأ في الخادم' }, { status: 500 });
  }
}
