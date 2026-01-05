# Journal Chatbot

AI-powered personal journal assistant with streaming chat interface and tool visualization.

## Tech Stack

- **TanStack Start** - Full-stack React framework with file-based routing
- **Vercel AI SDK** - Chat interface with streaming responses
- **Supabase** - Authentication and authorization (SSR-compatible)
- **TanStack Query** - Server state management
- **Cloudflare Workers** - Deployment target
- **Tailwind CSS v4** - Styling
- **shadcn/ui** - UI components (base-vega style)

## Getting Started

```bash
# Install dependencies
bun install

# Set up environment variables
cp .env.example .env
# Add your SUPABASE_URL and SUPABASE_ANON_KEY

# Run development server
bun run dev
```

App runs on http://localhost:3000

## Development

```bash
# Linting & formatting
bun run lint          # Check for issues
bun run lint:fix      # Auto-fix issues
bun run format        # Format code

# Type generation
bun run db:types      # Generate Supabase types (requires SUPABASE_PROJECT_ID)
bun run cf-typegen    # Generate Cloudflare types

# Add UI components
bunx shadcn@latest add <component-name>
```

## Build & Deploy

```bash
# Production build
bun run build

# Preview production build
bun run preview

# Deploy to Cloudflare Workers
bun run deploy
```

## Environment Variables

**Required:**

- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anonymous API key

**Optional:**

- `SUPABASE_PROJECT_ID` - For type generation
- `AI_GATEWAY_API_KEY` - For AI gateway integration

## Project Structure

```
src/
├── routes/           # File-based routing
│   ├── _authed/      # Protected routes (require auth)
│   └── api/          # API endpoints
├── components/       # Reusable components
│   ├── ui/           # shadcn/ui components
│   └── chat/         # Chat-specific components
├── features/         # Domain-specific modules
│   └── journal/      # Journal assistant logic
├── lib/              # Shared utilities
└── utils/            # App-specific utilities
```

## Authentication

- SSR-compatible Supabase auth with cookie-based sessions
- Protected routes under `_authed/` directory
- Auto-redirects to `/login` for unauthenticated users

## License

MIT
