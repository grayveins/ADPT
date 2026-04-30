/**
 * Coach Chat Screen
 * 
 * AI coaching interface with contextual opening messages,
 * suggested prompts, and action buttons.
 * 
 * Key behaviors:
 * - Contextual opener based on user state (workout day, rest day, pain, etc.)
 * - Suggested prompts always visible below input when empty
 * - Action buttons in coach messages for quick actions
 * - Offline mode with helpful tips
 * - Input animates with keyboard (always visible)
 */

import { useEffect, useRef, useState, useCallback } from "react";
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useReanimatedKeyboardAnimation } from "react-native-keyboard-controller";
import Animated, { useAnimatedStyle } from "react-native-reanimated";

import { useTheme } from "@/src/context/ThemeContext";
import { useCoachUnread } from "@/src/hooks/useCoachUnread";
import { supabase } from "@/lib/supabase";
import {
  ChatInput,
  CoachMessage,
  SuggestedPrompts,
  OfflineContent,
} from "@/src/components/chat";
import { layout, spacing } from "@/src/theme";
import {
  buildCoachContext,
  generateOpenerMessage,
  detectActionFromResponse,
  type Action,
} from "@/lib/coachContext";
import { getFullCoachContext, getLiteCoachContext } from "@/lib/coachContextBuilder";
import { detectContextMode, shouldForceFullContext } from "@/lib/coachIntentDetector";
import type { LiteCoachContext, FullCoachContext } from "@/src/types/coachContext";

type Msg = {
  role: "user" | "assistant";
  content: string;
  isError?: boolean;
  actions?: Action[];
};

