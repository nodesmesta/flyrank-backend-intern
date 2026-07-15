import { randomUUID } from "node:crypto";
import type { Task, TaskRepository } from "./interface.js";

export class InMemoryTaskRepository implements TaskRepository {
  private tasks: Task[] = [];

  async findAll(): Promise<Task[]> {
    return this.tasks;
  }

  async findById(id: string): Promise<Task | null> {
    return this.tasks.find((t) => t.id === id) ?? null;
  }

  async create(title: string): Promise<Task> {
    const task: Task = {
      id: randomUUID(),
      title,
      completed: false,
      created_at: new Date().toISOString(),
    };
    this.tasks.push(task);
    return task;
  }

  async update(id: string, completed: boolean): Promise<Task | null> {
    const task = this.tasks.find((t) => t.id === id);
    if (!task) return null;
    task.completed = completed;
    return task;
  }

  async delete(id: string): Promise<boolean> {
    const idx = this.tasks.findIndex((t) => t.id === id);
    if (idx === -1) return false;
    this.tasks.splice(idx, 1);
    return true;
  }
}
