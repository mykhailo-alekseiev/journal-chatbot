# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Journal Chatbot is a personal AI-powered journal assistant built with:
- **TanStack Start** (full-stack React framework with file-based routing)
- **Vercel AI SDK** for chat interface and streaming
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
- `src/components/ui/` - shadcn/ui components (auto-generated, customize as needed)
- `src/lib/utils.ts` - Utility functions including `cn()` for class merging
- `src/utils/seo.ts` - SEO meta tag helper
- `src/styles/app.css` - Global Tailwind styles and shadcn CSS variables
- `components.json` - shadcn/ui configuration

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

## Key Implementation Notes

1. **Route generation**: Routes are auto-generated. After adding/removing route files, the dev server will regenerate `routeTree.gen.ts`

2. **AI model configuration**: The chat API currently uses a placeholder model (`"zai/glm-4.7"`). Update this in `src/routes/api/chat.ts` when integrating a real model.

3. **Cloudflare deployment**: Use `bun run deploy` which builds and deploys via Wrangler. Ensure `.env` variables are configured in Cloudflare dashboard for production.

4. **Styling approach**: Uses Tailwind CSS v4 with dark mode support. Global styles in `src/styles/app.css`, inline classes in components.

5. **UI components**: Prefer shadcn/ui components from `~/components/ui/` over custom implementations. Use `cn()` from `~/lib/utils` for merging Tailwind classes.

6. **Package manager**: Use `bun` instead of `npm` or `yarn`. Run `bun install`, `bun run dev`, etc.
