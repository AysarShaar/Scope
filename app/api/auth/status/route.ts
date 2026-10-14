import { NextResponse } from 'next/server';
import { isGoogleConfigured } from '../../../../lib/authOptions';

export const dynamic = 'force-dynamic';

export async function GET() {
  const host = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  return NextResponse.json({
    googleConfigured: isGoogleConfigured,
    callbackUrl: `${host.replace(/\/$/, '')}/api/auth/callback/google`,
  });
}
