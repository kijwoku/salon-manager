import { formatDuration, taskDurationMs } from './duration';

const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

describe('formatDuration', () => {
  it('formats minutes, hours and days in Polish', () => {
    expect(formatDuration(20_000)).toBe('mniej niż 1 min');
    expect(formatDuration(15 * MIN)).toBe('15 min');
    expect(formatDuration(2 * HOUR + 15 * MIN)).toBe('2 godz. 15 min');
    expect(formatDuration(3 * HOUR)).toBe('3 godz.');
    expect(formatDuration(DAY + 5 * MIN)).toBe('1 dzień');
    expect(formatDuration(3 * DAY + 4 * HOUR + 10 * MIN)).toBe('3 dni 4 godz.');
  });
});

describe('taskDurationMs', () => {
  const created_at = '2026-01-01T10:00:00Z';

  it('uses done_at for finished tasks and now for open ones', () => {
    expect(taskDurationMs({ created_at, done_at: '2026-01-01T10:30:00Z' }, 0)).toBe(30 * MIN);
    expect(taskDurationMs({ created_at, done_at: null }, Date.parse(created_at) + HOUR)).toBe(HOUR);
  });
});
