import type http from "node:http";
import type { TaskService } from "../service/task-service.js";

function json(res: http.ServerResponse, status: number, data: unknown) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data));
}

function body(req: http.IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks).toString()));
    req.on("error", reject);
  });
}

export function createTaskRouter(service: TaskService) {
  return async (req: http.IncomingMessage, res: http.ServerResponse) => {
    const url = new URL(req.url ?? "/", `http://${req.headers.host}`);
    const path = url.pathname;

    try {
      // GET /api/tasks
      if (req.method === "GET" && path === "/api/tasks") {
        const tasks = await service.listTasks();
        return json(res, 200, tasks);
      }

      // GET /api/tasks/:id
      if (req.method === "GET" && path.startsWith("/api/tasks/")) {
        const id = path.slice("/api/tasks/".length);
        const task = await service.getTask(id);
        if (!task) return json(res, 404, { error: "Task not found" });
        return json(res, 200, task);
      }

      // POST /api/tasks
      if (req.method === "POST" && path === "/api/tasks") {
        const b = JSON.parse(await body(req));
        if (!b.title) return json(res, 400, { error: "title is required" });
        const task = await service.createTask(b.title);
        return json(res, 201, task);
      }

      // PATCH /api/tasks/:id
      if (req.method === "PATCH" && path.startsWith("/api/tasks/")) {
        const id = path.slice("/api/tasks/".length);
        const b = JSON.parse(await body(req));
        if (typeof b.completed !== "boolean") {
          return json(res, 400, { error: "completed (boolean) is required" });
        }
        const task = await service.updateTask(id, b.completed);
        if (!task) return json(res, 404, { error: "Task not found" });
        return json(res, 200, task);
      }

      // DELETE /api/tasks/:id
      if (req.method === "DELETE" && path.startsWith("/api/tasks/")) {
        const id = path.slice("/api/tasks/".length);
        const ok = await service.deleteTask(id);
        if (!ok) return json(res, 404, { error: "Task not found" });
        return json(res, 204, null);
      }

      // 404
      json(res, 404, { error: "Not found" });
    } catch (err) {
      console.error(err);
      json(res, 500, { error: "Internal server error" });
    }
  };
}
