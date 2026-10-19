import 'next-auth';
import 'next-auth/jwt';
import type { DefaultSession } from 'next-auth';

type SystemRole = 'admin' | 'editor_in_chief' | 'editor';

declare module 'next-auth' {
  interface Session {
    user: DefaultSession['user'] & {
      role?: SystemRole;
      editorId?: string;
      editorName?: string;
      permissions?: string[];
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role?: SystemRole;
    editorId?: string;
    editorName?: string;
    permissions?: string[];
  }
}
