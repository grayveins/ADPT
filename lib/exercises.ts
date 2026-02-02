export type Exercise = {
  id: string;
  name: string;
  category: string;
  isPublic?: boolean;
};

export const muscleGroups = [
  "Chest",
  "Back",
  "Shoulders",
  "Arms",
  "Legs",
  "Core",
  "Full Body",
  "Cardio",
];

export const defaultExercises: Exercise[] = [
  { id: "bench-press", name: "Bench Press", category: "Chest", isPublic: true },
  { id: "incline-bench-press", name: "Incline Bench Press", category: "Chest", isPublic: true },
  { id: "dumbbell-bench-press", name: "Dumbbell Bench Press", category: "Chest", isPublic: true },
  { id: "push-up", name: "Push-Up", category: "Chest", isPublic: true },
  { id: "chest-fly", name: "Chest Fly", category: "Chest", isPublic: true },
  { id: "deadlift", name: "Deadlift", category: "Back", isPublic: true },
  { id: "barbell-row", name: "Barbell Row", category: "Back", isPublic: true },
  { id: "pull-up", name: "Pull-Up", category: "Back", isPublic: true },
  { id: "lat-pulldown", name: "Lat Pulldown", category: "Back", isPublic: true },
  { id: "seated-row", name: "Seated Row", category: "Back", isPublic: true },
  { id: "overhead-press", name: "Overhead Press", category: "Shoulders", isPublic: true },
  { id: "dumbbell-shoulder-press", name: "Dumbbell Shoulder Press", category: "Shoulders", isPublic: true },
  { id: "lateral-raise", name: "Lateral Raise", category: "Shoulders", isPublic: true },
  { id: "rear-delt-fly", name: "Rear Delt Fly", category: "Shoulders", isPublic: true },
  { id: "bicep-curl", name: "Bicep Curl", category: "Arms", isPublic: true },
  { id: "hammer-curl", name: "Hammer Curl", category: "Arms", isPublic: true },
  { id: "tricep-pushdown", name: "Tricep Pushdown", category: "Arms", isPublic: true },
  { id: "tricep-dip", name: "Tricep Dip", category: "Arms", isPublic: true },
  { id: "squat", name: "Squat", category: "Legs", isPublic: true },
  { id: "front-squat", name: "Front Squat", category: "Legs", isPublic: true },
  { id: "leg-press", name: "Leg Press", category: "Legs", isPublic: true },
  { id: "romanian-deadlift", name: "Romanian Deadlift", category: "Legs", isPublic: true },
  { id: "lunges", name: "Lunges", category: "Legs", isPublic: true },
  { id: "leg-curl", name: "Leg Curl", category: "Legs", isPublic: true },
  { id: "leg-extension", name: "Leg Extension", category: "Legs", isPublic: true },
  { id: "calf-raise", name: "Calf Raise", category: "Legs", isPublic: true },
  { id: "plank", name: "Plank", category: "Core", isPublic: true },
  { id: "hanging-leg-raise", name: "Hanging Leg Raise", category: "Core", isPublic: true },
  { id: "cable-crunch", name: "Cable Crunch", category: "Core", isPublic: true },
  { id: "clean-and-press", name: "Clean and Press", category: "Full Body", isPublic: true },
  { id: "kettlebell-swing", name: "Kettlebell Swing", category: "Full Body", isPublic: true },
  { id: "running", name: "Running", category: "Cardio", isPublic: true },
  { id: "cycling", name: "Cycling", category: "Cardio", isPublic: true },
  { id: "rowing", name: "Rowing", category: "Cardio", isPublic: true },
];
