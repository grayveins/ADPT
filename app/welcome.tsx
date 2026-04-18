import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useTheme } from "@/src/context/ThemeContext";
import { spacing, radius } from "@/src/theme";

export default function Welcome() {
  const { colors } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={styles.content}>
        <Text allowFontScaling={false} style={[styles.title, { color: colors.text }]}>
          Welcome
        </Text>
      </View>

      <View style={styles.actions}>
        <Pressable
          onPress={() => router.push("/sign-in")}
          style={[styles.primaryButton, { backgroundColor: colors.text }]}
        >
          <Text allowFontScaling={false} style={[styles.primaryText, { color: colors.bg }]}>
            SIGN IN
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 34,
    fontWeight: "300",
    letterSpacing: 1,
  },
  actions: {
    paddingHorizontal: spacing.xl,
    paddingBottom: 48,
    gap: spacing.md,
  },
  primaryButton: {
    height: 52,
    borderRadius: radius.xl,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryText: {
    fontSize: 15,
    fontWeight: "600",
    letterSpacing: 1,
  },
});
