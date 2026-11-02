# Tasks

A simple task manager: create, list, edit and delete tasks. Built with Next.js 15 and a tRPC backend that keeps all data in memory (no database).

## Features

- Task list rendered on the server (SSR), newest first, with infinite scroll
- Create and edit tasks with the same form, validated on the client and on the server
- Delete tasks straight from the list, with success and error feedback
- Loading, success and error states on every operation, with backend errors shown on screen

## Stack

- [Next.js](https://nextjs.org) 15 (App Router) and TypeScript
- [tRPC](https://trpc.io) v11 with [TanStack Query](https://tanstack.com/query) v5
- [Zod](https://zod.dev) 4 for validation and [superjson](https://github.com/blitz-js/superjson) as the transformer
- [Tailwind CSS](https://tailwindcss.com) 4

## Running locally

Requirements: Node.js 18.18 or newer and npm. No environment variables are needed.

```bash
npm install
npm run dev      # http://localhost:3000
```

Production build:

```bash
npm run build
npm start
```

`npm run lint` runs ESLint. Tasks live in server memory, so restarting the server clears them.

## Project structure

```
src/
├── app/
│   ├── page.tsx                  # Home: fetches the first page on the server (SSR)
│   ├── tasks/new/page.tsx        # Create task
│   ├── tasks/[id]/edit/page.tsx  # Edit task (loaded on the server, 404 if unknown)
│   ├── api/trpc/[trpc]/route.ts  # HTTP entry point for tRPC
│   ├── layout.tsx                # Root layout, wraps the app in the tRPC provider
│   └── globals.css               # Tailwind import and color tokens
├── components/
│   ├── task-list.tsx             # List, delete with feedback, infinite scroll
│   └── task-form.tsx             # Form shared by create and edit
├── server/
│   ├── trpc.ts                   # tRPC setup: superjson and error formatter
│   ├── store.ts                  # In-memory task storage
│   └── routers/
│       ├── _app.ts               # Root router
│       └── task.ts               # Task procedures
└── trpc/
    ├── client.tsx                # React provider (tRPC + TanStack Query)
    └── server.ts                 # Server-side caller used by Server Components
```

## API

All procedures live under `task` (for example `trpc.task.list`). Inputs are validated with Zod and failures are `TRPCError`s with a readable message.

| Procedure | Input | Returns | Errors |
| --- | --- | --- | --- |
| `list` | `{ limit?: 1-50 (default 10), cursor?: string }` | `{ items, nextCursor }`, newest first | `BAD_REQUEST` for an invalid limit or cursor |
| `byId` | `{ id }` | the task | `NOT_FOUND` |
| `create` | `{ titulo, descricao? }` | the created task | `BAD_REQUEST` for a blank title |
| `update` | `{ id, titulo, descricao? }` | the updated task | `NOT_FOUND`, `BAD_REQUEST` |
| `delete` | `{ id }` | the deleted task | `NOT_FOUND` |

A task has `id` (UUID), `titulo`, `descricao?`, `dataCriacao` (Date) and `seq`, an internal creation counter used by the pagination cursor (see below). The field names `titulo`, `descricao` and `dataCriacao` follow the model specification.

## Technical decisions

### Validation and errors live in the procedure

Every input is validated with Zod inside the procedure, so the rules sit next to the data they protect and the client cannot bypass them. The form also checks the title, only to avoid a pointless request.

By default tRPC returns a failed Zod validation as a JSON dump of every issue. An `errorFormatter` in [src/server/trpc.ts](src/server/trpc.ts) replaces it with the first issue's message, so the UI can show "Title is required" as is.

### superjson

`dataCriacao` is a `Date`. Plain JSON would turn it into a string on the way to the client; superjson keeps it a real `Date`. The same transformer is configured on the server and on the client link.

### In-memory store on `globalThis`

Tasks are a module-level array, since there is no database. In development Next.js re-evaluates modules on every hot reload, which would recreate the array empty and wipe the list. Keeping it on `globalThis` makes it survive reloads. It does not survive a server restart, by design.

### Cursor pagination by `seq`

`list` returns pages with a `nextCursor`. The cursor is the `seq` of the last item, a counter assigned at creation and never reused, and a page is "the next `limit` tasks with a lower `seq`".

An earlier version used the last item's `id` as the cursor, but it broke when that task was deleted between two requests: the item could no longer be found. An offset would duplicate or skip items when tasks are added meanwhile. Comparing a monotonic number works in both cases and needs no lookup. This is the reason the model has one field beyond the specified ones.

### SSR with a server-side caller

The home page is a Server Component that calls the router directly ([src/trpc/server.ts](src/trpc/server.ts), no HTTP round trip) and passes the first page to the client component as `initialData`. The HTML already contains the tasks, and TanStack Query takes over from there.

Two details make it work: `export const dynamic = "force-dynamic"`, because otherwise Next prerenders the page at build time with an empty store, and a default `staleTime`, so the server-rendered data is not refetched right after mount. The edit page loads its task the same way and turns `NOT_FOUND` into Next's 404.

### Cache invalidation

Create, update and delete invalidate the `task.list` queries so the list reflects the change. Two details matter:

- The list query has `gcTime: 0`. It is seeded from the server on every mount, so a client cache that outlives the page would flash stale content when coming back from the form. Dropping it on unmount means the list always renders fresh server data. Invalidating cannot do this job: it only marks an unmounted query stale, and `refetchType: "all"` skips queries that were never fetched on the client, like this one.
- Delete invalidates on error too, so a task already removed elsewhere (`NOT_FOUND`) disappears from the list instead of lingering.

The form also stays locked during the redirect, to prevent a double submit.

### Infinite scroll

A native `IntersectionObserver` watches a sentinel below the list and calls `fetchNextPage` when it gets close to the viewport. It only observes while no request is in flight: loading a page during the refetch that follows a delete would cancel that refetch and leave the deleted task on screen. It also stops after a failed page, and a "Try again" button resumes it; otherwise a failure would retry forever.

### Smaller choices

- `update` replaces the editable fields entirely: the form always sends both, so an omitted `descricao` is cleared. `id`, `dataCriacao` and `seq` never change.
- A blank description is stored as no description, not as an empty string.
- Dates are rendered in UTC with a fixed locale, so the server and the browser produce the same text and hydration does not mismatch.
- The default system font stack is used instead of `next/font/google`, so the build needs no network access.
- Form state is plain `useState`; two fields do not need a form library.
