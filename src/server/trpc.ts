import { initTRPC } from "@trpc/server";
import superjson from "superjson";

// superjson is required because the task model has a Date field (dataCriacao).
// Plain JSON would turn it into a string; superjson restores a real Date on the
// other side. The same transformer must be configured on the client link.
const t = initTRPC.create({ transformer: superjson });

export const router = t.router;
export const publicProcedure = t.procedure;
