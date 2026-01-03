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

### Current Routes

**Public Routes:**
- `/` - Root redirect: authenticated users → `/chat`, unauthenticated → `/login` (`src/routes/index.tsx`)
- `/login` - Login page (`src/routes/login.tsx`)
- `/signup` - Sign up page (`src/routes/signup.tsx`)
- `/logout` - Logout endpoint with redirect (`src/routes/logout.tsx`)

**Protected Routes** (require authentication via `/_authed` layout):
- `/chat` - Main chat interface (`src/routes/_authed/chat.tsx`)
- `/api/chat` - POST endpoint for AI chat streaming (`src/routes/api/chat.ts`)

### Authentication & Authorization

**Architecture:**

- **SSR-compatible Supabase client** via `@supabase/ssr` package
- **Cookie-based sessions** managed through TanStack Start's cookie utilities
- **Server-side user context** fetched in root layout and passed to all routes
- **Protected route pattern** using layout routes (`/_authed`)

**Implementation Details:**

1. **Supabase Client** (`src/utils/supabase.ts`):
   - `getSupabaseServerClient()` - Creates server-side client with cookie integration
   - Uses `SUPABASE_URL` and `SUPABASE_ANON_KEY` environment variables
   - Handles cookie reading/writing via TanStack Start helpers

2. **Root Layout User Context** (`src/routes/__root.tsx`):
   - `fetchUser()` server function fetches current user via `supabase.auth.getUser()`
   - User context injected in `beforeLoad` hook, available to all child routes
   - Returns `{ email }` for authenticated users, `null` otherwise

3. **Protected Routes** (`src/routes/_authed.tsx`):
   - Layout route that guards all child routes under `/_authed/*`
   - Checks `context.user` in `beforeLoad` hook
   - Throws error if unauthenticated → caught by `errorComponent` → renders `<Login />`
   - All routes under `/_authed/` inherit this protection automatically

4. **Authentication Forms:**
   - **Reusable `<Auth />` component** (`src/components/Auth.tsx`): email/password form with action text, status, and after-submit slot
   - **`<Login />` component** (`src/components/Login.tsx`): login mutation with fallback "sign up instead" button on invalid credentials
   - Uses TanStack Query mutations for form handling

5. **Server Functions:**
   - `loginFn` - Calls `supabase.auth.signInWithPassword()`, returns error if failed
   - `signupFn` - Calls `supabase.auth.signUp()`, redirects on success
   - `logoutFn` - Calls `supabase.auth.signOut()`, redirects to `/`
   - All use `createServerFn()` with input validation

**Flow:**
1. User lands on `/` → root layout fetches user context
2. If not authenticated → redirect to `/login`
3. User submits login form → `loginFn` validates credentials → sets session cookie
4. Router invalidates and navigates to `/` → user context now populated → redirect to `/chat`
5. Protected `/chat` route renders successfully

### Chat Implementation

**Frontend** (`src/routes/_authed/chat.tsx`):

- Uses `useChat()` hook from `@ai-sdk/react`
- Renders message history with role identification
- Handles both text and tool response parts
- Fixed input at bottom with Tailwind dark mode support
- **Protected route** - only accessible when authenticated

**Backend** (`src/routes/api/chat.ts`):

- Uses Vercel AI SDK's `streamText()` for streaming responses
- Currently configured with model `"zai/glm-4.7"` (placeholder)
- Implements demo tools: `weather`, `convertFahrenheitToCelsius`
- Returns streaming UI message response via `toUIMessageStreamResponse()`

### State Management (TanStack Query)

**Configuration** (`src/lib/queryClient.ts`):

- **Query defaults:**
  - `refetchOnWindowFocus: false` - Don't refetch when window regains focus
  - `retry: false` - Don't retry failed queries
  - `staleTime: 1000 * 60` - Data considered fresh for 1 minute
- **TypeScript utilities:**
  - `ApiFnReturnType<T>` - Extracts return type from async function
  - `QueryConfig<T>` - Omits queryKey/queryFn for custom hooks
  - `MutationConfig<T>` - Type-safe mutation options

**Usage Patterns:**

- Server functions use `createServerFn()` from TanStack Start
- Client components use `useMutation()` for form submissions
- Mutations call server functions with `.mutate({ data: {...} })`
- Router invalidation via `router.invalidate()` after auth state changes

