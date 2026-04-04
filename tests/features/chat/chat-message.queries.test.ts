import { describe, expect, it, vi } from 'vitest';

const { mockCreate, mockFindMany } = vi.hoisted(() => ({
  mockCreate: vi.fn(),
  mockFindMany: vi.fn(),
}));

vi.mock('@/shared/db.singleton', () => ({
  prisma: { chatMessage: { create: mockCreate, findMany: mockFindMany } },
}));

import { addMessage, getMessages } from '@/features/chat/chat-message.queries';

const sampleMessage = {
  id: 'msg-1',
  sessionId: 'session-1',
  role: 'user',
  content: 'Hello',
  toolCallId: null,
  toolName: null,
  createdAt: new Date('2026-01-01'),
};

describe('addMessage', () => {
  it('should create a message with required fields', async () => {
    mockCreate.mockResolvedValue(sampleMessage);

    const message = await addMessage({ sessionId: 'session-1', role: 'user', content: 'Hello' });

    expect(mockCreate).toHaveBeenCalledWith({
      data: { sessionId: 'session-1', role: 'user', content: 'Hello' },
    });
    expect(message).toEqual(sampleMessage);
  });

  it('should pass optional toolCallId and toolName', async () => {
    const toolMessage = { ...sampleMessage, id: 'msg-2', role: 'tool', toolCallId: 'call-1', toolName: 'search' };
    mockCreate.mockResolvedValue(toolMessage);

    const message = await addMessage({
      sessionId: 'session-1',
      role: 'tool',
      content: 'Hello',
      toolCallId: 'call-1',
      toolName: 'search',
    });

    expect(mockCreate).toHaveBeenCalledWith({
      data: { sessionId: 'session-1', role: 'tool', content: 'Hello', toolCallId: 'call-1', toolName: 'search' },
    });
    expect(message).toEqual(toolMessage);
  });
});

describe('getMessages', () => {
  it('should return messages for a session ordered by createdAt asc', async () => {
    mockFindMany.mockResolvedValue([sampleMessage]);

    const messages = await getMessages('session-1');

    expect(mockFindMany).toHaveBeenCalledWith({
      where: { sessionId: 'session-1' },
      orderBy: { createdAt: 'asc' },
    });
    expect(messages).toEqual([sampleMessage]);
  });

  it('should return empty array for session with no messages', async () => {
    mockFindMany.mockResolvedValue([]);

    const messages = await getMessages('session-1');

    expect(messages).toEqual([]);
  });
});
