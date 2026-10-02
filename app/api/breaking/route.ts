import { NextRequest, NextResponse } from 'next/server';
import { newsService } from '../../../services/newsService';

export async function GET() {
  const breaking = await newsService.getBreakingNews();
  return NextResponse.json({ success: true, count: breaking.length, data: breaking });
}

export async function POST(request: NextRequest) {
  try {
    const adminKey = request.headers.get('x-admin-key') || request.headers.get('authorization')?.replace('Bearer ', '');
    if (!adminKey) {
      return NextResponse.json(
        { success: false, error: 'غير مصرح: يجب إرفاق رمز المسؤول (Admin Key)' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const result = await newsService.addBreakingNews(body, adminKey);

    if (!result.success) {
      return NextResponse.json(result, { status: 403 });
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'خطأ في الخادم' }, { status: 500 });
  }
}
