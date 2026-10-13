import { Injectable, Pipe, PipeTransform, signal } from '@angular/core';

import { Task } from './models';

const MINUTE = 60_000;

/** Formats a time span in Polish: "15 min", "2 godz. 15 min", "3 dni 4 godz.". */
export function formatDuration(ms: number): string {
  const totalMinutes = Math.floor(Math.max(0, ms) / MINUTE);
  if (totalMinutes < 1) return 'mniej niż 1 min';

  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;

  const parts: string[] = [];
  if (days) parts.push(`${days} ${days === 1 ? 'dzień' : 'dni'}`);
  if (hours) parts.push(`${hours} godz.`);
  if (minutes && !days) parts.push(`${minutes} min`);
  return parts.join(' ');
}

/** Time from creation to completion, or to `now` while the task is still open. */
export function taskDurationMs(task: Pick<Task, 'created_at' | 'done_at'>, now: number): number {
  const end = task.done_at ? Date.parse(task.done_at) : now;
  return Math.max(0, end - Date.parse(task.created_at));
}

const dateTimeFormat = new Intl.DateTimeFormat('pl-PL', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

export function formatDateTime(iso: string | null): string {
  return iso ? dateTimeFormat.format(new Date(iso)) : '—';
}

@Pipe({ name: 'smDuration' })
export class DurationPipe implements PipeTransform {
  transform(ms: number): string {
    return formatDuration(ms);
  }
}

@Pipe({ name: 'smDateTime' })
export class DateTimePipe implements PipeTransform {
  transform(iso: string | null): string {
    return formatDateTime(iso);
  }
}

/** Current time as a signal, refreshed so open tasks show a live elapsed time. */
@Injectable({ providedIn: 'root' })
export class Clock {
  readonly now = signal(Date.now());

  constructor() {
    setInterval(() => this.now.set(Date.now()), MINUTE / 2);
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) this.now.set(Date.now());
    });
  }
}
