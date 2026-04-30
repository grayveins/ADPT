/**
 * Share Card Utilities
 *
 * Captures a React Native View as a PNG and shares it via
 * expo-sharing (preferred) or the built-in RN Share API.
 */

import { RefObject } from "react";
import { Share, Platform } from "react-native";
import type { default as ViewShot } from "react-native-view-shot";
import * as Sharing from "expo-sharing";

/**
 * Capture a ViewShot ref as a PNG and present the native share sheet.
 *
 * @param viewRef  A ref attached to a `<ViewShot>` component.
 * @param filename Optional filename (without extension).
 */
export async function captureAndShare(
  viewRef: RefObject<ViewShot | null>,
  filename = "adpt-share"
): Promise<void> {
  if (!viewRef.current?.capture) {
    console.warn("[shareCard] viewRef has no capture method");
    return;
  }

  try {
    const uri = await viewRef.current.capture();

    // Prefer expo-sharing (supports Instagram stories, iMessage, etc.)
    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(uri, {
        mimeType: "image/png",
        dialogTitle: "Share your workout",
        UTI: "public.png", // iOS
      });
      return;
    }

    // Fallback: RN Share API (limited — mostly URLs / text on Android)
    if (Platform.OS !== "web") {
      await Share.share({
        url: uri, // iOS
        title: filename,
      });
    }
  } catch (error) {
    // User cancelled the share sheet — not an error
    if ((error as any)?.message?.includes("cancelled")) return;
    console.error("[shareCard] share failed:", error);
  }
}
