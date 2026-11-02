export type Task = {
  id: string;
  titulo: string;
  descricao?: string;
  dataCriacao: Date;
};

// In dev, Next.js re-evaluates modules on every hot reload, which would reset a
// plain module-level array and empty the list. globalThis survives reloads.
const globalForTasks = globalThis as unknown as { tasks?: Task[] };

// Newest first: create() unshifts, so the array is already in the order that
// list() returns and no sorting (or timestamp tie-breaking) is needed.
export const tasks: Task[] = (globalForTasks.tasks ??= []);
