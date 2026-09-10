import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import { db } from '@/lib/prisma';
import { POST } from '@/app/api/graphql/route';
import { getServerSession } from 'next-auth/next';
import { UserService } from '@/server/services/UserService';
import crypto from 'node:crypto';

vi.mock('next-auth/next', () => ({
  getServerSession: vi.fn(),
}));

describe('GraphQL me query & End-to-End Smoke Test', () => {
  let userA: { id: string; email: string; username: string; name: string };
  let userB: { id: string; email: string; username: string; name: string };

  beforeAll(async () => {
    const runId = crypto.randomUUID().slice(0, 8);
    userA = await db.user.create({
      data: {
        email: `me-a-${runId}@example.com`,
        username: `me_a_${runId}`,
        name: 'User A Name',
        targetCompanies: [],
      },
      select: { id: true, email: true, username: true, name: true },
    }) as any;

    userB = await db.user.create({
      data: {
        email: `me-b-${runId}@example.com`,
        username: `me_b_${runId}`,
        name: 'User B Name',
        targetCompanies: [],
      },
      select: { id: true, email: true, username: true, name: true },
    }) as any;
  });

  afterAll(async () => {
    const ids = [userA?.id, userB?.id].filter(Boolean);
    if (ids.length > 0) {
      await db.user.deleteMany({ where: { id: { in: ids } } });
    }
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('34. me returns authenticated user data when session exists', async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce({
      user: { id: userA.id, email: userA.email, name: userA.name },
    } as any);

    const request = new Request('http://localhost:3000/api/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: '{ me { id email username name } }' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);

    const json = await response.json();
    expect(json.errors).toBeUndefined();
    expect(json.data.me).toEqual({
      id: userA.id,
      email: userA.email,
      username: userA.username,
      name: userA.name,
    });
  });

  it('35. me returns error code UNAUTHENTICATED when unauthenticated', async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce(null);

    const request = new Request('http://localhost:3000/api/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: '{ me { id } }' }),
    });

    const response = await POST(request);
    const json = await response.json();

    expect(json.data.me).toBeNull();
    expect(json.errors).toBeDefined();
    expect(json.errors[0].extensions.code).toBe('UNAUTHENTICATED');
  });

  it('36. me returns correct user, enforcing user isolation (A cannot see B)', async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce({
      user: { id: userA.id, email: userA.email },
    } as any);

    const request = new Request('http://localhost:3000/api/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: '{ me { id email username } }' }),
    });

    const response = await POST(request);
    const json = await response.json();

    expect(json.data.me.id).toBe(userA.id);
    expect(json.data.me.email).toBe(userA.email);
    expect(json.data.me.id).not.toBe(userB.id);
  });

  it('37. Error envelope has all required fields (code, message, field, correlationId)', async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce(null);

    const request = new Request('http://localhost:3000/api/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Correlation-ID': 'corr-envelope-37',
      },
      body: JSON.stringify({ query: '{ me { id } }' }),
    });

    const response = await POST(request);
    const json = await response.json();

    expect(json.errors).toBeDefined();
    const error = json.errors[0];
    expect(error.message).toBe('Authentication required');
    expect(error.extensions.code).toBe('UNAUTHENTICATED');
    expect(error.extensions.field).toBeNull();
    expect(error.extensions.correlationId).toBe('corr-envelope-37');
  });

  it('38. X-Correlation-ID present in HTTP response headers', async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce(null);

    const customCorrelationId = 'custom-correlation-header-38';
    const request = new Request('http://localhost:3000/api/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Correlation-ID': customCorrelationId,
      },
      body: JSON.stringify({ query: '{ me { id } }' }),
    });

    const response = await POST(request);
    expect(response.headers.get('X-Correlation-ID')).toBe(customCorrelationId);
  });

  it('39. Internal unexpected error does not leak sensitive information', async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce({
      user: { id: userA.id, email: userA.email },
    } as any);

    const spy = vi
      .spyOn(UserService.prototype, 'getAuthenticatedUser')
      .mockRejectedValueOnce(new Error('Internal database syntax error: SELECT * FROM secret_table'));

    const request = new Request('http://localhost:3000/api/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: '{ me { id email } }' }),
    });

    const response = await POST(request);
    const json = await response.json();

    expect(json.errors).toBeDefined();
    expect(json.errors[0].message).toBe('An unexpected error occurred');
    expect(json.errors[0].extensions.code).toBe('INTERNAL_ERROR');
    expect(json.errors[0].message).not.toContain('secret_table');
    expect(json.errors[0].extensions.stack).toBeUndefined();

    spy.mockRestore();
  });

  it('41. Full me stack E2E: HTTP -> GraphQL -> DB -> response', async () => {
    // Seed real user in TEST_DATABASE_URL and mock session to match
    vi.mocked(getServerSession).mockResolvedValueOnce({
      user: { id: userA.id, email: userA.email, name: userA.name },
    } as any);

    const correlationId = `e2e-${crypto.randomUUID()}`;
    const request = new Request('http://localhost:3000/api/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Correlation-ID': correlationId,
      },
      body: JSON.stringify({ query: '{ me { id email username name } }' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    expect(response.headers.get('X-Correlation-ID')).toBe(correlationId);

    const json = await response.json();
    expect(json.errors).toBeUndefined();
    expect(json.data).toEqual({
      me: {
        id: userA.id,
        email: userA.email,
        username: userA.username,
        name: userA.name,
      },
    });
  });
});
