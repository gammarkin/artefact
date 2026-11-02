import { publicProcedure, router } from "../trpc";
import { taskRouter } from "./task";

export const appRouter = router({
  task: taskRouter,

  // Temporary, used to verify the wiring end to end (the Date exercises superjson).
  ping: publicProcedure.query(() => ({
    message: "pong",
    serverTime: new Date(),
  })),
});

// The client imports only this type, never the router itself, so no server
// code ends up in the browser bundle.
export type AppRouter = typeof appRouter;
