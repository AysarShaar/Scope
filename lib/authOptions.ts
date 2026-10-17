import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { getCloudflareEnv } from './cloudflare';
import { findEditorByEmail, getAdminEmails } from './auth';

const googleClientId = process.env.GOOGLE_CLIENT_ID?.trim() || '';
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim() || '';

export const isGoogleConfigured = Boolean(
  googleClientId &&
  googleClientSecret &&
  !googleClientId.includes('your-google-client-id')
);

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: googleClientId || 'google-client-id-placeholder',
      clientSecret: googleClientSecret || 'google-client-secret-placeholder',
      authorization: {
        params: {
          prompt: 'select_account',
          access_type: 'offline',
          response_type: 'code',
        },
      },
    }),
  ],
  pages: {
    signIn: '/admin',
    error: '/admin',
  },
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false;
      const email = user.email.toLowerCase().trim();
      const adminEmails = getAdminEmails();

      if (adminEmails.includes(email)) {
        return true;
      }

      try {
        const env = getCloudflareEnv();
        const editorMatch = await findEditorByEmail(email, env);
        if (editorMatch) {
          return true;
        }
      } catch (err) {
        console.error('[authOptions] signIn email check error:', err);
      }

      return false;
    },
    async jwt({ token }) {
      if (token.email) {
        const email = token.email.toLowerCase().trim();
        const adminEmails = getAdminEmails();

        if (adminEmails.includes(email)) {
          token.role = 'admin';
        } else {
          try {
            const env = getCloudflareEnv();
            const editorMatch = await findEditorByEmail(email, env);
            if (editorMatch) {
              token.role = editorMatch.systemRole;
              token.editorId = editorMatch.id;
              token.editorName = editorMatch.name;
            } else {
              delete token.role;
              delete token.editorId;
              delete token.editorName;
            }
          } catch {
            delete token.role;
            delete token.editorId;
            delete token.editorName;
          }
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role || 'editor';
        session.user.editorId = token.editorId || undefined;
        session.user.editorName = token.editorName || session.user.name || undefined;
      }
      return session;
    },
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET || '',
};
