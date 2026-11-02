"use client";

import type { inferRouterOutputs } from "@trpc/server";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { AppRouter } from "@/server/routers/_app";
import { trpc } from "@/trpc/client";

type Task = inferRouterOutputs<AppRouter>["task"]["byId"];

const buttonClass =
  "rounded border border-foreground/20 px-3 py-1.5 text-sm hover:bg-foreground/5 disabled:cursor-not-allowed disabled:opacity-50";

// Used for both modes: pass `task` to edit it, omit it to create a new one.
export function TaskForm({ task }: { task?: Task }) {
  const router = useRouter();
  const utils = trpc.useUtils();
  const [titulo, setTitulo] = useState(task?.titulo ?? "");
  const [descricao, setDescricao] = useState(task?.descricao ?? "");
  const [titleError, setTitleError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function onSuccess() {
    await utils.task.list.invalidate();
    setSaved(true);
    router.push("/");
  }

  const create = trpc.task.create.useMutation({ onSuccess });
  const update = trpc.task.update.useMutation({ onSuccess });
  const mutation = task ? update : create;

  // `saved` keeps the form locked during the redirect, after the mutation is
  // no longer pending, so a double click cannot submit twice.
  const busy = mutation.isPending || saved;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!titulo.trim()) {
      setTitleError("Title is required");
      return;
    }
    if (task) {
      update.mutate({ id: task.id, titulo, descricao });
    } else {
      create.mutate({ titulo, descricao });
    }
  }

  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="mb-6 text-2xl font-semibold">
        {task ? "Edit task" : "New task"}
      </h1>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div>
          <label htmlFor="title" className="mb-1 block text-sm font-medium">
            Title
          </label>
          <input
            id="title"
            value={titulo}
            onChange={(event) => {
              setTitulo(event.target.value);
              if (event.target.value.trim()) setTitleError(null);
            }}
            disabled={busy}
            aria-invalid={titleError !== null}
            aria-describedby={titleError ? "title-error" : undefined}
            className={`w-full rounded border bg-transparent px-3 py-2 disabled:opacity-50 ${
              titleError ? "border-red-600" : "border-foreground/20"
            }`}
          />
          {titleError && (
            <p id="title-error" className="mt-1 text-sm text-red-600">
              {titleError}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="description"
            className="mb-1 block text-sm font-medium"
          >
            Description (optional)
          </label>
          <textarea
            id="description"
            value={descricao}
            onChange={(event) => setDescricao(event.target.value)}
            disabled={busy}
            rows={4}
            className="w-full rounded border border-foreground/20 bg-transparent px-3 py-2 disabled:opacity-50"
          />
        </div>

        {mutation.isError && (
          <p role="alert" className="text-sm text-red-600">
            {mutation.error.message}
          </p>
        )}

        <div className="flex gap-2">
          <button type="submit" disabled={busy} className={buttonClass}>
            {busy ? "Saving…" : "Save"}
          </button>
          <Link href="/" className={buttonClass}>
            Cancel
          </Link>
        </div>
      </form>
    </main>
  );
}
