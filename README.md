# Tasks

A simple task manager: create, list, edit and delete tasks. Built with Next.js 15 and tRPC, with all data kept in memory (no database).

> Work in progress. This README will be expanded with the project structure and the main technical decisions.

## Stack

- Next.js 15 (App Router) and TypeScript
- tRPC v11 with TanStack Query
- Zod for validation, superjson as the transformer
- Tailwind CSS

## Running locally

Requires Node.js 18.18 or newer and npm.

```bash
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

For a production build:

```bash
npm run build
npm start
```

Tasks live in server memory, so restarting the server clears them.
