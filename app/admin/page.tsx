import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';

export default async function AdminRootRedirect() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string })?.role;
  if (role === 'admin') {
    redirect('/admin/dashboard');
  }
  redirect('/admin/articles');
}
