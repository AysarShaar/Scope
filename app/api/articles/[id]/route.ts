import { NextRequest, NextResponse } from 'next/server';
import { newsService } from '../../../../services/newsService';

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const article = await newsService.getArticleById(id);

  if (!article) {
    return NextResponse.json({ success: false, error: 'المقال غير موجود' }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: article });
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const adminKey = request.headers.get('x-admin-key') || request.headers.get('authorization')?.replace('Bearer ', '');

  if (!adminKey) {
    return NextResponse.json(
      { success: false, error: 'غير مصرح: يجب إرفاق رمز المسؤول (Admin Key) لحذف المقال' },
      { status: 401 }
    );
  }

  const result = await newsService.deleteArticle(id, adminKey);
  if (!result.success) {
    return NextResponse.json(result, { status: 403 });
  }

  return NextResponse.json(result);
}
