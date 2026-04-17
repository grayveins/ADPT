/**
 * MuscleImage Component
 *
 * Displays a body image with the specified muscle highlighted.
 * Each muscle image is a complete body silhouette with that muscle highlighted in teal.
 */

import React from "react";
import { View, Image, StyleSheet, ViewStyle, ImageStyle } from "react-native";
import {
  getMuscleImage,
  getMuscleConfig,
} from "@/src/constants/muscles";

type MuscleImageProps = {
  /** The muscle name (e.g., "Chest", "Back", "Quads") */
  muscle: string;
  /** Width/height of the image (images are square) */
  size?: number;
  /** Additional container styles */
  style?: ViewStyle;
  /** Additional image styles */
  imageStyle?: ImageStyle;
};

/**
 * Displays the body image with the specified muscle highlighted.
 * Returns null if the muscle is not found in the mapping.
 */
export function MuscleImage({
  muscle,
  size = 120,
  style,
  imageStyle,
}: MuscleImageProps) {
  const imageSource = getMuscleImage(muscle);
  const config = getMuscleConfig(muscle);

  if (!imageSource || !config) {
    return null;
  }

  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      <Image
        source={imageSource}
        style={[
          styles.image,
          { width: size, height: size },
          imageStyle,
        ]}
        resizeMode="contain"
      />
    </View>
  );
}

type MuscleGroupDisplayProps = {
  /** Primary muscles to display (shown larger) */
  primaryMuscles: string[];
  /** Secondary muscles to display (shown smaller) */
  secondaryMuscles?: string[];
  /** Size of primary muscle image */
  primarySize?: number;
  /** Size of secondary muscle images */
  secondarySize?: number;
  /** Container style */
  style?: ViewStyle;
};

/**
 * Displays primary and secondary muscle images for an exercise.
 * - Primary muscle is shown large
 * - Secondary muscles are shown as smaller thumbnails below
 */
export function MuscleGroupDisplay({
  primaryMuscles,
  secondaryMuscles = [],
  primarySize = 140,
  secondarySize = 60,
  style,
}: MuscleGroupDisplayProps) {
  // Get unique muscles (deduplicated)
  const primaryMuscle = primaryMuscles[0];
  const primaryConfig = getMuscleConfig(primaryMuscle);
  
  // Filter secondary muscles that have different images than the primary
  const uniqueSecondaryMuscles = secondaryMuscles.filter((muscle) => {
    const config = getMuscleConfig(muscle);
    return config && config.image !== primaryConfig?.image;
  });

  // Deduplicate secondary muscles by their image key
  const seenImages = new Set<string>();
  const dedupedSecondaryMuscles = uniqueSecondaryMuscles.filter((muscle) => {
    const config = getMuscleConfig(muscle);
    if (!config || seenImages.has(config.image)) return false;
    seenImages.add(config.image);
    return true;
  });

  if (!primaryMuscle || !primaryConfig) {
    return null;
  }

  return (
    <View style={[styles.groupContainer, style]}>
      {/* Primary muscle - large */}
      <MuscleImage muscle={primaryMuscle} size={primarySize} />

      {/* Secondary muscles - small thumbnails */}
      {dedupedSecondaryMuscles.length > 0 && (
        <View style={styles.secondaryRow}>
          {dedupedSecondaryMuscles.map((muscle) => (
            <MuscleImage
              key={muscle}
              muscle={muscle}
              size={secondarySize}
              style={styles.secondaryImage}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  image: {
    // Image fills container
  },
  groupContainer: {
    alignItems: "center",
  },
  secondaryRow: {
    flexDirection: "row",
    marginTop: 8,
    gap: 8,
  },
  secondaryImage: {
    opacity: 0.8,
  },
});

export default MuscleImage;
