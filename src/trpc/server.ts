import { appRouter } from "@/server/routers/_app";
import { createCallerFactory } from "@/server/trpc";

// Calls procedures in-process, for Server Components. No HTTP round trip.
export const caller = createCallerFactory(appRouter)({});
