/**
 * Coach upload-meal-plan screen.
 * Pick an active client, pick a PDF, set a title, upload.
 */

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as DocumentPicker from "expo-document-picker";

import { useTheme } from "@/src/context/ThemeContext";
import { spacing, radius } from "@/src/theme";
import {
  fetchActiveClientsForCoach,
  uploadMealPlan,
  type CoachClientLite,
} from "@/src/lib/mealPlans";
import { hapticPress, hapticSuccess } from "@/src/animations/feedback/haptics";

type PickedFile = {
  uri: string;
  name: string;
  size: number | null;
};

export default function UploadMealPlanScreen() {
  const { colors } = useTheme();
  const [clients, setClients] = useState<CoachClientLite[]>([]);
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<PickedFile | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchActiveClientsForCoach()
      .then((rows) => setClients(rows))
      .catch(() => setClients([]))
      .finally(() => setLoading(false));
  }, []);

  const onPickFile = async () => {
    hapticPress();
    const result = await DocumentPicker.getDocumentAsync({
      type: "application/pdf",
      copyToCacheDirectory: true,
      multiple: false,
    });
    if (result.canceled) return;
    const asset = result.assets?.[0];
    if (!asset) return;
    setFile({
      uri: asset.uri,
      name: asset.name ?? "meal-plan.pdf",
      size: asset.size ?? null,
    });
    if (!title) {
      setTitle((asset.name ?? "Meal plan").replace(/\.pdf$/i, ""));
    }
  };

  const onUpload = async () => {
    if (!selectedClient || !file) return;
    setUploading(true);
    try {
      await uploadMealPlan({
        uri: file.uri,
        fileName: file.name,
        fileSize: file.size,
        title,
        clientId: selectedClient,
      });
      hapticSuccess();
      router.back();
    } catch (err: any) {
      Alert.alert("Upload failed", err?.message ?? "Try again.");
    } finally {
      setUploading(false);
    }
  };

  const canUpload = !!selectedClient && !!file && !uploading;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={["top"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={26} color={colors.text} />
        </Pressable>
        <Text allowFontScaling={false} style={[styles.headerTitle, { color: colors.text }]}>
          Upload meal plan
        </Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {/* Client picker */}
        <Text allowFontScaling={false} style={[styles.label, { color: colors.textMuted }]}>
          CLIENT
        </Text>
        {loading ? (
          <ActivityIndicator color={colors.text} style={{ marginTop: spacing.md }} />
        ) : clients.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.bgSecondary }]}>
            <Text allowFontScaling={false} style={{ color: colors.textMuted, fontSize: 14 }}>
              No active clients. Add a client first to upload a meal plan.
            </Text>
          </View>
        ) : (
          clients.map((c) => {
            const isSel = c.client_id === selectedClient;
            return (
              <Pressable
                key={c.client_id}
                onPress={() => {
                  hapticPress();
                  setSelectedClient(c.client_id);
                }}
                style={[
                  styles.clientRow,
                  {
                    backgroundColor: isSel ? colors.text : colors.bgSecondary,
                  },
                ]}
              >
                <Text
                  allowFontScaling={false}
                  style={[
                    styles.clientName,
                    { color: isSel ? colors.bg : colors.text },
                  ]}
                >
                  {c.display_name}
                </Text>
                {isSel && <Ionicons name="checkmark" size={18} color={colors.bg} />}
              </Pressable>
            );
          })
        )}

        {/* File picker */}
        <Text
          allowFontScaling={false}
          style={[styles.label, { color: colors.textMuted, marginTop: spacing.xl }]}
        >
          FILE
        </Text>
        <Pressable
          onPress={onPickFile}
          style={[styles.fileCard, { backgroundColor: colors.bgSecondary }]}
        >
          <Ionicons
            name={file ? "document-text" : "cloud-upload-outline"}
            size={22}
            color={colors.text}
          />
          <View style={{ flex: 1 }}>
            <Text
              allowFontScaling={false}
              style={[styles.fileTitle, { color: colors.text }]}
              numberOfLines={1}
            >
              {file ? file.name : "Choose PDF"}
            </Text>
            {file?.size != null && (
              <Text allowFontScaling={false} style={[styles.fileMeta, { color: colors.textMuted }]}>
                {(file.size / (1024 * 1024)).toFixed(2)} MB
              </Text>
            )}
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </Pressable>

        {/* Title */}
        <Text
          allowFontScaling={false}
          style={[styles.label, { color: colors.textMuted, marginTop: spacing.xl }]}
        >
          TITLE
        </Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="e.g. Cutting Phase 1"
          placeholderTextColor={colors.textMuted}
          style={[
            styles.input,
            { backgroundColor: colors.bgSecondary, color: colors.text },
          ]}
        />
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.bg }]}>
        <Pressable
          onPress={onUpload}
          disabled={!canUpload}
          style={[
            styles.uploadBtn,
            {
              backgroundColor: canUpload ? colors.text : colors.bgSecondary,
            },
          ]}
        >
          {uploading ? (
            <ActivityIndicator color={colors.bg} />
          ) : (
            <Text
              allowFontScaling={false}
              style={[
                styles.uploadBtnText,
                { color: canUpload ? colors.bg : colors.textMuted },
              ]}
            >
              Upload
            </Text>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.base,
  },
  headerTitle: { fontSize: 17, fontWeight: "600" },
  body: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  label: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  emptyCard: {
    padding: spacing.lg,
    borderRadius: radius.md,
  },
  clientRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.base,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
  },
  clientName: { fontSize: 15, fontWeight: "500" },
  fileCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.base,
    borderRadius: radius.md,
    gap: spacing.md,
  },
  fileTitle: { fontSize: 15, fontWeight: "500" },
  fileMeta: { fontSize: 13, marginTop: 2 },
  input: {
    fontSize: 15,
    padding: spacing.base,
    borderRadius: radius.md,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  uploadBtn: {
    paddingVertical: spacing.base,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  uploadBtnText: { fontSize: 16, fontWeight: "600" },
});
