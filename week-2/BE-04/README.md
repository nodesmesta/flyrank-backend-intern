# BE-04 — Postgres in Docker + Repository Pattern

> FlyRank Internship — Backend Engineering Track | Week 2

A CRUD task API with **Postgres in Docker**, layered architecture, and a repository pattern that proves swapping storage changes only one file.

## Architecture

The service and routes **do not know** which repository is active. Switching between in-memory and Postgres requires zero changes to business logic.

```
src/
├── index.ts                  # Entry point — picks repository based on DATABASE_URL
├── repository/
│   ├── interface.ts          # TaskRepository contract
│   ├── in-memory.ts          # In-memory implementation
│   └── postgres.ts           # Postgres implementation
├── service/
│   └── task-service.ts       # Business logic — knows nothing about storage
└── routes/
    └── task-routes.ts        # HTTP handlers — knows nothing about storage
```

### How the swap works

| DATABASE_URL set? | Repository used |
|---|---|
| Yes | PostgresTaskRepository (pg Pool) |
| No / empty | InMemoryTaskRepository |

The only file that reads this environment variable is **`src/index.ts`** — the service and routes are untouched.

## Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/tasks` | List all tasks |
| `POST` | `/api/tasks` | Create a task |
| `GET` | `/api/tasks/:id` | Get a single task |
| `PATCH` | `/api/tasks/:id` | Update task completion |
| `DELETE` | `/api/tasks/:id` | Delete a task |

### Example requests

```bash
# Create
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"title": "Setup Docker"}'

# List
curl http://localhost:3000/api/tasks

# Update
curl -X PATCH http://localhost:3000/api/tasks/<id> \
  -H "Content-Type: application/json" \
  -d '{"completed": true}'

# Delete
curl -X DELETE http://localhost:3000/api/tasks/<id>
```

## Quick Start

### Prerequisites

- Docker & Docker Compose
- Node.js 22+

### Run the full stack (app + Postgres)

```bash
docker compose up -d --build
```

Server starts at **http://localhost:3000**.

### Run locally without Docker (in-memory)

```bash
npm install
npm start
```

Without `DATABASE_URL` set, the app uses the in-memory repository automatically.

## Persistence Test

The task requires proving that data survives an app + container restart.

```bash
# 1. Create a task
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"title": "Task that must survive"}'

# 2. Note the ID
TASK_ID=$(curl -s http://localhost:3000/api/tasks | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "Created task: $TASK_ID"

# 3. Restart the app container only
docker compose restart app

# 4. Wait for healthcheck
sleep 3

# 5. Verify the task still exists
curl http://localhost:3000/api/tasks

# 6. For a full restart (app + database)
docker compose down
docker compose up -d
curl http://localhost:3000/api/tasks
```

If the task from step 1 appears again, **persistence is confirmed**.

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | — | Postgres connection string (e.g. `postgres://app:secret@localhost:5432/be04`) |
| `PORT` | `3000` | Server port |

`.env` is gitignored. Copy `.env.example` to get started:

```bash
cp .env.example .env
```
## Tech Stack

| Tool | Purpose |
|---|---|
| Node.js 22 | Runtime |
| TypeScript | Type safety |
| tsx | Dev runner (TypeScript execute) |
| pg | Postgres driver |
| Postgres 17 | Database (Docker) |
| Docker Compose | Multi-container orchestration |
