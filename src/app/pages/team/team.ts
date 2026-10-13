import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { Clock, DateTimePipe, DurationPipe, taskDurationMs } from '../../core/duration';
import { Profile, Task, TaskList } from '../../core/models';
import { toMessage } from '../../core/supabase';
import { TasksApi } from '../../core/tasks-api';

interface EmployeeLists {
  employee: Profile;
  lists: TaskList[];
}

@Component({
  selector: 'sm-team',
  imports: [FormsModule, DurationPipe, DateTimePipe],
  templateUrl: './team.html',
})
export class Team {
  private readonly api = inject(TasksApi);
  private readonly clock = inject(Clock);

  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly error = signal('');
  protected readonly formError = signal('');
  protected readonly employees = signal<Profile[]>([]);
  protected readonly filterEmployeeId = signal('');
  private readonly lists = signal<TaskList[]>([]);

  protected employeeId = '';
  protected title = '';
  protected tasksText = '';

  protected readonly groups = computed<EmployeeLists[]>(() => {
    const filter = this.filterEmployeeId();
    const lists = this.lists();
    return this.employees()
      .filter((employee) => !filter || employee.id === filter)
      .map((employee) => ({
        employee,
        lists: lists.filter((list) => list.employee_id === employee.id),
      }));
  });

  constructor() {
    void this.load();
  }

  protected async load(): Promise<void> {
    this.loading.set(true);
    this.error.set('');
    try {
      const [employees, lists] = await Promise.all([this.api.loadEmployees(), this.api.loadLists()]);
      this.employees.set(employees);
      this.lists.set(lists);
    } catch (e) {
      this.error.set(toMessage(e));
    } finally {
      this.loading.set(false);
    }
  }

  protected name(employee: Profile): string {
    return employee.full_name.trim() || 'Bez nazwy';
  }

  protected doneCount(list: TaskList): number {
    return list.tasks.filter((t) => t.done_at).length;
  }

  protected duration(task: Task): number {
    return taskDurationMs(task, this.clock.now());
  }

  protected async createList(): Promise<void> {
    const title = this.title.trim();
    const taskTitles = this.tasksText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    if (!this.employeeId || !title || !taskTitles.length) {
      this.formError.set('Wybierz pracownika, wpisz tytuł listy i przynajmniej jedno zadanie.');
      return;
    }

    this.saving.set(true);
    this.formError.set('');
    try {
      await this.api.createList(this.employeeId, title, taskTitles);
      this.title = '';
      this.tasksText = '';
      await this.load();
    } catch (e) {
      this.formError.set(toMessage(e));
    } finally {
      this.saving.set(false);
    }
  }

  protected async deleteList(list: TaskList): Promise<void> {
    if (!confirm(`Usunąć listę „${list.title}” razem z zadaniami?`)) return;
    await this.run(() => this.api.deleteList(list.id));
  }

  protected async deleteTask(task: Task): Promise<void> {
    if (!confirm(`Usunąć zadanie „${task.title}”?`)) return;
    await this.run(() => this.api.deleteTask(task.id));
  }

  private async run(action: () => Promise<void>): Promise<void> {
    this.error.set('');
    try {
      await action();
      await this.load();
    } catch (e) {
      this.error.set(toMessage(e));
    }
  }
}
