/**
 * Progress photos flow.
 * Sequential pose capture: Front → Side L → Side R → Back.
 * Each pose: intro modal → camera with guide overlay → confirm → next.
 * Skipping a pose advances without saving anything.
 */

import React, { useCallback, useRef, useState } from "react";
import {
  Alert,
  Image,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTheme } from "@/src/context/ThemeContext";
import { spacing, radius } from "@/src/theme";
import { hapticPress } from "@/src/animations/feedback/haptics";
import { uploadProgressPhoto, type ProgressPose } from "@/src/lib/progressPhotos";
import { PoseSilhouette } from "@/src/components/progress-photos/PoseSilhouette";
import { PoseGuideOverlay } from "@/src/components/progress-photos/PoseGuideOverlay";

const POSE_ORDER: ProgressPose[] = ["front", "side", "back"];

const POSE_TITLES: Record<ProgressPose, string> = {
  front: "Front",
  side: "Side",
  back: "Back",
  other: "Other",
};

type Stage = "intro" | "camera" | "preview" | "uploading" | "done";

export default function ProgressPhotosScreen() {
  const { colors } = useTheme();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();

  const [poseIndex, setPoseIndex] = useState(0);
  const [stage, setStage] = useState<Stage>("intro");
  const [pendingUri, setPendingUri] = useState<string | null>(null);
  const [savedCount, setSavedCount] = useState(0);
  const [skippedCount, setSkippedCount] = useState(0);

  const currentPose = POSE_ORDER[poseIndex];

  const advance = useCallback(() => {
    setPendingUri(null);
    if (poseIndex + 1 >= POSE_ORDER.length) {
      setStage("done");
    } else {
      setPoseIndex(poseIndex + 1);
      setStage("intro");
    }
  }, [poseIndex]);

  const handleSkip = useCallback(() => {
    hapticPress();
    setSkippedCount((n) => n + 1);
    advance();
  }, [advance]);

  const handlePick = useCallback(async () => {
    hapticPress();
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 1,
      allowsEditing: false,
    });
    if (result.canceled || !result.assets[0]) return;
    setPendingUri(result.assets[0].uri);
    setStage("preview");
  }, []);

  const promptOpenSettings = useCallback(() => {
    Alert.alert(
      "Camera access required",
      "Enable camera access in Settings to take progress photos. You can still pick from your photo library instead.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Open Settings", onPress: () => Linking.openSettings() },
      ]
    );
  }, []);

  const handleTakeNow = useCallback(async () => {
    hapticPress();
    if (permission?.granted) {
      setStage("camera");
      return;
    }
    // Permission previously denied and the OS won't re-prompt — send to Settings.
    if (permission && !permission.canAskAgain) {
      promptOpenSettings();
      return;
    }
    const next = await requestPermission();
    if (next.granted) {
      setStage("camera");
    } else {
      promptOpenSettings();
    }
  }, [permission, requestPermission, promptOpenSettings]);

  const handleCapture = useCallback(async () => {
    if (!cameraRef.current) return;
    const photo = await cameraRef.current.takePictureAsync({ quality: 1, skipProcessing: true });
    if (!photo?.uri) return;
    hapticPress();
    setPendingUri(photo.uri);
    setStage("preview");
  }, []);

  const handleConfirm = useCallback(async () => {
    if (!pendingUri) return;
    hapticPress();
    setStage("uploading");
    try {
      await uploadProgressPhoto({ uri: pendingUri, pose: currentPose });
      setSavedCount((n) => n + 1);
      advance();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed";
      Alert.alert("Couldn't save photo", message);
      setStage("preview");
    }
  }, [pendingUri, currentPose, advance]);

  const handleRetake = useCallback(() => {
    hapticPress();
    setPendingUri(null);
    setStage("intro");
  }, []);

  const handleClose = useCallback(() => {
    hapticPress();
    router.back();
  }, []);

  // ── Render ────────────────────────────────────────────────────────────────

  if (stage === "camera") {
    return (
      <View style={[styles.cameraRoot, { backgroundColor: "#000" }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="front" />
        <PoseGuideOverlay pose={currentPose} />

        <SafeAreaView edges={["bottom"]} style={styles.cameraControls}>
          <Pressable style={styles.cancelBtn} onPress={() => setStage("intro")}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
          <Pressable style={styles.shutterBtn} onPress={handleCapture}>
            <View style={styles.shutterInner} />
          </Pressable>
          <View style={styles.cameraControlsRight} />
        </SafeAreaView>
      </View>
    );
  }

  if (stage === "preview" && pendingUri) {
    return (
      <View style={[styles.cameraRoot, { backgroundColor: "#000" }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <Image source={{ uri: pendingUri }} style={StyleSheet.absoluteFill} resizeMode="contain" />
        <PoseGuideOverlay pose={currentPose} />

        <SafeAreaView edges={["bottom"]} style={styles.cameraControls}>
          <Pressable style={styles.cancelBtn} onPress={handleRetake}>
            <Text style={styles.cancelText}>Retake</Text>
          </Pressable>
          <Pressable style={styles.confirmBtn} onPress={handleConfirm}>
            <Text style={styles.confirmText}>Use photo</Text>
          </Pressable>
          <View style={styles.cameraControlsRight} />
        </SafeAreaView>
      </View>
    );
  }

  // Intro / Done / Uploading — all sit on the same dimmed shell
  return (
    <View style={[styles.shell, { backgroundColor: "rgba(0,0,0,0.55)" }]}>
      <Stack.Screen options={{ headerShown: false, animation: "fade" }} />
      <SafeAreaView style={styles.shellInner}>
        <View style={styles.topBar}>
          <Pressable hitSlop={12} onPress={handleClose}>
            <Ionicons name="close" size={24} color="#fff" />
          </Pressable>
          <Text style={styles.topBarTitle}>
            {stage === "done" ? "Done" : `Photo ${poseIndex + 1} of ${POSE_ORDER.length}`}
          </Text>
          <Pressable
            hitSlop={12}
            onPress={() => {
              hapticPress();
              router.push("/(app)/photo-history" as never);
            }}
            accessibilityLabel="View photo history"
          >
            <Ionicons name="images-outline" size={22} color="#fff" />
          </Pressable>
        </View>

        {stage === "done" ? (
          <View style={styles.doneCard}>
            <View style={[styles.card, { backgroundColor: colors.card }]}>
              <Ionicons name="checkmark-circle" size={48} color={colors.text} />
              <Text style={[styles.title, { color: colors.text }]}>All set</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                {savedCount} {savedCount === 1 ? "photo" : "photos"} saved
                {skippedCount > 0 && `, ${skippedCount} skipped`}.
              </Text>
              <Pressable
                style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
                onPress={handleClose}
              >
                <Text style={[styles.primaryBtnText, { color: colors.textOnPrimary }]}>
                  Done
                </Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <View style={styles.introCard}>
            <View style={[styles.card, { backgroundColor: colors.card }]}>
              <View style={styles.cardHeader}>
                <Text style={[styles.poseTitle, { color: colors.text }]}>
                  {POSE_TITLES[currentPose]}
                </Text>
              </View>

              <View style={styles.silhouetteWrap}>
                <PoseSilhouette pose={currentPose} />
              </View>

              <Text style={[styles.helper, { color: colors.textSecondary }]}>
                Take consistent photos by using the guiding lines.
              </Text>

              <View style={styles.actions}>
                <Pressable
                  style={[styles.actionBtn, { borderColor: colors.border }]}
                  onPress={handlePick}
                  disabled={stage === "uploading"}
                >
                  <Text style={[styles.actionText, { color: colors.text }]}>Pick photo</Text>
                </Pressable>
                <Pressable
                  style={[styles.actionBtn, { borderColor: colors.border }]}
                  onPress={handleTakeNow}
                  disabled={stage === "uploading"}
                >
                  <Text style={[styles.actionText, { color: colors.text }]}>
                    {stage === "uploading" ? "Saving…" : "Take now"}
                  </Text>
                </Pressable>
              </View>
            </View>

            <Pressable onPress={handleSkip} hitSlop={8} style={styles.skipBtn}>
              <Text style={styles.skipText}>Skip this pose</Text>
            </Pressable>
          </View>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1 },
  shellInner: { flex: 1, paddingHorizontal: spacing.lg },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.md,
  },
  topBarTitle: { color: "#fff", fontSize: 16, fontWeight: "600" },

  introCard: { flex: 1, justifyContent: "center", alignItems: "center" },
  doneCard: { flex: 1, justifyContent: "center", alignItems: "center" },
  card: {
    width: "100%",
    maxWidth: 360,
    borderRadius: radius.xl,
    padding: spacing.xl,
    alignItems: "center",
  },
  cardHeader: { width: "100%", alignItems: "flex-start" },
  poseTitle: { fontSize: 22, fontWeight: "700" },
  silhouetteWrap: { marginVertical: spacing.md, alignItems: "center" },
  helper: {
    fontSize: 13,
    textAlign: "center",
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  actions: {
    flexDirection: "row",
    width: "100%",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  actionBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingVertical: 12,
    alignItems: "center",
  },
  actionText: { fontSize: 14, fontWeight: "600" },

  skipBtn: { marginTop: spacing.lg, paddingVertical: spacing.sm },
  skipText: { color: "#fff", fontSize: 14, opacity: 0.85 },

  title: { fontSize: 22, fontWeight: "700", marginTop: spacing.md },
  subtitle: { fontSize: 14, textAlign: "center", marginTop: spacing.xs },
  primaryBtn: {
    marginTop: spacing.lg,
    width: "100%",
    paddingVertical: 14,
    borderRadius: radius.md,
    alignItems: "center",
  },
  primaryBtnText: { fontSize: 15, fontWeight: "600" },

  cameraRoot: { flex: 1 },
  cameraControls: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  cameraControlsRight: { width: 60 },
  cancelBtn: { width: 60 },
  cancelText: { color: "#fff", fontSize: 15 },
  shutterBtn: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 4,
    borderColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  shutterInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.95)",
  },
  confirmBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    backgroundColor: "#fff",
    borderRadius: radius.md,
  },
  confirmText: { color: "#000", fontSize: 15, fontWeight: "600" },
});
