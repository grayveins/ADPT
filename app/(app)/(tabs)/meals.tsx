import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Pressable,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/src/context/ThemeContext";
import { spacing, radius } from "@/src/theme";
import { supabase } from "@/lib/supabase";

type MacroTargets = {
  calories: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  notes: string | null;
};

type MealPlan = {
  id: string;
  title: string;
  storage_path: string;
  uploaded_at: string;
};

export default function MealsScreen() {
  const { colors } = useTheme();
  const [macros, setMacros] = useState<MacroTargets | null>(null);
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [macroRes, planRes] = await Promise.all([
      supabase
        .from("client_macros")
        .select("calories, protein_g, carbs_g, fat_g, notes")
        .eq("client_id", user.id)
        .order("effective_from", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("meal_plans")
        .select("id, title, storage_path, uploaded_at")
        .eq("client_id", user.id)
        .order("uploaded_at", { ascending: false }),
    ]);

    if (macroRes.data) setMacros(macroRes.data);
    if (planRes.data) setMealPlans(planRes.data);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  const openPdf = useCallback(async (path: string) => {
    const { data } = await supabase.storage
      .from("meal-plans")
      .createSignedUrl(path, 3600);
    if (data?.signedUrl) Linking.openURL(data.signedUrl);
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={["top"]}>
      <Text allowFontScaling={false} style={[styles.title, { color: colors.text }]}>
        Nutrition
      </Text>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.text} />
        }
      >
        {/* Macro Targets */}
        {macros ? (
          <View style={[styles.macroCard, { backgroundColor: colors.bgSecondary }]}>
            {macros.calories && (
              <View style={styles.calorieRow}>
                <Text allowFontScaling={false} style={[styles.calorieValue, { color: colors.text }]}>
                  {macros.calories}
                </Text>
                <Text allowFontScaling={false} style={[styles.calorieLabel, { color: colors.textMuted }]}>
                  calories / day
                </Text>
              </View>
            )}
            <View style={styles.macroRow}>
              {macros.protein_g != null && (
                <MacroPill label="Protein" value={`${macros.protein_g}g`} colors={colors} />
              )}
              {macros.carbs_g != null && (
                <MacroPill label="Carbs" value={`${macros.carbs_g}g`} colors={colors} />
              )}
              {macros.fat_g != null && (
                <MacroPill label="Fat" value={`${macros.fat_g}g`} colors={colors} />
              )}
            </View>
            {macros.notes && (
              <Text allowFontScaling={false} style={[styles.macroNotes, { color: colors.textSecondary }]}>
                {macros.notes}
              </Text>
            )}
            <Text allowFontScaling={false} style={[styles.setBy, { color: colors.textMuted }]}>
              Set by your coach
            </Text>
          </View>
        ) : !loading ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.bgSecondary }]}>
            <Ionicons name="nutrition-outline" size={32} color={colors.textMuted} />
            <Text allowFontScaling={false} style={[styles.emptyTitle, { color: colors.text }]}>
              No targets set
            </Text>
            <Text allowFontScaling={false} style={[styles.emptyText, { color: colors.textMuted }]}>
              Your coach hasn't set nutrition targets yet
            </Text>
          </View>
        ) : null}

        {/* Meal Plans */}
        <View style={styles.section}>
          <Text allowFontScaling={false} style={[styles.sectionTitle, { color: colors.text }]}>
            Meal Plans
          </Text>
          {mealPlans.length > 0 ? (
            mealPlans.map((plan) => (
              <Pressable
                key={plan.id}
                onPress={() => openPdf(plan.storage_path)}
                style={[styles.planCard, { backgroundColor: colors.bgSecondary }]}
              >
                <Ionicons name="document-text-outline" size={20} color={colors.text} />
                <View style={styles.planInfo}>
                  <Text allowFontScaling={false} style={[styles.planTitle, { color: colors.text }]}>
                    {plan.title}
                  </Text>
                  <Text allowFontScaling={false} style={[styles.planDate, { color: colors.textMuted }]}>
                    {new Date(plan.uploaded_at).toLocaleDateString()}
                  </Text>
                </View>
                <Ionicons name="download-outline" size={20} color={colors.textMuted} />
              </Pressable>
            ))
          ) : !loading ? (
            <View style={[styles.emptyCard, { backgroundColor: colors.bgSecondary }]}>
              <Text allowFontScaling={false} style={[styles.emptyText, { color: colors.textMuted }]}>
                No meal plans uploaded
              </Text>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function MacroPill({ label, value, colors }: { label: string; value: string; colors: any }) {
  return (
    <View style={[styles.macroPill, { backgroundColor: colors.card }]}>
      <Text allowFontScaling={false} style={[styles.macroPillValue, { color: colors.text }]}>
        {value}
      </Text>
      <Text allowFontScaling={false} style={[styles.macroPillLabel, { color: colors.textMuted }]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: spacing.lg },
  title: { fontSize: 28, fontWeight: "700", marginTop: spacing.base, marginBottom: spacing.xl },
  macroCard: { padding: spacing.xl, borderRadius: radius.lg, gap: spacing.base },
  calorieRow: { alignItems: "center", marginBottom: spacing.sm },
  calorieValue: { fontSize: 40, fontWeight: "700" },
  calorieLabel: { fontSize: 14, marginTop: 2 },
  macroRow: { flexDirection: "row", gap: spacing.sm, justifyContent: "center" },
  macroPill: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: "center",
    gap: 2,
  },
  macroPillValue: { fontSize: 17, fontWeight: "600" },
  macroPillLabel: { fontSize: 12 },
  macroNotes: { fontSize: 14, textAlign: "center" },
  setBy: { fontSize: 12, textAlign: "center" },
  section: { marginTop: spacing.xl },
  sectionTitle: { fontSize: 17, fontWeight: "600", marginBottom: spacing.md },
  planCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.base,
    borderRadius: radius.md,
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  planInfo: { flex: 1 },
  planTitle: { fontSize: 15, fontWeight: "500" },
  planDate: { fontSize: 13, marginTop: 2 },
  emptyCard: {
    padding: spacing.xl,
    borderRadius: radius.lg,
    alignItems: "center",
    gap: spacing.sm,
  },
  emptyTitle: { fontSize: 17, fontWeight: "600" },
  emptyText: { fontSize: 15 },
});
