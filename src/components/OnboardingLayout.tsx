import { ReactNode } from "react";
import { StyleSheet, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";

import { darkColors, theme } from "@/src/theme";

type OnboardingLayoutProps = {
  children: ReactNode;
};

const MAX_W = 360;

export default function OnboardingLayout({ children }: OnboardingLayoutProps) {
  const { width } = useWindowDimensions();
  const containerWidth = Math.min(width - theme.space.xl * 2, MAX_W);

  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient
        colors={[darkColors.bgTop, darkColors.bg]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.outer}>
        <View style={[styles.inner, { width: containerWidth }]}>{children}</View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: darkColors.bg,
  },
  outer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: theme.space.xl,
  },
  inner: {
    alignSelf: "center",
    flex: 1,
  },
});
