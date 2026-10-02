import { NextRequest, NextResponse } from 'next/server';
import { newsService } from '../../../services/newsService';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category') || undefined;
  const search = searchParams.get('search') || undefined;
  const limit = parseInt(searchParams.get('limit') || '50', 10);

  const articles = await newsService.getArticles(category, search, limit);
  return NextResponse.json({ success: true, count: articles.length, data: articles });
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
    const result = await newsService.createArticle(body, adminKey);

    if (!result.success) {
      return NextResponse.json(result, { status: 403 });
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'خطأ في الخادم' }, { status: 500 });
  }
}
