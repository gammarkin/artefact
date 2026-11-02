import { initTRPC } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";

// superjson is required because the task model has a Date field (dataCriacao).
// Plain JSON would turn it into a string; superjson restores a real Date on the
// other side. The same transformer must be configured on the client link.
const t = initTRPC.create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    // tRPC's default message for a Zod failure is a JSON dump of every issue.
    // Use the first issue's message instead, e.g. "Title is required".
    if (error.cause instanceof ZodError) {
      return {
        ...shape,
        message: error.cause.issues[0]?.message ?? shape.message,
      };
    }
    return shape;
  },
});

export const router = t.router;
export const publicProcedure = t.procedure;
export const createCallerFactory = t.createCallerFactory;
