/**
 * VolumeChartNew
 *
 * Pure View-based vertical bar chart for weekly training volume.
 * Current week highlighted in teal, past weeks muted.
 * Labels: "W1", "W2", etc. with value on top of each bar.
 */

import React, { useMemo, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  LayoutChangeEvent,
} from "react-native";
import Animated, {
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from "react-native-reanimated";

import { useTheme } from "@/src/context/ThemeContext";

// ─── Types ─────────────────────────────────────────────────────────────────────

type VolumeChartProps = {
  data: { week: string; volume: number }[];
  height?: number;
};

// ─── Constants ─────────────────────────────────────────────────────────────────

const PADDING_TOP = 24; // space for value labels
const PADDING_BOTTOM = 20; // space for week labels
const BAR_GAP = 6;
const BAR_RADIUS = 6;

// ─── Animated Bar ──────────────────────────────────────────────────────────────

const AnimatedBar: React.FC<{
  barHeight: number;
  maxBarHeight: number;
  color: string;
  delay: number;
}> = ({ barHeight, maxBarHeight, color, delay }) => {
  const h = useSharedValue(0);

  React.useEffect(() => {
    h.value = withDelay(
      delay,
      withTiming(barHeight, { duration: 600, easing: Easing.out(Easing.cubic) })
    );
  }, [barHeight, delay]);

  const animatedStyle = useAnimatedStyle(() => ({
    height: h.value,
    backgroundColor: color,
    borderTopLeftRadius: BAR_RADIUS,
    borderTopRightRadius: BAR_RADIUS,
  }));

  return (
    <View style={{ height: maxBarHeight, justifyContent: "flex-end" }}>
      <Animated.View style={animatedStyle} />
    </View>
  );
};

// ─── Component ─────────────────────────────────────────────────────────────────

export const VolumeChartNew: React.FC<VolumeChartProps> = ({
  data,
  height = 180,
}) => {
  const { colors } = useTheme();
  const [containerWidth, setContainerWidth] = useState(0);

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    setContainerWidth(e.nativeEvent.layout.width);
  }, []);

  const maxBarHeight = height - PADDING_TOP - PADDING_BOTTOM;

  const { maxVolume, bars } = useMemo(() => {
    if (data.length === 0) return { maxVolume: 0, bars: [] };

    const max = Math.max(...data.map((d) => d.volume), 1);

    // Calculate bar width
    const totalGaps = (data.length - 1) * BAR_GAP;
    const barWidth =
      containerWidth > 0
        ? Math.max(12, (containerWidth - totalGaps) / data.length)
        : 30;

    const barsData = data.map((d, i) => {
      const heightFraction = d.volume / max;
      const barH = Math.max(2, heightFraction * maxBarHeight);
      const isLast = i === data.length - 1;
      return {
        week: d.week,
        volume: d.volume,
        barHeight: barH,
        barWidth,
        isLast,
        index: i,
      };
    });

    return { maxVolume: max, bars: barsData };
  }, [data, containerWidth, maxBarHeight]);

  // Format volume for labels
  const fmtVol = (v: number): string => {
    if (v >= 1000000) return `${(v / 1000000).toFixed(1)}M`;
    if (v >= 10000) return `${(v / 1000).toFixed(0)}k`;
    if (v >= 1000) return `${(v / 1000).toFixed(1)}k`;
    return String(v);
  };

  if (data.length === 0) {
    return (
      <View style={[styles.empty, { height }]}>
        <Text
          allowFontScaling={false}
          style={[styles.emptyText, { color: colors.textMuted }]}
        >
          Complete workouts to see volume trends
        </Text>
      </View>
    );
  }

  return (
    <View style={{ height }} onLayout={onLayout}>
      {containerWidth > 0 && (
        <View style={styles.barsContainer}>
          {/* Grid lines */}
          {[0.25, 0.5, 0.75, 1].map((frac) => (
            <View
              key={`grid-${frac}`}
              style={[
                styles.gridLine,
                {
                  bottom: PADDING_BOTTOM + frac * maxBarHeight,
                  backgroundColor: colors.border,
                },
              ]}
            />
          ))}

          {/* Bars */}
          <View style={styles.barsRow}>
            {bars.map((bar) => {
              const barColor = bar.isLast
                ? colors.primary
                : `${colors.primary}66`; // 40% opacity for past weeks
              return (
                <View
                  key={bar.index}
                  style={[styles.barColumn, { width: bar.barWidth }]}
                >
                  {/* Value label */}
                  <Text
                    allowFontScaling={false}
                    style={[
                      styles.barValue,
                      {
                        color: bar.isLast
                          ? colors.text
                          : colors.textMuted,
                      },
                    ]}
                    numberOfLines={1}
                  >
                    {fmtVol(bar.volume)}
                  </Text>

                  {/* Bar */}
                  <AnimatedBar
                    barHeight={bar.barHeight}
                    maxBarHeight={maxBarHeight}
                    color={barColor}
                    delay={bar.index * 50}
                  />

                  {/* Week label */}
                  <Text
                    allowFontScaling={false}
                    style={[styles.weekLabel, { color: colors.textMuted }]}
                    numberOfLines={1}
                  >
                    {bar.week}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      )}
    </View>
  );
};

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  empty: {
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  barsContainer: {
    flex: 1,
    position: "relative",
  },
  gridLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
  },
  barsRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "center",
    gap: BAR_GAP,
    paddingTop: PADDING_TOP,
    paddingBottom: PADDING_BOTTOM,
  },
  barColumn: {
    alignItems: "center",
  },
  barValue: {
    fontSize: 10,
    fontFamily: "Inter_500Medium",
    fontVariant: ["tabular-nums"],
    marginBottom: 4,
    textAlign: "center",
  },
  weekLabel: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    marginTop: 4,
    textAlign: "center",
  },
});

export default VolumeChartNew;
