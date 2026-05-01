/**
 * Camera overlay: thin guide lines positioned over the live preview so the
 * client can align eyes and hips consistently across photos.
 */

import React from "react";
import { StyleSheet, Text, View } from "react-native";

import type { ProgressPose } from "@/src/lib/progressPhotos";

const LINE_COLOR = "rgba(255, 255, 255, 0.7)";
const LABEL_COLOR = "rgba(255, 255, 255, 0.85)";
const ACCENT_COLOR = "#FF8A1A"; // single warm accent for the active pose label

const POSE_LABELS: Record<ProgressPose, string> = {
  front: "Front",
  side_left: "Side",
  side_right: "Side",
  back: "Back",
  other: "Other",
};

const TOP_LABEL: Record<ProgressPose, string> = {
  front: "Nose",
  side_left: "Center of head",
  side_right: "Center of head",
  back: "Center of head",
  other: "",
};

const HORIZONTAL_LINE_LABEL_TOP: Record<ProgressPose, string> = {
  front: "Eyes",
  side_left: "Eyes",
  side_right: "Eyes",
  back: "Ears",
  other: "",
};

export function PoseGuideOverlay({ pose }: { pose: ProgressPose }) {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {/* Top-left active pose label */}
      <View style={styles.topLeft}>
        <Text style={[styles.poseLabel, { color: ACCENT_COLOR }]}>
          {POSE_LABELS[pose]}
        </Text>
      </View>

      {/* Top-center label (Nose / Center of head) */}
      {TOP_LABEL[pose] && (
        <View style={styles.topCenter}>
          <Text style={styles.guideLabel}>{TOP_LABEL[pose]}</Text>
        </View>
      )}

      {/* Vertical centerline */}
      <View style={styles.verticalLine} />

      {/* Eyes / Ears horizontal line */}
      <View style={styles.eyesContainer}>
        <Text style={styles.guideLabelLeft}>{HORIZONTAL_LINE_LABEL_TOP[pose]}</Text>
        <View style={styles.horizontalLine} />
      </View>

      {/* Hip horizontal line */}
      <View style={styles.hipContainer}>
        <Text style={styles.guideLabelLeft}>Hip</Text>
        <View style={styles.horizontalLine} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  topLeft: {
    position: "absolute",
    top: 12,
    left: 16,
  },
  topCenter: {
    position: "absolute",
    top: 12,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  poseLabel: {
    fontSize: 16,
    fontWeight: "600",
  },
  guideLabel: {
    color: LABEL_COLOR,
    fontSize: 13,
  },
  guideLabelLeft: {
    color: LABEL_COLOR,
    fontSize: 13,
    paddingHorizontal: 12,
  },
  verticalLine: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: "50%",
    width: StyleSheet.hairlineWidth + 0.5,
    backgroundColor: LINE_COLOR,
  },
  eyesContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    top: "30%",
    flexDirection: "row",
    alignItems: "center",
  },
  hipContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: "30%",
    flexDirection: "row",
    alignItems: "center",
  },
  horizontalLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth + 0.5,
    backgroundColor: LINE_COLOR,
  },
});
