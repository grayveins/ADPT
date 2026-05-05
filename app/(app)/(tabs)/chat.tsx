/**
 * Coach messaging — client-side thread with their assigned coach.
 * Single thread (clients have one coach). Realtime via Supabase channel.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { router } from "expo-router";

import { useTheme } from "@/src/context/ThemeContext";
import { spacing, radius } from "@/src/theme";
import { supabase } from "@/lib/supabase";
import { hapticPress } from "@/src/animations/feedback/haptics";

type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  recipient_id: string;
  content: string | null;
  message_type: string;
  read_at: string | null;
  created_at: string;
};

function formatTime(d: string): string {
  const date = new Date(d);
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export default function ChatScreen() {
  const { colors } = useTheme();
  const [userId, setUserId] = useState<string | null>(null);
  const [coachId, setCoachId] = useState<string | null>(null);
  const [coachName, setCoachName] = useState<string>("Your coach");
  const [coachAvatar, setCoachAvatar] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const listRef = useRef<FlatList<Message>>(null);

  // Resolve user → coach link → conversation id
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || cancelled) {
        setLoading(false);
        return;
      }
      setUserId(user.id);

      const { data: cc } = await supabase
        .from("coach_clients")
        .select("coach_id")
        .eq("client_id", user.id)
        .in("status", ["active", "paused"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!cc) {
        setLoading(false);
        return;
      }
      const cid = (cc as { coach_id: string }).coach_id;
      setCoachId(cid);

      const [{ data: coach }, { data: convo }] = await Promise.all([
        supabase
          .from("coaches")
          .select("display_name, avatar_url")
          .eq("id", cid)
          .maybeSingle(),
        supabase
          .from("conversations")
          .select("id")
          .eq("coach_id", cid)
          .eq("client_id", user.id)
          .maybeSingle(),
      ]);

      if (cancelled) return;
      if (coach) {
        const c = coach as { display_name: string | null; avatar_url: string | null };
        setCoachName(c.display_name ?? "Your coach");
        setCoachAvatar(c.avatar_url ?? null);
      }
      if (convo) setConversationId((convo as { id: string }).id);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Load messages + subscribe to realtime once we know the conversation id
  useEffect(() => {
    if (!conversationId) return;
    let cancelled = false;

    (async () => {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });
      if (!cancelled) setMessages((data ?? []) as Message[]);
    })();

    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          setMessages((prev) => {
            const next = payload.new as Message;
            if (prev.some((m) => m.id === next.id)) return prev;
            return [...prev, next];
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const updated = payload.new as Message;
          setMessages((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  // Mark unread messages addressed to me as read
  useEffect(() => {
    if (!userId) return;
    const unread = messages.filter((m) => m.recipient_id === userId && m.read_at == null);
    if (unread.length === 0) return;
    void (async () => {
      await supabase
        .from("messages")
        .update({ read_at: new Date().toISOString() } as never)
        .in(
          "id",
          unread.map((m) => m.id)
        );
    })();
  }, [messages, userId]);

  // Autoscroll on new messages
  useEffect(() => {
    if (messages.length === 0) return;
    requestAnimationFrame(() => {
      listRef.current?.scrollToEnd({ animated: true });
    });
  }, [messages.length]);

  const handleSend = useCallback(async () => {
    if (!userId || !coachId || !conversationId) return;
    const text = draft.trim();
    if (!text) return;
    setSending(true);
    const { error } = await supabase.from("messages").insert({
      conversation_id: conversationId,
      sender_id: userId,
      recipient_id: coachId,
      content: text,
      message_type: "text",
    } as never);
    setSending(false);
    if (error) return;
    setDraft("");
  }, [draft, userId, coachId, conversationId]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.shell, { backgroundColor: colors.bg }]}>
        <View style={styles.center}>
          <ActivityIndicator color={colors.text} />
        </View>
      </SafeAreaView>
    );
  }

  if (!coachId || !conversationId) {
    return (
      <SafeAreaView style={[styles.shell, { backgroundColor: colors.bg }]}>
        <View style={styles.center}>
          <Ionicons name="chatbubble-outline" size={32} color={colors.textMuted} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No coach yet</Text>
          <Text style={[styles.emptyBody, { color: colors.textMuted }]}>
            Once you&apos;re connected to a coach, your conversation will appear here.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleBack = () => {
    hapticPress();
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(app)/(tabs)" as never);
    }
  };

  const initials = coachName
    .split(" ")
    .map((part) => part.charAt(0))
    .filter(Boolean)
    .join("")
    .slice(0, 2)
    .toUpperCase() || "?";

  return (
    <SafeAreaView style={[styles.shell, { backgroundColor: colors.bg }]} edges={["top"]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable
          onPress={handleBack}
          accessibilityRole="button"
          accessibilityLabel="Back"
          hitSlop={10}
          style={styles.backBtn}
        >
          <Ionicons name="chevron-back" size={26} color={colors.text} />
        </Pressable>

        <View
          style={[
            styles.avatar,
            { backgroundColor: colors.bgSecondary, borderColor: colors.border },
          ]}
        >
          {coachAvatar ? (
            <Image
              source={{ uri: coachAvatar }}
              style={styles.avatarImage}
              contentFit="cover"
              cachePolicy="memory-disk"
              transition={120}
            />
          ) : (
            <Text
              allowFontScaling={false}
              style={[styles.avatarText, { color: colors.text }]}
            >
              {initials}
            </Text>
          )}
        </View>

        <View style={styles.headerTextCol}>
          <Text
            allowFontScaling={false}
            numberOfLines={1}
            style={[styles.headerTitle, { color: colors.text }]}
          >
            {coachName}
          </Text>
          <Text
            allowFontScaling={false}
            style={[styles.headerSubtitle, { color: colors.textMuted }]}
          >
            Coach
          </Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 0}
      >
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={styles.messagesContent}
          ListEmptyComponent={
            <Text style={[styles.empty, { color: colors.textMuted }]}>
              No messages yet. Say hi.
            </Text>
          }
          renderItem={({ item }) => {
            const mine = item.sender_id === userId;
            return (
              <View style={[styles.row, mine ? styles.rowRight : styles.rowLeft]}>
                <View
                  style={[
                    styles.bubble,
                    mine
                      ? { backgroundColor: colors.text }
                      : { backgroundColor: colors.bgSecondary },
                    mine ? styles.bubbleRight : styles.bubbleLeft,
                  ]}
                >
                  <Text
                    allowFontScaling={false}
                    style={[
                      styles.bubbleText,
                      { color: mine ? colors.bg : colors.text },
                    ]}
                  >
                    {item.content}
                  </Text>
                  <Text
                    allowFontScaling={false}
                    style={[
                      styles.bubbleTime,
                      { color: mine ? "rgba(255,255,255,0.6)" : colors.textMuted },
                    ]}
                  >
                    {formatTime(item.created_at)}
                    {mine && item.read_at ? " · Read" : ""}
                  </Text>
                </View>
              </View>
            );
          }}
        />

        <View style={[styles.composer, { borderTopColor: colors.border }]}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Message..."
            placeholderTextColor={colors.textMuted}
            multiline
            style={[
              styles.input,
              {
                backgroundColor: colors.bgSecondary,
                color: colors.text,
                borderColor: colors.border,
              },
            ]}
          />
          <Pressable
            onPress={handleSend}
            disabled={sending || !draft.trim()}
            style={({ pressed }) => [
              styles.sendBtn,
              {
                backgroundColor: colors.primary,
                opacity: !draft.trim() || sending ? 0.5 : pressed ? 0.85 : 1,
              },
            ]}
          >
            <Ionicons name="arrow-up" size={20} color={colors.textOnPrimary} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1 },
  flex: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl },
  emptyTitle: { fontSize: 18, fontWeight: "600", marginTop: spacing.md },
  emptyBody: { fontSize: 14, textAlign: "center", marginTop: spacing.sm },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: spacing.sm,
  },
  backBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    marginRight: -2,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImage: { width: "100%", height: "100%" },
  avatarText: { fontSize: 13, fontWeight: "700" },
  headerTextCol: { flex: 1, gap: 1 },
  headerTitle: { fontSize: 16, fontWeight: "700" },
  headerSubtitle: { fontSize: 11, fontWeight: "500" },

  messagesContent: { padding: spacing.md, gap: spacing.sm },
  empty: { textAlign: "center", padding: spacing.xl, fontSize: 14 },

  row: { flexDirection: "row" },
  rowLeft: { justifyContent: "flex-start" },
  rowRight: { justifyContent: "flex-end" },
  bubble: {
    maxWidth: "78%",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.lg,
  },
  bubbleLeft: { borderBottomLeftRadius: 6 },
  bubbleRight: { borderBottomRightRadius: 6 },
  bubbleText: { fontSize: 15, lineHeight: 20 },
  bubbleTime: { fontSize: 10, marginTop: 4 },

  composer: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.lg,
    paddingHorizontal: 14,
    paddingVertical: 9,
    fontSize: 15,
    minHeight: 38,
    maxHeight: 120,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
});
