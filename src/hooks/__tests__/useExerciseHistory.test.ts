import { brzycki1RM } from "../useExerciseHistory";

describe("brzycki1RM", () => {
  it("returns null on zero reps", () => {
    expect(brzycki1RM(100, 0)).toBeNull();
  });

  it("returns null on negative reps", () => {
    expect(brzycki1RM(100, -1)).toBeNull();
  });

  it("returns null on zero weight", () => {
    expect(brzycki1RM(0, 5)).toBeNull();
  });

  it("returns the lifted weight for a 1-rep set", () => {
    expect(brzycki1RM(225, 1)).toBe(225);
  });

  it("estimates within ~5 lbs for a typical 5-rep set", () => {
    // Brzycki: 225 * 36 / (37 - 5) = 225 * 36 / 32 = 253.125 → 253
    expect(brzycki1RM(225, 5)).toBe(253);
  });

  it("estimates conservatively around the formula's accuracy edge (10 reps)", () => {
    // 100 * 36 / (37 - 10) = 100 * 36 / 27 = 133.33 → 133
    expect(brzycki1RM(100, 10)).toBe(133);
  });

  it("caps reps at 12 (formula loses accuracy past that)", () => {
    // Both 12 and 20 should return the same value (capped at 12).
    const at12 = brzycki1RM(100, 12);
    const at20 = brzycki1RM(100, 20);
    expect(at12).toBe(at20);
  });

  it("returns an integer (rounded)", () => {
    const result = brzycki1RM(225, 8);
    expect(result).not.toBeNull();
    expect(Number.isInteger(result)).toBe(true);
  });
});
