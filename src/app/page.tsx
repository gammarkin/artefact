import { TaskList } from "@/components/task-list";
import { caller } from "@/trpc/server";

// Render on every request. Otherwise Next prerenders this page at build time,
// with an empty store, and the list would never be server-rendered again.
export const dynamic = "force-dynamic";

export default async function Home() {
  // SSR: fetch the first page in-process and pass it to the client component as
  // initialData, so the HTML already contains the tasks. The client takes over
  // from there (delete, load more) without an initial request.
  const initialData = await caller.task.list({});

  return <TaskList initialData={initialData} />;
}
