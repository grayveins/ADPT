import { useEffect, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { darkColors } from "@/src/theme";
import { supabase } from "@/lib/supabase";

type Msg = { role: "user" | "assistant"; content: string };

export default function Chat() {
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      content: "I'm your ADPT coach. Tell me what you're training or how you feel today.",
    },
  ]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.replace("/sign-in");
      }
    });
  }, []);

  const send = async () => {
    const t = text.trim();
    if (!t || loading) return;

    const next: Msg[] = [...messages, { role: "user", content: t }];
    setMessages(next);
    setText("");
    setLoading(true);
    requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));

    try {
      const history = next.slice(-8).map((m) => ({ role: m.role, content: m.content }));
      const { data, error } = await supabase.functions.invoke("chat", {
        body: { text: t, history },
      });

      if (error) {
        console.error("Supabase function error:", error);
        throw error;
      }
      
      // Handle both success and error responses from the edge function
      const reply = data?.reply ?? "I'm here. Could you try that again?";
      setMessages([...next, { role: "assistant", content: reply }]);
    } catch (err) {
      console.error("Chat error:", err);
      setMessages([...next, { role: "assistant", content: "Connection error. Please check your internet and try again." }]);
    } finally {
      setLoading(false);
      requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
    }
  };

  const disabled = !text.trim() || loading;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.select({ ios: "padding", android: undefined })}
        keyboardVerticalOffset={Platform.select({ ios: 90, android: 0 })}
      >
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Ionicons name="fitness" size={20} color={darkColors.primary} />
          </View>
          <Text allowFontScaling={false} style={styles.headerTitle}>
            Coach
          </Text>
        </View>

        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.messages}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        >
          {messages.map((m, i) => {
            const isUser = m.role === "user";
            return (
              <View
                key={`${m.role}-${i}`}
                style={[styles.messageRow, isUser ? styles.messageUser : styles.messageCoach]}
              >
                <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleCoach]}>
                  <Text
                    allowFontScaling={false}
                    style={[styles.bubbleText, isUser ? styles.textUser : styles.textCoach]}
                  >
                    {m.content}
                  </Text>
                </View>
              </View>
            );
          })}
        </ScrollView>

        {loading && (
          <View style={styles.thinking}>
            <Ionicons name="pulse" size={16} color={darkColors.primary} style={{ marginRight: 8 }} />
            <Text allowFontScaling={false} style={styles.thinkingText}>
              Coach is thinking
            </Text>
          </View>
        )}

        <View style={styles.composer}>
          <View style={[styles.inputRow, focused && styles.inputRowFocused]}>
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder="Ask your coach..."
              placeholderTextColor={darkColors.muted}
              selectionColor={darkColors.primary}
              style={styles.input}
              multiline
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              keyboardAppearance="dark"
              textAlignVertical="top"
              underlineColorAndroid="transparent"
            />
            <TouchableOpacity
              onPress={send}
              disabled={disabled}
              style={[styles.sendButton, disabled && styles.sendDisabled]}
            >
              <Ionicons
                name="arrow-up"
                size={20}
                color={disabled ? darkColors.muted : "#000"}
              />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: darkColors.bg,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: darkColors.border,
    gap: 8,
  },
  headerIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: darkColors.card,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    color: darkColors.text,
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
  },
  messages: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 100,
  },
  messageRow: {
    marginBottom: 12,
  },
  messageUser: {
    alignItems: "flex-end",
  },
  messageCoach: {
    alignItems: "flex-start",
  },
  bubble: {
    maxWidth: "85%",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  bubbleUser: {
    backgroundColor: darkColors.primary,
    borderBottomRightRadius: 6,
  },
  bubbleCoach: {
    backgroundColor: darkColors.card,
    borderBottomLeftRadius: 6,
  },
  bubbleText: {
    fontSize: 15,
    lineHeight: 21,
    fontFamily: "Inter_400Regular",
  },
  textUser: {
    color: "#000",
  },
  textCoach: {
    color: darkColors.text,
  },
  thinking: {
    backgroundColor: darkColors.card,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  thinkingText: {
    color: darkColors.muted,
    fontFamily: "Inter_400Regular",
    fontSize: 14,
  },
  composer: {
    borderTopWidth: 1,
    borderTopColor: darkColors.border,
    padding: 12,
    paddingBottom: 24,
    backgroundColor: darkColors.bg,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: darkColors.card,
    borderWidth: 1,
    borderColor: darkColors.border,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  inputRowFocused: {
    borderColor: darkColors.primary,
  },
  input: {
    flex: 1,
    color: darkColors.text,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    maxHeight: 120,
    paddingTop: 4,
    paddingBottom: 4,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: darkColors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  sendDisabled: {
    backgroundColor: darkColors.border,
  },
});
