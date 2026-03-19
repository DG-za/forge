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

<!-- Setup instructions will go here -->

## Common Commands

<!-- Commands will be added as the project develops -->

## Environment Variables

<!-- Document required env vars here -->
