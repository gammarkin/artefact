import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import { TRPCError } from "@trpc/server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { tasks } from "../store";
import { createCallerFactory } from "../trpc";
import { appRouter } from "./_app";

const caller = createCallerFactory(appRouter)({});

beforeEach(() => {
  tasks.length = 0;
});

function rejectsWith(promise: Promise<unknown>, code: string) {
  return assert.rejects(
    promise,
    (error) => error instanceof TRPCError && error.code === code,
  );
}

// Creates "Task 1" .. "Task n", so "Task n" is the newest.
async function seed(n: number) {
  for (let i = 1; i <= n; i++) {
    await caller.task.create({ titulo: `Task ${i}` });
  }
}

describe("task.create", () => {
  it("trims the title and stores a blank description as undefined", async () => {
    const task = await caller.task.create({
      titulo: "  Buy milk  ",
      descricao: "   ",
    });

    assert.equal(task.titulo, "Buy milk");
    assert.equal(task.descricao, undefined);
  });

  it("assigns id, dataCriacao and seq", async () => {
    const task = await caller.task.create({ titulo: "Buy milk" });

    assert.match(task.id, /^[0-9a-f-]{36}$/);
    assert.ok(task.dataCriacao instanceof Date);
    assert.equal(typeof task.seq, "number");
  });

  it("rejects empty and whitespace-only titles", async () => {
    await rejectsWith(caller.task.create({ titulo: "" }), "BAD_REQUEST");
    await rejectsWith(caller.task.create({ titulo: "   " }), "BAD_REQUEST");
  });
});

describe("task.list", () => {
  it("returns the newest task first", async () => {
    await seed(3);

    const { items } = await caller.task.list({});

    assert.deepEqual(
      items.map((task) => task.titulo),
      ["Task 3", "Task 2", "Task 1"],
    );
  });

  it("pages through every task without duplicates", async () => {
    await seed(10);

    const sizes: number[] = [];
    const ids: string[] = [];
    let cursor: string | undefined;
    do {
      const page = await caller.task.list({ limit: 4, cursor });
      sizes.push(page.items.length);
      ids.push(...page.items.map((task) => task.id));
      cursor = page.nextCursor;
    } while (cursor);

    assert.deepEqual(sizes, [4, 4, 2]);
    assert.equal(new Set(ids).size, 10);
  });

  it("keeps the cursor valid when its task was deleted", async () => {
    await seed(6);
    const first = await caller.task.list({ limit: 3 });
    const boundary = first.items.at(-1)!;
    await caller.task.delete({ id: boundary.id });

    const second = await caller.task.list({ limit: 3, cursor: first.nextCursor });

    assert.deepEqual(
      second.items.map((task) => task.titulo),
      ["Task 3", "Task 2", "Task 1"],
    );
    assert.equal(second.nextCursor, undefined);
  });

  it("rejects an invalid cursor or limit", async () => {
    await rejectsWith(caller.task.list({ cursor: "abc" }), "BAD_REQUEST");
    await rejectsWith(caller.task.list({ cursor: "-1" }), "BAD_REQUEST");
    await rejectsWith(caller.task.list({ limit: 0 }), "BAD_REQUEST");
    await rejectsWith(caller.task.list({ limit: 51 }), "BAD_REQUEST");
  });
});

describe("task.byId, task.update and task.delete", () => {
  it("byId returns the task, or NOT_FOUND", async () => {
    const task = await caller.task.create({ titulo: "Buy milk" });

    assert.equal((await caller.task.byId({ id: task.id })).titulo, "Buy milk");
    await rejectsWith(caller.task.byId({ id: "nope" }), "NOT_FOUND");
  });

  it("update replaces the editable fields and keeps id, dataCriacao and seq", async () => {
    const task = await caller.task.create({
      titulo: "Buy milk",
      descricao: "2 liters",
    });

    const updated = await caller.task.update({
      id: task.id,
      titulo: "  Buy bread  ",
    });

    assert.equal(updated.titulo, "Buy bread");
    assert.equal(updated.descricao, undefined);
    assert.equal(updated.id, task.id);
    assert.equal(updated.dataCriacao.getTime(), task.dataCriacao.getTime());
    assert.equal(updated.seq, task.seq);
  });

  it("update and delete return NOT_FOUND for an unknown id", async () => {
    await rejectsWith(
      caller.task.update({ id: "nope", titulo: "x" }),
      "NOT_FOUND",
    );
    await rejectsWith(caller.task.delete({ id: "nope" }), "NOT_FOUND");
  });

  it("delete removes the task", async () => {
    const task = await caller.task.create({ titulo: "Buy milk" });

    await caller.task.delete({ id: task.id });

    await rejectsWith(caller.task.byId({ id: task.id }), "NOT_FOUND");
    assert.equal((await caller.task.list({})).items.length, 0);
  });
});

// The error formatter only runs on the HTTP layer, so these go through the
// fetch handler instead of the caller.
describe("HTTP error responses", () => {
  const handle = (path: string, init?: RequestInit) =>
    fetchRequestHandler({
      endpoint: "/api/trpc",
      req: new Request(`http://test/api/trpc/${path}`, init),
      router: appRouter,
    });

  async function errorOf(response: Response) {
    const body = (await response.json()) as {
      error: { json: { message: string } };
    };
    return body.error.json.message;
  }

  it("turns a Zod failure into a readable message (400)", async () => {
    const response = await handle("task.create", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ json: { titulo: "   " } }),
    });

    assert.equal(response.status, 400);
    assert.equal(await errorOf(response), "Title is required");
  });

  it("returns 404 with a clear message for an unknown id", async () => {
    const input = encodeURIComponent(JSON.stringify({ json: { id: "nope" } }));

    const response = await handle(`task.byId?input=${input}`);

    assert.equal(response.status, 404);
    assert.equal(await errorOf(response), "Task not found");
  });
});
