import {
  computeCurrentStreak,
  computeWeeklyCompleted,
  todayLocalISO,
  type HabitLog,
} from "../habits";

function makeLog(opts: {
  assignment_id: string;
  date: string;
  completed: boolean;
}): HabitLog {
  return {
    id: `${opts.assignment_id}-${opts.date}`,
    assignment_id: opts.assignment_id,
    client_id: "client-1",
    date: opts.date,
    completed: opts.completed,
    value: null,
    created_at: `${opts.date}T00:00:00Z`,
  };
}

function dayOffset(today: string, deltaDays: number): string {
  const d = new Date(today + "T00:00:00");
  d.setDate(d.getDate() - deltaDays);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

describe("todayLocalISO", () => {
  it("returns a YYYY-MM-DD string", () => {
    const result = todayLocalISO();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("matches today's local date components", () => {
    const result = todayLocalISO();
    const now = new Date();
    expect(result).toBe(
      `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`
    );
  });
});

describe("computeCurrentStreak", () => {
  const today = "2026-05-04";
  const A = "habit-A";

  it("returns 0 when there are no logs", () => {
    expect(computeCurrentStreak([], A, today)).toBe(0);
  });

  it("returns 0 when only other-assignment logs exist", () => {
    const logs = [
      makeLog({ assignment_id: "habit-B", date: today, completed: true }),
    ];
    expect(computeCurrentStreak(logs, A, today)).toBe(0);
  });

  it("returns 1 when only today is completed", () => {
    const logs = [makeLog({ assignment_id: A, date: today, completed: true })];
    expect(computeCurrentStreak(logs, A, today)).toBe(1);
  });

  it("returns 0 when today is logged but uncompleted", () => {
    const logs = [makeLog({ assignment_id: A, date: today, completed: false })];
    expect(computeCurrentStreak(logs, A, today)).toBe(0);
  });

  it("counts consecutive completed days back from today", () => {
    const logs = [0, 1, 2, 3, 4].map((i) =>
      makeLog({ assignment_id: A, date: dayOffset(today, i), completed: true })
    );
    expect(computeCurrentStreak(logs, A, today)).toBe(5);
  });

  it("stops at the first missing day", () => {
    // Today + day-1 completed, day-2 missing, day-3 completed
    // Expected: 2 (only the contiguous run from today counts)
    const logs = [
      makeLog({ assignment_id: A, date: today, completed: true }),
      makeLog({
        assignment_id: A,
        date: dayOffset(today, 1),
        completed: true,
      }),
      makeLog({
        assignment_id: A,
        date: dayOffset(today, 3),
        completed: true,
      }),
    ];
    expect(computeCurrentStreak(logs, A, today)).toBe(2);
  });

  it("stops at an explicitly-uncompleted day", () => {
    const logs = [
      makeLog({ assignment_id: A, date: today, completed: true }),
      makeLog({
        assignment_id: A,
        date: dayOffset(today, 1),
        completed: false,
      }),
      makeLog({
        assignment_id: A,
        date: dayOffset(today, 2),
        completed: true,
      }),
    ];
    expect(computeCurrentStreak(logs, A, today)).toBe(1);
  });

  it("ignores other assignments' completed logs", () => {
    const logs = [
      makeLog({ assignment_id: A, date: today, completed: true }),
      makeLog({
        assignment_id: "habit-B",
        date: dayOffset(today, 1),
        completed: true,
      }),
    ];
    expect(computeCurrentStreak(logs, A, today)).toBe(1);
  });
});

describe("computeWeeklyCompleted", () => {
  const today = todayLocalISO();
  const A = "habit-A";

  it("returns 0 when there are no logs", () => {
    expect(computeWeeklyCompleted([], A)).toBe(0);
  });

  it("counts completed logs in the trailing 7 days", () => {
    const logs = [0, 1, 2, 3, 4, 5, 6].map((i) =>
      makeLog({ assignment_id: A, date: dayOffset(today, i), completed: true })
    );
    expect(computeWeeklyCompleted(logs, A)).toBe(7);
  });

  it("excludes uncompleted logs", () => {
    const logs = [
      makeLog({ assignment_id: A, date: today, completed: true }),
      makeLog({
        assignment_id: A,
        date: dayOffset(today, 1),
        completed: false,
      }),
      makeLog({
        assignment_id: A,
        date: dayOffset(today, 2),
        completed: true,
      }),
    ];
    expect(computeWeeklyCompleted(logs, A)).toBe(2);
  });

  it("excludes logs older than 7 days", () => {
    const logs = [
      makeLog({ assignment_id: A, date: today, completed: true }),
      makeLog({
        assignment_id: A,
        date: dayOffset(today, 30),
        completed: true,
      }),
    ];
    expect(computeWeeklyCompleted(logs, A)).toBe(1);
  });

  it("ignores other assignments", () => {
    const logs = [
      makeLog({ assignment_id: A, date: today, completed: true }),
      makeLog({ assignment_id: "habit-B", date: today, completed: true }),
    ];
    expect(computeWeeklyCompleted(logs, A)).toBe(1);
  });
});
