import test from "node:test";
import assert from "node:assert/strict";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { mkdtemp, rm } from "node:fs/promises";
import request from "supertest";
import { createApp } from "../src/app.js";

async function withApp(run) {
  const dir = await mkdtemp(join(tmpdir(), "bassoon-test-"));
  const dataFile = join(dir, "tasks.json");
  const app = await createApp({ dataFile });
  try {
    await run(app);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

test("health check reports ok", async () => {
  await withApp(async (app) => {
    const res = await request(app).get("/api/health");
    assert.equal(res.status, 200);
    assert.equal(res.body.status, "ok");
  });
});

test("starts with an empty task list", async () => {
  await withApp(async (app) => {
    const res = await request(app).get("/api/tasks");
    assert.equal(res.status, 200);
    assert.deepEqual(res.body.tasks, []);
  });
});

test("creates a task and returns it in the list", async () => {
  await withApp(async (app) => {
    const created = await request(app).post("/api/tasks").send({ title: "Write docs" });
    assert.equal(created.status, 201);
    assert.equal(created.body.task.title, "Write docs");
    assert.equal(created.body.task.completed, false);

    const list = await request(app).get("/api/tasks");
    assert.equal(list.body.tasks.length, 1);
    assert.equal(list.body.tasks[0].id, created.body.task.id);
  });
});

test("rejects a task with a blank title", async () => {
  await withApp(async (app) => {
    const res = await request(app).post("/api/tasks").send({ title: "   " });
    assert.equal(res.status, 400);
    assert.match(res.body.error, /title/i);
  });
});

test("toggles completion via PATCH", async () => {
  await withApp(async (app) => {
    const created = await request(app).post("/api/tasks").send({ title: "Ship it" });
    const id = created.body.task.id;

    const patched = await request(app).patch(`/api/tasks/${id}`).send({ completed: true });
    assert.equal(patched.status, 200);
    assert.equal(patched.body.task.completed, true);
  });
});

test("deletes a task", async () => {
  await withApp(async (app) => {
    const created = await request(app).post("/api/tasks").send({ title: "Remove me" });
    const id = created.body.task.id;

    const del = await request(app).delete(`/api/tasks/${id}`);
    assert.equal(del.status, 204);

    const list = await request(app).get("/api/tasks");
    assert.equal(list.body.tasks.length, 0);
  });
});

test("returns 404 when updating a missing task", async () => {
  await withApp(async (app) => {
    const res = await request(app).patch("/api/tasks/does-not-exist").send({ completed: true });
    assert.equal(res.status, 404);
  });
});

test("persists tasks across store reloads", async () => {
  const dir = await mkdtemp(join(tmpdir(), "bassoon-persist-"));
  const dataFile = join(dir, "tasks.json");
  try {
    const app1 = await createApp({ dataFile });
    await request(app1).post("/api/tasks").send({ title: "Durable task" });

    const app2 = await createApp({ dataFile });
    const list = await request(app2).get("/api/tasks");
    assert.equal(list.body.tasks.length, 1);
    assert.equal(list.body.tasks[0].title, "Durable task");
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
