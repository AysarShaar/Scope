import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { NextRequest } from 'next/server';

const getToken = vi.fn();
vi.mock('next-auth/jwt', () => ({ getToken: (...a: unknown[]) => getToken(...a) }));

let editorRows: unknown[] = [];
vi.mock('../db/client', () => ({
  getDb: () => ({
    select: () => ({ from: () => ({ where: () => ({ limit: async () => editorRows }) }) }),
  }),
}));

import { authenticateRequest } from './auth';

const req = {} as NextRequest;
const env = { DB: {} } as never;

beforeEach(() => {
  getToken.mockReset();
  editorRows = [];
  process.env.NEXTAUTH_SECRET = 'test-secret';
  process.env.ADMIN_EMAILS = 'boss@example.com, Second@Example.com';
});

describe('authenticateRequest', () => {
  it('rejects everything when NEXTAUTH_SECRET is missing', async () => {
    delete process.env.NEXTAUTH_SECRET;
    getToken.mockResolvedValue({ email: 'boss@example.com' });
    expect((await authenticateRequest(req, env)).isValid).toBe(false);
  });

  it('rejects a request without a session', async () => {
    getToken.mockResolvedValue(null);
    expect((await authenticateRequest(req, env)).isValid).toBe(false);
  });

  it('gives admin role to ADMIN_EMAILS, ignoring case and spaces', async () => {
    getToken.mockResolvedValue({ email: 'SECOND@example.com', name: 'Two' });
    const r = await authenticateRequest(req, env);
    expect(r).toMatchObject({ isValid: true, systemRole: 'admin', email: 'second@example.com' });
  });

  it('uses the role stored in the editors table for other emails', async () => {
    getToken.mockResolvedValue({ email: 'ed@example.com' });
    editorRows = [{ id: 'e1', name: 'محرر', role: 'محرر', systemRole: 'editor_in_chief', email: 'ed@example.com' }];
    const r = await authenticateRequest(req, env);
    expect(r).toMatchObject({ isValid: true, systemRole: 'editor_in_chief', editorId: 'e1' });
  });

  it('defaults a stored editor with no role to "editor"', async () => {
    getToken.mockResolvedValue({ email: 'ed@example.com' });
    editorRows = [{ id: 'e1', name: 'محرر', role: 'محرر', systemRole: '', email: 'ed@example.com' }];
    expect((await authenticateRequest(req, env)).systemRole).toBe('editor');
  });

  it('rejects a signed-in user who is neither admin nor a registered editor', async () => {
    getToken.mockResolvedValue({ email: 'stranger@example.com' });
    expect((await authenticateRequest(req, env)).isValid).toBe(false);
  });

  it('rejects instead of throwing when token verification fails', async () => {
    getToken.mockRejectedValue(new Error('bad token'));
    expect((await authenticateRequest(req, env)).isValid).toBe(false);
  });
});
