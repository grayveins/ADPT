/**
 * MuscleMap
 * 
 * Visual body outline showing muscle group training frequency/volume.
 * Inspired by Fitbod's muscle recovery view.
 * 
 * Uses a simplified front-view body silhouette with colored regions.
 */

import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, { Path, Circle, Ellipse, Rect, G } from "react-native-svg";

import { useTheme } from "@/src/context/ThemeContext";

export type MuscleGroupData = {
  chest: number;     // 0-100 representing training volume/frequency
  back: number;
  shoulders: number;
  arms: number;
  core: number;
  legs: number;
};

type MuscleMapProps = {
  data: MuscleGroupData;
  size?: number;
};

// Get color based on training intensity (0-100)
const getIntensityColor = (value: number, colors: ReturnType<typeof useTheme>["colors"]) => {
  if (value === 0) return colors.border;
  if (value < 30) return colors.primaryFaint;
  if (value < 60) return colors.primaryMuted;
  if (value < 80) return `rgba(0, 201, 183, 0.5)`;
  return colors.primary;
};

export const MuscleMap: React.FC<MuscleMapProps> = ({ data, size = 200 }) => {
  const { colors } = useTheme();
  
  const muscleColors = useMemo(() => ({
    chest: getIntensityColor(data.chest, colors),
    back: getIntensityColor(data.back, colors),
    shoulders: getIntensityColor(data.shoulders, colors),
    arms: getIntensityColor(data.arms, colors),
    core: getIntensityColor(data.core, colors),
    legs: getIntensityColor(data.legs, colors),
  }), [data, colors]);

  const scale = size / 200;

  return (
    <View style={styles.container}>
      <Svg width={size} height={size * 1.4} viewBox="0 0 200 280">
        {/* Head */}
        <Circle 
          cx="100" 
          cy="25" 
          r="20" 
          fill={colors.bgSecondary}
          stroke={colors.border}
          strokeWidth="1"
        />
        
        {/* Neck */}
        <Rect
          x="92"
          y="42"
          width="16"
          height="12"
          fill={colors.bgSecondary}
        />

        {/* Shoulders - Left */}
        <Ellipse
          cx="60"
          cy="60"
          rx="18"
          ry="12"
          fill={muscleColors.shoulders}
        />
        
        {/* Shoulders - Right */}
        <Ellipse
          cx="140"
          cy="60"
          rx="18"
          ry="12"
          fill={muscleColors.shoulders}
        />

        {/* Chest / Upper torso */}
        <Path
          d="M 70 54 Q 100 48 130 54 L 135 95 Q 100 105 65 95 Z"
          fill={muscleColors.chest}
        />

        {/* Core / Abs */}
        <Path
          d="M 70 95 Q 100 105 130 95 L 125 150 Q 100 155 75 150 Z"
          fill={muscleColors.core}
        />

        {/* Left Arm - Upper */}
        <Path
          d="M 45 58 L 35 105 Q 30 110 35 115 L 55 70 Q 50 60 45 58"
          fill={muscleColors.arms}
        />
        
        {/* Left Arm - Lower */}
        <Path
          d="M 35 115 L 25 155 Q 22 162 30 165 L 45 125 Q 38 118 35 115"
          fill={muscleColors.arms}
        />

        {/* Right Arm - Upper */}
        <Path
          d="M 155 58 L 165 105 Q 170 110 165 115 L 145 70 Q 150 60 155 58"
          fill={muscleColors.arms}
        />
        
        {/* Right Arm - Lower */}
        <Path
          d="M 165 115 L 175 155 Q 178 162 170 165 L 155 125 Q 162 118 165 115"
          fill={muscleColors.arms}
        />

        {/* Left Leg - Upper (Quad) */}
        <Path
          d="M 75 150 L 65 210 Q 62 218 70 220 L 95 155 Q 85 152 75 150"
          fill={muscleColors.legs}
        />
        
        {/* Left Leg - Lower */}
        <Path
          d="M 70 220 L 60 270 Q 58 278 68 280 L 82 225 Q 75 222 70 220"
          fill={muscleColors.legs}
        />

        {/* Right Leg - Upper (Quad) */}
        <Path
          d="M 125 150 L 135 210 Q 138 218 130 220 L 105 155 Q 115 152 125 150"
          fill={muscleColors.legs}
        />
        
        {/* Right Leg - Lower */}
        <Path
          d="M 130 220 L 140 270 Q 142 278 132 280 L 118 225 Q 125 222 130 220"
          fill={muscleColors.legs}
        />

        {/* Body outline for definition */}
        <Path
          d="M 45 58 Q 50 50 70 48 Q 100 42 130 48 Q 150 50 155 58 
             L 165 105 Q 170 110 165 115 L 175 155 Q 178 162 170 165
             L 145 70 Q 140 55 140 60 L 135 95 L 125 150 
             L 135 210 Q 138 218 130 220 L 140 270 Q 142 278 132 280
             L 118 225 L 105 155 Q 100 155 95 155 L 82 225 
             L 68 280 Q 58 278 60 270 L 70 220 Q 62 218 65 210
             L 75 150 L 65 95 L 60 60 Q 60 55 60 70 L 55 70
             L 35 115 Q 30 110 35 105 L 25 155 Q 22 162 30 165 L 45 125
             L 45 58"
          fill="none"
          stroke={colors.border}
          strokeWidth="1"
          opacity={0.5}
        />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
});

export default MuscleMap;
