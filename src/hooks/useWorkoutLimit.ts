/**
 * Workout limit stub — paywall removed for v1 coaching prototype.
 * All workouts allowed.
 */

export function useWorkoutLimit() {
  return {
    canStartWorkout: true,
    workoutsRemaining: Infinity,
    refresh: async () => {},
  };
}
