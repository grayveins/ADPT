import { View, Text, Pressable, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/src/context/ThemeContext";
import { spacing, radius } from "@/src/theme";

export default function TakePhotos() {
  const { colors } = useTheme();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="close" size={24} color={colors.text} />
        </Pressable>
        <Text allowFontScaling={false} style={[styles.title, { color: colors.text }]}>
          Check-in Photos
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <Ionicons name="camera-outline" size={48} color={colors.textMuted} />
        <Text allowFontScaling={false} style={[styles.emptyTitle, { color: colors.text }]}>
          Coming Soon
        </Text>
        <Text allowFontScaling={false} style={[styles.emptyText, { color: colors.textMuted }]}>
          Progress photo capture will be available in the next update.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: { fontSize: 16, fontWeight: "600" },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: { fontSize: 18, fontWeight: "600" },
  emptyText: { fontSize: 14, textAlign: "center" },
});
