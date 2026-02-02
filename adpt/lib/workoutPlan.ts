import { addDays, format } from "date-fns";

export type WorkoutIntensity = "low" | "medium" | "high";
export type WorkoutPhase = "base" | "build" | "peak" | "deload";

export type PlannedWorkout = {
  id: string;
  date: string;
  dayIndex: number;
  type: string;
  focus: string;
  durationMinutes: number;
  intensity: WorkoutIntensity;
  phase: WorkoutPhase;
  isRest: boolean;
};

export type WorkoutPlanPreferences = {
  goal?: string | null;
  workoutsPerWeek?: number | null;
  trainingStyle?: string | null;
  splitPreference?: string | null;
  limitations?: string[] | null;
  activityLevel?: string | null;
  adherenceScore?: number | null;
  lastSessionDaysAgo?: number | null;
  weekIndex?: number | null;
};

const intensityOrder: WorkoutIntensity[] = ["low", "medium", "high"];
const phaseCycle: WorkoutPhase[] = ["base", "build", "peak", "deload"];

const scheduleByCount: Record<number, number[]> = {
  1: [2],
  2: [1, 4],
  3: [0, 2, 4],
  4: [0, 1, 3, 5],
  5: [0, 1, 2, 4, 5],
  6: [0, 1, 2, 3, 4, 5],
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const shiftIntensity = (intensity: WorkoutIntensity, delta: number) => {
  const idx = intensityOrder.indexOf(intensity);
  const next = clamp(idx + delta, 0, intensityOrder.length - 1);
  return intensityOrder[next];
};

const resolveTrainingStyle = (trainingStyle?: string | null, splitPreference?: string | null) => {
  if (trainingStyle) return trainingStyle;
  const normalized = (splitPreference ?? "").trim().toLowerCase();
  if (normalized.includes("full")) return "full_body";
  if (normalized.includes("upper")) return "upper_lower";
  if (normalized.includes("push") || normalized.includes("pull") || normalized.includes("legs")) {
    return "ppl";
  }
  if (normalized.includes("custom")) return "custom";
  return "full_body";
};

const getSequenceForStyle = (style: string) => {
  switch (style) {
    case "upper_lower":
      return ["Upper Body", "Lower Body"];
    case "ppl":
      return ["Push", "Pull", "Legs"];
    case "custom":
      return ["Full Body", "Upper Focus", "Lower Focus", "Conditioning"];
    default:
      return ["Full Body"];
  }
};

const getIntensityPattern = (count: number): WorkoutIntensity[] => {
  const normalized = clamp(count, 1, 6);
  const patterns: Record<number, WorkoutIntensity[]> = {
    1: ["medium"],
    2: ["medium", "low"],
    3: ["high", "medium", "low"],
    4: ["high", "medium", "medium", "low"],
    5: ["high", "medium", "high", "medium", "low"],
    6: ["high", "medium", "high", "medium", "high", "low"],
  };
  return patterns[normalized];
};

const applyPhase = (intensity: WorkoutIntensity, phase: WorkoutPhase) => {
  if (phase === "deload") return "low";
  if (phase === "base") return intensity === "high" ? "medium" : intensity;
  if (phase === "peak") return intensity === "medium" ? "high" : intensity;
  return intensity;
};

const getBaseDuration = (goal?: string | null) => {
  switch (goal) {
    case "build_muscle":
      return 50;
    case "lose_weight":
      return 40;
    case "get_toned":
      return 45;
    case "endurance":
      return 35;
    default:
      return 45;
  }
};

const getGoalFocus = (goal?: string | null) => {
  switch (goal) {
    case "build_muscle":
      return "Hypertrophy focus";
    case "lose_weight":
      return "Metabolic strength";
    case "get_toned":
      return "Lean strength";
    case "endurance":
      return "Aerobic base";
    default:
      return "Balanced strength";
  }
};

const getTypeFocus = (type: string, index: number) => {
  switch (type) {
    case "Upper Body":
      return index % 2 === 0 ? "Push emphasis" : "Pull emphasis";
    case "Lower Body":
      return "Strength + stability";
    case "Push":
      return "Chest + shoulders";
    case "Pull":
      return "Back + biceps";
    case "Legs":
      return "Quads + glutes";
    case "Upper Focus":
      return "Upper balance";
    case "Lower Focus":
      return "Lower balance";
    case "Conditioning":
      return "Low-impact conditioning";
    case "Recovery":
      return "Mobility + breath";
    default:
      return "Compound focus";
  }
};

const applyLimitations = (
  focus: string,
  workoutType: string,
  limitations?: string[] | null
) => {
  if (!limitations || !limitations.length || limitations.includes("none")) return focus;
  const lowerLimitations = limitations.some((item) => item === "knees" || item === "hips");
  const backLimitations = limitations.includes("back");
  const shoulderLimitations = limitations.includes("shoulder");
  const normalizedType = workoutType.toLowerCase();
  const includesLower =
    normalizedType.includes("lower") || normalizedType.includes("legs") || normalizedType.includes("full");
  const includesUpper =
    normalizedType.includes("upper") ||
    normalizedType.includes("push") ||
    normalizedType.includes("pull") ||
    normalizedType.includes("full");
  const notes: string[] = [];
  if (lowerLimitations && includesLower) notes.push("Joint-friendly lower");
  if (backLimitations && (includesLower || normalizedType.includes("pull"))) {
    notes.push("Back-friendly");
  }
  if (shoulderLimitations && includesUpper) notes.push("Shoulder-friendly");
  if (limitations.includes("other")) notes.push("Move within comfort");
  if (!notes.length) return focus;
  return `${focus} - ${notes.join(" - ")}`;
};

export const generateWeeklyPlan = (
  preferences: WorkoutPlanPreferences,
  weekStart: Date = new Date()
): PlannedWorkout[] => {
  const workoutsPerWeek = clamp(preferences.workoutsPerWeek ?? 3, 1, 6);
  const schedule = scheduleByCount[workoutsPerWeek] ?? scheduleByCount[3];
  const style = resolveTrainingStyle(preferences.trainingStyle, preferences.splitPreference);
  const sequence = getSequenceForStyle(style);

  const weekIndex = Math.abs(preferences.weekIndex ?? 0);
  const phase = phaseCycle[weekIndex % phaseCycle.length];
  const baseDuration = getBaseDuration(preferences.goal);

  let intensities = getIntensityPattern(workoutsPerWeek).map((item) => applyPhase(item, phase));

  if (preferences.adherenceScore != null) {
    if (preferences.adherenceScore < 0.6) {
      intensities = intensities.map((item) => shiftIntensity(item, -1));
    } else if (preferences.adherenceScore > 0.9) {
      intensities = intensities.map((item, idx) => (idx < 2 ? shiftIntensity(item, 1) : item));
    }
  }

  if (preferences.lastSessionDaysAgo != null && preferences.lastSessionDaysAgo <= 1) {
    intensities = intensities.map((item, idx) => (idx === 0 ? shiftIntensity(item, -1) : item));
  }

  const planned: PlannedWorkout[] = [];
  let workoutIndex = 0;

  for (let dayIndex = 0; dayIndex < 7; dayIndex += 1) {
    const date = addDays(weekStart, dayIndex);
    const dateKey = format(date, "yyyy-MM-dd");
    const isWorkoutDay = schedule.includes(dayIndex);

    if (!isWorkoutDay) {
      planned.push({
        id: `day-${dayIndex}`,
        date: dateKey,
        dayIndex,
        type: "Recovery",
        focus: applyLimitations(
          getTypeFocus("Recovery", dayIndex),
          "Recovery",
          preferences.limitations
        ),
        durationMinutes: 20,
        intensity: "low",
        phase,
        isRest: true,
      });
      continue;
    }

    const type = sequence[workoutIndex % sequence.length];
    const intensity = intensities[workoutIndex] ?? "medium";
    const durationDelta = intensity === "high" ? 5 : intensity === "low" ? -5 : 0;
    const frequencyDelta = workoutsPerWeek >= 5 ? -5 : workoutsPerWeek <= 2 ? 5 : 0;
    const durationMinutes = clamp(baseDuration + durationDelta + frequencyDelta, 25, 70);
    const goalFocus = getGoalFocus(preferences.goal);
    const typeFocus = getTypeFocus(type, workoutIndex);
    const focus = applyLimitations(`${typeFocus} - ${goalFocus}`, type, preferences.limitations);

    planned.push({
      id: `day-${dayIndex}`,
      date: dateKey,
      dayIndex,
      type,
      focus,
      durationMinutes,
      intensity,
      phase,
      isRest: false,
    });

    workoutIndex += 1;
  }

  return planned;
};
