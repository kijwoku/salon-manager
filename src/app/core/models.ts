export type Role = 'manager' | 'employee';

export interface Profile {
  id: string;
  full_name: string;
  role: Role;
}

export interface Task {
  id: number;
  list_id: number;
  title: string;
  position: number;
  created_at: string;
  done_at: string | null;
}

export interface TaskList {
  id: number;
  title: string;
  employee_id: string;
  created_by: string;
  created_at: string;
  tasks: Task[];
}
