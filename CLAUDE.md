# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Journal Chatbot is a personal AI-powered journal assistant built with:

- **TanStack Start** (full-stack React framework with file-based routing)
- **Vercel AI SDK** for chat interface and streaming
- **Supabase** for authentication and authorization (SSR-compatible)
- **TanStack Query** for server state management
- **Cloudflare Workers** as deployment target
- **Tailwind CSS v4** for styling
- **shadcn/ui** for UI components (base-vega style)

## Development Commands

```bash
# Development server (runs on port 3000)
bun run dev

# Production build (builds + type-checks)
bun run build

# Preview production build
bun run preview

# Deploy to Cloudflare Workers
bun run deploy

# Linting
bun run lint          # Check for issues
bun run lint:fix      # Auto-fix issues

# Formatting
bun run format        # Format code
bun run format:check  # Check formatting

# Generate Cloudflare types
bun run cf-typegen

# Add shadcn UI components
bunx shadcn@latest add <component-name>
```

## Architecture

### Routing Structure

- **File-based routing** via TanStack Router
- Routes defined in `src/routes/` directory
- Auto-generated route tree at `src/routeTree.gen.ts` (don't edit manually)
- Route configuration in `src/router.tsx`

### Routing Pattern

- **Public routes**: `/login`, `/signup`, `/logout`
- **Protected routes**: Place under `src/routes/_authed/*` (automatically requires authentication)
- **Root (`/`)**: Redirects to `/chat` if authenticated, `/login` otherwise

### Authentication & Authorization

- **SSR-compatible Supabase** via `@supabase/ssr` with cookie-based sessions
- **User context**: Fetched in root layout, available as `context.user` in all routes (typed as `{ email: string } | null`)
- **Protected routes**: `_authed` layout guards all child routes, shows `<Login />` if unauthenticated
- **Server functions**: Use `getSupabaseServerClient()` from `src/utils/supabase.ts` for SSR-compatible auth operations
- **Auth forms**: TanStack Query mutations in `src/components/Login.tsx` and `src/components/Auth.tsx`

### Chat Implementation

- **Frontend** (`src/routes/_authed/chat.tsx`): Uses `useChat()` from `@ai-sdk/react`, protected route
- **Backend** (`src/routes/api/chat.ts`): Uses `streamText()` with placeholder model `"zai/glm-4.7"`

### File Structure

- `src/routes/` - File-based routes (auth routes, `_authed/` for protected routes)
- `src/components/` - Reusable components (Auth, Login, error boundaries)
- `src/components/ui/` - shadcn/ui components
- `src/lib/` - Shared utilities and configuration (queryClient, utils)
- `src/utils/` - App-specific utilities (Supabase client, SEO)
- `src/styles/` - Global CSS and Tailwind configuration

### Configuration

- **Vite plugins**: Tailwind, TanStack Start, Cloudflare, React
- **Dev server**: Runs on port 3000
- **Source directory**: `src/`
- **Path aliases**: `~/` resolves to `src/` (via vite-tsconfig-paths)

### Deployment

- Builds for **Cloudflare Workers** runtime
- Config in `wrangler.jsonc`
- Uses `nodejs_compat` compatibility flag
- Build output in `dist/server/` and `dist/client/`

**Environment Variables** (`.env` for local, Cloudflare dashboard for production):

Required:
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_ANON_KEY` - Your Supabase anonymous/public API key

Optional:
- `AI_GATEWAY_API_KEY` - API key for AI gateway (if used)

### Error Handling

- Global error boundary: `DefaultCatchBoundary`
- 404 handling: `NotFound` component
- Both configured in `src/router.tsx`

### UI Components (shadcn/ui)

- **Component library**: [shadcn/ui](https://ui.shadcn.com/) - copy-paste components, not a dependency
- **Style variant**: `base-vega` with CSS variables
- **Icon library**: Lucide React
- **Component location**: `src/components/ui/`

**Adding new components:**

```bash
bunx shadcn@latest add <component-name>
```

**Available components:** alert-dialog, badge, button, card, combobox, dropdown-menu, field, input-group, input, label, select, separator, textarea

**Usage patterns:**

- Import from `~/components/ui/<component>`
- Use `cn()` utility for conditional/merged Tailwind classes
- Components use Radix UI primitives for accessibility
- Customize by editing the component source directly
