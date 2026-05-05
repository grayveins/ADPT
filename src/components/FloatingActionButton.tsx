import React, { useEffect, useState } from "react";
import { View, Text, Pressable, StyleSheet, Modal, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useSegments } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/src/context/ThemeContext";
import { spacing, radius } from "@/src/theme";
import { hapticPress } from "@/src/animations/feedback/haptics";
import { supabase } from "@/lib/supabase";
import { useUnreadMessages } from "@/src/hooks/useUnreadMessages";

type Action = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
};

type Coach = { display_name: string | null; avatar_url: string | null };

export function FloatingActionButton() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const [coach, setCoach] = useState<Coach | null>(null);
  const segments = useSegments();
  // Hide on chat — the composer occupies the bottom-right space the FAB
  // would land on, and a "+" overlay reads as an attachment affordance,
  // which is misleading until attachments ship.
  const hideFab = segments.some(
    (s) => s === "chat" || s === "(workout)" || s === "active"
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (cancelled || !user) return;
      const { data } = await supabase
        .from("coach_clients")
        .select("coach:coaches!coach_clients_coach_id_fkey(display_name, avatar_url)")
        .eq("client_id", user.id)
        .eq("status", "active")
        .order("started_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (cancelled) return;
      const c = (data as { coach: Coach | null } | null)?.coach ?? null;
      setCoach(c);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const { unreadCount } = useUnreadMessages();

  if (hideFab) return null;

  const actions: Action[] = [
    {
      icon: "scale-outline",
      label: "Log Body Stats",
      onPress: () => router.push("/(app)/log-progress" as any),
    },
    {
      icon: "barbell-outline",
      label: "Start Workout",
      onPress: () => router.push("/(app)/(tabs)/workout" as any),
    },
    {
      icon: "camera-outline",
      label: "Take Photos",
      onPress: () => router.push("/(app)/progress-photos" as any),
    },
  ];

  const handleAction = (action: Action) => {
    setOpen(false);
    hapticPress();
    action.onPress();
  };

  return (
    <>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.overlay} onPress={() => setOpen(false)}>
          <View style={[styles.menu, { bottom: 227 + insets.bottom }]}>
            {actions.map((action, i) => (
              <Pressable
                key={i}
                onPress={() => handleAction(action)}
                style={[styles.menuItem, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <Ionicons name={action.icon} size={18} color={colors.text} />
                <Text allowFontScaling={false} style={[styles.menuLabel, { color: colors.text }]}>
                  {action.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>

      <Pressable
        onPress={() => { hapticPress(); setOpen(true); }}
        style={[styles.fab, { bottom: 162 + insets.bottom, backgroundColor: colors.text }]}
      >
        <Ionicons name="add" size={28} color={colors.bg} />
      </Pressable>

      <Pressable
        onPress={() => { hapticPress(); router.push("/(app)/(tabs)/chat" as any); }}
        accessibilityRole="button"
        accessibilityLabel={
          coach
            ? unreadCount > 0
              ? `Chat with ${coach.display_name ?? "your coach"}, ${unreadCount} unread`
              : `Chat with ${coach.display_name ?? "your coach"}`
            : unreadCount > 0
            ? `Messages, ${unreadCount} unread`
            : "Messages"
        }
        style={[
          styles.chatFab,
          {
            bottom: 90 + insets.bottom,
            backgroundColor: colors.bgSecondary,
            borderColor: colors.border,
          },
        ]}
      >
        {coach?.avatar_url ? (
          <Image source={{ uri: coach.avatar_url }} style={styles.chatFabAvatar} />
        ) : (
          <Ionicons name="chatbubble-outline" size={24} color={colors.text} />
        )}
        {unreadCount > 0 && (
          <View style={[styles.unreadBadge, { backgroundColor: colors.text, borderColor: colors.bg }]}>
            <Text allowFontScaling={false} style={[styles.unreadBadgeText, { color: colors.bg }]}>
              {unreadCount > 9 ? "9+" : unreadCount}
            </Text>
          </View>
        )}
      </Pressable>
    </>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    right: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 100,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.2)",
    justifyContent: "flex-end",
  },
  menu: {
    position: "absolute",
    right: spacing.lg,
    gap: 6,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
  },
  menuLabel: { fontSize: 14, fontWeight: "500" },
  chatFab: {
    position: "absolute",
    right: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
    overflow: "visible",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 100,
  },
  chatFabAvatar: { width: 56, height: 56, borderRadius: 28 },
  unreadBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  unreadBadgeText: { fontSize: 10, fontWeight: "700" },
});
