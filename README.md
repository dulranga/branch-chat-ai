# Branching Chat

An AI chat application where conversations form a tree structure. Each node is a linear message exchange; forking creates a child node that inherits its ancestor chain's context.

Built with [Next.js 16](https://nextjs.org), [React 19](https://react.dev), and the [Vercel AI SDK](https://sdk.vercel.ai/docs).

## Features

- **Branching conversations** — fork any message into a new parallel thread. The full ancestor chain is preserved as context.
- **Multi-provider** — OpenAI, Anthropic, Google, Mistral, Groq, and more via a pluggable Model Catalog.
- **Tree visualization** — interactive graph of the conversation tree using [xyflow/react](https://xyflow.com).
- **Model management** — add, configure, and switch between multiple AI models with encrypted API key storage.
- **Reasoning levels** — per-message control of thinking effort (`none` → `xhigh`).
- **Message editing** — edit your last message with full audit trail (originals preserved).
- **Rich rendering** — code highlighting (highlight.js), math (katex via streamdown), diagrams (mermaid), and CJK support via [StreamDown](https://streamdown.dev).
- **Three-panel layout** — sidebar (chat list), chat area (messages), tree panel (node graph). Collapses to mobile-friendly two-panel view.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| UI | React 19, shadcn/ui, Radix UI, Tailwind CSS v4 |
| AI | Vercel AI SDK v7 (`ai`, `@ai-sdk/*`) |
| Database | PostgreSQL + Drizzle ORM |
| Auth | [better-auth](https://www.better-auth.com) |
| Encryption | pgcrypto (`pgp_sym_encrypt`/`pgp_sym_decrypt`) |
| Tree graph | [@xyflow/react](https://xyflow.com) |
| Panels | react-resizable-panels |
| Rendering | StreamDown (CJK, code, math, mermaid) |
| Linting | Biome |
| Testing | Vitest, Playwright |
| Package manager | npm |

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL database

### Setup

```bash
# Install dependencies
npm install

# Copy environment variables and fill them in
cp .env.example .env
```

Required environment variables:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `BETTER_AUTH_SECRET` | Random secret ≥ 32 characters |
| `BETTER_AUTH_URL` | Public app URL (e.g. `http://localhost:6011`) |
| `APP_ENCRYPTION_KEY` | 32-byte key for pgp_sym_encrypt |
| `SYSTEM_MODEL_*` | Model config for internal tasks (title gen, etc.) |
| Provider keys | `OPENAI_API_KEY`, etc. (per provider) |

### Database

```bash
# Run migrations
npx drizzle-kit migrate

# (Optional) generate migrations after schema changes
npx drizzle-kit generate
```

### Development

```bash
npm run dev
```

Open [http://localhost:6011](http://localhost:6011).

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Biome check |
| `npm run format` | Biome format |
| `npm run typecheck` | TypeScript type check |
| `npm run test` | Run Vitest tests |
| `npm run test:watch` | Vitest watch mode |

## Project Structure

```
src/
├── app/              # Next.js App Router (pages, API routes)
├── components/       # React components (shadcn/ui, custom)
├── config/           # Model catalog (models.yaml) and other config
├── data-access/      # Drizzle schema, queries, mutations
├── hooks/            # Custom React hooks
└── lib/              # Utilities, AI provider factory, auth
```

## Domain Model

See [`CONTEXT.md`](./CONTEXT.md) for the full glossary of domain terms — Chat, Node, Materialized Path, Ancestor Chain, User Model, and more.
