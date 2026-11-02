import { publicProcedure, router } from "../trpc";

export const appRouter = router({
  // Temporary procedure used only to verify the wiring end to end.
  // Returning a Date also proves the superjson transformer is working.
  ping: publicProcedure.query(() => ({
    message: "pong",
    serverTime: new Date(),
  })),
});

// The client imports only this type, never the router itself, so no server
// code ends up in the browser bundle.
export type AppRouter = typeof appRouter;
