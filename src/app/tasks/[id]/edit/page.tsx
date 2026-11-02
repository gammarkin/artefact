import { TRPCError } from "@trpc/server";
import { notFound } from "next/navigation";
import { TaskForm } from "@/components/task-form";
import { caller } from "@/trpc/server";

export default async function EditTaskPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Loaded on the server, like the list, so the form arrives already filled.
  // An unknown id becomes the standard 404 instead of an error page.
  const task = await caller.task.byId({ id }).catch((error) => {
    if (error instanceof TRPCError && error.code === "NOT_FOUND") notFound();
    throw error;
  });

  return <TaskForm task={task} />;
}
