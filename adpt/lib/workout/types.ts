export type WorkoutSet = {
  id: string;
  weight: number | null;
  reps: number | null;
  rir?: number | null;
  isWarmup?: boolean;
  isDone?: boolean;
  completedAt?: string | null;
  notes?: string | null;
};

export type WorkoutExercise = {
  id: string;
  logId?: string;
  exerciseId?: string;
  name: string;
  muscleGroup?: string | null;
  sets: WorkoutSet[];
  restTimerSeconds?: number;
  lastPerformed?: {
    date: string;
    bestSet?: {
      weight: number;
      reps: number;
    };
  };
};