**DevTools:**

- React Query DevTools available in development (bottom-left corner)
- Inspect queries, mutations, and cache state

### File Structure Conventions

**Routes:**
- `src/routes/__root.tsx` - Root layout with error boundaries, user context fetching
- `src/routes/_authed.tsx` - Protected route layout (authentication guard)
- `src/routes/_authed/*` - All protected routes (chat, etc.)
- `src/routes/login.tsx`, `src/routes/signup.tsx`, `src/routes/logout.tsx` - Auth routes

**Components:**
- `src/components/` - Reusable components (Auth, Login, DefaultCatchBoundary, NotFound)
- `src/components/ui/` - shadcn/ui components (auto-generated, customize as needed)

**Utilities & Config:**
- `src/lib/utils.ts` - Utility functions including `cn()` for class merging
- `src/lib/queryClient.ts` - TanStack Query configuration and TypeScript utilities
- `src/utils/supabase.ts` - Supabase SSR client factory
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

## Key Implementation Notes

1. **Route generation**: Routes are auto-generated. After adding/removing route files, the dev server will regenerate `routeTree.gen.ts`

2. **Authentication patterns**:
   - **Protected routes**: Place under `src/routes/_authed/` to require authentication automatically
   - **User context**: Access via `context.user` in any route (typed as `{ email: string } | null`)
   - **Server functions**: Always use `getSupabaseServerClient()` for auth operations (handles SSR cookies correctly)
   - **Client mutations**: Use TanStack Query's `useMutation()` for auth form submissions
   - **Session management**: Handled automatically via Supabase cookies (no manual token management needed)

3. **Adding new protected routes**:
   - Create file under `src/routes/_authed/your-route.tsx`
   - Authentication guard applied automatically via parent layout
   - User context available in route context

4. **AI model configuration**: The chat API currently uses a placeholder model (`"zai/glm-4.7"`). Update this in `src/routes/api/chat.ts` when integrating a real model.

5. **Cloudflare deployment**:
   - Use `bun run deploy` which builds and deploys via Wrangler
   - **Critical**: Set Supabase environment variables (`SUPABASE_URL`, `SUPABASE_ANON_KEY`) in Cloudflare dashboard for production
   - Test authentication flow after deployment to ensure cookie handling works correctly

6. **State management**:
   - Use TanStack Query for server state (API calls, auth mutations)
   - Server functions defined with `createServerFn()` from TanStack Start
   - Query config in `src/lib/queryClient.ts` - modify defaults there

7. **Styling approach**: Uses Tailwind CSS v4 with dark mode support. Global styles in `src/styles/app.css`, inline classes in components.

8. **UI components**: Prefer shadcn/ui components from `~/components/ui/` over custom implementations. Use `cn()` from `~/lib/utils` for merging Tailwind classes.

9. **Package manager**: Use `bun` instead of `npm` or `yarn`. Run `bun install`, `bun run dev`, etc.

## Common Patterns

### Creating a Server Function with Authentication

```typescript
import { createServerFn } from '@tanstack/react-start'
import { getSupabaseServerClient } from '~/utils/supabase'

export const myServerFn = createServerFn({ method: 'POST' })
  .inputValidator((d: { /* your input type */ }) => d)
  .handler(async ({ data }) => {
    const supabase = getSupabaseServerClient()

    // Get current user
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) {
      return { error: true, message: 'Unauthorized' }
    }

    // Your logic here with authenticated user
    // ...

    return { success: true }
  })
```

### Using Mutations in Components

```typescript
import { useMutation } from '@tanstack/react-query'
import { useServerFn } from '@tanstack/react-start'
import { myServerFn } from '../routes/my-route'

function MyComponent() {
  const mutation = useMutation({
    mutationFn: useServerFn(myServerFn),
    onSuccess: (data) => {
      if (!data?.error) {
        // Handle success
      }
    },
  })

  return (
    <form onSubmit={(e) => {
      e.preventDefault()
      const formData = new FormData(e.target)
      mutation.mutate({
        data: {
          field: formData.get('field') as string
        }
      })
    }}>
      {/* form fields */}
    </form>
  )
}
```
