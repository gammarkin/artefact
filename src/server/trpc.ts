import { initTRPC } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";

// superjson keeps Date fields (dataCriacao) as real Dates across the wire.
// The client link must be configured with the same transformer.
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
