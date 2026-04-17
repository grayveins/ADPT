/**
 * WeightChart
 *
 * Pure View-based weight trend line chart. No external chart library.
 * Renders connected dots with a teal gradient fill below the line.
 * Supports tap-to-inspect individual data points.
 */

import React, { useMemo, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  LayoutChangeEvent,
} from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";

import { useTheme } from "@/src/context/ThemeContext";
import { format, parseISO } from "date-fns";

// ─── Types ─────────────────────────────────────────────────────────────────────

type WeightDataPoint = {
  date: string;
  weight: number;
};

type WeightChartProps = {
  data: WeightDataPoint[];
  unit: "kg" | "lb";
  height?: number;
};

// ─── Constants ─────────────────────────────────────────────────────────────────

const DOT_SIZE = 6;
const DOT_SIZE_ACTIVE = 10;
const LINE_WIDTH = 2;
const PADDING_LEFT = 44;
const PADDING_RIGHT = 12;
const PADDING_TOP = 16;
const PADDING_BOTTOM = 28;
const Y_LABEL_COUNT = 5;

// ─── Component ─────────────────────────────────────────────────────────────────

export const WeightChart: React.FC<WeightChartProps> = ({
  data,
  unit,
  height = 200,
}) => {
  const { colors } = useTheme();
  const [containerWidth, setContainerWidth] = useState(0);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  // Layout
  const onLayout = useCallback((e: LayoutChangeEvent) => {
    setContainerWidth(e.nativeEvent.layout.width);
  }, []);

  const chartWidth = containerWidth - PADDING_LEFT - PADDING_RIGHT;
  const chartHeight = height - PADDING_TOP - PADDING_BOTTOM;

  // Compute scales
  const { minY, maxY, yTicks, points } = useMemo(() => {
    if (data.length === 0) {
      return { minY: 0, maxY: 100, yTicks: [], points: [] };
    }

    const weights = data.map((d) => d.weight);
    const rawMin = Math.min(...weights);
    const rawMax = Math.max(...weights);
    const range = rawMax - rawMin || 10;
    const padding = range * 0.15;
    const min = Math.floor((rawMin - padding) / 5) * 5;
    const max = Math.ceil((rawMax + padding) / 5) * 5;

    // Y-axis ticks
    const step = (max - min) / (Y_LABEL_COUNT - 1);
    const ticks = Array.from({ length: Y_LABEL_COUNT }, (_, i) =>
      Math.round(min + step * i)
    );

    // Map data to pixel coordinates
    const pts = data.map((d, i) => {
      const xFraction = data.length === 1 ? 0.5 : i / (data.length - 1);
      const yFraction = max === min ? 0.5 : (d.weight - min) / (max - min);
      return {
        x: PADDING_LEFT + xFraction * chartWidth,
        y: PADDING_TOP + (1 - yFraction) * chartHeight,
        weight: d.weight,
        date: d.date,
      };
    });

    return { minY: min, maxY: max, yTicks: ticks, points: pts };
  }, [data, chartWidth, chartHeight]);

  // Delta from start
  const delta = useMemo(() => {
    if (data.length < 2) return null;
    const diff = data[data.length - 1].weight - data[0].weight;
    return diff;
  }, [data]);

  if (data.length === 0) {
    return (
      <View style={[styles.empty, { height }]}>
        <Text
          allowFontScaling={false}
          style={[styles.emptyText, { color: colors.textMuted }]}
        >
          Log your weight to see trends
        </Text>
      </View>
    );
  }

  // Build SVG-like line path as Views
  // We use absolute-positioned thin views rotated to connect dots
  const lines: { x1: number; y1: number; x2: number; y2: number }[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    lines.push({
      x1: points[i].x,
      y1: points[i].y,
      x2: points[i + 1].x,
      y2: points[i + 1].y,
    });
  }

  // Gradient fill: render vertical bars from each point down to bottom
  const fillBars = points.map((pt, i) => {
    const barHeight = PADDING_TOP + chartHeight - pt.y;
    return { x: pt.x, y: pt.y, height: barHeight };
  });

  return (
    <View style={{ height }} onLayout={onLayout}>
      {containerWidth === 0 ? null : (
        <View style={StyleSheet.absoluteFill}>
          {/* Y-axis labels */}
          {yTicks.map((tick, i) => {
            const yFraction =
              maxY === minY ? 0.5 : (tick - minY) / (maxY - minY);
            const y = PADDING_TOP + (1 - yFraction) * chartHeight;
            return (
              <React.Fragment key={`y-${i}`}>
                {/* Grid line */}
                <View
                  style={[
                    styles.gridLine,
                    {
                      top: y,
                      left: PADDING_LEFT,
                      width: chartWidth,
                      backgroundColor: colors.border,
                    },
                  ]}
                />
                {/* Label */}
                <Text
                  allowFontScaling={false}
                  style={[
                    styles.yLabel,
                    {
                      top: y - 7,
                      color: colors.textMuted,
                    },
                  ]}
                >
                  {tick}
                </Text>
              </React.Fragment>
            );
          })}

          {/* Gradient fill below line */}
          {fillBars.map((bar, i) => {
            // Calculate width of each segment
            const nextX = i < fillBars.length - 1 ? fillBars[i + 1].x : bar.x + 2;
            const prevX = i > 0 ? fillBars[i - 1].x : bar.x - 2;
            const segWidth = Math.max(
              2,
              ((i < fillBars.length - 1 ? nextX : bar.x) -
                (i > 0 ? (bar.x + prevX) / 2 : bar.x - 1)) +
                (i > 0 ? 0 : 1)
            );
            // Simpler: just use inter-point spacing
            const spacing =
              points.length > 1
                ? (points[points.length - 1].x - points[0].x) /
                  (points.length - 1)
                : 4;
            return (
              <View
                key={`fill-${i}`}
                style={{
                  position: "absolute",
                  left: bar.x - spacing / 2,
                  top: bar.y,
                  width: spacing,
                  height: bar.height,
                  backgroundColor: colors.primary,
                  opacity: 0.08,
                }}
              />
            );
          })}

          {/* Lines connecting dots */}
          {lines.map((line, i) => {
            const dx = line.x2 - line.x1;
            const dy = line.y2 - line.y1;
            const length = Math.sqrt(dx * dx + dy * dy);
            const angle = Math.atan2(dy, dx) * (180 / Math.PI);
            return (
              <View
                key={`line-${i}`}
                style={{
                  position: "absolute",
                  left: line.x1,
                  top: line.y1 - LINE_WIDTH / 2,
                  width: length,
                  height: LINE_WIDTH,
                  backgroundColor: colors.primary,
                  borderRadius: LINE_WIDTH / 2,
                  transform: [
                    { translateX: 0 },
                    { translateY: 0 },
                    { rotate: `${angle}deg` },
                  ],
                  transformOrigin: "left center",
                }}
              />
            );
          })}

          {/* Data point dots */}
          {points.map((pt, i) => {
            const isSelected = selectedIdx === i;
            const isLast = i === points.length - 1;
            const dotSize = isSelected || isLast ? DOT_SIZE_ACTIVE : DOT_SIZE;
            return (
              <Pressable
                key={`dot-${i}`}
                onPress={() => setSelectedIdx(isSelected ? null : i)}
                hitSlop={12}
                style={{
                  position: "absolute",
                  left: pt.x - dotSize / 2,
                  top: pt.y - dotSize / 2,
                  width: dotSize,
                  height: dotSize,
                  borderRadius: dotSize / 2,
                  backgroundColor: isLast ? colors.primary : colors.card,
                  borderWidth: 2,
                  borderColor: colors.primary,
                  zIndex: 10,
                }}
              />
            );
          })}

          {/* Tooltip */}
          {selectedIdx !== null && points[selectedIdx] && (
            <Animated.View
              entering={FadeIn.duration(150)}
              exiting={FadeOut.duration(100)}
              style={[
                styles.tooltip,
                {
                  backgroundColor: colors.bgTertiary,
                  borderColor: colors.border,
                  left: Math.min(
                    Math.max(PADDING_LEFT, points[selectedIdx].x - 45),
                    containerWidth - PADDING_RIGHT - 90
                  ),
                  top: points[selectedIdx].y - 48,
                },
              ]}
            >
              <Text
                allowFontScaling={false}
                style={[styles.tooltipValue, { color: colors.text }]}
              >
                {points[selectedIdx].weight} {unit}
              </Text>
              <Text
                allowFontScaling={false}
                style={[styles.tooltipDate, { color: colors.textMuted }]}
              >
                {format(parseISO(points[selectedIdx].date), "MMM d, yyyy")}
              </Text>
            </Animated.View>
          )}

          {/* X-axis date labels (every 2nd) */}
          {points.map((pt, i) => {
            if (points.length <= 6 || i % 2 === 0 || i === points.length - 1) {
              return (
                <Text
                  key={`x-${i}`}
                  allowFontScaling={false}
                  style={[
                    styles.xLabel,
                    {
                      left: pt.x - 20,
                      top: PADDING_TOP + chartHeight + 8,
                      color: colors.textMuted,
                    },
                  ]}
                >
                  {format(parseISO(pt.date), "M/d")}
                </Text>
              );
            }
            return null;
          })}
        </View>
      )}

      {/* Current + delta overlay */}
      {data.length > 0 && (
        <View style={styles.currentOverlay}>
          <Text
            allowFontScaling={false}
            style={[styles.currentValue, { color: colors.text }]}
          >
            {data[data.length - 1].weight}{" "}
            <Text style={[styles.currentUnit, { color: colors.textMuted }]}>
              {unit}
            </Text>
          </Text>
          {delta !== null && (
            <Text
              allowFontScaling={false}
              style={[
                styles.deltaText,
                { color: delta <= 0 ? colors.success : colors.textSecondary },
              ]}
            >
              {delta > 0 ? "+" : ""}
              {delta.toFixed(1)} {unit}
            </Text>
          )}
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
  gridLine: {
    position: "absolute",
    height: StyleSheet.hairlineWidth,
  },
  yLabel: {
    position: "absolute",
    left: 0,
    width: PADDING_LEFT - 6,
    textAlign: "right",
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    fontVariant: ["tabular-nums"],
  },
  xLabel: {
    position: "absolute",
    width: 40,
    textAlign: "center",
    fontSize: 10,
    fontFamily: "Inter_400Regular",
  },
  tooltip: {
    position: "absolute",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    zIndex: 20,
    alignItems: "center",
    minWidth: 90,
  },
  tooltipValue: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    fontVariant: ["tabular-nums"],
  },
  tooltipDate: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    marginTop: 1,
  },
  currentOverlay: {
    position: "absolute",
    top: 0,
    right: 0,
    alignItems: "flex-end",
  },
  currentValue: {
    fontSize: 20,
    fontFamily: "Inter_600SemiBold",
    fontVariant: ["tabular-nums"],
  },
  currentUnit: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  deltaText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    fontVariant: ["tabular-nums"],
    marginTop: 1,
  },
});

export default WeightChart;
