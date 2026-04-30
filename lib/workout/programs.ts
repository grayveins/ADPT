/**
 * Curated Program Library
 * Evidence-based programs designed by ADPT.
 * Each program has multiple workout days with prescribed exercises.
 */

export type ProgramDay = {
  name: string;
  focus: string;
  exercises: {
    name: string;
    sets: number;
    reps: string;
    rir: number;
    notes?: string;
    muscleGroup?: string;
  }[];
};

export type CuratedProgram = {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  category: "build_muscle" | "get_strong" | "get_started";
  accent: readonly [string, string];
  split: string;
  daysPerWeek: number;
  level: "beginner" | "intermediate" | "advanced";
  tags: string[];
  days: ProgramDay[];
};

// =============================================================================
// BUILD MUSCLE
// =============================================================================

const pplPro: CuratedProgram = {
  id: "ppl-pro",
  name: "Push Pull Legs",
  subtitle: "The most popular split in the gym",
  description: "6 days a week, every muscle twice. Push one day, pull the next, legs after. Simple structure, serious results.",
  category: "build_muscle",
  accent: ["#3B82F6", "#2563EB"] as const,
  split: "Push / Pull / Legs",
  daysPerWeek: 6,
  level: "intermediate",
  tags: ["popular", "6-day", "high frequency"],
  days: [
    {
      name: "Push A",
      focus: "Chest & Triceps",
      exercises: [
        { name: "Bench Press", sets: 4, reps: "6-8", rir: 2, muscleGroup: "Chest" },
        { name: "Overhead Press", sets: 3, reps: "8-10", rir: 2, muscleGroup: "Shoulders" },
        { name: "Incline Dumbbell Press", sets: 3, reps: "10-12", rir: 1, muscleGroup: "Chest" },
        { name: "Lateral Raises", sets: 3, reps: "12-15", rir: 1, muscleGroup: "Shoulders" },
        { name: "Tricep Pushdowns", sets: 3, reps: "10-12", rir: 1, muscleGroup: "Arms" },
        { name: "Overhead Tricep Extensions", sets: 3, reps: "12-15", rir: 1, muscleGroup: "Arms" },
      ],
    },
    {
      name: "Pull A",
      focus: "Back & Biceps",
      exercises: [
        { name: "Barbell Rows", sets: 4, reps: "6-8", rir: 2, muscleGroup: "Back" },
        { name: "Pull-ups", sets: 3, reps: "6-10", rir: 2, muscleGroup: "Back" },
        { name: "Cable Rows", sets: 3, reps: "10-12", rir: 1, muscleGroup: "Back" },
        { name: "Face Pulls", sets: 3, reps: "15-20", rir: 1, muscleGroup: "Shoulders" },
        { name: "Barbell Curls", sets: 3, reps: "8-10", rir: 1, muscleGroup: "Arms" },
        { name: "Hammer Curls", sets: 2, reps: "10-12", rir: 1, muscleGroup: "Arms" },
      ],
    },
    {
      name: "Legs A",
      focus: "Quads & Glutes",
      exercises: [
        { name: "Squats", sets: 4, reps: "6-8", rir: 2, muscleGroup: "Legs" },
        { name: "Romanian Deadlift", sets: 3, reps: "8-10", rir: 2, muscleGroup: "Legs" },
        { name: "Leg Press", sets: 3, reps: "10-12", rir: 1, muscleGroup: "Legs" },
        { name: "Leg Curls", sets: 3, reps: "10-12", rir: 1, muscleGroup: "Legs" },
        { name: "Calf Raises", sets: 4, reps: "12-15", rir: 1, muscleGroup: "Legs" },
      ],
    },
    {
      name: "Push B",
      focus: "Shoulders & Chest",
      exercises: [
        { name: "Overhead Press", sets: 4, reps: "6-8", rir: 2, muscleGroup: "Shoulders" },
        { name: "Incline Bench Press", sets: 3, reps: "8-10", rir: 2, muscleGroup: "Chest" },
        { name: "Dumbbell Bench Press", sets: 3, reps: "10-12", rir: 1, muscleGroup: "Chest" },
        { name: "Lateral Raises", sets: 4, reps: "12-15", rir: 1, muscleGroup: "Shoulders" },
        { name: "Tricep Dips", sets: 3, reps: "8-12", rir: 1, muscleGroup: "Arms" },
      ],
    },
    {
      name: "Pull B",
      focus: "Back Width & Biceps",
      exercises: [
        { name: "Deadlift", sets: 3, reps: "5-6", rir: 2, muscleGroup: "Back" },
        { name: "Lat Pulldowns", sets: 3, reps: "10-12", rir: 1, muscleGroup: "Back" },
        { name: "Chest-Supported Rows", sets: 3, reps: "10-12", rir: 1, muscleGroup: "Back" },
        { name: "Reverse Flyes", sets: 3, reps: "12-15", rir: 1, muscleGroup: "Shoulders" },
        { name: "Incline Curls", sets: 3, reps: "10-12", rir: 1, muscleGroup: "Arms" },
        { name: "Barbell Curls", sets: 2, reps: "8-10", rir: 1, muscleGroup: "Arms" },
      ],
    },
    {
      name: "Legs B",
      focus: "Hamstrings & Glutes",
      exercises: [
        { name: "Romanian Deadlift", sets: 4, reps: "8-10", rir: 2, muscleGroup: "Legs" },
        { name: "Bulgarian Split Squats", sets: 3, reps: "8-10", rir: 2, muscleGroup: "Legs" },
        { name: "Leg Press", sets: 3, reps: "12-15", rir: 1, muscleGroup: "Legs" },
        { name: "Leg Curls", sets: 3, reps: "10-12", rir: 1, muscleGroup: "Legs" },
        { name: "Hip Thrusts", sets: 3, reps: "10-12", rir: 1, muscleGroup: "Legs" },
        { name: "Calf Raises", sets: 4, reps: "12-15", rir: 1, muscleGroup: "Legs" },
      ],
    },
  ],
};

