import { useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  View,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useTheme } from "@/src/context/ThemeContext";
import { supabase } from "@/lib/supabase";
import { spacing, radius } from "@/src/theme";

export default function LogProgress() {
  const { colors } = useTheme();
  const [weight, setWeight] = useState("");
  const [fatPct, setFatPct] = useState("");
  const [saving, setSaving] = useState(false);

  const onSave = async () => {
    if (!weight && !fatPct) {
      Alert.alert("Enter at least one value");
      return;
    }
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const weightKg = weight ? parseFloat(weight) / 2.205 : null;
      const fat = fatPct ? parseFloat(fatPct) : null;

      const { error } = await supabase.from("body_stats").insert({
        client_id: user.id,
        date: new Date().toISOString().split("T")[0],
        weight_kg: weightKg ? Math.round(weightKg * 100) / 100 : null,
        body_fat_pct: fat,
        source: "manual",
      });

      if (error) {
        if (error.code === "23505") {
          Alert.alert("Already logged", "You've already logged stats for today.");
        } else {
          Alert.alert("Error", error.message);
        }
        return;
      }
      router.back();
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.select({ ios: "padding", android: "height" })}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Pressable onPress={() => router.back()} hitSlop={8}>
            <Text allowFontScaling={false} style={[styles.headerAction, { color: colors.textMuted }]}>
              Cancel
            </Text>
          </Pressable>
          <Text allowFontScaling={false} style={[styles.headerTitle, { color: colors.text }]}>
            Today
          </Text>
          <Pressable onPress={onSave} disabled={saving} hitSlop={8}>
            <Text allowFontScaling={false} style={[styles.headerAction, { color: colors.text, fontWeight: "600" }]}>
              {saving ? "Saving..." : "Save"}
            </Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <InputRow
            label="Body Weight"
            unit="lbs"
            value={weight}
            onChangeText={setWeight}
            colors={colors}
          />
          <InputRow
            label="Fat %"
            unit="%"
            value={fatPct}
            onChangeText={setFatPct}
            colors={colors}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function InputRow({ label, unit, value, onChangeText, colors }: {
  label: string;
  unit: string;
  value: string;
  onChangeText: (v: string) => void;
  colors: any;
}) {
  return (
    <View style={[styles.inputRow, { borderBottomColor: colors.border }]}>
      <Text allowFontScaling={false} style={[styles.inputLabel, { color: colors.text }]}>
        {label}
      </Text>
      <View style={styles.inputRight}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          keyboardType="decimal-pad"
          placeholder="—"
          placeholderTextColor={colors.textMuted}
          style={[styles.input, { color: colors.text }]}
          allowFontScaling={false}
        />
        <Text allowFontScaling={false} style={[styles.inputUnit, { color: colors.textMuted }]}>
          {unit}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: { fontSize: 16, fontWeight: "600" },
  headerAction: { fontSize: 16 },
  scroll: { paddingHorizontal: spacing.lg, paddingTop: spacing.base },
  inputRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  inputLabel: { fontSize: 16 },
  inputRight: { flexDirection: "row", alignItems: "center", gap: 4 },
  input: { fontSize: 16, fontWeight: "500", textAlign: "right", minWidth: 60 },
  inputUnit: { fontSize: 14 },
});
