import pg from "../../node_modules/@types/pg/index.js";
import { randomUUID } from "node:crypto";
import type { Task, TaskRepository } from "./interface.js";

export class PostgresTaskRepository implements TaskRepository {
  constructor(private pool: pg.Pool) {}

  async findAll(): Promise<Task[]> {
    const result = await this.pool.query<Task>(
      "SELECT id, title, completed, created_at FROM tasks ORDER BY created_at DESC"
    );
    return result.rows;
  }

  async findById(id: string): Promise<Task | null> {
    const result = await this.pool.query<Task>(
      "SELECT id, title, completed, created_at FROM tasks WHERE id = $1",
      [id]
    );
    return result.rows[0] ?? null;
  }

  async create(title: string): Promise<Task> {
    const id = randomUUID();
    const now = new Date().toISOString();
    await this.pool.query(
      "INSERT INTO tasks (id, title, completed, created_at) VALUES ($1, $2, $3, $4)",
      [id, title, false, now]
    );
    return { id, title, completed: false, created_at: now };
  }

  async update(id: string, completed: boolean): Promise<Task | null> {
    const result = await this.pool.query<Task>(
      "UPDATE tasks SET completed = $1 WHERE id = $2 RETURNING id, title, completed, created_at",
      [completed, id]
    );
    return result.rows[0] ?? null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.pool.query(
      "DELETE FROM tasks WHERE id = $1",
      [id]
    );
    return (result.rowCount ?? 0) > 0;
  }
}
