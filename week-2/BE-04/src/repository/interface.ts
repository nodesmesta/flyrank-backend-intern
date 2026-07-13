export interface Task {
  id: string;
  title: string;
  completed: boolean;
  created_at: string;
}

export interface TaskRepository {
  findAll(): Promise<Task[]>;
  findById(id: string): Promise<Task | null>;
  create(title: string): Promise<Task>;
  update(id: string, completed: boolean): Promise<Task | null>;
  delete(id: string): Promise<boolean>;
}