const stretchGrow: CuratedProgram = {
  id: "stretch-grow",
  name: "Stretch & Grow",
  subtitle: "Maximum muscle growth",
  description: "4-day upper/lower split using exercises that stretch your muscles under load — the #1 driver of muscle growth according to recent research.",
  category: "build_muscle",
  accent: ["#8B5CF6", "#7C3AED"] as const,
  split: "Upper / Lower",
  daysPerWeek: 4,
  level: "intermediate",
  tags: ["research-backed", "4-day", "efficient"],
  days: [
    {
      name: "Upper A",
      focus: "Chest & Back (Stretched)",
      exercises: [
        { name: "Incline Dumbbell Press", sets: 3, reps: "8-12", rir: 1, notes: "Deep stretch at bottom", muscleGroup: "Chest" },
        { name: "Cable Rows", sets: 3, reps: "10-12", rir: 1, notes: "Full stretch forward", muscleGroup: "Back" },
        { name: "Overhead Press", sets: 3, reps: "8-10", rir: 2, muscleGroup: "Shoulders" },
        { name: "Incline Curls", sets: 3, reps: "10-12", rir: 1, notes: "Arms behind torso for stretch", muscleGroup: "Arms" },
        { name: "Overhead Tricep Extensions", sets: 3, reps: "10-12", rir: 1, notes: "Deep stretch overhead", muscleGroup: "Arms" },
        { name: "Lateral Raises", sets: 3, reps: "12-15", rir: 1, notes: "Cross-body cable for stretch", muscleGroup: "Shoulders" },
      ],
    },
    {
      name: "Lower A",
      focus: "Quads & Hamstrings (Stretched)",
      exercises: [
        { name: "Romanian Deadlift", sets: 3, reps: "8-10", rir: 2, notes: "Emphasis on hamstring stretch", muscleGroup: "Legs" },
        { name: "Leg Extensions", sets: 3, reps: "10-15", rir: 1, notes: "Seated reclined for quad stretch", muscleGroup: "Legs" },
        { name: "Bulgarian Split Squats", sets: 3, reps: "8-10", rir: 2, notes: "Deep stretch at bottom", muscleGroup: "Legs" },
        { name: "Leg Curls", sets: 3, reps: "10-12", rir: 1, notes: "Seated for stretch", muscleGroup: "Legs" },
        { name: "Calf Raises", sets: 3, reps: "12-15", rir: 1, notes: "Full stretch at bottom", muscleGroup: "Legs" },
      ],
    },
    {
      name: "Upper B",
      focus: "Back & Shoulders (Stretched)",
      exercises: [
        { name: "Lat Pulldowns", sets: 3, reps: "10-12", rir: 1, notes: "Full stretch at top", muscleGroup: "Back" },
        { name: "Dumbbell Bench Press", sets: 3, reps: "8-12", rir: 1, notes: "Deep stretch at bottom", muscleGroup: "Chest" },
        { name: "Chest-Supported Rows", sets: 3, reps: "10-12", rir: 1, muscleGroup: "Back" },
        { name: "Lateral Raises", sets: 3, reps: "12-15", rir: 1, muscleGroup: "Shoulders" },
        { name: "Hammer Curls", sets: 3, reps: "10-12", rir: 1, muscleGroup: "Arms" },
        { name: "Tricep Pushdowns", sets: 3, reps: "10-12", rir: 1, muscleGroup: "Arms" },
      ],
    },
    {
      name: "Lower B",
      focus: "Glutes & Quads (Stretched)",
      exercises: [
        { name: "Squats", sets: 4, reps: "6-8", rir: 2, notes: "Full depth for stretch", muscleGroup: "Legs" },
        { name: "Hip Thrusts", sets: 3, reps: "10-12", rir: 1, muscleGroup: "Legs" },
        { name: "Walking Lunges", sets: 3, reps: "10-12", rir: 1, notes: "Long stride for stretch", muscleGroup: "Legs" },
        { name: "Leg Curls", sets: 3, reps: "10-12", rir: 1, muscleGroup: "Legs" },
        { name: "Calf Raises", sets: 3, reps: "12-15", rir: 1, muscleGroup: "Legs" },
      ],
    },
  ],
};

