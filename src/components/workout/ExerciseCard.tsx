/**
 * ExerciseCard
 * Exercise with sets, video thumbnail, and completion state
 */

import React, { useState } from "react";
import { StyleSheet, View, Text, Pressable, Image } from "react-native";
import Animated, {
  useAnimatedStyle,
  withSpring,
  withTiming,
  useSharedValue,
  FadeIn,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { darkColors, theme } from "@/src/theme";
import { AnimatedSetRow } from "./AnimatedSetRow";
import { MicroConfetti } from "@/src/animations/components/Confetti";
import { showToast } from "@/src/animations/celebrations";
import { SPRING_CONFIG } from "@/src/animations/constants";

type Set = {
  weight: string;
  reps: string;
  completed: boolean;
};

type ExerciseCardProps = {
  name: string;
  muscles: string[];
  sets: Set[];
  targetSets: number;
  targetReps: number;
  targetRIR: number;
  videoThumbnail?: string;
  previousBest?: { weight: string; reps: string };
  onSetComplete: (setIndex: number) => void;
  onSetUpdate: (setIndex: number, field: "weight" | "reps", value: string) => void;
};

export const ExerciseCard: React.FC<ExerciseCardProps> = ({
  name,
  muscles,
  sets,
  targetSets,
  targetReps,
  targetRIR,
  videoThumbnail,
  previousBest,
  onSetComplete,
  onSetUpdate,
}) => {
  const [expanded, setExpanded] = useState(true);
  const [showExerciseConfetti, setShowExerciseConfetti] = useState(false);
  
  const completedSets = sets.filter((s) => s.completed).length;
  const isComplete = completedSets === sets.length;
  
  const rotation = useSharedValue(0);
  const headerGlow = useSharedValue(0);

  const handleToggleExpand = () => {
    rotation.value = withSpring(expanded ? 180 : 0, SPRING_CONFIG.snappy);
    setExpanded(!expanded);
  };

  const handleSetComplete = (index: number) => {
    onSetComplete(index);
    
    // Check if this completes the exercise
    const newCompletedCount = sets.filter((s, i) => s.completed || i === index).length;
    if (newCompletedCount === sets.length) {
      // Exercise complete!
      setShowExerciseConfetti(true);
      setTimeout(() => setShowExerciseConfetti(false), 1500);
      showToast({ type: "exerciseComplete" });
      
      // Glow header
      headerGlow.value = withTiming(0.3, { duration: 200 }, () => {
        headerGlow.value = withTiming(0, { duration: 500 });
      });
    }
  };

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const headerGlowStyle = useAnimatedStyle(() => ({
    backgroundColor: `rgba(0, 199, 190, ${headerGlow.value})`,
  }));

  return (
    <Animated.View 
      entering={FadeIn.duration(300)}
      style={[styles.container, isComplete && styles.containerComplete]}
    >
      {/* Exercise Confetti */}
      <MicroConfetti
        active={showExerciseConfetti}
        origin={{ x: 100, y: 30 }}
      />

      {/* Header */}
      <Pressable onPress={handleToggleExpand}>
        <Animated.View style={[styles.header, headerGlowStyle]}>
          {/* Video thumbnail */}
          <View style={styles.thumbnail}>
            {videoThumbnail ? (
              <Image source={{ uri: videoThumbnail }} style={styles.thumbnailImage} />
            ) : (
              <Ionicons name="barbell" size={24} color={darkColors.muted} />
            )}
          </View>

          {/* Exercise info */}
          <View style={styles.headerInfo}>
            <View style={styles.nameRow}>
              <Text allowFontScaling={false} style={styles.name}>
                {name}
              </Text>
              {isComplete && (
                <View style={styles.completeBadge}>
                  <Text allowFontScaling={false} style={styles.completeBadgeText}>
                    COMPLETE
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.musclesRow}>
              {muscles.map((muscle, i) => (
                <View key={muscle} style={styles.muscleTag}>
                  <Text allowFontScaling={false} style={styles.muscleText}>
                    {muscle}
                  </Text>
                </View>
              ))}
            </View>
            <Text allowFontScaling={false} style={styles.targetText}>
              {targetSets} sets × {targetReps} reps × {targetRIR} RIR
            </Text>
          </View>

          {/* Progress & chevron */}
          <View style={styles.headerRight}>
            <Text allowFontScaling={false} style={styles.progress}>
              {completedSets}/{sets.length}
            </Text>
            <Animated.View style={chevronStyle}>
              <Ionicons name="chevron-down" size={20} color={darkColors.muted} />
            </Animated.View>
          </View>
        </Animated.View>
      </Pressable>

      {/* Sets */}
      {expanded && (
        <View style={styles.setsContainer}>
          {sets.map((set, index) => (
            <AnimatedSetRow
              key={index}
              setNumber={index + 1}
              weight={set.weight}
              reps={set.reps}
              completed={set.completed}
              previousWeight={previousBest?.weight}
              previousReps={previousBest?.reps}
              onComplete={() => handleSetComplete(index)}
              onWeightChange={(value) => onSetUpdate(index, "weight", value)}
              onRepsChange={(value) => onSetUpdate(index, "reps", value)}
            />
          ))}
        </View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: darkColors.card,
    borderRadius: 16,
    marginBottom: 16,
    overflow: "hidden",
  },
  containerComplete: {
    borderColor: darkColors.primary,
    borderWidth: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },
  thumbnail: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: darkColors.border,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  thumbnailImage: {
    width: "100%",
    height: "100%",
  },
  headerInfo: {
    flex: 1,
    gap: 4,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  name: {
    color: darkColors.text,
    fontSize: 16,
    fontFamily: theme.fonts.bodySemiBold,
  },
  completeBadge: {
    backgroundColor: darkColors.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  completeBadgeText: {
    color: "#000",
    fontSize: 10,
    fontFamily: theme.fonts.bodySemiBold,
  },
  musclesRow: {
    flexDirection: "row",
    gap: 6,
  },
  muscleTag: {
    backgroundColor: darkColors.selectedBg,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  muscleText: {
    color: darkColors.primary,
    fontSize: 11,
    fontFamily: theme.fonts.bodyMedium,
  },
  targetText: {
    color: darkColors.muted,
    fontSize: 12,
    fontFamily: theme.fonts.body,
  },
  headerRight: {
    alignItems: "center",
    gap: 4,
  },
  progress: {
    color: darkColors.text,
    fontSize: 14,
    fontFamily: theme.fonts.bodySemiBold,
  },
  setsContainer: {
    padding: 12,
    paddingTop: 0,
  },
});

export default ExerciseCard;
