/**
 * SkeletonLoader
 * Shimmer skeleton placeholders for loading states
 */

import React, { useEffect } from "react";
import { StyleSheet, View, ViewStyle } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
  Easing,
} from "react-native-reanimated";
import { useTheme } from "@/src/context/ThemeContext";

type SkeletonProps = {
  width?: number | `${number}%`;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
};

/** Single shimmer bone */
export const Skeleton: React.FC<SkeletonProps> = ({
  width = "100%",
  height = 16,
  borderRadius = 8,
  style,
}) => {
  const { colors } = useTheme();
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const shimmerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.5, 1], [0.3, 0.6, 0.3]),
  }));

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: colors.border,
        },
        shimmerStyle,
        style,
      ]}
    />
  );
};

/** Skeleton matching the Home dashboard layout */
export const HomeSkeleton: React.FC = () => {
  const { colors } = useTheme();
  return (
    <View style={skeletonStyles.container}>
      {/* Coach message */}
      <Skeleton width="80%" height={14} style={{ marginBottom: 6 }} />
      <Skeleton width="60%" height={14} style={{ marginBottom: 24 }} />

      {/* Week progress */}
      <View style={[skeletonStyles.card, { backgroundColor: colors.card }]}>
        <View style={skeletonStyles.weekRow}>
          {[...Array(7)].map((_, i) => (
            <Skeleton key={i} width={36} height={36} borderRadius={18} />
          ))}
        </View>
        <Skeleton width="50%" height={10} style={{ marginTop: 12 }} />
        <Skeleton width="100%" height={6} borderRadius={3} style={{ marginTop: 8 }} />
      </View>

      {/* Hero workout card */}
      <View style={[skeletonStyles.heroCard, { backgroundColor: colors.card }]}>
        <Skeleton width="40%" height={12} style={{ marginBottom: 8 }} />
        <Skeleton width="70%" height={22} style={{ marginBottom: 16 }} />
        <Skeleton width="100%" height={14} style={{ marginBottom: 8 }} />
        <Skeleton width="85%" height={14} style={{ marginBottom: 8 }} />
        <Skeleton width="60%" height={14} style={{ marginBottom: 20 }} />
        <Skeleton width="100%" height={52} borderRadius={26} />
      </View>

      {/* Quick actions */}
      <View style={skeletonStyles.actionsRow}>
        <Skeleton width="48%" height={56} borderRadius={12} />
        <Skeleton width="48%" height={56} borderRadius={12} />
      </View>
    </View>
  );
};

/** Skeleton matching the Progress tab layout */
export const ProgressSkeleton: React.FC = () => {
  const { colors } = useTheme();
  return (
    <View style={skeletonStyles.container}>
      {/* Strength Score */}
      <View style={[skeletonStyles.card, { backgroundColor: colors.card, alignItems: "center" }]}>
        <Skeleton width={120} height={120} borderRadius={60} style={{ marginBottom: 12 }} />
        <Skeleton width="40%" height={16} style={{ marginBottom: 6 }} />
        <Skeleton width="30%" height={12} />
      </View>

      {/* Streak */}
      <View style={[skeletonStyles.card, { backgroundColor: colors.card }]}>
        <View style={skeletonStyles.row}>
          <Skeleton width={32} height={32} borderRadius={16} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Skeleton width="50%" height={16} style={{ marginBottom: 6 }} />
            <Skeleton width="30%" height={12} />
          </View>
        </View>
      </View>

      {/* PRs */}
      <View style={[skeletonStyles.card, { backgroundColor: colors.card }]}>
        <Skeleton width="30%" height={14} style={{ marginBottom: 16 }} />
        <View style={skeletonStyles.row}>
          <Skeleton width="48%" height={60} borderRadius={8} />
          <Skeleton width="48%" height={60} borderRadius={8} />
        </View>
      </View>

      {/* Heatmap */}
      <View style={[skeletonStyles.card, { backgroundColor: colors.card }]}>
        <Skeleton width="35%" height={14} style={{ marginBottom: 12 }} />
        <Skeleton width="100%" height={80} borderRadius={8} />
      </View>
    </View>
  );
};

/** Skeleton for workout history list */
export const HistorySkeleton: React.FC = () => {
  const { colors } = useTheme();
  return (
    <View style={skeletonStyles.container}>
      {[...Array(4)].map((_, i) => (
        <View key={i} style={[skeletonStyles.card, { backgroundColor: colors.card }]}>
          <View style={skeletonStyles.row}>
            <View style={{ flex: 1 }}>
              <Skeleton width="60%" height={16} style={{ marginBottom: 8 }} />
              <Skeleton width="40%" height={12} />
            </View>
            <Skeleton width={50} height={24} borderRadius={12} />
          </View>
          <View style={[skeletonStyles.row, { marginTop: 12 }]}>
            <Skeleton width="25%" height={10} />
            <Skeleton width="25%" height={10} />
            <Skeleton width="25%" height={10} />
          </View>
        </View>
      ))}
    </View>
  );
};

/** Skeleton for workout tab */
export const WorkoutSkeleton: React.FC = () => {
  const { colors } = useTheme();
  return (
    <View style={skeletonStyles.container}>
      {/* Program header */}
      <View style={[skeletonStyles.card, { backgroundColor: colors.card }]}>
        <Skeleton width="45%" height={14} style={{ marginBottom: 8 }} />
        <Skeleton width="70%" height={20} style={{ marginBottom: 12 }} />
        <Skeleton width="100%" height={8} borderRadius={4} />
      </View>

      {/* Planned workouts */}
      {[...Array(3)].map((_, i) => (
        <View key={i} style={[skeletonStyles.card, { backgroundColor: colors.card }]}>
          <View style={skeletonStyles.row}>
            <Skeleton width={44} height={44} borderRadius={22} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Skeleton width="55%" height={16} style={{ marginBottom: 6 }} />
              <Skeleton width="35%" height={12} />
            </View>
          </View>
        </View>
      ))}
    </View>
  );
};

const skeletonStyles = StyleSheet.create({
  container: {
    padding: 20,
    gap: 16,
  },
  card: {
    borderRadius: 16,
    padding: 16,
  },
  heroCard: {
    borderRadius: 20,
    padding: 24,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  weekRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
});