// =============================================================================
// CLASSIC SPLITS
// =============================================================================

const pplClassic: CuratedProgram = {
  id: "ppl-classic",
  name: "PPL Lite",
  subtitle: "Simple & effective",
  description: "Stripped-down push/pull/legs. Fewer exercises per session, same muscle coverage. For when you want PPL but don't want to live in the gym.",
  category: "build_muscle",
  accent: ["#F59E0B", "#D97706"] as const,
  split: "Push / Pull / Legs",
  daysPerWeek: 6,
  level: "intermediate",
  tags: ["proven", "6-day", "straightforward"],
  days: [
    {
      name: "Push",
      focus: "Chest, Shoulders, Triceps",
      exercises: [
        { name: "Bench Press", sets: 4, reps: "6-8", rir: 2, muscleGroup: "Chest" },
        { name: "Incline Dumbbell Press", sets: 3, reps: "8-12", rir: 1, muscleGroup: "Chest" },
        { name: "Overhead Press", sets: 3, reps: "8-10", rir: 2, muscleGroup: "Shoulders" },
        { name: "Lateral Raises", sets: 4, reps: "12-15", rir: 1, muscleGroup: "Shoulders" },
        { name: "Tricep Pushdowns", sets: 3, reps: "10-12", rir: 1, muscleGroup: "Arms" },
        { name: "Overhead Tricep Extensions", sets: 3, reps: "12-15", rir: 1, muscleGroup: "Arms" },
      ],
    },
    {
      name: "Pull",
      focus: "Back, Biceps, Rear Delts",
      exercises: [
        { name: "Barbell Rows", sets: 4, reps: "6-8", rir: 2, muscleGroup: "Back" },
        { name: "Lat Pulldowns", sets: 3, reps: "8-12", rir: 1, muscleGroup: "Back" },
        { name: "Cable Rows", sets: 3, reps: "10-12", rir: 1, muscleGroup: "Back" },
        { name: "Face Pulls", sets: 3, reps: "15-20", rir: 1, muscleGroup: "Shoulders" },
        { name: "Barbell Curls", sets: 3, reps: "8-10", rir: 1, muscleGroup: "Arms" },
        { name: "Hammer Curls", sets: 3, reps: "10-12", rir: 1, muscleGroup: "Arms" },
      ],
    },
    {
      name: "Legs",
      focus: "Quads, Hamstrings, Glutes, Calves",
      exercises: [
        { name: "Squats", sets: 4, reps: "6-8", rir: 2, muscleGroup: "Legs" },
        { name: "Romanian Deadlift", sets: 3, reps: "8-10", rir: 2, muscleGroup: "Legs" },
        { name: "Leg Press", sets: 3, reps: "10-12", rir: 1, muscleGroup: "Legs" },
        { name: "Leg Curls", sets: 3, reps: "10-12", rir: 1, muscleGroup: "Legs" },
        { name: "Leg Extensions", sets: 3, reps: "12-15", rir: 1, muscleGroup: "Legs" },
        { name: "Calf Raises", sets: 4, reps: "12-15", rir: 1, muscleGroup: "Legs" },
      ],
    },
  ],
};

