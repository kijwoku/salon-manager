import { Component, computed, inject, signal } from '@angular/core';

import { Clock, DateTimePipe, DurationPipe, taskDurationMs } from '../../core/duration';
import { Task, TaskList } from '../../core/models';
import { toMessage } from '../../core/supabase';
import { TasksApi } from '../../core/tasks-api';

@Component({
  selector: 'sm-my-tasks',
  imports: [DurationPipe, DateTimePipe],
  templateUrl: './my-tasks.html',
})
export class MyTasks {
  private readonly api = inject(TasksApi);
  private readonly clock = inject(Clock);

  protected readonly loading = signal(true);
  protected readonly error = signal('');
  protected readonly pending = signal<ReadonlySet<number>>(new Set());
  private readonly lists = signal<TaskList[]>([]);

  /** Lists that still have open tasks come first. */
  protected readonly sortedLists = computed(() =>
    [...this.lists()].sort((a, b) => Number(isFinished(a)) - Number(isFinished(b))),
  );

  constructor() {
    void this.load();
  }

  protected async load(): Promise<void> {
    this.loading.set(true);
    this.error.set('');
    try {
      this.lists.set(await this.api.loadLists());
    } catch (e) {
      this.error.set(toMessage(e));
    } finally {
      this.loading.set(false);
    }
  }

  protected doneCount(list: TaskList): number {
    return list.tasks.filter((t) => t.done_at).length;
  }

  protected duration(task: Task): number {
    return taskDurationMs(task, this.clock.now());
  }

  protected async toggle(task: Task, checkbox: HTMLInputElement): Promise<void> {
    const done = checkbox.checked;
    if (this.pending().has(task.id)) return;
    this.setPending(task.id, true);
    this.error.set('');
    try {
      this.replaceTask(await this.api.setTaskDone(task.id, done));
    } catch (e) {
      // The binding value did not change, so put the checkbox back by hand.
      checkbox.checked = !!task.done_at;
      this.error.set(toMessage(e));
    } finally {
      this.setPending(task.id, false);
    }
  }

  private replaceTask(saved: Task): void {
    this.lists.update((lists) =>
      lists.map((list) =>
        list.id === saved.list_id
          ? { ...list, tasks: list.tasks.map((t) => (t.id === saved.id ? saved : t)) }
          : list,
      ),
    );
  }

  private setPending(taskId: number, on: boolean): void {
    this.pending.update((current) => {
      const next = new Set(current);
      if (on) next.add(taskId);
      else next.delete(taskId);
      return next;
    });
  }
}

function isFinished(list: TaskList): boolean {
  return list.tasks.length > 0 && list.tasks.every((t) => t.done_at);
}
