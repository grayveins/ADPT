import { ReactNode } from "react";
import { ScrollView, StyleSheet, View, ViewStyle, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";

import { theme } from "@/src/theme";

type DashboardLayoutProps = {
  children: ReactNode;
  contentStyle?: ViewStyle;
};

const MAX_W = 360;

export default function DashboardLayout({ children, contentStyle }: DashboardLayoutProps) {
  const { width } = useWindowDimensions();
  const containerWidth = Math.min(width - theme.space.xl * 2, MAX_W);

  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient
        colors={[theme.colors.bgTop, theme.colors.bg]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <ScrollView
        contentContainerStyle={[styles.scroll, contentStyle]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.inner, { width: containerWidth }]}>{children}</View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  scroll: {
    paddingTop: theme.space.xl,
    paddingBottom: theme.space.xxl,
    paddingHorizontal: theme.space.xl,
  },
  inner: {
    alignSelf: "center",
    gap: theme.space.l,
  },
});
