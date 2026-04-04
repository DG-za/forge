import { describe, expect, it, vi } from 'vitest';

const { mockCreate, mockFindMany, mockUpdate, mockDelete } = vi.hoisted(() => ({
  mockCreate: vi.fn(),
  mockFindMany: vi.fn(),
  mockUpdate: vi.fn(),
  mockDelete: vi.fn(),
}));

vi.mock('@/shared/db.singleton', () => ({
  prisma: {
    mcpServer: { create: mockCreate, findMany: mockFindMany, update: mockUpdate, delete: mockDelete },
  },
}));

import {
  createMcpServer,
  deleteMcpServer,
  getMcpServers,
  updateMcpServer,
} from '@/features/chat/mcp-server.queries';

const sampleServer = {
  id: 'mcp-1',
  name: 'search',
  command: 'npx',
  args: ['-y', '@mcp/search'],
  env: {},
  enabled: true,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
};

describe('createMcpServer', () => {
  it('should create with required fields and defaults', async () => {
    mockCreate.mockResolvedValue(sampleServer);

    const server = await createMcpServer({ name: 'search', command: 'npx' });

    expect(mockCreate).toHaveBeenCalledWith({ data: { name: 'search', command: 'npx' } });
    expect(server).toEqual(sampleServer);
  });

  it('should pass optional args, env, and enabled', async () => {
    const custom = { ...sampleServer, args: ['--flag'], env: { KEY: 'val' }, enabled: false };
    mockCreate.mockResolvedValue(custom);

    const server = await createMcpServer({
      name: 'search',
      command: 'npx',
      args: ['--flag'],
      env: { KEY: 'val' },
      enabled: false,
    });

    expect(mockCreate).toHaveBeenCalledWith({
      data: { name: 'search', command: 'npx', args: ['--flag'], env: { KEY: 'val' }, enabled: false },
    });
    expect(server).toEqual(custom);
  });
});

describe('getMcpServers', () => {
  it('should return all servers ordered by name asc', async () => {
    mockFindMany.mockResolvedValue([sampleServer]);

    const servers = await getMcpServers();

    expect(mockFindMany).toHaveBeenCalledWith({ orderBy: { name: 'asc' } });
    expect(servers).toEqual([sampleServer]);
  });

  it('should return empty array when none exist', async () => {
    mockFindMany.mockResolvedValue([]);

    const servers = await getMcpServers();

    expect(servers).toEqual([]);
  });
});

describe('updateMcpServer', () => {
  it('should update only the provided fields', async () => {
    const updated = { ...sampleServer, name: 'updated-search' };
    mockUpdate.mockResolvedValue(updated);

    const server = await updateMcpServer('mcp-1', { name: 'updated-search' });

    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: 'mcp-1' },
      data: { name: 'updated-search' },
    });
    expect(server).toEqual(updated);
  });
});

describe('deleteMcpServer', () => {
  it('should delete by id', async () => {
    mockDelete.mockResolvedValue(sampleServer);

    await deleteMcpServer('mcp-1');

    expect(mockDelete).toHaveBeenCalledWith({ where: { id: 'mcp-1' } });
  });
});
