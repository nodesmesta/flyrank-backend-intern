import express from "express";

const app = express();
const PORT = 3000;

app.use(express.json());

interface Task {
  id: number;
  title: string;
  done: boolean;
}

const tasks: Task[] = [
  { id: 1, title: "Learn Express basics", done: true },
  { id: 2, title: "Build a CRUD API", done: false },
  { id: 3, title: "Write documentation", done: false },
];

let nextId = 4;

app.get("/", (_req, res) => {
  res.json({
    name: "Task API",
    version: "1.0",
    endpoints: ["/tasks"],
  });
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.get("/tasks", (_req, res) => {
  res.json(tasks);
});

app.get("/tasks/:id", (req, res) => {
  const id = Number(req.params.id);
  const task = tasks.find((t) => t.id === id);

  if (!task) {
    res.status(404).json({ error: `Task ${id} not found` });
    return;
  }

  res.json(task);
});

app.post("/tasks", (req, res) => {
  const { title } = req.body;

  if (!title || typeof title !== "string" || title.trim() === "") {
    res.status(400).json({ error: "Title is required" });
    return;
  }

  const task: Task = { id: nextId++, title: title.trim(), done: false };
  tasks.push(task);
  res.status(201).json(task);
});

app.put("/tasks/:id", (req, res) => {
  const id = Number(req.params.id);
  const task = tasks.find((t) => t.id === id);

  if (!task) {
    res.status(404).json({ error: `Task ${id} not found` });
    return;
  }

  const { title, done } = req.body;

  if (title !== undefined) {
    if (typeof title !== "string" || title.trim() === "") {
      res.status(400).json({ error: "Title must be a non-empty string" });
      return;
    }
    task.title = title.trim();
  }

  if (done !== undefined) {
    if (typeof done !== "boolean") {
      res.status(400).json({ error: "Done must be a boolean" });
      return;
    }
    task.done = done;
  }

  res.json(task);
});

app.delete("/tasks/:id", (req, res) => {
  const id = Number(req.params.id);
  const index = tasks.findIndex((t) => t.id === id);

  if (index === -1) {
    res.status(404).json({ error: `Task ${id} not found` });
    return;
  }

  tasks.splice(index, 1);
  res.status(204).send();
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