export default function Chat() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const { markAsRead } = useCoachUnread();
  
  // Keyboard animation
  const { height: keyboardHeight } = useReanimatedKeyboardAnimation();
  
  // State
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [serviceUnavailable, setServiceUnavailable] = useState(false);
  const [inputHeight, setInputHeight] = useState<number>(layout.inputMinHeight);
  const [suggestedPrompts, setSuggestedPrompts] = useState<string[]>([]);
  const [contextLoading, setContextLoading] = useState(true);
  // AI context (cached)
  const [cachedFullContext, setCachedFullContext] = useState<FullCoachContext | null>(null);
  const [cachedLiteContext, setCachedLiteContext] = useState<LiteCoachContext | null>(null);
  const [isFirstMessage, setIsFirstMessage] = useState(true);

  // Auth check and context load
  const loadInitialContext = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.replace("/sign-in");
        return;
      }

      // Build legacy context for opener message (UI only)
      const legacyContext = await buildCoachContext(session.user.id);
      const opener = generateOpenerMessage(legacyContext);

      // Pre-fetch and cache the new AI context
      const fullContext = await getFullCoachContext(session.user.id);
      const liteContext = await getLiteCoachContext(session.user.id);
      setCachedFullContext(fullContext);
      setCachedLiteContext(liteContext);

      // Set initial message with actions
      setMessages([{
        role: "assistant",
        content: opener.text,
        actions: opener.actions,
      }]);

      setSuggestedPrompts(opener.prompts);

      // Mark coach as read when screen opens
      await markAsRead();
    } catch (err) {
      console.error("Error loading coach context:", err);
      // Fallback to generic opener
      setMessages([{
        role: "assistant",
        content: "Ready when you are.",
      }]);
      setSuggestedPrompts([
        "What's my workout today?",
        "How am I doing this week?",
        "What should I eat today?",
        "Tips for better form",
      ]);
    } finally {
      setContextLoading(false);
    }
  }, [markAsRead]);

  useEffect(() => {
    loadInitialContext();
  }, [loadInitialContext]);

  // Scroll to bottom
  const scrollToBottom = useCallback(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, []);

  // Handle action button press
  const handleActionPress = useCallback((action: Action) => {
    // Special handling for pain responses
    if (action.type === "pain_better" || action.type === "pain_same" || action.type === "pain_worse") {
      // Add user's response as a message
      const responseText = action.type === "pain_better" 
        ? "Feeling better now"
        : action.type === "pain_same"
        ? "About the same"
        : "It's gotten worse";

      const newMessages: Msg[] = [
        ...messages,
        { role: "user", content: responseText },
      ];
      setMessages(newMessages);
      
      // Generate appropriate coach response
      const coachResponse = action.type === "pain_better"
        ? "Good to hear. Take it easy if needed today."
        : action.type === "pain_same"
        ? "Let's keep it light. I'll suggest alternatives for affected exercises."
        : "Let's skip anything that aggravates it. Rest if you need to.";

      setTimeout(() => {
        setMessages([
          ...newMessages,
          { role: "assistant", content: coachResponse },
        ]);
        scrollToBottom();
      }, 300);

      return;
    }

    // Navigation actions handled by ActionButton component
    if (action.route) {
      if (action.params) {
        router.push({ pathname: action.route as any, params: action.params });
      } else {
        router.push(action.route as any);
      }
    }
  }, [messages, scrollToBottom]);

  // Handle suggested prompt selection
  const handleSelectPrompt = useCallback((prompt: string) => {
    setText(prompt);
  }, []);

  // Send message
  const send = useCallback(async () => {
    const t = text.trim();
    if (!t || loading) return;

    const next: Msg[] = [...messages, { role: "user", content: t }];
    setMessages(next);
    setText("");
    setLoading(true);
    scrollToBottom();

    try {
      const history = next.slice(-8).map((m) => ({ role: m.role, content: m.content }));
      
      // Determine context mode based on message content
      const shouldUseFull = shouldForceFullContext({ isFirstMessage }) || 
                           detectContextMode(t) === "full";
      
      // Select appropriate context
      let context: LiteCoachContext | FullCoachContext | undefined;
      if (shouldUseFull && cachedFullContext) {
        context = cachedFullContext;
      } else if (cachedLiteContext) {
        context = cachedLiteContext;
      }
      
      // Mark that we've sent at least one message
      if (isFirstMessage) {
        setIsFirstMessage(false);
      }
      
      const { data, error } = await supabase.functions.invoke("chat", {
        body: { text: t, history, context },
      });

      if (error) {
        console.error("Supabase function error:", error);
        throw error;
      }
      
      if (data?.error || data?.reply?.includes("capacity") || data?.reply?.includes("unavailable")) {
        setServiceUnavailable(true);
        setMessages([...next, { 
          role: "assistant", 
          content: "Coach is taking a quick break. Check out the tips below.",
          isError: true,
        }]);
      } else {
        const reply = data?.reply ?? "I'm here. Could you try that again?";
        
        // Detect any actions in the response
        const detectedAction = detectActionFromResponse(reply);
        const actions = detectedAction ? [detectedAction] : undefined;

        setMessages([...next, { role: "assistant", content: reply, actions }]);
        setServiceUnavailable(false);
      }
    } catch (err) {
      console.error("Chat error:", err);
      setServiceUnavailable(true);
      setMessages([...next, { 
        role: "assistant", 
        content: "Having trouble connecting.",
        isError: true,
      }]);
    } finally {
      setLoading(false);
      scrollToBottom();
    }
  }, [text, loading, messages, scrollToBottom, cachedFullContext, cachedLiteContext, isFirstMessage]);

  // Retry after error
  const handleRetry = useCallback(() => {
    setServiceUnavailable(false);
  }, []);

  // Animated style for input container - moves up with keyboard
  const inputContainerStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: keyboardHeight.value }],
    };
  });

  // Show loading state while context loads
  if (contextLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.bg }]}>
        <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
          <Ionicons name="pulse" size={24} color={colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Header */}
      <View 
        style={[
          styles.header, 
          { 
            paddingTop: insets.top,
            backgroundColor: colors.bg,
            borderBottomColor: colors.border,
          }
        ]}
      >
        <View style={styles.headerContent}>
          <Ionicons 
            name="sparkles" 
            size={18} 
            color={colors.primary} 
            style={styles.headerIcon}
          />
          <Text 
            allowFontScaling={false}
            style={[styles.headerTitle, { color: colors.text }]}
          >
            Coach
          </Text>
        </View>
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollRef}
        style={styles.messagesList}
        contentContainerStyle={[
          styles.messagesContent,
          { paddingBottom: inputHeight + spacing.lg + (text.trim() === "" ? 52 : 0) },
        ]}
        onContentSizeChange={scrollToBottom}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        showsVerticalScrollIndicator={false}
      >
        {messages.map((m, i) => {
          const isUser = m.role === "user";
          
          if (!isUser) {
            // Use CoachMessage for assistant messages
            return (
              <CoachMessage
                key={`${m.role}-${i}`}
                content={m.content}
                actions={m.actions}
                onActionPress={handleActionPress}
                isError={m.isError}
              />
            );
          }

          // User message bubble
          return (
            <View
              key={`${m.role}-${i}`}
              style={[styles.messageRow, styles.messageUser]}
            >
              <View 
                style={[
                  styles.bubble, 
                  styles.bubbleUser, 
                  { backgroundColor: colors.primary }
                ]}
              >
                <Text
                  allowFontScaling={false}
                  style={[styles.bubbleText, { color: colors.textOnPrimary }]}
                >
                  {m.content}
                </Text>
              </View>
            </View>
          );
        })}

        {/* Loading indicator */}
        {loading && (
          <View style={[styles.thinking, { backgroundColor: colors.card }]}>
            <Ionicons name="pulse" size={16} color={colors.primary} style={{ marginRight: 8 }} />
            <Text allowFontScaling={false} style={[styles.thinkingText, { color: colors.textMuted }]}>
              Coach is thinking
            </Text>
          </View>
        )}

        {/* Offline/Error content */}
        {serviceUnavailable && (
          <OfflineContent onRetry={handleRetry} />
        )}
      </ScrollView>

      {/* Input area with suggested prompts */}
      <Animated.View 
        style={[
          styles.inputWrapper,
          inputContainerStyle,
        ]}
      >
        {/* Suggested prompts - visible when input is empty */}
        <SuggestedPrompts
          prompts={suggestedPrompts}
          onSelectPrompt={handleSelectPrompt}
          visible={text.trim() === "" && !serviceUnavailable}
        />

        <ChatInput
          value={text}
          onChangeText={setText}
          onSend={send}
          disabled={loading}
          placeholder="Ask your coach..."
          onHeightChange={setInputHeight}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: layout.headerHeight,
  },
  headerIcon: {
    marginRight: spacing.xs,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingTop: spacing.base,
  },
  messageRow: {
    marginBottom: spacing.md,
  },
  messageUser: {
    alignItems: "flex-end",
  },
  bubble: {
    maxWidth: "85%",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
    borderRadius: 20,
  },
  bubbleUser: {
    borderBottomRightRadius: 6,
  },
  bubbleText: {
    fontSize: 15,
    lineHeight: 21,
    fontFamily: "Inter_400Regular",
  },
  thinking: {
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.base,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    marginBottom: spacing.md,
  },
  thinkingText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
  },
  inputWrapper: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
  },
});
