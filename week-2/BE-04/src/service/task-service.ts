import type { TaskRepository, Task } from "../repository/interface.js";

export class TaskService {
  constructor(private repo: TaskRepository) {}

  async listTasks(): Promise<Task[]> {
    return this.repo.findAll();
  }

  async getTask(id: string): Promise<Task | null> {
    return this.repo.findById(id);
  }

  async createTask(title: string): Promise<Task> {
    return this.repo.create(title);
  }

  async updateTask(id: string, completed: boolean): Promise<Task | null> {
    return this.repo.update(id, completed);
  }

  async deleteTask(id: string): Promise<boolean> {
    return this.repo.delete(id);
  }
}
