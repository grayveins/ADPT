/**
 * Muscle Image Constants
 *
 * Maps muscle names used in ExerciseInfo to their corresponding body images.
 * Each image shows a full body silhouette with the target muscle highlighted in teal.
 */

// Muscle image assets
export const MUSCLE_IMAGES = {
  chest: require("@/assets/muscles/chest.webp"),
  "front-delts": require("@/assets/muscles/front-delts.webp"),
  "rear-delts": require("@/assets/muscles/rear-delts.webp"),
  biceps: require("@/assets/muscles/biceps.webp"),
  triceps: require("@/assets/muscles/triceps.webp"),
  abs: require("@/assets/muscles/abs.webp"),
  obliques: require("@/assets/muscles/obliques.webp"),
  quads: require("@/assets/muscles/quads.webp"),
  lats: require("@/assets/muscles/lats.webp"),
  lowerback: require("@/assets/muscles/lowerback.webp"),
  glutes: require("@/assets/muscles/glutes.webp"),
  hamstrings: require("@/assets/muscles/hamstrings.webp"),
  calves: require("@/assets/muscles/calves.webp"),
};

// Body silhouettes (gray, no muscle highlighted)
export const BODY_SILHOUETTES = {
  front: require("@/assets/muscles/body-front.webp"),
  back: require("@/assets/muscles/body-back.webp"),
};

export type MuscleImageKey = keyof typeof MUSCLE_IMAGES;

export type MuscleConfig = {
  image: MuscleImageKey;
  view: "front" | "back";
  label: string;
};

/**
 * Maps muscle names (as used in ExerciseInfo) to their image configuration.
 * Keys are lowercase for case-insensitive matching.
 */
export const MUSCLE_CONFIG: Record<string, MuscleConfig> = {
  // Chest
  chest: { image: "chest", view: "front", label: "Chest" },
  "upper chest": { image: "chest", view: "front", label: "Upper Chest" },

  // Shoulders
  shoulders: { image: "front-delts", view: "front", label: "Shoulders" },
  "front delts": { image: "front-delts", view: "front", label: "Front Delts" },
  "side delts": { image: "front-delts", view: "front", label: "Side Delts" },
  "rear delts": { image: "rear-delts", view: "back", label: "Rear Delts" },

  // Arms
  biceps: { image: "biceps", view: "front", label: "Biceps" },
  triceps: { image: "triceps", view: "back", label: "Triceps" },
  forearms: { image: "biceps", view: "front", label: "Forearms" }, // Combined with biceps

  // Back
  back: { image: "lats", view: "back", label: "Back" },
  lats: { image: "lats", view: "back", label: "Lats" },
  "upper back": { image: "lats", view: "back", label: "Upper Back" },
  traps: { image: "lats", view: "back", label: "Traps" }, // Combined with lats
  rhomboids: { image: "lats", view: "back", label: "Rhomboids" },
  "lower back": { image: "lowerback", view: "back", label: "Lower Back" },

  // Core
  core: { image: "abs", view: "front", label: "Core" },
  abs: { image: "abs", view: "front", label: "Abs" },
  obliques: { image: "obliques", view: "front", label: "Obliques" },

  // Legs
  quads: { image: "quads", view: "front", label: "Quads" },
  hamstrings: { image: "hamstrings", view: "back", label: "Hamstrings" },
  glutes: { image: "glutes", view: "back", label: "Glutes" },
  calves: { image: "calves", view: "back", label: "Calves" },
  legs: { image: "quads", view: "front", label: "Legs" }, // Generic legs -> quads

  // Special
  "hip flexors": { image: "quads", view: "front", label: "Hip Flexors" },
  "rotator cuff": { image: "rear-delts", view: "back", label: "Rotator Cuff" },
  heart: { image: "chest", view: "front", label: "Heart" }, // Cardio
  "full body": { image: "chest", view: "front", label: "Full Body" },
};

/**
 * Get muscle configuration by name (case-insensitive)
 */
export function getMuscleConfig(muscleName: string): MuscleConfig | null {
  const normalized = muscleName.toLowerCase().trim();
  return MUSCLE_CONFIG[normalized] || null;
}

/**
 * Get the image source for a muscle
 */
export function getMuscleImage(muscleName: string) {
  const config = getMuscleConfig(muscleName);
  if (!config) return null;
  return MUSCLE_IMAGES[config.image];
}

/**
 * Get the body silhouette for a muscle's view (front or back)
 */
export function getBodySilhouette(muscleName: string) {
  const config = getMuscleConfig(muscleName);
  if (!config) return BODY_SILHOUETTES.front;
  return config.view === "front" ? BODY_SILHOUETTES.front : BODY_SILHOUETTES.back;
}
