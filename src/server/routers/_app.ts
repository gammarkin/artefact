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

export type AppRouter = typeof appRouter;