const upperLower: CuratedProgram = {
  id: "upper-lower",
  name: "Upper Lower",
  subtitle: "4 days, full coverage",
  description: "Upper body twice, lower body twice. Plenty of rest days while still hitting everything hard enough to grow.",
  category: "build_muscle",
  accent: ["#06B6D4", "#0891B2"] as const,
  split: "Upper / Lower",
  daysPerWeek: 4,
  level: "intermediate",
  tags: ["balanced", "4-day", "popular"],
  days: [
    {
      name: "Upper A",
      focus: "Chest & Back Focus",
      exercises: [
        { name: "Bench Press", sets: 4, reps: "6-8", rir: 2, muscleGroup: "Chest" },
        { name: "Barbell Rows", sets: 4, reps: "6-8", rir: 2, muscleGroup: "Back" },
        { name: "Overhead Press", sets: 3, reps: "8-10", rir: 2, muscleGroup: "Shoulders" },
        { name: "Lat Pulldowns", sets: 3, reps: "10-12", rir: 1, muscleGroup: "Back" },
        { name: "Lateral Raises", sets: 3, reps: "12-15", rir: 1, muscleGroup: "Shoulders" },
        { name: "Barbell Curls", sets: 2, reps: "10-12", rir: 1, muscleGroup: "Arms" },
        { name: "Tricep Pushdowns", sets: 2, reps: "10-12", rir: 1, muscleGroup: "Arms" },
      ],
    },
    {
      name: "Lower A",
      focus: "Squat Focus",
      exercises: [
        { name: "Squats", sets: 4, reps: "6-8", rir: 2, muscleGroup: "Legs" },
        { name: "Romanian Deadlift", sets: 3, reps: "8-10", rir: 2, muscleGroup: "Legs" },
        { name: "Leg Press", sets: 3, reps: "10-12", rir: 1, muscleGroup: "Legs" },
        { name: "Leg Curls", sets: 3, reps: "10-12", rir: 1, muscleGroup: "Legs" },
        { name: "Calf Raises", sets: 4, reps: "12-15", rir: 1, muscleGroup: "Legs" },
      ],
    },
    {
      name: "Upper B",
      focus: "Shoulders & Arms Focus",
      exercises: [
        { name: "Overhead Press", sets: 4, reps: "6-8", rir: 2, muscleGroup: "Shoulders" },
        { name: "Pull-ups", sets: 3, reps: "6-10", rir: 2, muscleGroup: "Back" },
        { name: "Incline Dumbbell Press", sets: 3, reps: "10-12", rir: 1, muscleGroup: "Chest" },
        { name: "Cable Rows", sets: 3, reps: "10-12", rir: 1, muscleGroup: "Back" },
        { name: "Lateral Raises", sets: 4, reps: "12-15", rir: 1, muscleGroup: "Shoulders" },
        { name: "Hammer Curls", sets: 3, reps: "10-12", rir: 1, muscleGroup: "Arms" },
        { name: "Overhead Tricep Extensions", sets: 3, reps: "10-12", rir: 1, muscleGroup: "Arms" },
      ],
    },
    {
      name: "Lower B",
      focus: "Deadlift Focus",
      exercises: [
        { name: "Deadlift", sets: 3, reps: "5-6", rir: 2, muscleGroup: "Legs" },
        { name: "Bulgarian Split Squats", sets: 3, reps: "8-10", rir: 2, muscleGroup: "Legs" },
        { name: "Hip Thrusts", sets: 3, reps: "10-12", rir: 1, muscleGroup: "Legs" },
        { name: "Leg Extensions", sets: 3, reps: "12-15", rir: 1, muscleGroup: "Legs" },
        { name: "Calf Raises", sets: 4, reps: "12-15", rir: 1, muscleGroup: "Legs" },
      ],
    },
  ],
};

