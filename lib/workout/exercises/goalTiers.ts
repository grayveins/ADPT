/**
 * Goal-specific exercise tiers for the workout generator.
 *
 * Each goal maps exercise IDs to a tier that controls how the generator
 * prioritises exercises:
 *
 *   primary   - core movements the programme is built around
 *   secondary - important assistance / supplementary work
 *   tertiary  - finishing / detail work (isolation, rehab, etc.)
 *
 * Exercises not listed for a given goal default to 'tertiary'.
 */

export type GoalTier = 'primary' | 'secondary' | 'tertiary';

// ---------------------------------------------------------------------------
// Tier maps per goal
// ---------------------------------------------------------------------------

export const GOAL_TIERS: Record<string, Record<string, GoalTier>> = {

  // =========================================================================
  // STRENGTH  - big compounds first, close variations second, isolation last
  // =========================================================================
  strength: {
    // Primary: big 5 compounds
    'bench-press': 'primary',
    'squat': 'primary',
    'deadlift': 'primary',
    'overhead-press': 'primary',
    'barbell-row': 'primary',

    // Secondary: close variations + assistance compounds
    'incline-bench-press': 'secondary',
    'close-grip-bench-press': 'secondary',
    'dumbbell-bench-press': 'secondary',
    'decline-bench-press': 'secondary',
    'weighted-dip': 'secondary',
    'front-squat': 'secondary',
    'safety-bar-squat': 'secondary',
    'box-squat': 'secondary',
    'pause-squat': 'secondary',
    'leg-press': 'secondary',
    'sumo-deadlift': 'secondary',
    'trap-bar-deadlift': 'secondary',
    'romanian-deadlift': 'secondary',
    'stiff-leg-deadlift': 'secondary',
    'hip-thrust': 'secondary',
    'seated-overhead-press': 'secondary',
    'push-press': 'secondary',
    'z-press': 'secondary',
    'dumbbell-shoulder-press': 'secondary',
    'pendlay-row': 'secondary',
    't-bar-row': 'secondary',
    'dumbbell-row': 'secondary',
    'pull-up': 'secondary',
    'chin-up': 'secondary',
    'lat-pulldown': 'secondary',
    'seated-row': 'secondary',
    'bulgarian-split-squat': 'secondary',
    'good-morning': 'secondary',
    'dip': 'secondary',

    // Tertiary: isolation & machine work
    'tricep-pushdown': 'tertiary',
    'rope-pushdown': 'tertiary',
    'overhead-tricep-extension': 'tertiary',
    'skull-crusher': 'tertiary',
    'bicep-curl': 'tertiary',
    'hammer-curl': 'tertiary',
    'barbell-curl': 'tertiary',
    'lateral-raise': 'tertiary',
    'face-pull': 'tertiary',
    'rear-delt-fly': 'tertiary',
    'leg-curl': 'tertiary',
    'leg-extension': 'tertiary',
    'calf-raise': 'tertiary',
    'plank': 'tertiary',
    'hanging-leg-raise': 'tertiary',
    'ab-wheel': 'tertiary',
    'farmers-carry': 'tertiary',
    'wrist-curl': 'tertiary',
  },

  // =========================================================================
  // HYPERTROPHY  - broader primary pool, machines elevated
  // =========================================================================
  hypertrophy: {
    // Primary: all key compounds + machines for volume
    'bench-press': 'primary',
    'incline-bench-press': 'primary',
    'dumbbell-bench-press': 'primary',
    'incline-dumbbell-press': 'primary',
    'machine-chest-press': 'primary',
    'incline-machine-press': 'primary',
    'squat': 'primary',
    'leg-press': 'primary',
    'hack-squat': 'primary',
    'belt-squat': 'primary',
    'deadlift': 'primary',
    'romanian-deadlift': 'primary',
    'hip-thrust': 'primary',
    'hip-thrust-machine': 'primary',
    'overhead-press': 'primary',
    'dumbbell-shoulder-press': 'primary',
    'machine-shoulder-press': 'primary',
    'arnold-press': 'primary',
    'barbell-row': 'primary',
    'dumbbell-row': 'primary',
    'seated-row': 'primary',
    'machine-row': 'primary',
    'pendulum-row': 'primary',
    'pull-up': 'primary',
    'lat-pulldown': 'primary',
    'chin-up': 'primary',
    'dip': 'primary',
    'weighted-dip': 'primary',
    'bulgarian-split-squat': 'primary',

    // Secondary: isolation targeting lagging muscles
    'cable-fly': 'secondary',
    'chest-fly': 'secondary',
    'pec-deck': 'secondary',
    'lateral-raise': 'secondary',
    'cable-lateral-raise': 'secondary',
    'machine-lateral-raise': 'secondary',
    'rear-delt-fly': 'secondary',
    'reverse-pec-deck': 'secondary',
    'face-pull': 'secondary',
    'leg-extension': 'secondary',
    'leg-curl': 'secondary',
    'seated-leg-curl': 'secondary',
    'leg-press-close-stance': 'secondary',
    'bicep-curl': 'secondary',
    'hammer-curl': 'secondary',
    'barbell-curl': 'secondary',
    'ez-bar-curl': 'secondary',
    'preacher-curl': 'secondary',
    'spider-curl': 'secondary',
    'cable-curl': 'secondary',
    'preacher-curl-machine': 'secondary',
    'incline-dumbbell-curl': 'secondary',
    'tricep-pushdown': 'secondary',
    'rope-pushdown': 'secondary',
    'overhead-tricep-extension': 'secondary',
    'overhead-cable-tricep-extension': 'secondary',
    'skull-crusher': 'secondary',
    'close-grip-bench-press': 'secondary',
    'tricep-dip': 'secondary',
    'tricep-dip-machine': 'secondary',
    'calf-raise': 'secondary',
    'standing-calf-raise': 'secondary',
    'seated-calf-raise': 'secondary',
    'hip-adduction': 'secondary',
    'hip-abduction': 'secondary',
    'chest-supported-row': 'secondary',
    'close-grip-pulldown': 'secondary',
    'wide-grip-pulldown': 'secondary',
    'straight-arm-pulldown': 'secondary',
    'single-arm-lat-pulldown': 'secondary',
    'neutral-grip-pulldown': 'secondary',

    // Tertiary: specialty & niche
    'decline-bench-press': 'tertiary',
    'decline-dumbbell-press': 'tertiary',
    'svend-press': 'tertiary',
    'front-squat': 'tertiary',
    'smith-machine-squat': 'tertiary',
    'sumo-deadlift': 'tertiary',
    'trap-bar-deadlift': 'tertiary',
    'wrist-curl': 'tertiary',
    'reverse-wrist-curl': 'tertiary',
    'reverse-barbell-curl': 'tertiary',
    'plate-pinch-hold': 'tertiary',
    'concentration-curl': 'tertiary',
    'cross-body-curl': 'tertiary',
    'kickback': 'tertiary',
    'shrugs': 'tertiary',
    'barbell-shrugs': 'tertiary',
    'upright-row': 'tertiary',
    'front-raise': 'tertiary',
    'cable-front-raise': 'tertiary',
    'lu-raise': 'tertiary',
    'donkey-calf-raise': 'tertiary',
    'single-leg-calf-raise': 'tertiary',
    'calf-press-leg-press': 'tertiary',
    'tibialis-raise': 'tertiary',
    'glute-kickback': 'tertiary',
  },

  // =========================================================================
  // FAT_LOSS  - supersetable compounds first, metabolic movements second
  // =========================================================================
  fat_loss: {
    // Primary: supersetable compounds & metabolic movements
    'squat': 'primary',
    'deadlift': 'primary',
    'bench-press': 'primary',
    'barbell-row': 'primary',
    'dumbbell-bench-press': 'primary',
    'dumbbell-row': 'primary',
    'overhead-press': 'primary',
    'dumbbell-shoulder-press': 'primary',
    'pull-up': 'primary',
    'lat-pulldown': 'primary',
    'leg-press': 'primary',
    'hip-thrust': 'primary',
    'dip': 'primary',
    'bulgarian-split-squat': 'primary',
    'goblet-squat': 'primary',
    'lunges': 'primary',
    'walking-lunges': 'primary',
    'kettlebell-swing': 'primary',
    'thruster': 'primary',
    'burpee': 'primary',
    'sled-push': 'primary',
    'battle-rope': 'primary',
    'clean-and-press': 'primary',
    'push-up': 'primary',
    'mountain-climber': 'primary',

    // Secondary: metabolic / supersetable isolation
    'machine-chest-press': 'secondary',
    'machine-row': 'secondary',
    'machine-shoulder-press': 'secondary',
    'hack-squat': 'secondary',
    'belt-squat': 'secondary',
    'seated-row': 'secondary',
    'chin-up': 'secondary',
    'cable-row': 'secondary',
    'reverse-lunges': 'secondary',
    'step-up': 'secondary',
    'farmers-carry': 'secondary',
    'suitcase-carry': 'secondary',
    'wall-ball': 'secondary',
    'romanian-deadlift': 'secondary',
    'trap-bar-deadlift': 'secondary',
    'inverted-row': 'secondary',
    'close-grip-bench-press': 'secondary',
    'running': 'secondary',
    'cycling': 'secondary',
    'rowing': 'secondary',

    // Tertiary: isolation (used sparingly for active recovery sets)
    'lateral-raise': 'tertiary',
    'face-pull': 'tertiary',
    'bicep-curl': 'tertiary',
    'tricep-pushdown': 'tertiary',
    'cable-fly': 'tertiary',
    'leg-curl': 'tertiary',
    'leg-extension': 'tertiary',
    'calf-raise': 'tertiary',
    'plank': 'tertiary',
    'hanging-leg-raise': 'tertiary',
    'cable-crunch': 'tertiary',
  },

  // =========================================================================
  // GENERAL_FITNESS  - functional compounds, machines secondary, isolation last
  // =========================================================================
  general_fitness: {
    // Primary: functional compounds for balanced fitness
    'squat': 'primary',
    'deadlift': 'primary',
    'bench-press': 'primary',
    'overhead-press': 'primary',
    'barbell-row': 'primary',
    'dumbbell-bench-press': 'primary',
    'dumbbell-shoulder-press': 'primary',
    'dumbbell-row': 'primary',
    'pull-up': 'primary',
    'lat-pulldown': 'primary',
    'hip-thrust': 'primary',
    'romanian-deadlift': 'primary',
    'lunges': 'primary',
    'bulgarian-split-squat': 'primary',
    'goblet-squat': 'primary',
    'push-up': 'primary',
    'dip': 'primary',
    'chin-up': 'primary',
    'kettlebell-swing': 'primary',
    'farmers-carry': 'primary',
    'plank': 'primary',

    // Secondary: machines & supplementary
    'machine-chest-press': 'secondary',
    'incline-machine-press': 'secondary',
    'machine-shoulder-press': 'secondary',
    'machine-row': 'secondary',
    'pendulum-row': 'secondary',
    'leg-press': 'secondary',
    'hack-squat': 'secondary',
    'belt-squat': 'secondary',
    'hip-thrust-machine': 'secondary',
    'seated-row': 'secondary',
    'cable-row': 'secondary',
    'chest-supported-row': 'secondary',
    'incline-bench-press': 'secondary',
    'incline-dumbbell-press': 'secondary',
    'front-squat': 'secondary',
    'trap-bar-deadlift': 'secondary',
    'dumbbell-rdl': 'secondary',
    'walking-lunges': 'secondary',
    'reverse-lunges': 'secondary',
    'step-up': 'secondary',
    'close-grip-pulldown': 'secondary',
    'wide-grip-pulldown': 'secondary',
    'arnold-press': 'secondary',
    'lateral-raise': 'secondary',
    'face-pull': 'secondary',
    'rear-delt-fly': 'secondary',
    'leg-curl': 'secondary',
    'leg-extension': 'secondary',
    'running': 'secondary',
    'cycling': 'secondary',
    'rowing': 'secondary',
    'sled-push': 'secondary',

    // Tertiary: isolation & specialty
    'bicep-curl': 'tertiary',
    'hammer-curl': 'tertiary',
    'barbell-curl': 'tertiary',
    'tricep-pushdown': 'tertiary',
    'rope-pushdown': 'tertiary',
    'overhead-tricep-extension': 'tertiary',
    'skull-crusher': 'tertiary',
    'cable-fly': 'tertiary',
    'chest-fly': 'tertiary',
    'pec-deck': 'tertiary',
    'cable-lateral-raise': 'tertiary',
    'machine-lateral-raise': 'tertiary',
    'reverse-pec-deck': 'tertiary',
    'calf-raise': 'tertiary',
    'seated-calf-raise': 'tertiary',
    'standing-calf-raise': 'tertiary',
    'hanging-leg-raise': 'tertiary',
    'cable-crunch': 'tertiary',
    'ab-wheel': 'tertiary',
    'wrist-curl': 'tertiary',
    'reverse-wrist-curl': 'tertiary',
    'hip-adduction': 'tertiary',
    'hip-abduction': 'tertiary',
    'shrugs': 'tertiary',
    'glute-kickback': 'tertiary',
  },
};

// ---------------------------------------------------------------------------
// Lookup helper
// ---------------------------------------------------------------------------

/**
 * Returns the goal tier for a given exercise. Exercises not listed under a
 * goal default to 'tertiary'.
 */
export function getGoalTier(exerciseId: string, goal: string): GoalTier {
  const goalMap = GOAL_TIERS[goal];
  if (!goalMap) return 'tertiary';
  return goalMap[exerciseId] ?? 'tertiary';
}

/**
 * Returns all exercise IDs for a given goal at a specific tier.
 */
export function getExercisesByGoalTier(goal: string, tier: GoalTier): string[] {
  const goalMap = GOAL_TIERS[goal];
  if (!goalMap) return [];
  return Object.entries(goalMap)
    .filter(([, t]) => t === tier)
    .map(([id]) => id);
}
