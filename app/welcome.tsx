import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useTheme } from "@/src/context/ThemeContext";
import { spacing, radius } from "@/src/theme";

const LOGO = require("@/assets/images/icon.png");

export default function Welcome() {
  const { colors } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={styles.content}>
        <Image source={LOGO} style={styles.logo} />
        <Text allowFontScaling={false} style={[styles.brand, { color: colors.text }]}>
          ADPT
        </Text>
      </View>

      <View style={styles.actions}>
        <Pressable
          onPress={() => router.push("/sign-up")}
          style={[styles.primaryButton, { backgroundColor: colors.text }]}
        >
          <Text allowFontScaling={false} style={[styles.primaryText, { color: colors.bg }]}>
            Get Started
          </Text>
        </Pressable>

        <Pressable
          onPress={() => router.push("/sign-in")}
          style={styles.secondaryButton}
        >
          <Text allowFontScaling={false} style={[styles.secondaryText, { color: colors.text }]}>
            Sign In
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
  logo: {
    width: 80,
    height: 80,
    borderRadius: 20,
    marginBottom: spacing.base,
  },
  brand: {
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: 4,
  },
  actions: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  primaryButton: {
    height: 56,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryText: {
    fontSize: 17,
    fontWeight: "600",
  },
  secondaryButton: {
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryText: {
    fontSize: 15,
    fontWeight: "500",
  },
});
