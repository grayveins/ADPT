/**
 * QuickLinks
 * Navigation shortcuts for Library, History, Archive
 */

import React from "react";
import { StyleSheet, View, Text, Pressable } from "react-native";
import Animated from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { darkColors, theme } from "@/src/theme";
import { useSpringPress } from "@/src/animations/primitives";

type QuickLinkItem = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
};

const QuickLink: React.FC<QuickLinkItem> = ({ icon, label, onPress }) => {
  const { animatedStyle, pressHandlers } = useSpringPress({
    onPress,
    haptic: true,
  });

  return (
    <Animated.View style={[styles.linkContainer, animatedStyle]}>
      <Pressable
        {...pressHandlers}
        style={styles.linkButton}
      >
        <Ionicons name={icon} size={20} color={darkColors.muted} />
        <Text allowFontScaling={false} style={styles.linkLabel}>
          {label}
        </Text>
        <Ionicons name="chevron-forward" size={16} color={darkColors.muted2} />
      </Pressable>
    </Animated.View>
  );
};

type QuickLinksProps = {
  onLibraryPress: () => void;
  onHistoryPress: () => void;
  onArchivePress: () => void;
};

export const QuickLinks: React.FC<QuickLinksProps> = ({
  onLibraryPress,
  onHistoryPress,
  onArchivePress,
}) => {
  const links: QuickLinkItem[] = [
    { icon: "library-outline", label: "Workout Library", onPress: onLibraryPress },
    { icon: "time-outline", label: "Workout History", onPress: onHistoryPress },
    { icon: "archive-outline", label: "Archive", onPress: onArchivePress },
  ];

  return (
    <View style={styles.container}>
      {links.map((link, index) => (
        <React.Fragment key={link.label}>
          <QuickLink {...link} />
          {index < links.length - 1 && <View style={styles.divider} />}
        </React.Fragment>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: darkColors.card,
    borderRadius: 16,
    overflow: "hidden",
  },
  linkContainer: {},
  linkButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  linkLabel: {
    flex: 1,
    color: darkColors.text,
    fontSize: 15,
    fontFamily: theme.fonts.bodyMedium,
  },
  divider: {
    height: 1,
    backgroundColor: darkColors.border,
    marginHorizontal: 16,
  },
});

export default QuickLinks;
