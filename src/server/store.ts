export type Task = {
  id: string;
  titulo: string;
  descricao?: string;
  dataCriacao: Date;
  // Creation order. Only used as the pagination cursor, see task.list.
  seq: number;
};

// In dev, Next.js re-evaluates modules on every hot reload, which would reset a
// plain module-level array and empty the list. globalThis survives reloads.
const globalForStore = globalThis as unknown as {
  tasks?: Task[];
  lastSeq?: number;
};

// Newest first: addTask() unshifts, so the array is already in the order that
// list() returns and no sorting (or timestamp tie-breaking) is needed.
export const tasks: Task[] = (globalForStore.tasks ??= []);

// Never reused, even after deletes. Kept on globalThis with the array: if it
// restarted while the tasks survived, new tasks would get repeated values.
function nextSeq() {
  globalForStore.lastSeq = (globalForStore.lastSeq ?? 0) + 1;
  return globalForStore.lastSeq;
}

export function addTask(input: { titulo: string; descricao?: string }): Task {
  const task: Task = {
    id: crypto.randomUUID(),
    titulo: input.titulo,
    descricao: input.descricao,
    dataCriacao: new Date(),
    seq: nextSeq(),
  };
  tasks.unshift(task);
  return task;
}
