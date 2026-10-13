import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { Clock, DateTimePipe, DurationPipe, taskDurationMs } from '../../core/duration';
import { Profile, TaskList } from '../../core/models';
import { toMessage } from '../../core/supabase';
import { TasksApi } from '../../core/tasks-api';

type StatusFilter = 'all' | 'done' | 'open';

interface ReportRow {
  id: number;
  task: string;
  list: string;
  employeeId: string;
  employee: string;
  createdAt: string;
  doneAt: string | null;
}

@Component({
  selector: 'sm-reports',
  imports: [FormsModule, DurationPipe, DateTimePipe],
  templateUrl: './reports.html',
})
export class Reports {
  private readonly api = inject(TasksApi);
  private readonly clock = inject(Clock);

  protected readonly loading = signal(true);
  protected readonly error = signal('');
  protected readonly employees = signal<Profile[]>([]);
  protected readonly employeeId = signal('');
  protected readonly status = signal<StatusFilter>('all');
  private readonly lists = signal<TaskList[]>([]);

  private readonly allRows = computed<ReportRow[]>(() => {
    const names = new Map(this.employees().map((e) => [e.id, e.full_name.trim()]));
    return this.lists()
      .flatMap((list) =>
        list.tasks.map((task) => ({
          id: task.id,
          task: task.title,
          list: list.title,
          employeeId: list.employee_id,
          employee: names.get(list.employee_id) || 'Bez nazwy',
          createdAt: task.created_at,
          doneAt: task.done_at,
        })),
      )
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id - a.id);
  });

  protected readonly rows = computed(() => {
    const employeeId = this.employeeId();
    const status = this.status();
    return this.allRows().filter(
      (row) =>
        (!employeeId || row.employeeId === employeeId) &&
        (status === 'all' || (status === 'done') === !!row.doneAt),
    );
  });

  protected readonly summary = computed(() => {
    const rows = this.rows();
    const done = rows.filter((row) => row.doneAt);
    const totalMs = done.reduce((sum, row) => sum + this.duration(row), 0);
    return {
      total: rows.length,
      done: done.length,
      open: rows.length - done.length,
      averageMs: done.length ? totalMs / done.length : null,
    };
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

  protected duration(row: ReportRow): number {
    return taskDurationMs({ created_at: row.createdAt, done_at: row.doneAt }, this.clock.now());
  }
}
