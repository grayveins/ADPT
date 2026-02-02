import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import Card from "@/src/components/Card";
import { theme } from "@/src/theme";

export type WeeklyDay = {
  date: string;
  label: string;
  isToday: boolean;
  completed: boolean;
  isPlanned: boolean;
  detail: string;
};

type WeeklyConsistencyProps = {
  days: WeeklyDay[];
};

export default function WeeklyConsistency({ days }: WeeklyConsistencyProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    if (!days.length) return;
    const todayIndex = days.findIndex((day) => day.isToday);
    setSelectedIndex(todayIndex >= 0 ? todayIndex : 0);
  }, [days]);

  if (!days.length) return null;
  const selectedDay = days[selectedIndex] ?? days[0];

  return (
    <Card style={styles.card}>
      <Text allowFontScaling={false} style={styles.title}>
        Weekly consistency
      </Text>
      <View style={styles.labelsRow}>
        {days.map((day) => (
          <Text
            key={`label-${day.date}`}
            allowFontScaling={false}
            style={[styles.label, day.isToday && styles.labelActive]}
          >
            {day.label}
          </Text>
        ))}
      </View>
      <View style={styles.dotsRow}>
        {days.map((day, index) => (
          <Pressable
            key={`dot-${day.date}`}
            onPress={() => setSelectedIndex(index)}
            style={({ pressed }) => [
              styles.dot,
              day.completed && styles.dotCompleted,
              !day.completed && day.isPlanned && styles.dotPlanned,
              !day.completed && !day.isPlanned && styles.dotRest,
              index === selectedIndex && styles.dotSelected,
              pressed && styles.dotPressed,
            ]}
          />
        ))}
      </View>
      <Text allowFontScaling={false} style={styles.detail}>
        {selectedDay.detail}
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: theme.space.s,
  },
  title: {
    color: theme.colors.text,
    fontFamily: theme.fonts.bodyMedium,
    fontSize: 15,
  },
  labelsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  label: {
    color: theme.colors.muted2,
    fontFamily: theme.fonts.bodyMedium,
    fontSize: 12,
    width: 18,
    textAlign: "center",
  },
  labelActive: {
    color: theme.colors.text,
  },
  dotsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
  },
  dotCompleted: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  dotPlanned: {
    backgroundColor: "rgba(201, 124, 115, 0.18)",
    borderColor: "rgba(201, 124, 115, 0.4)",
  },
  dotRest: {
    backgroundColor: theme.colors.border,
    borderColor: theme.colors.border,
  },
  dotSelected: {
    borderWidth: 2,
  },
  dotPressed: {
    opacity: 0.8,
  },
  detail: {
    color: theme.colors.muted,
    fontFamily: theme.fonts.body,
    fontSize: 13,
  },
});
