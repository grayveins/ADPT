/**
 * Settings Screen
 * 
 * User preferences and app settings.
 * Accessible from the drawer menu.
 */

import React, { useState } from "react";
import { View, Text, StyleSheet, Switch, Pressable, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import { useTheme } from "@/src/context/ThemeContext";
import { spacing, layout } from "@/src/theme";

type SettingRowProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
};

function SettingRow({ icon, label, value, onPress, rightElement }: SettingRowProps) {
  const { colors } = useTheme();

  const content = (
    <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
      <View style={[styles.settingIcon, { backgroundColor: colors.primaryMuted }]}>
        <Ionicons name={icon} size={18} color={colors.primary} />
      </View>
      <Text style={[styles.settingLabel, { color: colors.text }]}>{label}</Text>
      {value && (
        <Text style={[styles.settingValue, { color: colors.textMuted }]}>{value}</Text>
      )}
      {rightElement}
      {onPress && !rightElement && (
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      )}
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => pressed && styles.pressed}>
        {content}
      </Pressable>
    );
  }

  return content;
}

export default function SettingsScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  // Placeholder state for settings (theme toggle not yet implemented in context)
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backButton}
          hitSlop={8}
        >
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Settings</Text>
        <View style={styles.backButton} />
      </View>

      {/* Settings Sections */}
      <View style={styles.content}>
        {/* Appearance Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
            Appearance
          </Text>
          <View style={[styles.sectionCard, { backgroundColor: colors.card }]}>
            <SettingRow
              icon="moon-outline"
              label="Dark Mode"
              value={isDark ? "On" : "Off"}
            />
          </View>
        </View>

        {/* Notifications Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
            Notifications
          </Text>
          <View style={[styles.sectionCard, { backgroundColor: colors.card }]}>
            <SettingRow
              icon="notifications-outline"
              label="Push Notifications"
              rightElement={
                <Switch
                  value={notificationsEnabled}
                  onValueChange={setNotificationsEnabled}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor={colors.text}
                />
              }
            />
          </View>
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
            Account
          </Text>
          <View style={[styles.sectionCard, { backgroundColor: colors.card }]}>
            <SettingRow
              icon="person-outline"
              label="Edit Profile"
              onPress={() => {
                Alert.alert("Coming Soon", "Profile editing will be available in a future update.");
              }}
            />
            <SettingRow
              icon="key-outline"
              label="Change Password"
              onPress={() => {
                Alert.alert("Coming Soon", "Password change will be available in a future update.");
              }}
            />
          </View>
        </View>

        {/* Data Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
            Data & Privacy
          </Text>
          <View style={[styles.sectionCard, { backgroundColor: colors.card }]}>
            <SettingRow
              icon="download-outline"
              label="Export My Data"
              onPress={() => {
                Alert.alert("Coming Soon", "Data export will be available in a future update.");
              }}
            />
            <SettingRow
              icon="trash-outline"
              label="Delete Account"
              onPress={() => {
                Alert.alert(
                  "Delete Account",
                  "To delete your account and all data, please contact support@adpt.fit",
                  [{ text: "OK" }]
                );
              }}
            />
          </View>
        </View>
      </View>
    </View>
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
    height: layout.headerHeight,
    paddingHorizontal: layout.screenPaddingHorizontal,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
  },
  content: {
    flex: 1,
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingTop: spacing.lg,
  },
  section: {
    marginBottom: layout.sectionGap,
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  sectionCard: {
    borderRadius: 14,
    overflow: "hidden",
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md + 2,
    paddingHorizontal: spacing.base,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: spacing.md,
  },
  settingIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  settingLabel: {
    flex: 1,
    fontSize: 16,
    fontFamily: "Inter_500Medium",
  },
  settingValue: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  pressed: {
    opacity: 0.7,
  },
});
