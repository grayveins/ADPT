/**
 * push-on-message
 *
 * Triggered by a Supabase Database Webhook on `messages` INSERT.
 * Looks up the recipient's push token + the sender's display name and
 * fires an Expo Push notification.
 *
 * Webhook payload shape (Supabase DB Webhooks):
 *   { type: "INSERT", table: "messages", schema: "public",
 *     record: <new row>, old_record: null }
 *
 * Setup (one-time):
 *   1. supabase functions deploy push-on-message
 *   2. (Optional) supabase secrets set EXPO_ACCESS_TOKEN=... — only required
 *      if the project has Expo Enhanced Security enabled. Without it, Expo
 *      Push accepts unauthenticated requests.
 *   3. In Supabase Studio → Database → Webhooks → Create:
 *        - Name: messages_push
 *        - Table: public.messages
 *        - Events: Insert
 *        - Type: Supabase Edge Function
 *        - Function: push-on-message
 *        - HTTP headers are populated automatically.
 *
 * The function uses SERVICE_ROLE to read profiles + coaches across RLS.
 */

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const EXPO_ACCESS_TOKEN = Deno.env.get("EXPO_ACCESS_TOKEN") ?? "";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

type WebhookPayload = {
  type: "INSERT" | "UPDATE" | "DELETE";
  table: string;
  schema: string;
  record: {
    id: string;
    conversation_id: string;
    sender_id: string;
    recipient_id: string;
    content: string | null;
    message_type: string;
    created_at: string;
  } | null;
  old_record: unknown;
};

type ExpoPushTicket = {
  status: "ok" | "error";
  id?: string;
  message?: string;
  details?: { error?: string };
};

async function resolveSenderName(senderId: string): Promise<string> {
  // Sender could be a coach or a client. Try coaches first (display_name is
  // set explicitly), then fall back to profiles.first_name.
  const { data: coach } = await supabase
    .from("coaches")
    .select("display_name")
    .eq("id", senderId)
    .maybeSingle();
  if (coach?.display_name) return coach.display_name as string;

  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name")
    .eq("id", senderId)
    .maybeSingle();
  return (profile?.first_name as string | null) ?? "New message";
}

async function resolvePushToken(userId: string): Promise<string | null> {
  const { data } = await supabase
    .from("profiles")
    .select("push_token")
    .eq("id", userId)
    .maybeSingle();
  const token = (data?.push_token as string | null) ?? null;
  if (!token) return null;
  // Expo tokens look like ExponentPushToken[xxx] or ExpoPushToken[xxx].
  if (!token.startsWith("ExponentPushToken[") && !token.startsWith("ExpoPushToken[")) {
    return null;
  }
  return token;
}

function preview(content: string | null, messageType: string): string {
  if (messageType !== "text") return `[${messageType}]`;
  return (content ?? "").slice(0, 140);
}

async function sendExpoPush(
  to: string,
  title: string,
  body: string,
  data: Record<string, unknown>
): Promise<ExpoPushTicket> {
  const headers: Record<string, string> = {
    Accept: "application/json",
    "Accept-Encoding": "gzip, deflate",
    "Content-Type": "application/json",
  };
  if (EXPO_ACCESS_TOKEN) {
    headers.Authorization = `Bearer ${EXPO_ACCESS_TOKEN}`;
  }

  const res = await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers,
    body: JSON.stringify({
      to,
      title,
      body,
      data,
      // Suppress the OS notification when the app is foregrounded — the
      // in-app banner (MessageNotifier) handles that case.
      _displayInForeground: false,
      sound: "default",
      priority: "high",
      channelId: "messages",
    }),
  });

  const json = (await res.json().catch(() => null)) as
    | { data?: ExpoPushTicket }
    | null;
  return (
    json?.data ?? { status: "error", message: `HTTP ${res.status}` }
  );
}

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  let payload: WebhookPayload;
  try {
    payload = await req.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  if (
    payload.type !== "INSERT" ||
    payload.table !== "messages" ||
    !payload.record
  ) {
    return new Response("Ignored", { status: 200 });
  }

  const { recipient_id, sender_id, content, message_type, conversation_id } =
    payload.record;

  const [pushToken, senderName] = await Promise.all([
    resolvePushToken(recipient_id),
    resolveSenderName(sender_id),
  ]);

  if (!pushToken) {
    return new Response(
      JSON.stringify({ skipped: "no_push_token" }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }

  const ticket = await sendExpoPush(
    pushToken,
    senderName,
    preview(content, message_type),
    { conversation_id, sender_id, type: "message" }
  );

  // Bad-token cleanup: Expo returns DeviceNotRegistered when the token has
  // been invalidated (uninstall, log-out elsewhere). Drop it so we don't
  // keep retrying.
  if (
    ticket.status === "error" &&
    ticket.details?.error === "DeviceNotRegistered"
  ) {
    await supabase
      .from("profiles")
      .update({ push_token: null })
      .eq("id", recipient_id);
  }

  return new Response(JSON.stringify({ ticket }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
