const mocks = vi.hoisted(() => ({
  config: vi.fn(),
  isConfigured: vi.fn(),
  me: vi.fn(),
  users: vi.fn(),
  torrents: vi.fn(),
  unnecessaryTorrents: vi.fn(),
}));

vi.mock('@client/integrations/api', () => ({
  apiClient: {
    api: {
      config: { $get: mocks.config, 'is-configured': { $get: mocks.isConfigured } },
      users: { $get: mocks.users, me: { $get: mocks.me } },
      torrents: {
        $get: mocks.torrents,
        unnecessary: { $get: mocks.unnecessaryTorrents },
      },
    },
  },
}));

import { configQueryOptions, isConfiguredQueryOptions } from './config';
import { meOrNullQueryOptions } from './me';
import { torrentsQueryOptions, unnecessaryTorrentsQueryOptions } from './torrents';
import { usersQueryOptions } from './users';

describe('TanStack query options', () => {
  const context = { signal: new AbortController().signal } as never;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch configuration and configured state', async () => {
    mocks.config.mockResolvedValueOnce(new Response(JSON.stringify({ value: true })));
    mocks.isConfigured.mockResolvedValueOnce(
      new Response(JSON.stringify({ isConfigured: true })),
    );

    await expect(configQueryOptions.queryFn?.(context)).resolves.toEqual({ value: true });
    await expect(isConfiguredQueryOptions.queryFn?.(context)).resolves.toBe(true);
  });

  it('should fetch users and torrents', async () => {
    mocks.users.mockResolvedValueOnce(new Response(JSON.stringify([{ id: 1 }])));
    mocks.torrents.mockResolvedValueOnce(
      new Response(JSON.stringify([{ id: 'torrent' }])),
    );
    mocks.unnecessaryTorrents.mockResolvedValueOnce(
      new Response(JSON.stringify([{ id: 'unnecessary-torrent' }])),
    );

    await expect(usersQueryOptions.queryFn?.(context)).resolves.toEqual([{ id: 1 }]);
    await expect(torrentsQueryOptions.queryFn?.(context)).resolves.toEqual([
      { id: 'torrent' },
    ]);
    await expect(unnecessaryTorrentsQueryOptions.queryFn?.(context)).resolves.toEqual([
      { id: 'unnecessary-torrent' },
    ]);
  });

  it('should return null for an unauthenticated user', async () => {
    mocks.me.mockResolvedValueOnce(new Response(null, { status: 401 }));

    await expect(meOrNullQueryOptions.queryFn?.(context)).resolves.toBeNull();
  });

  it('should reject failed user and torrent requests', async () => {
    mocks.me.mockResolvedValueOnce(new Response(null, { status: 500 }));
    mocks.users.mockResolvedValueOnce(new Response('failed', { status: 500 }));
    mocks.torrents.mockResolvedValueOnce(new Response('failed', { status: 500 }));
    mocks.unnecessaryTorrents.mockResolvedValueOnce(
      new Response('failed unnecessary', { status: 500 }),
    );

    await expect(meOrNullQueryOptions.queryFn?.(context)).rejects.toThrow(
      'Failed to fetch user profile',
    );
    await expect(usersQueryOptions.queryFn?.(context)).rejects.toThrow(
      'Failed to fetch users',
    );
    await expect(torrentsQueryOptions.queryFn?.(context)).rejects.toThrow('failed');
    await expect(unnecessaryTorrentsQueryOptions.queryFn?.(context)).rejects.toThrow(
      'failed unnecessary',
    );
  });
});
