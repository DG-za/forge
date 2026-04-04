import { PrismaPg } from '@prisma/adapter-pg';
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { execSync } from 'child_process';
import pg from 'pg';
import { describe, expect, it } from 'vitest';
import { PrismaClient } from '../../../generated/prisma/client';

let container: StartedPostgreSqlContainer;
let prisma: PrismaClient;
let pool: pg.Pool;

beforeAll(async () => {
  container = await new PostgreSqlContainer('postgres:16').start();
  const databaseUrl = container.getConnectionUri();
  execSync('npx prisma migrate deploy', {
    env: { ...process.env, DATABASE_URL: databaseUrl },
    stdio: 'pipe',
  });
  pool = new pg.Pool({ connectionString: databaseUrl });
  prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
});

afterAll(async () => {
  await prisma.$disconnect();
  await pool.end();
  await container.stop();
});

describe('ChatSession', () => {
  it('should create and retrieve a session without title', async () => {
    const session = await prisma.chatSession.create({ data: {} });

    const found = await prisma.chatSession.findUnique({ where: { id: session.id } });

    expect(found).not.toBeNull();
    expect(found!.title).toBeNull();
    expect(found!.createdAt).toBeInstanceOf(Date);
  });

  it('should create a session with title', async () => {
    const session = await prisma.chatSession.create({ data: { title: 'My Chat' } });

    const found = await prisma.chatSession.findUnique({ where: { id: session.id } });

    expect(found!.title).toBe('My Chat');
  });

  it('should list sessions ordered by updatedAt desc', async () => {
    const first = await prisma.chatSession.create({ data: { title: 'First' } });
    const second = await prisma.chatSession.create({ data: { title: 'Second' } });

    // Touch the first session to make it most recently updated
    await prisma.chatSession.update({ where: { id: first.id }, data: { title: 'First Updated' } });

    const sessions = await prisma.chatSession.findMany({ orderBy: { updatedAt: 'desc' } });

    const ids = sessions.map((s) => s.id);
    expect(ids.indexOf(first.id)).toBeLessThan(ids.indexOf(second.id));
  });
});

describe('ChatMessage', () => {
  it('should add messages and retrieve them in order', async () => {
    const session = await prisma.chatSession.create({ data: {} });

    await prisma.chatMessage.create({
      data: { sessionId: session.id, role: 'user', content: 'Hello' },
    });
    await prisma.chatMessage.create({
      data: { sessionId: session.id, role: 'assistant', content: 'Hi there' },
    });

    const messages = await prisma.chatMessage.findMany({
      where: { sessionId: session.id },
      orderBy: { createdAt: 'asc' },
    });

    expect(messages).toHaveLength(2);
    expect(messages[0].role).toBe('user');
    expect(messages[0].content).toBe('Hello');
    expect(messages[1].role).toBe('assistant');
    expect(messages[1].content).toBe('Hi there');
  });

  it('should store tool message fields', async () => {
    const session = await prisma.chatSession.create({ data: {} });

    const msg = await prisma.chatMessage.create({
      data: {
        sessionId: session.id,
        role: 'tool',
        content: '{"result": "ok"}',
        toolCallId: 'call-123',
        toolName: 'search',
      },
    });

    expect(msg.toolCallId).toBe('call-123');
    expect(msg.toolName).toBe('search');
  });

  it('should cascade delete messages when session is deleted', async () => {
    const session = await prisma.chatSession.create({ data: {} });
    await prisma.chatMessage.create({
      data: { sessionId: session.id, role: 'user', content: 'test' },
    });

    await prisma.chatSession.delete({ where: { id: session.id } });

    const messages = await prisma.chatMessage.findMany({ where: { sessionId: session.id } });
    expect(messages).toHaveLength(0);
  });
});

describe('McpServer', () => {
  it('should create a server with defaults', async () => {
    const server = await prisma.mcpServer.create({
      data: { name: 'search', command: 'npx' },
    });

    expect(server.name).toBe('search');
    expect(server.command).toBe('npx');
    expect(server.args).toEqual([]);
    expect(server.env).toEqual({});
    expect(server.enabled).toBe(true);
  });

  it('should create a server with custom args and env', async () => {
    const server = await prisma.mcpServer.create({
      data: {
        name: 'custom',
        command: 'node',
        args: ['-y', '@mcp/tool'],
        env: { API_KEY: 'secret' },
        enabled: false,
      },
    });

    expect(server.args).toEqual(['-y', '@mcp/tool']);
    expect(server.env).toEqual({ API_KEY: 'secret' });
    expect(server.enabled).toBe(false);
  });

  it('should list servers ordered by name', async () => {
    // Create with names that sort predictably
    await prisma.mcpServer.create({ data: { name: 'zulu', command: 'cmd' } });
    await prisma.mcpServer.create({ data: { name: 'alpha', command: 'cmd' } });

    const servers = await prisma.mcpServer.findMany({ orderBy: { name: 'asc' } });
    const names = servers.map((s) => s.name);

    expect(names.indexOf('alpha')).toBeLessThan(names.indexOf('zulu'));
  });

  it('should update a server', async () => {
    const server = await prisma.mcpServer.create({
      data: { name: 'original', command: 'cmd' },
    });

    const updated = await prisma.mcpServer.update({
      where: { id: server.id },
      data: { name: 'renamed', enabled: false },
    });

    expect(updated.name).toBe('renamed');
    expect(updated.enabled).toBe(false);
    expect(updated.command).toBe('cmd');
  });

  it('should delete a server', async () => {
    const server = await prisma.mcpServer.create({
      data: { name: 'to-delete', command: 'cmd' },
    });

    await prisma.mcpServer.delete({ where: { id: server.id } });

    const found = await prisma.mcpServer.findUnique({ where: { id: server.id } });
    expect(found).toBeNull();
  });
});
