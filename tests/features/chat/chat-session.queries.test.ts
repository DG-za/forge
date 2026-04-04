import { describe, expect, it, vi } from 'vitest';

const { mockCreate, mockFindUnique, mockFindMany } = vi.hoisted(() => ({
  mockCreate: vi.fn(),
  mockFindUnique: vi.fn(),
  mockFindMany: vi.fn(),
}));

vi.mock('@/shared/db.singleton', () => ({
  prisma: { chatSession: { create: mockCreate, findUnique: mockFindUnique, findMany: mockFindMany } },
}));

import { createSession, getSession, getSessions } from '@/features/chat/chat-session.queries';

const sampleSession = {
  id: 'session-1',
  title: null,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
};

const sampleSessionWithMessages = {
  ...sampleSession,
  messages: [
    { id: 'msg-1', role: 'user', content: 'Hello', toolCallId: null, toolName: null, createdAt: new Date('2026-01-01') },
    {
      id: 'msg-2',
      role: 'assistant',
      content: 'Hi there',
      toolCallId: null,
      toolName: null,
      createdAt: new Date('2026-01-01T00:01:00'),
    },
  ],
};

describe('createSession', () => {
  it('should create a session without title when omitted', async () => {
    mockCreate.mockResolvedValue(sampleSession);

    const session = await createSession();

    expect(mockCreate).toHaveBeenCalledWith({ data: {} });
    expect(session).toEqual(sampleSession);
  });

  it('should create a session with title when provided', async () => {
    const titled = { ...sampleSession, title: 'My Chat' };
    mockCreate.mockResolvedValue(titled);

    const session = await createSession('My Chat');

    expect(mockCreate).toHaveBeenCalledWith({ data: { title: 'My Chat' } });
    expect(session).toEqual(titled);
  });
});

describe('getSession', () => {
  it('should return session with messages ordered by createdAt asc', async () => {
    mockFindUnique.mockResolvedValue(sampleSessionWithMessages);

    const session = await getSession('session-1');

    expect(mockFindUnique).toHaveBeenCalledWith({
      where: { id: 'session-1' },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });
    expect(session).toEqual(sampleSessionWithMessages);
  });

  it('should return null for missing session', async () => {
    mockFindUnique.mockResolvedValue(null);

    const session = await getSession('nonexistent');

    expect(session).toBeNull();
  });
});

describe('getSessions', () => {
  it('should return sessions ordered by updatedAt desc', async () => {
    mockFindMany.mockResolvedValue([sampleSession]);

    const sessions = await getSessions();

    expect(mockFindMany).toHaveBeenCalledWith({ orderBy: { updatedAt: 'desc' } });
    expect(sessions).toEqual([sampleSession]);
  });

  it('should return empty array when no sessions exist', async () => {
    mockFindMany.mockResolvedValue([]);

    const sessions = await getSessions();

    expect(sessions).toEqual([]);
  });
});
