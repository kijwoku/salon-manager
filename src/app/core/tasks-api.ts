import { inject, Injectable } from '@angular/core';

import { Profile, Task, TaskList } from './models';
import { Supabase } from './supabase';

@Injectable({ providedIn: 'root' })
export class TasksApi {
  private readonly supabase = inject(Supabase);

  /** Lists visible to the current user (RLS: own lists, or all for a manager), newest first. */
  async loadLists(): Promise<TaskList[]> {
    const { data, error } = await this.supabase.required
      .from('task_lists')
      .select(
        'id, title, employee_id, created_by, created_at, tasks(id, list_id, title, position, created_at, done_at)',
      )
      .order('created_at', { ascending: false });
    if (error) throw error;

    const lists = (data ?? []) as TaskList[];
    for (const list of lists) {
      list.tasks.sort((a, b) => a.position - b.position || a.id - b.id);
    }
    return lists;
  }

  async loadEmployees(): Promise<Profile[]> {
    const { data, error } = await this.supabase.required
      .from('profiles')
      .select('id, full_name, role')
      .eq('role', 'employee')
      .order('full_name');
    if (error) throw error;
    return (data ?? []) as Profile[];
  }

  async createList(employeeId: string, title: string, taskTitles: string[]): Promise<void> {
    const client = this.supabase.required;
    const { data, error } = await client
      .from('task_lists')
      .insert({ title, employee_id: employeeId })
      .select('id')
      .single();
    if (error) throw error;

    const listId = (data as { id: number }).id;
    const { error: tasksError } = await client
      .from('tasks')
      .insert(taskTitles.map((taskTitle, position) => ({ list_id: listId, title: taskTitle, position })));
    if (tasksError) {
      await client.from('task_lists').delete().eq('id', listId);
      throw tasksError;
    }
  }

  async deleteList(listId: number): Promise<void> {
    const { error } = await this.supabase.required.from('task_lists').delete().eq('id', listId);
    if (error) throw error;
  }

  async deleteTask(taskId: number): Promise<void> {
    const { error } = await this.supabase.required.from('tasks').delete().eq('id', taskId);
    if (error) throw error;
  }

  /** The server sets done_at; employees have no UPDATE right on the table. */
  async setTaskDone(taskId: number, done: boolean): Promise<Task> {
    const { data, error } = await this.supabase.required.rpc('set_task_done', {
      task_id: taskId,
      done,
    });
    if (error) throw error;
    return data as Task;
  }
}
