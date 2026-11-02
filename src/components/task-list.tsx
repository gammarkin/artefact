"use client";

import type { inferRouterOutputs } from "@trpc/server";
import Link from "next/link";
import { useState } from "react";
import type { AppRouter } from "@/server/routers/_app";
import { trpc } from "@/trpc/client";

type ListOutput = inferRouterOutputs<AppRouter>["task"]["list"];

// Fixed locale and time zone so the server and the browser render the same text.
const dateFormat = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "UTC",
});

const buttonClass =
  "rounded border border-foreground/20 px-3 py-1.5 text-sm hover:bg-foreground/5 disabled:cursor-not-allowed disabled:opacity-50";

export function TaskList({ initialData }: { initialData: ListOutput }) {
  const utils = trpc.useUtils();
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const tasks = trpc.task.list.useInfiniteQuery(
    {},
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      initialData: { pages: [initialData], pageParams: [undefined] },
      // Seeded from the server on every mount, so a cache that outlives the
      // page would only flash stale content when coming back from the form.
      gcTime: 0,
    },
  );

  const deleteTask = trpc.task.delete.useMutation({
    onMutate: () => setMessage(null),
    onSuccess: () => setMessage({ type: "success", text: "Task deleted" }),
    onError: (error) => setMessage({ type: "error", text: error.message }),
    // Also on error: if the task was already gone (NOT_FOUND), refetching
    // brings the list back in sync instead of leaving a ghost row.
    onSettled: () => utils.task.list.invalidate(),
  });

  const items = tasks.data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <main className="mx-auto max-w-2xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Tasks</h1>
        <Link href="/tasks/new" className={buttonClass}>
          New task
        </Link>
      </div>

      {message && (
        <p
          role={message.type === "error" ? "alert" : "status"}
          className={`mb-4 text-sm ${
            message.type === "error"
              ? "text-red-600"
              : "text-green-700 dark:text-green-400"
          }`}
        >
          {message.text}
        </p>
      )}

      {tasks.isError && (
        <p role="alert" className="mb-4 text-sm text-red-600">
          {tasks.error.message}
        </p>
      )}

      {items.length === 0 ? (
        <p className="text-foreground/60">No tasks yet.</p>
      ) : (
        <ul className="space-y-3">
          {items.map((task) => (
            <li
              key={task.id}
              className="flex items-start justify-between gap-4 rounded border border-foreground/15 p-4"
            >
              <div className="min-w-0">
                <h2 className="break-words font-medium">{task.titulo}</h2>
                {task.descricao && (
                  <p className="mt-1 break-words text-sm text-foreground/70">
                    {task.descricao}
                  </p>
                )}
                <time
                  dateTime={task.dataCriacao.toISOString()}
                  className="mt-2 block text-xs text-foreground/50"
                >
                  {dateFormat.format(task.dataCriacao)} UTC
                </time>
              </div>
              <div className="flex shrink-0 gap-2">
                <Link href={`/tasks/${task.id}/edit`} className={buttonClass}>
                  Edit
                </Link>
                <button
                  type="button"
                  onClick={() => deleteTask.mutate({ id: task.id })}
                  disabled={deleteTask.isPending}
                  className={buttonClass}
                >
                  {deleteTask.isPending && deleteTask.variables?.id === task.id
                    ? "Deleting…"
                    : "Delete"}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {tasks.hasNextPage && (
        <button
          type="button"
          onClick={() => tasks.fetchNextPage()}
          disabled={tasks.isFetchingNextPage}
          className={`${buttonClass} mt-4`}
        >
          {tasks.isFetchingNextPage ? "Loading…" : "Load more"}
        </button>
      )}
    </main>
  );
}
