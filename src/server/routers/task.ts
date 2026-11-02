import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { tasks, type Task } from "../store";
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
        cursor: z.string().optional(),
      }),
    )
    .query(({ input }) => {
      // The cursor is the id of the last item seen. Unlike an offset, it stays
      // correct when new tasks are added at the top between page requests.
      let start = 0;
      if (input.cursor !== undefined) {
        const cursorIndex = tasks.findIndex((task) => task.id === input.cursor);
        if (cursorIndex === -1) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid cursor",
          });
        }
        start = cursorIndex + 1;
      }

      const items = tasks.slice(start, start + input.limit);
      const hasMore = start + input.limit < tasks.length;
      return { items, nextCursor: hasMore ? items.at(-1)?.id : undefined };
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
    };
    tasks.unshift(task);
    return task;
  }),

  // Full replace: the edit form always sends both fields, so an omitted
  // descricao clears it. id and dataCriacao are never changed.
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
