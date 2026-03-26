/**
 * Templates Screen
 * Browse, manage, and start workouts from saved templates.
 */

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";

import { useTheme } from "@/src/context/ThemeContext";
import { supabase } from "@/lib/supabase";
import { useTemplates } from "@/src/hooks/useTemplates";
import { hapticPress } from "@/src/animations/feedback/haptics";
import type { WorkoutTemplate } from "@/lib/workout/templates";

export default function TemplatesScreen() {
  const { colors } = useTheme();
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id);
    });
  }, []);

  const { templates, loading, remove } = useTemplates(userId);

  const startFromTemplate = (template: WorkoutTemplate) => {
    hapticPress();
    router.push({
      pathname: "/(workout)/active",
      params: {
        name: template.name,
        exercises: JSON.stringify(template.exercises),
        sourceType: "template",
        sourceId: template.id,
      },
    });
  };

  const handleDelete = (template: WorkoutTemplate) => {
    Alert.alert("Delete Template?", `Remove "${template.name}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => remove(template.id),
      },
    ]);
  };

  const renderTemplate = ({ item, index }: { item: WorkoutTemplate; index: number }) => {
    const exerciseCount = item.exercises?.length ?? 0;

    return (
      <Animated.View entering={FadeInDown.delay(index * 40).duration(250)}>
        <Pressable
          onPress={() => startFromTemplate(item)}
          onLongPress={() => handleDelete(item)}
          style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <View style={styles.cardHeader}>
            <Text allowFontScaling={false} style={[styles.cardName, { color: colors.text }]}>
              {item.name}
            </Text>
            <Pressable onPress={() => handleDelete(item)} hitSlop={8}>
              <Ionicons name="trash-outline" size={18} color={colors.textMuted} />
            </Pressable>
          </View>

          <Text allowFontScaling={false} style={[styles.cardExercises, { color: colors.textSecondary }]}>
            {(item.exercises || []).map((e: any) => e.name).join(", ")}
          </Text>

          <View style={styles.cardFooter}>
            <Text allowFontScaling={false} style={[styles.cardMeta, { color: colors.textMuted }]}>
              {exerciseCount} exercise{exerciseCount !== 1 ? "s" : ""}
            </Text>
            {item.times_used > 0 && (
              <Text allowFontScaling={false} style={[styles.cardMeta, { color: colors.textMuted }]}>
                Used {item.times_used}x
              </Text>
            )}
          </View>
        </Pressable>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={["top"]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <Text allowFontScaling={false} style={[styles.title, { color: colors.text }]}>
          My Templates
        </Text>
        <View style={styles.backButton} />
      </View>

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : templates.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="clipboard-outline" size={48} color={colors.textMuted} />
          <Text allowFontScaling={false} style={[styles.emptyText, { color: colors.textMuted }]}>
            No templates yet
          </Text>
          <Text allowFontScaling={false} style={[styles.emptySubtext, { color: colors.textMuted }]}>
            Complete a workout to save it as a template
          </Text>
        </View>
      ) : (
        <FlatList
          data={templates}
          keyExtractor={(item) => item.id}
          renderItem={renderTemplate}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
  },
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: "Inter_500Medium",
  },
  emptySubtext: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  list: {
    padding: 16,
  },
  card: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  cardName: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    flex: 1,
  },
  cardExercises: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginBottom: 8,
  },
  cardFooter: {
    flexDirection: "row",
    gap: 12,
  },
  cardMeta: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
});
