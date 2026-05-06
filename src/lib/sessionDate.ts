/**
 * Compute the started_at / ended_at pair for a workout session, honoring
 * an optional backfill date for sessions that the user attributes to an
 * earlier calendar day (e.g. logging Monday's workout from Tuesday).
 *
 * Behavior:
 * - No sessionDate, or future / today / malformed → live timestamps
 *   (started_at = startTime, ended_at = now).
 * - sessionDate strictly before today → started_at is noon of that day,
 *   ended_at is started_at + the actual elapsed duration of the session
 *   so the row keeps a realistic length.
 *
 * Pure function — accepts `now` so we can test it deterministically.
 */
export function computeSessionTimestamps(args: {
  startTime: number;
  now: Date;
  sessionDate?: string | null;
}): { startedAt: Date; endedAt: Date; backfilled: boolean } {
  const { startTime, now, sessionDate } = args;
  const elapsedMs = Math.max(0, now.getTime() - startTime);
  const todayMidnight = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );

  if (sessionDate) {
    const parsed = new Date(`${sessionDate}T00:00:00`);
    if (isNaN(parsed.getTime())) {
      console.warn(
        `[sessionDate] ignoring malformed value: ${JSON.stringify(sessionDate)}`
      );
    } else if (parsed.getTime() < todayMidnight.getTime()) {
      const startedAt = new Date(parsed);
      startedAt.setHours(12, 0, 0, 0);
      const endedAt = new Date(startedAt.getTime() + elapsedMs);
      return { startedAt, endedAt, backfilled: true };
    }
    // Future or today: fall through to live timestamps.
  }

  return {
    startedAt: new Date(startTime),
    endedAt: new Date(now.getTime()),
    backfilled: false,
  };
}
