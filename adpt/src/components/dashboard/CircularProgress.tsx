import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";

import { darkColors } from "@/src/theme";

type CircularProgressProps = {
  current: number;
  target: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
};

export default function CircularProgress({
  current,
  target,
  size = 200,
  strokeWidth = 12,
  label = "workouts",
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(current / target, 1);
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <View style={styles.container}>
      <Svg width={size} height={size} style={styles.svg}>
        {/* Background ring */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={darkColors.ringBg}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Progress ring */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={darkColors.primary}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <View style={styles.labelContainer}>
        <Text allowFontScaling={false} style={styles.value}>
          {current}
          <Text style={styles.separator}> / </Text>
          {target}
        </Text>
        <Text allowFontScaling={false} style={styles.label}>
          {label}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  svg: {
    transform: [{ rotate: "0deg" }],
  },
  labelContainer: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  value: {
    color: darkColors.text,
    fontSize: 48,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: -1,
  },
  separator: {
    color: darkColors.muted,
    fontSize: 32,
  },
  label: {
    color: darkColors.muted,
    fontSize: 16,
    fontFamily: "Inter_500Medium",
    marginTop: 4,
  },
});
