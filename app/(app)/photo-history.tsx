/**
 * Client-side history of own progress photos. Grouped by date, tap a thumb
 * to open a full-screen lightbox with delete + close.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTheme } from "@/src/context/ThemeContext";
import { spacing, radius } from "@/src/theme";
import { hapticPress } from "@/src/animations/feedback/haptics";
import {
  deleteProgressPhoto,
  listOwnProgressPhotosWithUrls,
  type ProgressPhoto,
  type ProgressPose,
} from "@/src/lib/progressPhotos";

type PhotoWithUrl = ProgressPhoto & { url: string | null };
type Group = { date: string; photos: PhotoWithUrl[] };

const POSE_LABELS: Record<string, string> = {
  front: "Front",
  side: "Side",
  back: "Back",
  other: "Other",
};

const POSE_ORDER: ProgressPose[] = ["front", "side", "back", "other"];

function formatDateLabel(d: string): string {
  return new Date(d + "T00:00:00").toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function PhotoHistoryScreen() {
  const { colors } = useTheme();
  const [photos, setPhotos] = useState<PhotoWithUrl[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<PhotoWithUrl | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await listOwnProgressPhotosWithUrls();
      setPhotos(data);
    } catch {
      // Treat as empty; UI will show the empty state
      setPhotos([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const groups: Group[] = useMemo(() => {
    const byDate = new Map<string, PhotoWithUrl[]>();
    for (const p of photos) {
      const arr = byDate.get(p.taken_at) ?? [];
      arr.push(p);
      byDate.set(p.taken_at, arr);
    }
    for (const arr of byDate.values()) {
      arr.sort((a, b) => {
        const ai = POSE_ORDER.indexOf((a.pose ?? "other") as ProgressPose);
        const bi = POSE_ORDER.indexOf((b.pose ?? "other") as ProgressPose);
        return ai - bi;
      });
    }
    return [...byDate.entries()]
      .sort((a, b) => (a[0] < b[0] ? 1 : -1))
      .map(([date, ps]) => ({ date, photos: ps }));
  }, [photos]);

  const handleDelete = useCallback(
    (photo: PhotoWithUrl) => {
      Alert.alert("Delete photo?", "This can't be undone.", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            hapticPress();
            try {
              await deleteProgressPhoto({
                id: photo.id,
                storagePath: photo.storage_path,
              });
              setActive(null);
              setPhotos((prev) => prev.filter((p) => p.id !== photo.id));
            } catch {
              Alert.alert("Couldn't delete", "Try again later.");
            }
          },
        },
      ]);
    },
    []
  );

  return (
    <SafeAreaView style={[styles.shell, { backgroundColor: colors.bg }]} edges={["top"]}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={26} color={colors.text} />
        </Pressable>
        <Text allowFontScaling={false} style={[styles.headerTitle, { color: colors.text }]}>
          Progress photos
        </Text>
        <Pressable
          onPress={() => {
            hapticPress();
            router.push("/(app)/progress-photos" as never);
          }}
          hitSlop={12}
        >
          <Ionicons name="add" size={24} color={colors.text} />
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.text} />
        </View>
      ) : groups.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="camera-outline" size={32} color={colors.textMuted} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No photos yet</Text>
          <Text style={[styles.emptyBody, { color: colors.textMuted }]}>
            Take your first set to start tracking your progress.
          </Text>
          <Pressable
            onPress={() => {
              hapticPress();
              router.push("/(app)/progress-photos" as never);
            }}
            style={[styles.emptyCta, { backgroundColor: colors.primary }]}
          >
            <Text style={[styles.emptyCtaText, { color: colors.textOnPrimary }]}>
              Take photos
            </Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={groups}
          keyExtractor={(g) => g.date}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View style={styles.group}>
              <Text style={[styles.dateLabel, { color: colors.textMuted }]}>
                {formatDateLabel(item.date)}
              </Text>
              <View style={styles.row}>
                {item.photos.map((p) => (
                  <Pressable
                    key={p.id}
                    onPress={() => setActive(p)}
                    style={[styles.thumb, { backgroundColor: colors.bgSecondary }]}
                  >
                    {p.url ? (
                      <Image source={{ uri: p.url }} style={styles.thumbImg} resizeMode="cover" />
                    ) : (
                      <Text style={[styles.thumbFallback, { color: colors.textMuted }]}>
                        Unavailable
                      </Text>
                    )}
                    <Text style={styles.thumbLabel}>
                      {POSE_LABELS[p.pose ?? "other"]}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}
        />
      )}

      <Modal visible={!!active} animationType="fade" onRequestClose={() => setActive(null)}>
        {active ? (
          <SafeAreaView style={styles.lightbox}>
            <View style={styles.lightboxHeader}>
              <Pressable onPress={() => setActive(null)} hitSlop={12}>
                <Ionicons name="close" size={28} color="#fff" />
              </Pressable>
              <Text style={styles.lightboxTitle}>
                {POSE_LABELS[active.pose ?? "other"]} · {formatDateLabel(active.taken_at)}
              </Text>
              <Pressable onPress={() => handleDelete(active)} hitSlop={12}>
                <Ionicons name="trash-outline" size={24} color="#fff" />
              </Pressable>
            </View>
            {active.url ? (
              <Image
                source={{ uri: active.url }}
                style={styles.lightboxImage}
                resizeMode="contain"
              />
            ) : (
              <View style={styles.center}>
                <Text style={{ color: "#fff" }}>Image unavailable</Text>
              </View>
            )}
          </SafeAreaView>
        ) : null}
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: { fontSize: 17, fontWeight: "600" },

  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl },
  emptyTitle: { fontSize: 18, fontWeight: "600", marginTop: spacing.md },
  emptyBody: { fontSize: 14, textAlign: "center", marginTop: spacing.sm, marginBottom: spacing.lg },
  emptyCta: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: radius.md,
  },
  emptyCtaText: { fontSize: 15, fontWeight: "600" },

  listContent: { padding: spacing.lg, gap: spacing.lg },
  group: { gap: spacing.sm },
  dateLabel: { fontSize: 12, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5 },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8 },

  thumb: {
    width: "31%",
    aspectRatio: 3 / 4,
    borderRadius: radius.md,
    overflow: "hidden",
    position: "relative",
  },
  thumbImg: { width: "100%", height: "100%" },
  thumbFallback: { fontSize: 11, textAlign: "center", marginTop: 24 },
  thumbLabel: {
    position: "absolute",
    bottom: 4,
    left: 6,
    backgroundColor: "rgba(0,0,0,0.55)",
    color: "#fff",
    fontSize: 10,
    fontWeight: "600",
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    textTransform: "uppercase",
  },

  lightbox: { flex: 1, backgroundColor: "#000" },
  lightboxHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  lightboxTitle: { color: "#fff", fontSize: 14, fontWeight: "500", flex: 1, textAlign: "center" },
  lightboxImage: { flex: 1, width: "100%" },
});