const fullBody3x: CuratedProgram = {
  id: "full-body-3x",
  name: "Full Body 3x",
  subtitle: "Perfect first program",
  description: "3 days a week, whole body each session. Great if you're just starting out or want a simple routine that covers everything.",
  category: "get_started",
  accent: ["#7FA07F", "#6B8E6B"] as const,
  split: "Full Body",
  daysPerWeek: 3,
  level: "beginner",
  tags: ["beginner", "3-day", "simple"],
  days: [
    {
      name: "Day A",
      focus: "Squat Focus",
      exercises: [
        { name: "Squats", sets: 3, reps: "6-8", rir: 2, muscleGroup: "Legs" },
        { name: "Bench Press", sets: 3, reps: "8-10", rir: 2, muscleGroup: "Chest" },
        { name: "Barbell Rows", sets: 3, reps: "8-10", rir: 2, muscleGroup: "Back" },
        { name: "Overhead Press", sets: 2, reps: "8-10", rir: 2, muscleGroup: "Shoulders" },
        { name: "Barbell Curls", sets: 2, reps: "10-12", rir: 1, muscleGroup: "Arms" },
        { name: "Calf Raises", sets: 3, reps: "12-15", rir: 1, muscleGroup: "Legs" },
      ],
    },
    {
      name: "Day B",
      focus: "Hinge Focus",
      exercises: [
        { name: "Deadlift", sets: 3, reps: "5-6", rir: 2, muscleGroup: "Legs" },
        { name: "Incline Dumbbell Press", sets: 3, reps: "8-12", rir: 1, muscleGroup: "Chest" },
        { name: "Lat Pulldowns", sets: 3, reps: "8-12", rir: 1, muscleGroup: "Back" },
        { name: "Lateral Raises", sets: 3, reps: "12-15", rir: 1, muscleGroup: "Shoulders" },
        { name: "Tricep Pushdowns", sets: 2, reps: "10-12", rir: 1, muscleGroup: "Arms" },
        { name: "Leg Curls", sets: 2, reps: "10-12", rir: 1, muscleGroup: "Legs" },
      ],
    },
    {
      name: "Day C",
      focus: "Press Focus",
      exercises: [
        { name: "Overhead Press", sets: 3, reps: "6-8", rir: 2, muscleGroup: "Shoulders" },
        { name: "Squats", sets: 3, reps: "8-10", rir: 2, muscleGroup: "Legs" },
        { name: "Cable Rows", sets: 3, reps: "10-12", rir: 1, muscleGroup: "Back" },
        { name: "Dumbbell Bench Press", sets: 3, reps: "8-12", rir: 1, muscleGroup: "Chest" },
        { name: "Hammer Curls", sets: 2, reps: "10-12", rir: 1, muscleGroup: "Arms" },
        { name: "Face Pulls", sets: 2, reps: "15-20", rir: 1, muscleGroup: "Shoulders" },
      ],
    },
  ],
};

