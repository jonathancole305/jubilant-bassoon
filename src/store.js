import { randomUUID } from "node:crypto";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";

// A tiny JSON-file backed store for tasks. It is intentionally simple:
// state is kept in memory and flushed to disk on every mutation so the
// data survives server restarts during development.
export class TaskStore {
  constructor(dataFile) {
    this.dataFile = dataFile;
    this.tasks = [];
    this.loaded = false;
  }

  async load() {
    try {
      const raw = await readFile(this.dataFile, "utf8");
      const parsed = JSON.parse(raw);
      this.tasks = Array.isArray(parsed.tasks) ? parsed.tasks : [];
    } catch (err) {
      // A missing file just means an empty store on first run.
      if (err.code !== "ENOENT") throw err;
      this.tasks = [];
    }
    this.loaded = true;
    return this;
  }

  async #persist() {
    await mkdir(dirname(this.dataFile), { recursive: true });
    await writeFile(this.dataFile, JSON.stringify({ tasks: this.tasks }, null, 2));
  }

  list() {
    return [...this.tasks].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async create(title) {
    const task = {
      id: randomUUID(),
      title,
      completed: false,
      createdAt: new Date().toISOString(),
    };
    this.tasks.push(task);
    await this.#persist();
    return task;
  }

  find(id) {
    return this.tasks.find((t) => t.id === id) ?? null;
  }

  async update(id, changes) {
    const task = this.find(id);
    if (!task) return null;
    if (typeof changes.title === "string") task.title = changes.title;
    if (typeof changes.completed === "boolean") task.completed = changes.completed;
    await this.#persist();
    return task;
  }

  async remove(id) {
    const index = this.tasks.findIndex((t) => t.id === id);
    if (index === -1) return false;
    this.tasks.splice(index, 1);
    await this.#persist();
    return true;
  }
}
