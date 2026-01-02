# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Journal Chatbot is a personal AI-powered journal assistant built with:
- **TanStack Start** (full-stack React framework with file-based routing)
- **Vercel AI SDK** for chat interface and streaming
- **Cloudflare Workers** as deployment target
- **Tailwind CSS v4** for styling

## Development Commands

```bash
# Development server (runs on port 3000)
npm run dev

# Production build (builds + type-checks)
npm run build

# Preview production build
npm run preview

# Deploy to Cloudflare Workers
npm run deploy

# Linting
npm run lint          # Check for issues
npm run lint:fix      # Auto-fix issues

# Formatting
npm run format        # Format code
npm run format:check  # Check formatting

# Generate Cloudflare types
npm run cf-typegen
```

## Architecture

### Routing Structure
- **File-based routing** via TanStack Router
- Routes defined in `src/routes/` directory
- Auto-generated route tree at `src/routeTree.gen.ts` (don't edit manually)
- Route configuration in `src/router.tsx`

### Current Routes
- `/` - Main chat interface (`src/routes/index.tsx`)
- `/api/chat` - POST endpoint for AI chat streaming (`src/routes/api/chat.ts`)

### Chat Implementation
**Frontend** (`src/routes/index.tsx`):
- Uses `useChat()` hook from `@ai-sdk/react`
- Renders message history with role identification
- Handles both text and tool response parts
- Fixed input at bottom with Tailwind dark mode support

**Backend** (`src/routes/api/chat.ts`):
- Uses Vercel AI SDK's `streamText()` for streaming responses
- Currently configured with model `"zai/glm-4.7"` (placeholder)
- Implements demo tools: `weather`, `convertFahrenheitToCelsius`
- Returns streaming UI message response via `toUIMessageStreamResponse()`

### File Structure Conventions
- `src/routes/__root.tsx` - Root layout with error boundaries
- `src/components/` - Reusable components (DefaultCatchBoundary, NotFound)
- `src/utils/seo.ts` - SEO meta tag helper
- `src/styles/app.css` - Global Tailwind styles

### Configuration
- **Vite plugins**: Tailwind, TanStack Start, Cloudflare, React
- **Dev server**: Runs on port 3000
- **Source directory**: `src/`
- **Path aliases**: `~/` resolves to `src/` (via vite-tsconfig-paths)

### Deployment
- Builds for **Cloudflare Workers** runtime
- Config in `wrangler.jsonc`
- Uses `nodejs_compat` compatibility flag
- Environment variables in `.env` (AI_GATEWAY_API_KEY)
- Build output in `dist/server/` and `dist/client/`

### Error Handling
- Global error boundary: `DefaultCatchBoundary`
- 404 handling: `NotFound` component
- Both configured in `src/router.tsx`

## Key Implementation Notes

1. **Route generation**: Routes are auto-generated. After adding/removing route files, the dev server will regenerate `routeTree.gen.ts`

2. **AI model configuration**: The chat API currently uses a placeholder model (`"zai/glm-4.7"`). Update this in `src/routes/api/chat.ts` when integrating a real model.

3. **Cloudflare deployment**: Use `npm run deploy` which builds and deploys via Wrangler. Ensure `.env` variables are configured in Cloudflare dashboard for production.

4. **Styling approach**: Uses Tailwind CSS v4 with dark mode support. Global styles in `src/styles/app.css`, inline classes in components.