const getStrong: CuratedProgram = {
  id: "get-strong",
  name: "Get Strong",
  subtitle: "Heavy lifts, real results",
  description: "Focus on the big lifts — squat, bench, deadlift, overhead press. Low reps, heavy weight, long rest. You'll feel the difference in weeks.",
  category: "get_strong",
  accent: ["#EF4444", "#DC2626"] as const,
  split: "Upper / Lower",
  daysPerWeek: 4,
  level: "intermediate",
  tags: ["strength", "compounds", "4-day"],
  days: [
    {
      name: "Upper Strength",
      focus: "Bench & Row",
      exercises: [
        { name: "Bench Press", sets: 5, reps: "5", rir: 2, notes: "3-4 min rest", muscleGroup: "Chest" },
        { name: "Barbell Rows", sets: 5, reps: "5", rir: 2, muscleGroup: "Back" },
        { name: "Overhead Press", sets: 3, reps: "6-8", rir: 2, muscleGroup: "Shoulders" },
        { name: "Pull-ups", sets: 3, reps: "5-8", rir: 2, muscleGroup: "Back" },
        { name: "Barbell Curls", sets: 2, reps: "8-10", rir: 1, muscleGroup: "Arms" },
      ],
    },
    {
      name: "Lower Strength",
      focus: "Squat & Deadlift",
      exercises: [
        { name: "Squats", sets: 5, reps: "5", rir: 2, notes: "3-4 min rest", muscleGroup: "Legs" },
        { name: "Romanian Deadlift", sets: 3, reps: "6-8", rir: 2, muscleGroup: "Legs" },
        { name: "Leg Press", sets: 3, reps: "8-10", rir: 1, muscleGroup: "Legs" },
        { name: "Leg Curls", sets: 3, reps: "8-10", rir: 1, muscleGroup: "Legs" },
        { name: "Calf Raises", sets: 3, reps: "10-12", rir: 1, muscleGroup: "Legs" },
      ],
    },
    {
      name: "Upper Volume",
      focus: "Bench & Pull-ups",
      exercises: [
        { name: "Bench Press", sets: 4, reps: "8-10", rir: 1, muscleGroup: "Chest" },
        { name: "Lat Pulldowns", sets: 4, reps: "8-10", rir: 1, muscleGroup: "Back" },
        { name: "Incline Dumbbell Press", sets: 3, reps: "10-12", rir: 1, muscleGroup: "Chest" },
        { name: "Cable Rows", sets: 3, reps: "10-12", rir: 1, muscleGroup: "Back" },
        { name: "Lateral Raises", sets: 3, reps: "12-15", rir: 1, muscleGroup: "Shoulders" },
        { name: "Tricep Pushdowns", sets: 3, reps: "10-12", rir: 1, muscleGroup: "Arms" },
      ],
    },
    {
      name: "Lower Volume",
      focus: "Deadlift & Accessories",
      exercises: [
        { name: "Deadlift", sets: 3, reps: "5", rir: 2, notes: "3-4 min rest", muscleGroup: "Legs" },
        { name: "Bulgarian Split Squats", sets: 3, reps: "8-10", rir: 2, muscleGroup: "Legs" },
        { name: "Hip Thrusts", sets: 3, reps: "10-12", rir: 1, muscleGroup: "Legs" },
        { name: "Leg Extensions", sets: 3, reps: "12-15", rir: 1, muscleGroup: "Legs" },
        { name: "Calf Raises", sets: 3, reps: "12-15", rir: 1, muscleGroup: "Legs" },
      ],
    },
  ],
};

const quickEffective: CuratedProgram = {
  id: "quick-effective",
  name: "Quick & Effective",
  subtitle: "30 minutes, in and out",
  description: "3 compound exercises per session. Multiple muscles per move. For people who are busy but still want real results.",
  category: "get_started",
  accent: ["#10B981", "#059669"] as const,
  split: "Full Body",
  daysPerWeek: 3,
  level: "beginner",
  tags: ["quick", "minimal", "beginner"],
  days: [
    {
      name: "Workout A",
      focus: "Squat / Press / Row",
      exercises: [
        { name: "Squats", sets: 3, reps: "5-8", rir: 2, muscleGroup: "Legs" },
        { name: "Bench Press", sets: 3, reps: "5-8", rir: 2, muscleGroup: "Chest" },
        { name: "Barbell Rows", sets: 3, reps: "5-8", rir: 2, muscleGroup: "Back" },
      ],
    },
    {
      name: "Workout B",
      focus: "Deadlift / OHP / Pull",
      exercises: [
        { name: "Deadlift", sets: 3, reps: "5", rir: 2, muscleGroup: "Legs" },
        { name: "Overhead Press", sets: 3, reps: "5-8", rir: 2, muscleGroup: "Shoulders" },
        { name: "Pull-ups", sets: 3, reps: "5-10", rir: 2, muscleGroup: "Back" },
      ],
    },
  ],
};

