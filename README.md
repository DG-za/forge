# Forge 🤖

Fire-and-forget autonomous task runner — dispatches AI agents to work through GitHub epics.

## Stack

TypeScript, Claude Agent SDK, Next.js, Docker

## Architecture

- **Dispatcher** — reads an epic's sub-issues, runs a questions phase, then works through issues sequentially
- **Worker agents** — implement, test, self-review, and create PRs for individual issues
- **Web UI** — Next.js mobile-first dashboard for triggering runs, answering questions, and monitoring progress
- **Notifications** — ntfy push notifications for status updates

## Getting Started

```bash
npm install
docker compose up -d          # Start local Postgres
cp .env.example .env          # Configure DATABASE_URL (defaults work with Docker Compose)
npx prisma migrate deploy     # Apply database migrations
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the dashboard. Requires Node.js 20+ and Docker Desktop.

## Common Commands

| Command | Description |
|---|---|
| `npm run dev` | Start Next.js dev server |
| `npm run build` | Production build |
| `npm test` | Run tests (uses Testcontainers — needs Docker) |
| `npm run test:watch` | Run tests in watch mode |
| `npm run lint` | Run ESLint |
| `npm run format` | Format with Prettier |
| `npm run typecheck` | TypeScript type checking |
| `docker compose up -d` | Start local Postgres |
| `npx prisma migrate deploy` | Apply database migrations |

## Environment Variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | Postgres connection string (see `.env.example`) |
| `ANTHROPIC_API_KEY` | Claude API key for agent dispatch |
