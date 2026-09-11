import express from "express";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { TaskStore } from "./store.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = join(__dirname, "..", "public");

export async function createApp({ dataFile } = {}) {
  const resolvedDataFile = dataFile ?? join(__dirname, "..", "data", "tasks.json");
  const store = await new TaskStore(resolvedDataFile).load();

  const app = express();
  app.use(express.json());

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", uptime: process.uptime() });
  });

  app.get("/api/tasks", (_req, res) => {
    res.json({ tasks: store.list() });
  });

  app.post("/api/tasks", async (req, res) => {
    const title = typeof req.body?.title === "string" ? req.body.title.trim() : "";
    if (!title) {
      return res.status(400).json({ error: "A non-empty 'title' is required." });
    }
    const task = await store.create(title);
    res.status(201).json({ task });
  });

  app.patch("/api/tasks/:id", async (req, res) => {
    const changes = {};
    if ("title" in (req.body ?? {})) {
      const title = typeof req.body.title === "string" ? req.body.title.trim() : "";
      if (!title) return res.status(400).json({ error: "'title' must be a non-empty string." });
      changes.title = title;
    }
    if ("completed" in (req.body ?? {})) {
      if (typeof req.body.completed !== "boolean") {
        return res.status(400).json({ error: "'completed' must be a boolean." });
      }
      changes.completed = req.body.completed;
    }
    const task = await store.update(req.params.id, changes);
    if (!task) return res.status(404).json({ error: "Task not found." });
    res.json({ task });
  });

  app.delete("/api/tasks/:id", async (req, res) => {
    const removed = await store.remove(req.params.id);
    if (!removed) return res.status(404).json({ error: "Task not found." });
    res.status(204).end();
  });

  app.use(express.static(PUBLIC_DIR));

  return app;
}
