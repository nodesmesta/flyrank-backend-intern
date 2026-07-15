import http from "node:http";
import pg from "../node_modules/@types/pg/index.js";
import { InMemoryTaskRepository } from "./repository/in-memory.js";
import { PostgresTaskRepository } from "./repository/postgres.js";
import { TaskService } from "./service/task-service.js";
import { createTaskRouter } from "./routes/task-routes.js";

const PORT = parseInt(process.env.PORT ?? "3000", 10);
const DATABASE_URL = process.env.DATABASE_URL;

async function main() {
  let repo;

  if (DATABASE_URL) {
    const pool = new pg.Pool({ connectionString: DATABASE_URL });
    repo = new PostgresTaskRepository(pool);
    console.log("Using Postgres repository");
  } else {
    repo = new InMemoryTaskRepository();
    console.log("Using In-Memory repository (no DATABASE_URL set)");
  }

  const service = new TaskService(repo);
  const router = createTaskRouter(service);

  const server = http.createServer(router);

  server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

main().catch((err) => {
  console.error("Failed to start:", err);
  process.exit(1);
});
