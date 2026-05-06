import { computeSessionTimestamps } from "../sessionDate";

const NOW = new Date("2026-05-05T15:00:00").getTime();
const FIVE_MIN_AGO = NOW - 5 * 60 * 1000;

const args = (overrides: Partial<Parameters<typeof computeSessionTimestamps>[0]> = {}) => ({
  startTime: FIVE_MIN_AGO,
  now: new Date(NOW),
  ...overrides,
});

describe("computeSessionTimestamps", () => {
  test("no sessionDate → live timestamps, not backfilled", () => {
    const r = computeSessionTimestamps(args());
    expect(r.backfilled).toBe(false);
    expect(r.startedAt.getTime()).toBe(FIVE_MIN_AGO);
    expect(r.endedAt.getTime()).toBe(NOW);
  });

  test("today's date → live timestamps (no backfill)", () => {
    const r = computeSessionTimestamps(args({ sessionDate: "2026-05-05" }));
    expect(r.backfilled).toBe(false);
    expect(r.startedAt.getTime()).toBe(FIVE_MIN_AGO);
  });

  test("future date → live timestamps (no backfill)", () => {
    const r = computeSessionTimestamps(args({ sessionDate: "2026-05-10" }));
    expect(r.backfilled).toBe(false);
    expect(r.startedAt.getTime()).toBe(FIVE_MIN_AGO);
  });

  test("past date → started_at is noon of that day, ended_at preserves elapsed", () => {
    const r = computeSessionTimestamps(args({ sessionDate: "2026-05-04" }));
    expect(r.backfilled).toBe(true);
    expect(r.startedAt.getFullYear()).toBe(2026);
    expect(r.startedAt.getMonth()).toBe(4); // May
    expect(r.startedAt.getDate()).toBe(4);
    expect(r.startedAt.getHours()).toBe(12);
    expect(r.startedAt.getMinutes()).toBe(0);
    // ended_at = startedAt + 5 min
    expect(r.endedAt.getTime() - r.startedAt.getTime()).toBe(5 * 60 * 1000);
  });

  test("malformed sessionDate → warns and falls back to live timestamps", () => {
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
    const r = computeSessionTimestamps(args({ sessionDate: "not-a-date" }));
    expect(r.backfilled).toBe(false);
    expect(r.startedAt.getTime()).toBe(FIVE_MIN_AGO);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("malformed"));
    warn.mockRestore();
  });

  test("clock skew (now < startTime) doesn't produce negative elapsed", () => {
    const r = computeSessionTimestamps({
      startTime: NOW + 1000,
      now: new Date(NOW),
      sessionDate: "2026-05-04",
    });
    expect(r.backfilled).toBe(true);
    expect(r.endedAt.getTime()).toBeGreaterThanOrEqual(r.startedAt.getTime());
  });
});
