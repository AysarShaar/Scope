import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { getCloudflareEnv } from '@/lib/cloudflare';
import { findEditorByEmail, getAdminEmails } from '@/lib/auth';
import { can, ADMIN_PERMISSIONS, Permission } from '@/lib/permissions';

export default async function AdminRootRedirect() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email?.toLowerCase().trim();
  if (!email) {
    redirect('/admin/articles');
  }

  const adminEmails = getAdminEmails();
  let livePermissions: readonly Permission[] | Permission[] = session?.user?.permissions as Permission[] || [];

  if (adminEmails.includes(email)) {
    livePermissions = ADMIN_PERMISSIONS;
  } else {
    try {
      const env = getCloudflareEnv();
      const editor = await findEditorByEmail(email, env);
      if (editor) {
        livePermissions = editor.permissions;
      }
    } catch {
      // use token permissions as fallback
    }
  }

  if (can({ permissions: livePermissions }, 'analytics.view')) {
    redirect('/admin/dashboard');
  }
  redirect('/admin/articles');
}
