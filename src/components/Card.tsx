import { ReactNode } from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";

import { darkColors, theme } from "@/src/theme";

type CardProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export default function Card({ children, style }: CardProps) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: darkColors.card,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: darkColors.border,
    padding: theme.space.l,
    shadowColor: darkColors.shadow,
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },
});
