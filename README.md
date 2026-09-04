# jubilant-bassoon

A small, modern **task manager** web app used to demonstrate a working
Cloud Agent development environment. It is a plain Node.js + Express server
with a polished, dependency-free frontend and a JSON-file backed store.

## Stack

- **Runtime:** Node.js 20+ (developed against Node 22)
- **Server:** [Express](https://expressjs.com/) 4
- **Frontend:** vanilla HTML/CSS/JS (no build step)
- **Persistence:** JSON file at `data/tasks.json` (created on first write)
- **Tests:** Node's built-in test runner + [supertest](https://github.com/ladjs/supertest)
- **Lint:** ESLint 9 (flat config)

## Getting started

```bash
npm install      # install dependencies
npm run dev      # start with auto-reload at http://localhost:3000
```

Other commands:

```bash
npm start        # start the server (no watch)
npm test         # run the API test suite
npm run lint     # lint src/, test/, and public/
```

The server listens on `PORT` (default `3000`) and `HOST` (default `0.0.0.0`).

## HTTP API

| Method   | Path              | Description                          |
| -------- | ----------------- | ------------------------------------ |
| `GET`    | `/api/health`     | Liveness probe                       |
| `GET`    | `/api/tasks`      | List tasks (newest first)            |
| `POST`   | `/api/tasks`      | Create a task `{ "title": "…" }`     |
| `PATCH`  | `/api/tasks/:id`  | Update `title` and/or `completed`    |
| `DELETE` | `/api/tasks/:id`  | Delete a task                        |

Example:

```bash
curl -s localhost:3000/api/tasks -H 'content-type: application/json' \
  -d '{"title":"Try the app"}'
```

## Project layout

```
public/            Static frontend (index.html, styles.css, app.js)
src/
  app.js           Express app factory (exported for tests)
  server.js        Server entrypoint
  store.js         JSON-file task store
test/api.test.js   API tests
.cursor/           Cloud Agent environment configuration
```

## Cloud Agent environment

The environment is configured in `.cursor/environment.json`:

- **install:** `npm ci` — install dependencies from the lockfile
- **terminal:** `npm run dev` — runs the dev server so its logs stay visible
- **ports:** `3000` is exposed
