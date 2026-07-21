import express from "express";
import Database from "better-sqlite3";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const PORT = parseInt(process.env.PORT ?? "3000", 10);

// --- Database setup ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const db = new Database(join(__dirname, "..", "tasks.db"));

db.exec(`
  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    done INTEGER NOT NULL DEFAULT 0
  )
`);

const count = db.prepare("SELECT COUNT(*) AS c FROM tasks").get() as { c: number };
if (count.c === 0) {
  const seed = db.prepare("INSERT INTO tasks (title, done) VALUES (?, ?)");
  seed.run("Learn SQLite", 0);
  seed.run("Build a CRUD API", 0);
  seed.run("Write documentation", 0);
}

// --- Express app ---
const app = express();
app.use(express.json());

// GET /tasks
app.get("/tasks", (_req, res) => {
  const tasks = db.prepare("SELECT * FROM tasks").all();
  res.json(tasks);
});

// GET /tasks/:id
app.get("/tasks/:id", (req, res) => {
  const task = db.prepare("SELECT * FROM tasks WHERE id = ?").get(req.params.id);
  if (!task) {
    res.status(404).json({ error: "Task not found" });
    return;
  }
  res.json(task);
});

// POST /tasks
app.post("/tasks", (req, res) => {
  const { title } = req.body;
  if (!title || typeof title !== "string" || title.trim().length === 0) {
    res.status(400).json({ error: "title is required" });
    return;
  }
  const stmt = db.prepare("INSERT INTO tasks (title, done) VALUES (?, ?)");
  const result = stmt.run(title.trim(), 0);
  const task = db.prepare("SELECT * FROM tasks WHERE id = ?").get(result.lastInsertRowid);
  res.status(201).json(task);
});

// PUT /tasks/:id
app.put("/tasks/:id", (req, res) => {
  const { title, done } = req.body;
  if (!title || typeof title !== "string" || title.trim().length === 0) {
    res.status(400).json({ error: "title is required" });
    return;
  }
  if (typeof done !== "boolean") {
    res.status(400).json({ error: "done (boolean) is required" });
    return;
  }
  const stmt = db.prepare("UPDATE tasks SET title = ?, done = ? WHERE id = ?");
  const result = stmt.run(title.trim(), done ? 1 : 0, req.params.id);
  if (result.changes === 0) {
    res.status(404).json({ error: "Task not found" });
    return;
  }
  const task = db.prepare("SELECT * FROM tasks WHERE id = ?").get(req.params.id);
  res.json(task);
});

// DELETE /tasks/:id
app.delete("/tasks/:id", (req, res) => {
  const stmt = db.prepare("DELETE FROM tasks WHERE id = ?");
  const result = stmt.run(req.params.id);
  if (result.changes === 0) {
    res.status(404).json({ error: "Task not found" });
    return;
  }
  res.status(204).send();
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
