import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { nextSeq, tasks, type Task } from "../store";
import { publicProcedure, router } from "../trpc";

const taskFields = {
  titulo: z.string().trim().min(1, "Title is required"),
  // A blank description is stored as "no description" instead of an empty string.
  descricao: z
    .string()
    .trim()
    .optional()
    .transform((value) => value || undefined),
};

function findIndexOrThrow(id: string) {
  const index = tasks.findIndex((task) => task.id === id);
  if (index === -1) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Task not found" });
  }
  return index;
}

export const taskRouter = router({
  list: publicProcedure
    .input(
      z.object({
        limit: z.number().int().min(1).max(50).default(10),
        cursor: z
          .string()
          .regex(/^\d+$/, "Invalid cursor")
          .transform(Number)
          .optional(),
      }),
    )
    .query(({ input }) => {
      // The cursor is the seq of the last item seen. Comparing seq values
      // instead of looking that item up keeps it valid when the task was
      // deleted, or others were added, between page requests.
      const { limit, cursor } = input;
      const remaining =
        cursor === undefined
          ? tasks
          : tasks.filter((task) => task.seq < cursor);

      const items = remaining.slice(0, limit);
      const hasMore = remaining.length > limit;
      return {
        items,
        nextCursor: hasMore ? String(items[limit - 1].seq) : undefined,
      };
    }),

  byId: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(({ input }) => tasks[findIndexOrThrow(input.id)]),

  create: publicProcedure.input(z.object(taskFields)).mutation(({ input }) => {
    const task: Task = {
      id: crypto.randomUUID(),
      titulo: input.titulo,
      descricao: input.descricao,
      dataCriacao: new Date(),
      seq: nextSeq(),
    };
    tasks.unshift(task);
    return task;
  }),

  // Full replace: the edit form always sends both fields, so an omitted
  // descricao clears it. id, dataCriacao and seq are never changed.
  update: publicProcedure
    .input(z.object({ id: z.string(), ...taskFields }))
    .mutation(({ input }) => {
      const index = findIndexOrThrow(input.id);
      const updated: Task = {
        ...tasks[index],
        titulo: input.titulo,
        descricao: input.descricao,
      };
      tasks[index] = updated;
      return updated;
    }),

  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ input }) => {
      const [removed] = tasks.splice(findIndexOrThrow(input.id), 1);
      return removed;
    }),
});