const antagonist: CuratedProgram = {
  id: "antagonist",
  name: "Antagonist Split",
  subtitle: "Chest & back, arms & shoulders",
  description: "Pair opposing muscle groups each session. Chest with back, shoulders with arms, then legs. Keeps intensity high and sessions efficient.",
  category: "build_muscle",
  accent: ["#FFD700", "#E5C100"] as const,
  split: "Chest-Back / Shoulders-Arms / Legs",
  daysPerWeek: 6,
  level: "advanced",
  tags: ["classic", "high volume", "advanced"],
  days: [
    {
      name: "Chest & Back",
      focus: "Antagonist Pairing",
      exercises: [
        { name: "Bench Press", sets: 4, reps: "6-10", rir: 1, muscleGroup: "Chest" },
        { name: "Pull-ups", sets: 4, reps: "6-10", rir: 1, muscleGroup: "Back" },
        { name: "Incline Dumbbell Press", sets: 3, reps: "10-12", rir: 1, muscleGroup: "Chest" },
        { name: "Barbell Rows", sets: 3, reps: "8-10", rir: 1, muscleGroup: "Back" },
        { name: "Cable Flyes", sets: 3, reps: "12-15", rir: 1, muscleGroup: "Chest" },
        { name: "Lat Pulldowns", sets: 3, reps: "10-12", rir: 1, muscleGroup: "Back" },
      ],
    },
    {
      name: "Shoulders & Arms",
      focus: "Delts, Biceps, Triceps",
      exercises: [
        { name: "Overhead Press", sets: 4, reps: "6-10", rir: 1, muscleGroup: "Shoulders" },
        { name: "Lateral Raises", sets: 4, reps: "12-15", rir: 1, muscleGroup: "Shoulders" },
        { name: "Barbell Curls", sets: 3, reps: "8-10", rir: 1, muscleGroup: "Arms" },
        { name: "Tricep Pushdowns", sets: 3, reps: "10-12", rir: 1, muscleGroup: "Arms" },
        { name: "Hammer Curls", sets: 3, reps: "10-12", rir: 1, muscleGroup: "Arms" },
        { name: "Overhead Tricep Extensions", sets: 3, reps: "10-12", rir: 1, muscleGroup: "Arms" },
        { name: "Reverse Flyes", sets: 3, reps: "12-15", rir: 1, muscleGroup: "Shoulders" },
      ],
    },
    {
      name: "Legs",
      focus: "Quads, Hams, Glutes, Calves",
      exercises: [
        { name: "Squats", sets: 4, reps: "6-10", rir: 1, muscleGroup: "Legs" },
        { name: "Romanian Deadlift", sets: 3, reps: "8-10", rir: 1, muscleGroup: "Legs" },
        { name: "Leg Press", sets: 3, reps: "10-15", rir: 1, muscleGroup: "Legs" },
        { name: "Leg Curls", sets: 3, reps: "10-12", rir: 1, muscleGroup: "Legs" },
        { name: "Leg Extensions", sets: 3, reps: "12-15", rir: 1, muscleGroup: "Legs" },
        { name: "Calf Raises", sets: 4, reps: "12-20", rir: 1, muscleGroup: "Legs" },
      ],
    },
  ],
};

// =============================================================================
// EXPORTS
// =============================================================================

export const CURATED_PROGRAMS: CuratedProgram[] = [
  pplPro,
  stretchGrow,
  upperLower,
  pplClassic,
  antagonist,
  getStrong,
  fullBody3x,
  quickEffective,
];

/** Group programs by category for display */
export function getProgramsByCategory(): { category: string; programs: CuratedProgram[] }[] {
  const categoryOrder = ["get_started", "build_muscle", "get_strong"];
  const categoryLabels: Record<string, string> = {
    get_started: "Get Started",
    build_muscle: "Build Muscle",
    get_strong: "Get Strong",
  };

  const grouped = new Map<string, CuratedProgram[]>();
  for (const p of CURATED_PROGRAMS) {
    const list = grouped.get(p.category) || [];
    list.push(p);
    grouped.set(p.category, list);
  }

  return categoryOrder
    .filter((c) => grouped.has(c))
    .map((c) => ({ category: categoryLabels[c] || c, programs: grouped.get(c)! }));
}
