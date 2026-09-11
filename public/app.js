const els = {
  form: document.getElementById("composer"),
  input: document.getElementById("new-task"),
  list: document.getElementById("tasks"),
  empty: document.getElementById("empty"),
  filters: document.getElementById("filters"),
  statTotal: document.getElementById("stat-total"),
  statDone: document.getElementById("stat-done"),
};

let tasks = [];
let filter = "all";

async function api(path, options) {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok && res.status !== 204) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${res.status})`);
  }
  return res.status === 204 ? null : res.json();
}

function visibleTasks() {
  if (filter === "active") return tasks.filter((t) => !t.completed);
  if (filter === "completed") return tasks.filter((t) => t.completed);
  return tasks;
}

function render() {
  const shown = visibleTasks();
  els.list.innerHTML = "";

  for (const task of shown) {
    const li = document.createElement("li");
    li.className = `task${task.completed ? " is-done" : ""}`;
    li.dataset.id = task.id;

    const check = document.createElement("input");
    check.type = "checkbox";
    check.className = "task__check";
    check.checked = task.completed;
    check.setAttribute("aria-label", `Mark "${task.title}" complete`);
    check.addEventListener("change", () => toggle(task));

    const title = document.createElement("span");
    title.className = "task__title";
    title.textContent = task.title;

    const del = document.createElement("button");
    del.className = "task__delete";
    del.type = "button";
    del.innerHTML = "&times;";
    del.setAttribute("aria-label", `Delete "${task.title}"`);
    del.addEventListener("click", () => remove(task));

    li.append(check, title, del);
    els.list.append(li);
  }

  const done = tasks.filter((t) => t.completed).length;
  els.statTotal.textContent = `${tasks.length} task${tasks.length === 1 ? "" : "s"}`;
  els.statDone.textContent = `${done} done`;
  els.empty.hidden = shown.length !== 0;
}

async function load() {
  const data = await api("/api/tasks");
  tasks = data.tasks;
  render();
}

async function add(title) {
  const data = await api("/api/tasks", {
    method: "POST",
    body: JSON.stringify({ title }),
  });
  tasks.unshift(data.task);
  render();
}

async function toggle(task) {
  const data = await api(`/api/tasks/${task.id}`, {
    method: "PATCH",
    body: JSON.stringify({ completed: !task.completed }),
  });
  Object.assign(task, data.task);
  render();
}

async function remove(task) {
  await api(`/api/tasks/${task.id}`, { method: "DELETE" });
  tasks = tasks.filter((t) => t.id !== task.id);
  render();
}

els.form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const title = els.input.value.trim();
  if (!title) return;
  els.input.value = "";
  try {
    await add(title);
  } catch (err) {
    alert(err.message);
  }
});

els.filters.addEventListener("click", (e) => {
  const btn = e.target.closest(".filters__btn");
  if (!btn) return;
  filter = btn.dataset.filter;
  for (const b of els.filters.querySelectorAll(".filters__btn")) {
    b.classList.toggle("is-active", b === btn);
  }
  render();
});

load().catch((err) => {
  els.empty.hidden = false;
  els.empty.textContent = `Could not load tasks: ${err.message}`;
});
